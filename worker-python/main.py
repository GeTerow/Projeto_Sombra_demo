# main.py
import os
import uvicorn
from fastapi import FastAPI, HTTPException, Request # ADICIONADO Request
from pydantic import BaseModel, ValidationError # ADICIONADO ValidationError
from typing import List, Dict, Any
import openai
from dotenv import load_dotenv

from celery_app import celery_app
from celery.exceptions import CeleryError

load_dotenv()

from tasks import process_audio_task, analyze_task 

openai.api_key = os.getenv("OPENAI_API_KEY")


# --- Modelos de Dados Pydantic ---
class ProcessTaskRequest(BaseModel):
    task_id: str
    file_path: str
    config: Dict[str, Any] # Garante que a requisição tenha o campo config

class GenerateSummaryRequest(BaseModel):
    name: str
    transcriptions: List[str]
    openai_api_key: str

class AnalyzeTaskRequest(BaseModel):
    task_id: str
    transcription: str
    config: Dict[str, Any]
# --- API (FastAPI) ---
app = FastAPI(title="API de Análise de Áudio", version="2.0.0")


# --- Endpoints de Status e Saúde ---
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API está pronta para receber tarefas."}

@app.get("/health-redis")
def health_redis_check():
    try:
        stats = celery_app.control.inspect().stats()
        if not stats:
            raise CeleryError("Não foi possível obter estatísticas do broker. O worker está rodando e acessível?")
        return {"status": "ok", "message": "Conexão com o broker do Celery (Redis) está funcionando."}
    except Exception as e:
        raise HTTPException(
            status_code=503, 
            detail=f"Não foi possível conectar ao broker do Celery (Redis). Erro: {str(e)}"
        )


# --- Endpoints Principais ---
@app.post("/process-task", status_code=202)
async def process_task_endpoint(raw_request: Request): # ASSINATURA ALTERADA
    """
    Recebe a tarefa, incluindo sua configuração, e a envia para a fila do Celery.
    """
    # 1. Logar o corpo bruto da requisição
    body = await raw_request.json()

    # 2. Tentar validar manualmente com o Pydantic
    try:
        request = ProcessTaskRequest.model_validate(body)
    except ValidationError as e:
        print(f"[API FastAPI] ERRO DE VALIDAÇÃO Pydantic: {e.errors()}")
        raise HTTPException(status_code=422, detail=e.errors())

    # 3. Logar o caminho específico que será verificado
    file_path_to_check = request.file_path
    print(f"[API FastAPI] Verificando existência do arquivo em: {file_path_to_check}")
    
    if not os.path.exists(file_path_to_check):
        print(f"[API FastAPI] ARQUIVO NÃO ENCONTRADO! Retornando 404.")
        raise HTTPException(status_code=404, detail=f"Arquivo de áudio não encontrado em: {file_path_to_check}")

    try:
        print(f"[API FastAPI] Tarefa validada: {request.task_id}. Enviando para a fila do Celery.")
        process_audio_task.delay(request.task_id, request.file_path, request.config)
        
        return {"message": "Tarefa de processamento de áudio aceita e enfileirada para execução."}
    except Exception as e:
        error_detail = f"Falha ao enfileirar a tarefa no Celery. A API não conseguiu se conectar ao Redis. Erro: {str(e)}"
        print(f"[API FastAPI] ERRO CRÍTICO: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/analyze-task", status_code=202)
async def analyze_task_endpoint(request: AnalyzeTaskRequest):

    try:
        print(f"[API FastAPI] Tarefa de ANÁLISE recebida: {request.task_id}. Enviando para a fila do Celery.")
        analyze_task.delay(request.task_id, request.transcription, request.config)
        return {"message": "Tarefa de análise aceita e enfileirada para execução."}
    except Exception as e:
        error_detail = f"Falha ao enfileirar a tarefa de análise no Celery. Erro: {str(e)}"
        print(f"[API FastAPI] ERRO CRÍTICO: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/generate-summary")
def generate_summary(request: GenerateSummaryRequest):
    client = openai.OpenAI(api_key=request.openai_api_key)
    
    print(f"-> Gerando resumo para {request.name} com base em {len(request.transcriptions)} transcricoes.")
    
    # ... (lógica do prompt)
    previous_transcriptions_text = "\n\n---\n[FIM DA TRANSCRICAO]\n---\n\n".join(
        [f"Transcricao {i+1}:\n{transcription}" for i, transcription in enumerate(request.transcriptions)]
    )

    prompt = f"""
    Você é um gerente de vendas sênior e está preparando uma análise de desempenho para a vendedora chamada "{request.name}".
    Você tem em mãos as últimas {len(request.transcriptions)} transcrições de suas ligações.
    O modelo de transcrição que gera o arquivo VTT não é perfeito. Frequentemente, ele confunde os interlocutores, atribuindo a fala de uma pessoa a outra (ex: SPEAKER 01 pode conter falas tanto do vendedor quanto do cliente). Portanto, sua análise não deve confiar cegamente nessas etiquetas de voz. Sua inteligência está em superar essa limitação.
    Ignore as transcrições que são muito curtas ou que claramente não representam uma ligação de vendas.
    Sua tarefa é sintetizar essas análises em um único documento coeso e construtivo. O documento deve ser em formato de markdown, direcionado para a vendedora, bem detalhado e sempre dando exemplos concretos das ligações.

    **Regras obrigatórias de formatação:**
    - Sempre coloque títulos, subtítulos e tópicos importantes em **negrito** usando `**texto**`.
    - Nas seções de "Oportunidades de Desenvolvimento", **os subtópicos devem obrigatoriamente vir em negrito** assim:
         **O que melhorar:**
         **Como isso se manifestou (Exemplo prático):**
         **Como pode ser diferente (Sugestão de melhoria):**

    Estruture o documento da seguinte forma:

    1.  **Visão Geral do Desempenho:** Comece com um parágrafo de abertura, reconhecendo o esforço e o volume de trabalho recente de {request.name}.
    2.  **Padrões de Destaque (Pontos Fortes):** Identifique e liste em tópicos os pontos fortes que aparecem consistentemente nas transcrições. Essa parte pode ser mais resumida.
    3.  **Oportunidades de Desenvolvimento (Pontos a Melhorar):** Identifique os principais pontos de melhoria recorrentes. Para cada ponto, detalhe extensivamente de forma construtiva, usando obrigatoriamente a seguinte estrutura:
         **O que melhorar:** Identifique a competência ou o comportamento a ser desenvolvido (Ex: Condução da fase de descoberta, contorno de objeções de preço, etc.).
         **Como isso se manifestou (Exemplo prático):** Descreva uma ou mais situações específicas das ligações em que isso foi notado. Seja específico, citando o contexto e, se possível, trechos que ilustrem o ponto.
         **Como pode ser diferente (Sugestão de melhoria):** Ofereça uma sugestão clara e prática sobre como agir de forma diferente em situações futuras para obter um resultado melhor. Dê exemplos de frases ou abordagens alternativas.
    4.  **Plano de Ação Sugerido:** Com base nas oportunidades identificadas, sugira ações práticas, bem detalhadas e focadas que {request.name} pode implementar nas próximas semanas.
    
    Seja objetivo, claro e não economize palavras.

    Aqui estão as transcrições para sua referência:
    ---
    {previous_transcriptions_text}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-5-mini-2025-08-07",
            messages=[
                {"role": "system", "content": "Você é um gerente de vendas sênior elaborando um feedback de desempenho."},
                {"role": "user", "content": prompt}
            ]
        )
        summary = response.choices[0].message.content
        print("  -> Resumo consolidado gerado com sucesso.")
        return {"summary": summary}
    except Exception as e:
        print(f"  -> ERRO ao gerar resumo: {e}")
        raise HTTPException(status_code=500, detail=f"Falha ao gerar o resumo da IA: {str(e)}")


if __name__ == "__main__":
    print("Iniciando a API (FastAPI)...")
    if not openai.api_key:
        print("AVISO: A variável de ambiente OPENAI_API_KEY não foi definida. O endpoint /generate-summary irá falhar.")
    uvicorn.run(app, host="0.0.0.0", port=8000)