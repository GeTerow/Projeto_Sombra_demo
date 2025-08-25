import os
import logging
import requests
import whisperx
import torch
import gc
import tempfile
import traceback
import time
import json
import re
from typing import Any, Dict, Optional, Tuple
from functools import lru_cache

import openai
from openai import OpenAI
from dotenv import load_dotenv

from celery_app import celery_app

load_dotenv()

# --- Logging ---
logger = logging.getLogger("ai_worker")
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(name)s | %(message)s", "%Y-%m-%d %H:%M:%S"
)
handler.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False
logger.info("Iniciando a configuração do Worker de IA...")

# --- Constantes e Configurações Padrão ---
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:3001")
ASSISTANT_MAX_WAIT_S = int(os.getenv("ASSISTANT_MAX_WAIT_S", "300"))
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY") 
# --- Detecção de Dispositivo ---
def detect_device() -> str:
    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"

DEVICE = detect_device()
COMPUTE_TYPE_DEFAULT = "float16" if DEVICE == "cuda" else "int8"
BATCH_SIZE = 4

logger.info(f"Dispositivo de processamento principal detectado: {DEVICE}")

# --- Cache de Modelos ---
MODEL_CACHE: Dict[Tuple[str, str, str], Any] = {}
ALIGN_MODELS_CACHE: Dict[Tuple[str, str], Tuple[Any, Any]] = {}

def load_whisper_model(model_name: str, device: str, compute_type: str) -> Any:
    key = (model_name, device, compute_type)
    if key not in MODEL_CACHE:
        logger.info(f"Carregando WhisperX ({model_name}) em {device} (compute_type={compute_type})...")
        MODEL_CACHE[key] = whisperx.load_model(model_name, device, compute_type=compute_type)
    else:
        logger.info(f"Reutilizando modelo WhisperX cacheado para {key}.")
    return MODEL_CACHE[key]

@lru_cache(maxsize=2)
def get_diarize_model(hf_token: str, device: str) -> Any:
    logger.info(f"Carregando modelo de Diarização no device={device}...")
    try:
        diarize_model = whisperx.DiarizationPipeline(use_auth_token=hf_token, device=device)
    except TypeError:
        diarize_model = whisperx.DiarizationPipeline(hf_token=hf_token, device=device)
    return diarize_model

def get_align_model(language_code: str, device: str) -> Tuple[Any, Any]:
    key = (language_code, device)
    if key not in ALIGN_MODELS_CACHE:
        logger.info(f"Carregando modelo de alinhamento para idioma: {language_code} em {device}")
        model_a, metadata = whisperx.load_align_model(language_code=language_code, device=device)
        ALIGN_MODELS_CACHE[key] = (model_a, metadata)
    else:
        logger.info(f"Reutilizando modelo de alinhamento cacheado para '{language_code}' em {device}.")
    return ALIGN_MODELS_CACHE[key]


# --- Utilitários ---
def notify_backend(webhook_url: str, payload: Dict[str, Any], timeout: int = 20) -> None:
    try:
        headers = {
            'Content-Type': 'application/json'
        }
        if INTERNAL_API_KEY:
            headers['x-internal-api-key'] = INTERNAL_API_KEY
        else:
            logger.warning("INTERNAL_API_KEY não definida. A notificação para o backend pode falhar.")

        resp = requests.patch(webhook_url, json=payload, headers=headers, timeout=timeout)
        
        if resp.status_code >= 400:
            logger.error(f"Webhook para {webhook_url} retornou status {resp.status_code}: {resp.text}")
    except requests.RequestException as req_e:
        logger.error(f"Falha ao notificar backend em {webhook_url}: {req_e}")
def generate_vtt(segments_obj: Dict[str, Any], audio_path: str) -> str:
    with tempfile.TemporaryDirectory() as temp_dir:
        writer = whisperx.utils.WriteVTT(output_dir=temp_dir)
        writer(segments_obj, audio_path, {"max_line_width": None, "max_line_count": None, "highlight_words": False})
        output_vtt_path = os.path.join(temp_dir, os.path.splitext(os.path.basename(audio_path))[0] + ".vtt")
        with open(output_vtt_path, "r", encoding="utf-8") as f:
            return f.read()

def extract_json_from_text(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except Exception:
        pass
    code_block = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if code_block:
        candidate = code_block.group(1).strip()
        try:
            return json.loads(candidate)
        except Exception:
            pass
    first = text.find("{")
    last = text.rfind("}")
    if first != -1 and last != -1 and last > first:
        candidate = text[first : last + 1].strip()
        try:
            return json.loads(candidate)
        except Exception:
            pass
    raise ValueError("Não foi possível extrair um JSON válido da resposta do Assistant.")

def run_openai_assistant(vtt_content: str, api_key: str, assistant_id: str, max_wait_s: int = ASSISTANT_MAX_WAIT_S) -> Dict[str, Any]:
    if not api_key or not assistant_id:
        raise RuntimeError("Chave da API OpenAI ou ID do Assistente ausentes.")

    client = OpenAI(api_key=api_key)
    thread = client.beta.threads.create()
    logger.info(f"Thread criada: {thread.id}")

    prompt = (
        "Analise a seguinte transcrição de chamada (formato VTT) e RETORNE EXCLUSIVAMENTE um JSON válido, "
        "sem qualquer texto adicional. Se não puder analisar, retorne um JSON como "
        '{"erro": "<motivo>"}.\n\n---\n\n'
        f"{vtt_content}"
    )
    client.beta.threads.messages.create(thread_id=thread.id, role="user", content=prompt)
    logger.info("Transcrição enviada à thread do Assistant.")

    run = client.beta.threads.runs.create(thread_id=thread.id, assistant_id=assistant_id, tool_choice="none")
    logger.info(f"Run iniciada: {run.id} (aguardando conclusão)")

    start = time.time()
    sleep_s = 2.0
    terminal_status = {"completed", "failed", "cancelled", "expired"}
    while True:
        run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
        status = run.status
        logger.info(f"Status atual do run: {status}")

        if status in terminal_status:
            break

        if time.time() - start > max_wait_s:
            try:
                client.beta.threads.runs.cancel(thread_id=thread.id, run_id=run.id)
            except Exception: pass
            raise TimeoutError(f"Tempo máximo de espera ({max_wait_s}s) excedido para execução do Assistant.")

        time.sleep(sleep_s)
        sleep_s = min(5.0, sleep_s + 0.5)

    if run.status != "completed":
        last_error = getattr(run, "last_error", None)
        reason = getattr(last_error, "message", f"Status final foi '{run.status}'")
        raise RuntimeError(f"A execução do Assistant falhou. Causa: {reason}")
    
    messages = client.beta.threads.messages.list(thread_id=thread.id)
    assistant_text = next(
        (part.text.value for m in messages.data if m.role == "assistant" for part in m.content if part.type == "text" and part.text), ""
    )
    
    if not assistant_text:
        raise RuntimeError("Não foi possível localizar a mensagem do Assistant com conteúdo de texto.")

    analysis_json = extract_json_from_text(assistant_text)
    logger.info("Análise JSON da IA obtida com sucesso.")
    return analysis_json


@celery_app.task(name="process_audio_task")
def process_audio_task(task_id: str, audio_path: str, config: Dict[str, Any]):
    """
    Pipeline que agora realiza APENAS a transcrição, alinhamento e diarização.
    """
    logger.info(f"[Worker Celery] Iniciando TRANSCRIÇÃO | task_id={task_id}")
    webhook_url = f"{NODE_BACKEND_URL}/api/v1/tasks/{task_id}/complete"
    
    hf_token = config.get("HF_TOKEN")
    whisperx_model_name = config.get("WHISPERX_MODEL", "large-v3")
    
    # Usa o dispositivo global detectado (cuda, mps, cpu) para todos os modelos
    logger.info(f"Dispositivo de processamento para esta tarefa: {DEVICE}")

    if not all([hf_token]):
        error_message = "Configuração incompleta: HF_TOKEN não foi fornecido."
        logger.error(error_message)
        notify_backend(webhook_url, {"status": "FAILED", "analysis": {"error": error_message}})
        return
        
    if not os.path.exists(audio_path):
        error_message = f"Arquivo de áudio não encontrado: {audio_path}"
        logger.error(error_message)
        notify_backend(webhook_url, {"status": "FAILED", "analysis": {"error": error_message}})
        return

    audio, result_transcribe, result_aligned, diarize_segments, result_with_speakers = None, None, None, None, None

    try:
        model = load_whisper_model(whisperx_model_name, DEVICE, COMPUTE_TYPE_DEFAULT)
        diarize_model = get_diarize_model(hf_token, DEVICE)

        logger.info(f"Carregando áudio: {audio_path}")
        with torch.inference_mode():
            audio = whisperx.load_audio(audio_path)

            logger.info("Etapa 1: Transcrevendo...")
            notify_backend(webhook_url, {"status": "TRANSCRIBING"})
            result_transcribe = model.transcribe(audio, batch_size=BATCH_SIZE)
            language_code = result_transcribe.get("language", "pt")
            logger.info(f"Idioma detectado: {language_code}")
            if DEVICE == "cuda": torch.cuda.empty_cache()

            logger.info("Etapa 2: Alinhando...")
            notify_backend(webhook_url, {"status": "ALIGNING"})
            model_a, metadata = get_align_model(language_code, DEVICE)
            result_aligned = whisperx.align(result_transcribe["segments"], model_a, metadata, audio, DEVICE, return_char_alignments=False)
            if DEVICE == "cuda": torch.cuda.empty_cache()

            logger.info("Etapa 3: Diarizando...")
            notify_backend(webhook_url, {"status": "DIARIZING"})
            diarize_segments = diarize_model(audio)
            
            logger.info("Etapa 4: Atribuindo locutores...")
            result_with_speakers = whisperx.assign_word_speakers(diarize_segments, result_aligned)
            result_with_speakers["language"] = language_code
            if DEVICE == "cuda": torch.cuda.empty_cache()

            logger.info("Etapa 5: Gerando VTT...")
            vtt_content = generate_vtt(result_with_speakers, audio_path)

        payload = {
            "status": "TRANSCRIBED",
            "transcription": vtt_content,
            "analysis": None
        }
        logger.info(f"Enviando webhook de transcrição concluída para: {webhook_url}")
        notify_backend(webhook_url, payload)

    except Exception as e:
        full_traceback = traceback.format_exc()
        error_message = f"Erro ao transcrever a tarefa {task_id}: {e}"
        logger.error(error_message)
        logger.error("Stack Trace completo:\n" + full_traceback)
        notify_backend(webhook_url, {"status": "FAILED", "analysis": {"error": error_message, "traceback": full_traceback}})

    finally:
        logger.info(f"[Worker Celery] Limpando memória para a tarefa de transcrição {task_id}...")
        if audio is not None: del audio
        if result_transcribe is not None: del result_transcribe
        if result_aligned is not None: del result_aligned
        if diarize_segments is not None: del diarize_segments
        if result_with_speakers is not None: del result_with_speakers
        
        gc.collect()
        if DEVICE == "cuda" and torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info(f"[Worker Celery] Finalizado processamento de transcrição | task_id={task_id}")

@celery_app.task(name="analyze_task")
def analyze_task(task_id: str, transcription: str, config: Dict[str, Any]):
    """
    NOVA TAREFA: Recebe uma transcrição e realiza apenas a análise com IA.
    """
    logger.info(f"[Worker Celery] Iniciando ANÁLISE DE IA | task_id={task_id}")
    webhook_url = f"{NODE_BACKEND_URL}/api/v1/tasks/{task_id}/complete"
    
    openai_api_key = config.get("OPENAI_API_KEY")
    openai_assistant_id = config.get("OPENAI_ASSISTANT_ID")

    if not all([openai_api_key, openai_assistant_id]):
        error_message = "Configuração incompleta para análise: Chave da API OpenAI ou ID do assistente ausentes."
        logger.error(error_message)
        notify_backend(webhook_url, {"status": "FAILED", "analysis": {"error": error_message}})
        return
    
    try:
        logger.info("Etapa 1: Enviando transcrição ao OpenAI Assistant...")
        analysis_result_json = run_openai_assistant(transcription, openai_api_key, openai_assistant_id)

        payload = {
            "status": "COMPLETED",
            "analysis": json.dumps(analysis_result_json, ensure_ascii=False),
        }
        logger.info(f"Enviando webhook de ANÁLISE concluída para: {webhook_url}")
        notify_backend(webhook_url, payload)

    except Exception as e:
        full_traceback = traceback.format_exc()
        error_message = f"Erro ao analisar a tarefa {task_id}: {e}"
        logger.error(error_message)
        logger.error("Stack Trace completo:\n" + full_traceback)
        notify_backend(webhook_url, {"status": "FAILED", "analysis": {"error": error_message, "traceback": full_traceback}})
    finally:
        logger.info(f"[Worker Celery] Finalizado processamento de análise | task_id={task_id}")