#!/bin/bash
set -e

# Ajuste para o diretório da aplicação (ajuste se seu código está em /app)
cd /app || cd /usr/src/app || true

echo "Diretório atual: $(pwd)"
echo "Iniciando o servidor FastAPI (uvicorn) em background..."
# garante app-dir explícito caso o cd falhe
uvicorn --app-dir /app main:app --host 0.0.0.0 --port 8000 &

echo "Iniciando o worker do Celery em foreground..."
exec celery -A celery_app worker --loglevel=info
