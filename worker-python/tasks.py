# tasks.py
import os
import requests
import whisperx
import torch
import gc
import tempfile
import openai
import traceback
import time # NOVO: Import para polling
import json # NOVO: Import para carregar a resposta JSON

from celery_app import celery_app
from dotenv import load_dotenv
load_dotenv()

# --- Configuração Inicial ---
print("Iniciando a configuracao do Worker de IA...")

NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:3001")
HF_TOKEN = os.getenv("HF_TOKEN")
openai.api_key = os.getenv("OPENAI_API_KEY")
# NOVO: Adicione o ID do seu Assistant no arquivo .env
OPENAI_ASSISTANT_ID = os.getenv("OPENAI_ASSISTANT_ID")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
BATCH_SIZE = 8
COMPUTE_TYPE = "float16" if torch.cuda.is_available() else "int8"

# --- Validação de Configuração Essencial ---
if not openai.api_key:
    print("ERRO CRÍTICO: A variável de ambiente OPENAI_API_KEY não foi definida.")
if not HF_TOKEN:
    print("ERRO CRÍTICO: A variável de ambiente HF_TOKEN não foi definida.")
# NOVO: Validação do ID do Assistant
if not OPENAI_ASSISTANT_ID:
    print("ERRO CRÍTICO: A variável de ambiente OPENAI_ASSISTANT_ID não foi definida.")
if not NODE_BACKEND_URL:
     print("AVISO: A variável de ambiente NODE_BACKEND_URL não foi definida.")

# --- Carregamento dos Modelos ---
print(f"Dispositivo: {DEVICE}. Carregando modelo WhisperX (large-v3)...")
model = whisperx.load_model("large-v3", DEVICE, compute_type=COMPUTE_TYPE)

print("Carregando modelo de Diarizacao...")
if not HF_TOKEN:
    raise ValueError("Token do Hugging Face (HF_TOKEN) não encontrado.")
diarize_model = whisperx.DiarizationPipeline(use_auth_token=HF_TOKEN, device=DEVICE)

ALIGN_MODELS_CACHE = {}
print(">> Modelos carregados com sucesso. Worker pronto para receber tarefas.")

@celery_app.task
def process_audio_task(task_id: str, audio_path: str):
    """
    Função principal que executa todo o pipeline de análise de áudio.
    """
    print(f"[Worker Celery] Iniciando processamento para a Tarefa ID: {task_id}")
    webhook_url = f"{NODE_BACKEND_URL}/api/v1/tasks/{task_id}/complete"
    
    if not os.path.exists(audio_path):
        error_message = f"Arquivo de áudio não encontrado pelo WORKER em: {audio_path}."
        print(f"  -> FALHA! {error_message}")
        try:
            requests.patch(webhook_url, json={"status": "FAILED", "analysis": error_message}, timeout=10)
        except requests.RequestException as req_e:
            print(f"  -> FALHA ADICIONAL: Não foi possível notificar o backend. Erro: {req_e}")
        return

    try:
        # Etapas 1-5 ... (sem mudanças)
        print(f"  -> Carregando áudio de: {audio_path}")
        audio = whisperx.load_audio(audio_path)
        
        print("  -> Etapa 1: Transcrevendo...")
        result_transcribe = model.transcribe(audio, batch_size=BATCH_SIZE)
        language_code = result_transcribe.get("language", "pt")
        
        print(f"  -> Etapa 2: Alinhando transcrição (idioma: {language_code})...")
        if language_code not in ALIGN_MODELS_CACHE:
            print(f"    -> Carregando modelo de alinhamento para '{language_code}'...")
            model_a, metadata = whisperx.load_align_model(language_code=language_code, device=DEVICE)
            ALIGN_MODELS_CACHE[language_code] = (model_a, metadata)
        else:
            print(f"    -> Reutilizando modelo de alinhamento para '{language_code}'.")
        model_a, metadata = ALIGN_MODELS_CACHE[language_code]
        result_aligned = whisperx.align(result_transcribe["segments"], model_a, metadata, audio, DEVICE, return_char_alignments=False)
        
        print("  -> Etapa 3: Diarizando para identificar locutores...")
        diarize_segments = diarize_model(audio)
        
        print("  -> Etapa 4: Atribuindo locutores às falas...")
        result_final = whisperx.assign_word_speakers(diarize_segments, result_aligned)
        result_final["language"] = language_code
        
        print("  -> Etapa 5: Gerando o texto final no formato VTT...")
        vtt_content = ""
        with tempfile.TemporaryDirectory() as temp_dir:
            writer = whisperx.utils.WriteVTT(output_dir=temp_dir)
            writer(result_final, audio_path, {"max_line_width": None, "max_line_count": None, "highlight_words": False})
            output_vtt_path = os.path.join(temp_dir, os.path.splitext(os.path.basename(audio_path))[0] + ".vtt")
            with open(output_vtt_path, 'r', encoding='utf-8') as f:
                vtt_content = f.read()
        
        # --- ETAPA 6: LÓGICA DO ASSISTANT (ATUALIZADA) ---
        print("  -> Etapa 6: Interagindo com o OpenAI Assistant...")
        if not openai.api_key or not OPENAI_ASSISTANT_ID:
             raise ValueError("Chave da API OpenAI ou ID do Assistant não configurados.")

        client = openai.OpenAI()

        # 1. Cria uma Thread
        thread = client.beta.threads.create()
        print(f"    -> Thread criada com ID: {thread.id}")

        # 2. Adiciona a transcrição como uma mensagem na Thread
        client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=f"Analise a seguinte transcrição de chamada:\n\n---\n\n{vtt_content}"
        )
        print("    -> Mensagem com a transcrição enviada para a thread.")

        # 3. Executa o Assistant
        run = client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=OPENAI_ASSISTANT_ID
        )
        print(f"    -> Assistant executado com Run ID: {run.id}. Aguardando conclusão...")

        # 4. Polling: Verifica o status da execução até ser concluída
        while run.status not in ["completed", "failed", "cancelled"]:
            time.sleep(2) # Espera 2 segundos entre as verificações
            run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
            print(f"    -> Status atual: {run.status}")

        if run.status == "failed":
            raise Exception(f"A execução do Assistant falhou. Causa: {run.last_error.message}")
        if run.status == "cancelled":
             raise Exception("A execução do Assistant foi cancelada.")

        # 5. Recupera a resposta do Assistant
        messages = client.beta.threads.messages.list(thread_id=thread.id)
        assistant_message = messages.data[0]
        
        # A resposta estará dentro de um bloco de texto, que esperamos ser um JSON
        json_response_str = assistant_message.content[0].text.value
        
        # Valida e converte a string para um objeto JSON (para garantir que está correta)
        analysis_result_json = json.loads(json_response_str)

        print("  -> Análise JSON da IA recebida com sucesso.")

        print(f"  -> SUCESSO! Enviando webhook para: {webhook_url}")
        requests.patch(webhook_url, json={
            "status": "COMPLETED",
            "transcription": vtt_content,
            # Enviamos o JSON como uma string no corpo da requisição
            "analysis": json.dumps(analysis_result_json) 
        }, timeout=10)

    except Exception as e:
        full_traceback = traceback.format_exc()
        error_message = f"Erro crítico ao processar a tarefa {task_id}: {str(e)}"
        
        print(f"  -> FALHA! {error_message}")
        print("  -> Stack Trace Completo:")
        print(full_traceback)
        
        try:
            requests.patch(
                webhook_url, 
                json={"status": "FAILED", "analysis": f"{error_message}\n\nTraceback:\n{full_traceback}"},
                timeout=10
            )
            print("  -> Webhook de falha enviado com sucesso para o backend.")
        except requests.RequestException as req_e:
            print(f"  -> FALHA ADICIONAL: Não foi possível notificar o backend. Erro: {req_e}")
    
    finally:
        print(f"[Worker Celery] Limpando cache da GPU para a tarefa {task_id}.")
        gc.collect()
        if DEVICE == "cuda":
            torch.cuda.empty_cache()