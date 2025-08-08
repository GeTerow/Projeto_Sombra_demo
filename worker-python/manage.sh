#!/bin/bash

# --- Configurações ---

# ATENÇÃO: Verifique se este caminho corresponde ao seu ambiente virtual.
# O caminho que você forneceu (.\.venv\Scripts\activate) foi convertido para o formato Bash.
# Se sua pasta venv ou projeto estiver em outro lugar, ajuste o caminho aqui.
VENV_ACTIVATE_PATH="venv/Scripts/activate"

# Nome do container Docker para o Redis
REDIS_CONTAINER_NAME="ia-redis-server"

# Diretórios para arquivos de log e de processo (PID)
LOG_DIR="logs"
PID_DIR="pids"

# Cores para o output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sem Cor

# --- Funções do Script ---

# Garante que os diretórios de logs e pids existam
mkdir -p $LOG_DIR
mkdir -p $PID_DIR

# Função para mostrar como usar o script
usage() {
    echo "Script de Gerenciamento do Worker de IA"
    echo ""
    echo "Uso: $0 {start|stop|restart|status|logs}"
    echo "  start         - Inicia o Redis, o Worker Celery e a API FastAPI."
    echo "  stop          - Para todos os serviços."
    echo "  restart       - Para e depois inicia todos os serviços."
    echo "  status        - Mostra o status atual de cada serviço."
    echo "  logs [celery|api] - Mostra os logs em tempo real de um serviço."
    echo ""
}

# Função para verificar se o script de ativação do ambiente virtual existe
check_venv() {
    if [ ! -f "$VENV_ACTIVATE_PATH" ]; then
        echo -e "${RED}ERRO: Script de ativação do ambiente virtual não encontrado em '$VENV_ACTIVATE_PATH'.${NC}"
        echo "Verifique a variável VENV_ACTIVATE_PATH no topo do script manage.sh."
        exit 1
    fi
}

# Função para iniciar os serviços
start_services() {
    echo -e "${YELLOW}Iniciando serviços...${NC}"
    check_venv # Verifica se o venv existe antes de continuar

    # 1. Iniciar Redis (se não estiver rodando)
    if [ ! "$(docker ps -q -f name=$REDIS_CONTAINER_NAME)" ]; then
        if [ "$(docker ps -aq -f status=exited -f name=$REDIS_CONTAINER_NAME)" ]; then
            echo "-> Removendo container antigo do Redis e iniciando um novo..."
            docker rm $REDIS_CONTAINER_NAME > /dev/null
        fi
        echo "-> Iniciando container Redis ($REDIS_CONTAINER_NAME) em segundo plano..."
        docker run -d --name $REDIS_CONTAINER_NAME -p 6380:6379 redis > /dev/null
    else
        echo "-> Container Redis já está em execução."
    fi

    # 2. Iniciar Worker Celery (com ativação do venv)
    echo "-> Iniciando Worker Celery em segundo plano (logs em $LOG_DIR/celery.log)..."
    # --- LINHA CORRIGIDA ---
    # Trocado --concurrency=1 por --pool=gevent para compatibilidade com Windows
    nohup bash -c "source $VENV_ACTIVATE_PATH; celery -A celery_app worker --loglevel=info --pool=gevent" > "$LOG_DIR/celery.log" 2>&1 &
    echo $! > "$PID_DIR/celery.pid"

    # 3. Iniciar API FastAPI/Uvicorn (com ativação do venv)
    echo "-> Iniciando API FastAPI em segundo plano (logs em $LOG_DIR/api.log)..."
    nohup bash -c "source $VENV_ACTIVATE_PATH; uvicorn main:app --host 0.0.0.0 --port 8000" > "$LOG_DIR/api.log" 2>&1 &
    echo $! > "$PID_DIR/api.pid"
    
    sleep 2 # Dá um tempo para os serviços iniciarem antes de mostrar o status
    echo -e "${GREEN}Todos os serviços foram iniciados.${NC}"
    check_status
}

# Função para parar os serviços
stop_services() {
    echo -e "${YELLOW}Parando serviços...${NC}"

    # Parar API FastAPI
    if [ -f "$PID_DIR/api.pid" ]; then
        echo "-> Parando API FastAPI..."
        kill $(cat "$PID_DIR/api.pid") > /dev/null 2>&1
        rm "$PID_DIR/api.pid"
    else
        echo "-> PID da API não encontrado. Pode já estar parada."
    fi

    # Parar Worker Celery
    if [ -f "$PID_DIR/celery.pid" ]; then
        echo "-> Parando Worker Celery..."
        kill $(cat "$PID_DIR/celery.pid") > /dev/null 2>&1
        rm "$PID_DIR/celery.pid"
    else
        echo "-> PID do Celery não encontrado. Pode já estar parado."
    fi

    # Parar Redis
    if [ "$(docker ps -q -f name=$REDIS_CONTAINER_NAME)" ]; then
        echo "-> Parando container Redis..."
        docker stop $REDIS_CONTAINER_NAME > /dev/null
    else
        echo "-> Container Redis já estava parado."
    fi
    
    echo -e "${GREEN}Todos os serviços foram parados.${NC}"
}

# Função para verificar o status
check_status() {
    echo "Verificando status dos serviços:"
    
    # Status Redis
    if [ "$(docker ps -q -f name=$REDIS_CONTAINER_NAME)" ]; then
        echo -e "- Redis: ${GREEN}EM EXECUÇÃO${NC}"
    else
        echo -e "- Redis: ${RED}PARADO${NC}"
    fi

    # Status Celery
    if [ -f "$PID_DIR/celery.pid" ] && ps -p $(cat "$PID_DIR/celery.pid") > /dev/null; then
        echo -e "- Worker Celery: ${GREEN}EM EXECUÇÃO${NC} (PID: $(cat "$PID_DIR/celery.pid"))"
    else
        echo -e "- Worker Celery: ${RED}PARADO${NC}"
    fi
    
    # Status API
    if [ -f "$PID_DIR/api.pid" ] && ps -p $(cat "$PID_DIR/api.pid") > /dev/null; then
        echo -e "- API FastAPI: ${GREEN}EM EXECUÇÃO${NC} (PID: $(cat "$PID_DIR/api.pid"))"
    else
        echo -e "- API FastAPI: ${RED}PARADO${NC}"
    fi
}

# Função para ver os logs
view_logs() {
    if [ "$1" == "celery" ]; then
        echo "Mostrando logs do Celery (Pressione Ctrl+C para sair)..."
        tail -f "$LOG_DIR/celery.log"
    elif [ "$1" == "api" ]; then
        echo "Mostrando logs da API (Pressione Ctrl+C para sair)..."
        tail -f "$LOG_DIR/api.log"
    else
        echo -e "${RED}Erro: Especifique qual log ver.${NC}"
        echo "Uso: $0 logs [celery|api]"
    fi
}


# --- Lógica Principal do Script ---
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_services
        ;;
    status)
        check_status
        ;;
    logs)
        view_logs "$2"
        ;;
    *)
        usage
        exit 1
        ;;
esac

exit 0