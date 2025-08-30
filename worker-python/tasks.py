import os
import logging
import time
from typing import Any, Dict
from celery_app import celery_app
import requests

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
logger.info("Worker de IA iniciado em MODO DE DEMONSTRAÇÃO.")

# --- Constantes ---
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:3001")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

# --- MODO DE DEMONSTRAÇÃO ---
# As funções de processamento pesado foram desativadas.
# O worker apenas registrará que recebeu a tarefa e simulará
# um processamento para que o frontend mostre o progresso.

def notify_backend(webhook_url: str, payload: Dict[str, Any], timeout: int = 20) -> None:
    try:
        headers = {'Content-Type': 'application/json'}
        if INTERNAL_API_KEY:
            headers['x-internal-api-key'] = INTERNAL_API_KEY
        resp = requests.patch(webhook_url, json=payload, headers=headers, timeout=timeout)
        if resp.status_code >= 400:
            logger.error(f"Webhook (modo demo) para {webhook_url} retornou status {resp.status_code}: {resp.text}")
    except requests.RequestException as req_e:
        logger.error(f"Falha ao notificar backend (modo demo) em {webhook_url}: {req_e}")

@celery_app.task(name="process_audio_task")
def process_audio_task(task_id: str, audio_path: str, config: Dict[str, Any]):
    """
    Função de transcrição SIMULADA para o modo de demonstração.
    """
    webhook_url = f"{NODE_BACKEND_URL}/api/v1/tasks/{task_id}/complete"
    logger.info(f"[DEMO] Iniciando processamento simulado para task_id={task_id}")

    time.sleep(2)
    notify_backend(webhook_url, {"status": "TRANSCRIBING"})
    time.sleep(2)
    notify_backend(webhook_url, {"status": "ALIGNING"})
    time.sleep(2)
    notify_backend(webhook_url, {"status": "DIARIZING"})
    time.sleep(2)

    mock_vtt = """WEBVTT

[SPEAKER_00]: Olá, esta é uma transcrição de demonstração.
00:00:01.500 --> 00:00:04.000

[SPEAKER_01]: O processamento real de áudio foi desativado.
00:00:04.500 --> 00:00:07.000
"""
    payload = {"status": "TRANSCRIBED", "transcription": mock_vtt, "analysis": None}
    notify_backend(webhook_url, payload)
    logger.info(f"[DEMO] Finalizando processamento simulado para task_id={task_id}")
    return "Modo de demonstração: processamento de áudio simulado."


@celery_app.task(name="analyze_task")
def analyze_task(task_id: str, transcription: str, config: Dict[str, Any]):
    """
    Função de análise de IA desativada no modo de demonstração.
    """
    webhook_url = f"{NODE_BACKEND_URL}/api/v1/tasks/{task_id}/complete"
    logger.info(f"[DEMO] Recebida tarefa de análise para task_id={task_id}, mas nenhuma ação de IA será executada.")

    time.sleep(3) # Simula a análise da IA

    # Retorna uma falha controlada para exibir no frontend
    error_payload = {
        "status": "FAILED",
        "analysis": {
            "error": "Funcionalidade de análise por IA desativada na versão de demonstração pública."
        }
    }
    notify_backend(webhook_url, error_payload)
    logger.info(f"[DEMO] Finalizando tarefa de análise (simulado) para task_id={task_id}.")
    return "Modo de demonstração: análise de IA ignorada."