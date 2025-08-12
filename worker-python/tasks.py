# tasks.py
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

import openai  # compatibilidade
from openai import OpenAI
from dotenv import load_dotenv

from celery_app import celery_app

load_dotenv()

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
logger = logging.getLogger("ai_worker")
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(name)s | %(message)s", "%Y-%m-%d %H:%M:%S"
)
handler.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False  # evita logs duplicados
logger.info("Iniciando a configuração do Worker de IA...")

# -----------------------------------------------------------------------------
# Env/Config
# -----------------------------------------------------------------------------
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:3001")
HF_TOKEN = os.getenv("HF_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_ASSISTANT_ID = os.getenv("OPENAI_ASSISTANT_ID")
ASSISTANT_MAX_WAIT_S = int(os.getenv("ASSISTANT_MAX_WAIT_S", "300"))

# WhisperX
WHISPERX_MODEL = os.getenv("WHISPERX_MODEL", "large-v3")

# IMPORTANTE: diarização e alinhamento no CPU para poupar VRAM do GPU
DIAR_DEVICE = os.getenv("DIAR_DEVICE", "cpu")
ALIGN_DEVICE = os.getenv("ALIGN_DEVICE", "cpu")

# Compat com SDK antigo
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

# -----------------------------------------------------------------------------
# Device detection
# -----------------------------------------------------------------------------
def detect_device() -> str:
    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"

DEVICE = detect_device()

# Mantemos FP16 no CUDA conforme solicitado. Batch pequeno (2) para 8GB.
if DEVICE == "cuda":
    COMPUTE_TYPE = os.getenv("WHISPERX_COMPUTE_TYPE", "float16")
    BATCH_SIZE = int(os.getenv("WHISPERX_BATCH_SIZE", "2"))
elif DEVICE == "mps":
    COMPUTE_TYPE = os.getenv("WHISPERX_COMPUTE_TYPE", "float32")
    BATCH_SIZE = int(os.getenv("WHISPERX_BATCH_SIZE", "4"))
else:
    COMPUTE_TYPE = os.getenv("WHISPERX_COMPUTE_TYPE", "int8")
    BATCH_SIZE = int(os.getenv("WHISPERX_BATCH_SIZE", "4"))

logger.info(f"Dispositivo detectado: {DEVICE} | compute_type={COMPUTE_TYPE} | batch_size={BATCH_SIZE}")

# -----------------------------------------------------------------------------
# Validação de configuração
# -----------------------------------------------------------------------------
config_errors = []
if not OPENAI_API_KEY:
    config_errors.append("OPENAI_API_KEY não definida")
if not HF_TOKEN:
    config_errors.append("HF_TOKEN não definida (Hugging Face)")
if not OPENAI_ASSISTANT_ID:
    config_errors.append("OPENAI_ASSISTANT_ID não definida")
if not NODE_BACKEND_URL:
    logger.warning("AVISO: NODE_BACKEND_URL não definida; usando http://localhost:3001")

if config_errors:
    msg = "ERRO CRÍTICO de configuração: " + "; ".join(config_errors)
    logger.error(msg)
    raise RuntimeError(msg)

# -----------------------------------------------------------------------------
# Cache e utilitários de modelo
# -----------------------------------------------------------------------------
# Cache de alinhamento por (idioma, device), pois device influencia o modelo
ALIGN_MODELS_CACHE: Dict[Tuple[str, str], Tuple[Any, Any]] = {}

@lru_cache(maxsize=1)
def load_whisperx_models() -> Tuple[Any, Any]:
    """
    Carrega e cacheia os modelos principais (WhisperX e Diarization).
    WhisperX no DEVICE com compute_type definido; Diarização no DIAR_DEVICE (CPU).
    """
    logger.info(f"Carregando WhisperX ({WHISPERX_MODEL}) em {DEVICE} (compute_type={COMPUTE_TYPE})...")
    model = whisperx.load_model(WHISPERX_MODEL, DEVICE, compute_type=COMPUTE_TYPE)

    logger.info(f"Carregando modelo de Diarização no device={DIAR_DEVICE}...")
    try:
        diarize_model = whisperx.DiarizationPipeline(use_auth_token=HF_TOKEN, device=DIAR_DEVICE)
    except TypeError:
        diarize_model = whisperx.DiarizationPipeline(hf_token=HF_TOKEN, device=DIAR_DEVICE)

    logger.info("Modelos carregados com sucesso.")
    return model, diarize_model

def get_align_model(language_code: str, device: str = ALIGN_DEVICE) -> Tuple[Any, Any]:
    """
    Carrega (com cache) o modelo de alinhamento para um idioma específico no device solicitado.
    """
    key = (language_code, device)
    if key not in ALIGN_MODELS_CACHE:
        logger.info(f"Carregando modelo de alinhamento para idioma: {language_code} em {device}")
        model_a, metadata = whisperx.load_align_model(language_code=language_code, device=device)
        ALIGN_MODELS_CACHE[key] = (model_a, metadata)
    else:
        logger.info(f"Reutilizando modelo de alinhamento cacheado para '{language_code}' em {device}.")
    return ALIGN_MODELS_CACHE[key]

# -----------------------------------------------------------------------------
# Utilitários gerais
# -----------------------------------------------------------------------------
def notify_backend(webhook_url: str, payload: Dict[str, Any], timeout: int = 20) -> None:
    """Função modificada para aceitar qualquer payload e notificar o backend."""
    try:
        # Usaremos o método PATCH, que é ideal para atualizações parciais.
        resp = requests.patch(webhook_url, json=payload, timeout=timeout)
        if resp.status_code >= 400:
            logger.error(f"Webhook para {webhook_url} retornou status {resp.status_code}: {resp.text}")
    except requests.RequestException as req_e:
        logger.error(f"Falha ao notificar backend em {webhook_url}: {req_e}")

def generate_vtt(segments_obj: Dict[str, Any], audio_path: str) -> str:
    with tempfile.TemporaryDirectory() as temp_dir:
        writer = whisperx.utils.WriteVTT(output_dir=temp_dir)
        writer(
            segments_obj,
            audio_path,
            {"max_line_width": None, "max_line_count": None, "highlight_words": False},
        )
        output_vtt_path = os.path.join(
            temp_dir, os.path.splitext(os.path.basename(audio_path))[0] + ".vtt"
        )
        with open(output_vtt_path, "r", encoding="utf-8") as f:
            return f.read()

def extract_json_from_text(text: str) -> Dict[str, Any]:
    # 1) Direto
    try:
        return json.loads(text)
    except Exception:
        pass
    # 2) Bloco ```json ... ```
    code_block = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if code_block:
        candidate = code_block.group(1).strip()
        try:
            return json.loads(candidate)
        except Exception:
            pass
    # 3) Heurística de chaves
    first = text.find("{")
    last = text.rfind("}")
    if first != -1 and last != -1 and last > first:
        candidate = text[first : last + 1].strip()
        try:
            return json.loads(candidate)
        except Exception:
            pass
    raise ValueError("Não foi possível extrair um JSON válido da resposta do Assistant.")

def run_openai_assistant(vtt_content: str, max_wait_s: int = ASSISTANT_MAX_WAIT_S) -> Dict[str, Any]:
    if not OPENAI_API_KEY or not OPENAI_ASSISTANT_ID:
        raise RuntimeError("OPENAI_API_KEY ou OPENAI_ASSISTANT_ID ausentes.")

    client = OpenAI(api_key=OPENAI_API_KEY)

    thread = client.beta.threads.create()
    logger.info(f"Thread criada: {thread.id}")

    prompt = (
        "Analise a seguinte transcrição de chamada (formato VTT) e RETORNE EXCLUSIVAMENTE um JSON válido, "
        "sem qualquer texto adicional. Se não puder analisar, retorne um JSON como "
        '{"erro": "<motivo>"}.\n\n---\n\n'
        f"{vtt_content}"
    )
    client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=prompt,
    )
    logger.info("Transcrição enviada à thread do Assistant.")

    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=OPENAI_ASSISTANT_ID,
        tool_choice="none",
    )
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

        if status == "requires_action":
            try:
                client.beta.threads.runs.cancel(thread_id=thread.id, run_id=run.id)
            except Exception:
                pass
            raise RuntimeError("Assistant solicitou ação (tools), mas ferramentas estão desabilitadas.")

        if time.time() - start > max_wait_s:
            try:
                client.beta.threads.runs.cancel(thread_id=thread.id, run_id=run.id)
            except Exception:
                pass
            raise TimeoutError(f"Tempo máximo de espera ({max_wait_s}s) excedido para execução do Assistant.")

        time.sleep(sleep_s)
        sleep_s = min(5.0, sleep_s + 0.5)

    if run.status == "failed":
        last_error = getattr(run, "last_error", None)
        reason = getattr(last_error, "message", "Motivo não informado")
        raise RuntimeError(f"A execução do Assistant falhou. Causa: {reason}")
    if run.status in {"cancelled", "expired"}:
        raise RuntimeError(f"A execução do Assistant terminou com status: {run.status}")

    messages = client.beta.threads.messages.list(thread_id=thread.id)
    assistant_text_parts = []
    for m in messages.data:
        if getattr(m, "role", "") != "assistant":
            continue
        for part in getattr(m, "content", []):
            if getattr(part, "type", "") == "text" and getattr(part, "text", None):
                assistant_text_parts.append(part.text.value or "")
        if assistant_text_parts:
            break

    if not assistant_text_parts:
        raise RuntimeError("Não foi possível localizar a mensagem do Assistant com conteúdo de texto.")

    assistant_text = "\n".join(assistant_text_parts).strip()
    analysis_json = extract_json_from_text(assistant_text)
    logger.info("Análise JSON da IA obtida com sucesso.")
    return analysis_json

# -----------------------------------------------------------------------------
# Task Celery
# -----------------------------------------------------------------------------
@celery_app.task(name="process_audio_task")
def process_audio_task(task_id: str, audio_path: str) -> None:
    """
    Pipeline:
      1) Carrega audio
      2) Transcreve (GPU FP16, batch pequeno)
      3) Alinha (CPU)
      4) Diariza (CPU)
      5) Gera VTT
      6) Assistant -> JSON
      7) Webhook backend
    """
    logger.info(f"[Worker Celery] Iniciando processamento | task_id={task_id}")
    # O webhook_url agora aponta para o mesmo endpoint para todas as atualizações.
    webhook_url = f"{NODE_BACKEND_URL}/api/v1/tasks/{task_id}/complete"

    if not os.path.exists(audio_path):
        error_message = f"Arquivo de áudio não encontrado: {audio_path}"
        logger.error(error_message)
        notify_backend(webhook_url, {"status": "FAILED", "analysis": {"error": error_message}})
        return

    try:
        model, diarize_model = load_whisperx_models()

        logger.info(f"Carregando áudio: {audio_path}")
        with torch.inference_mode():
            audio = whisperx.load_audio(audio_path)

            # --- ETAPA 1: TRANSCRIÇÃO ---
            logger.info("Etapa 1: Transcrevendo...")
            notify_backend(webhook_url, {"status": "TRANSCRIBING"})
            try:
                result_transcribe = model.transcribe(audio, batch_size=BATCH_SIZE)
            except RuntimeError as e:
                if "out of memory" in str(e).lower() and DEVICE == "cuda":
                    logger.warning("CUDA OOM na transcrição. Tentando novamente com batch_size=1...")
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                    result_transcribe = model.transcribe(audio, batch_size=1)
                else:
                    raise

            if not result_transcribe or not result_transcribe.get("segments"):
                raise RuntimeError("Transcrição vazia ou inválida.")
            language_code = result_transcribe.get("language", "pt")
            logger.info(f"Idioma detectado: {language_code}")
            if DEVICE == "cuda": torch.cuda.empty_cache()

            # --- ETAPA 2: ALINHAMENTO ---
            logger.info("Etapa 2: Alinhando...")
            notify_backend(webhook_url, {"status": "ALIGNING"})
            model_a, metadata = get_align_model(language_code, device=ALIGN_DEVICE)
            result_aligned = whisperx.align(
                result_transcribe["segments"], model_a, metadata, audio, ALIGN_DEVICE, return_char_alignments=False
            )
            if DEVICE == "cuda": torch.cuda.empty_cache()

            # --- ETAPA 3: DIARIZAÇÃO ---
            logger.info("Etapa 3: Diarizando...")
            notify_backend(webhook_url, {"status": "DIARIZING"})
            diarize_segments = diarize_model(audio_path) # Removido try-except para ser mais estrito
            
            logger.info("Etapa 4: Atribuindo locutores...")
            result_with_speakers = whisperx.assign_word_speakers(diarize_segments, result_aligned)
            result_with_speakers["language"] = language_code
            if DEVICE == "cuda": torch.cuda.empty_cache()

            # --- ETAPA 5: VTT (rápido, sem notificação) ---
            logger.info("Etapa 5: Gerando VTT...")
            vtt_content = generate_vtt(result_with_speakers, audio_path)

        # --- ETAPA 6: ANÁLISE COM IA ---
        logger.info("Etapa 6: Enviando transcrição ao OpenAI Assistant...")
        notify_backend(webhook_url, {"status": "ANALYZING"})
        analysis_result_json = run_openai_assistant(vtt_content)

        # --- ETAPA 7: FINALIZAÇÃO ---
        payload = {
            "status": "COMPLETED",
            "transcription": vtt_content,
            "analysis": json.dumps(analysis_result_json, ensure_ascii=False),
        }
        logger.info(f"Enviando webhook de sucesso para: {webhook_url}")
        notify_backend(webhook_url, payload)

    except Exception as e:
        full_traceback = traceback.format_exc()
        error_message = f"Erro ao processar a tarefa {task_id}: {e}"
        logger.error(error_message)
        logger.error("Stack Trace completo:"); logger.error(full_traceback)
        notify_backend(
            webhook_url,
            {"status": "FAILED", "analysis": {"error": error_message, "traceback": full_traceback}},
        )

    finally:
        # Limpeza de memória
        logger.info(f"[Worker Celery] Limpando memória para a tarefa {task_id}...")
        del audio, result_transcribe, result_aligned, diarize_segments, result_with_speakers
        gc.collect()
        if DEVICE == "cuda" and torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info(f"[Worker Celery] Finalizado processamento | task_id={task_id}")