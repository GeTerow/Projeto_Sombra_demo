# tasks.py
import os
import requests
import whisperx
import torch
import gc
import tempfile
import openai
import traceback
from celery_app import celery_app
from dotenv import load_dotenv
load_dotenv()
# --- Configuração Inicial ---
print("Iniciando a configuracao do Worker de IA...")

# MELHORIA: Carregar configurações de variáveis de ambiente para segurança e flexibilidade.
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:3001")
HF_TOKEN = os.getenv("HF_TOKEN")
openai.api_key = os.getenv("OPENAI_API_KEY")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
BATCH_SIZE = 8
COMPUTE_TYPE = "float16" if torch.cuda.is_available() else "int8"

# --- Validação de Configuração Essencial ---
if not openai.api_key:
    print("ERRO CRÍTICO: A variável de ambiente OPENAI_API_KEY não foi definida. O worker não poderá processar a análise.")
if not HF_TOKEN:
    print("ERRO CRÍTICO: A variável de ambiente HF_TOKEN não foi definida. O worker não poderá realizar a diarização.")
if not NODE_BACKEND_URL:
     print("AVISO: A variável de ambiente NODE_BACKEND_URL não foi definida. O worker não poderá enviar webhooks.")

# --- Carregamento dos Modelos ---
print(f"Dispositivo: {DEVICE}. Carregando modelo WhisperX (large_v3)...")
model = whisperx.load_model("large-v3", DEVICE, compute_type=COMPUTE_TYPE)

print("Carregando modelo de Diarizacao...")
if not HF_TOKEN:
    raise ValueError("Token do Hugging Face (HF_TOKEN) não encontrado. A diarização não pode ser inicializada.")
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
        error_message = f"Arquivo de áudio não encontrado pelo WORKER em: {audio_path}. Verifique os volumes e permissões."
        print(f"  -> FALHA! {error_message}")
        try:
            requests.patch(webhook_url, json={"status": "FAILED", "analysis": error_message}, timeout=10)
        except requests.RequestException as req_e:
            print(f"  -> FALHA ADICIONAL: Não foi possível notificar o backend sobre o erro de arquivo não encontrado. Erro: {req_e}")
        return

    try:
        # Etapas 1-5 ...
        print(f"  -> Carregando áudio de: {audio_path}")
        audio = whisperx.load_audio(audio_path)
        
        print("  -> Etapa 1: Transcrevendo...")
        result_transcribe = model.transcribe(audio, batch_size=BATCH_SIZE)
        language_code = result_transcribe.get("language", "pt")
        
        print(f"  -> Etapa 2: Alinhando transcrição (idioma: {language_code})...")
        if language_code not in ALIGN_MODELS_CACHE:
            print(f"    -> Modelo de alinhamento para '{language_code}' não está no cache. Carregando...")
            model_a, metadata = whisperx.load_align_model(language_code=language_code, device=DEVICE)
            ALIGN_MODELS_CACHE[language_code] = (model_a, metadata)
        else:
            print(f"    -> Reutilizando modelo de alinhamento para '{language_code}' do cache.")
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
        
        print("  -> Etapa 6: Enviando transcrição para análise da IA (GPT)...")
        if not openai.api_key:
             raise ValueError("A chave da API da OpenAI não foi configurada no worker.")

        prompt = f"""
    Você é um coach de vendas especialista em análise de ligações.
    A seguir está uma transcrição em formato WebVTT.

    Sua tarefa é:
    1.  Primeiro, deduza qual locutor é o vendedor e qual é o cliente com base no diálogo. Apresente esta dedução sob o título "**1. Identificação dos locutores**".
    2.  Depois, identifique, se houver, o máximo de "momentos cruciais" onde o vendedor poderia ter melhorado. Apresente esta seção sob o título "**2. Momentos cruciais para melhoria**".
    3.  Para cada momento crucial, formate sua análise da seguinte maneira:
        - **Momento X:**
        - **Vendedor:** [Citação exata da fala do vendedor]
        - **Problema:** Análise do que poderia ser melhorado.
        - **Melhoria:** Sugestão prática e direta.
        - **Sugestão de Fala:** Exemplo de como o vendedor poderia ter dito.
    
    **IMPORTANTE:** Para garantir a legibilidade, adicione uma linha divisória "---" e uma quebra de linha extra entre cada "Momento" analisado.

    Seja direto, prático e foque seus conselhos no desempenho do vendedor.

    Conversa Transcrita (Formato VTT):
    "{vtt_content}"
    """
    
        response = openai.chat.completions.create(
            # RESTAURADO: Modelo original mantido conforme solicitado.
            model="gpt-5-nano-2025-08-07",
            messages=[
                {"role": "system", "content": "Você é um coach de vendas que analisa transcrições em formato WebVTT."},
                {"role": "user", "content": prompt}
            ]
        )
        analysis_result = response.choices[0].message.content
        print("  -> Análise da IA concluída com sucesso.")

        print(f"  -> SUCESSO! Enviando webhook para: {webhook_url}")
        requests.patch(webhook_url, json={
            "status": "COMPLETED",
            "transcription": vtt_content,
            "analysis": analysis_result
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
            print(f"  -> FALHA ADICIONAL: Não foi possível notificar o backend sobre o erro. Erro do Request: {req_e}")
    
    finally:
        print(f"[Worker Celery] Limpando cache da GPU para a tarefa {task_id}.")
        gc.collect()
        if DEVICE == "cuda":
            torch.cuda.empty_cache()