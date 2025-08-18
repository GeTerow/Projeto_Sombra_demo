#!/bin/bash

# Inicia o servidor FastAPI/Uvicorn em segundo plano
echo "Iniciando o servidor FastAPI..."
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Inicia o worker do Celery em primeiro plano
echo "Iniciando o worker do Celery..."
celery -A celery_app worker --loglevel=info