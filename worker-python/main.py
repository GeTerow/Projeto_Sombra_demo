import os
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, ValidationError
from typing import Dict, Any
from dotenv import load_dotenv
from celery_app import celery_app
from celery.exceptions import CeleryError
from tasks import process_audio_task, analyze_task
load_dotenv()

# --- MODO DEMO ---
# --- MODO DEMO ---
# --- LÓGICA PRINCIPAL DE PROCESSAMENTO REMOVIDA ---
# --- MODO DEMO ---
# --- MODO DEMO ---

# --- Modelos de Dados Pydantic ---
class ProcessTaskRequest(BaseModel):
    task_id: str
    file_path: str
    config: Dict[str, Any]

class AnalyzeTaskRequest(BaseModel):
    task_id: str
    transcription: str
    config: Dict[str, Any]

# --- API (FastAPI) ---
app = FastAPI(title="API de Análise de Áudio (Modo Demonstração)", version="2.0.0")

# --- Endpoints de Status e Saúde ---
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API está pronta para receber tarefas."}

# --- Endpoints Principais ---
@app.post("/process-task", status_code=202)
async def process_task_endpoint(request: ProcessTaskRequest):
    """
    Recebe a tarefa e a envia para a fila do Celery para processamento SIMULADO.
    """
    try:
        print(f"[API FastAPI-DEMO] Tarefa recebida: {request.task_id}. Enviando para a fila.")
        process_audio_task.delay(request.task_id, request.file_path, request.config)
        return {"message": "Tarefa de demonstração aceita e enfileirada."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao enfileirar a tarefa no Celery: {str(e)}")

@app.post("/analyze-task", status_code=202)
async def analyze_task_endpoint(request: AnalyzeTaskRequest):
    """
    Recebe a tarefa de análise e a envia para a fila para uma resposta SIMULADA.
    """
    try:
        print(f"[API FastAPI-DEMO] Tarefa de análise recebida: {request.task_id}. Enviando para a fila.")
        analyze_task.delay(request.task_id, request.transcription, request.config)
        return {"message": "Tarefa de análise de demonstração aceita e enfileirada."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao enfileirar a tarefa de análise: {str(e)}")

if __name__ == "__main__":
    print("Iniciando a API (FastAPI) em modo de demonstração...")
    uvicorn.run(app, host="0.0.0.0", port=8000)