# **Projeto Sombra**

Este projeto é uma aplicação web full-stack projetada para fazer upload e analisar gravações de chamadas de vendas. A plataforma transcreve o áudio, identifica os interlocutores e utiliza um assistente de IA para gerar insights sobre o desempenho da vendedora, destacando pontos fortes e oportunidades de melhoria.

## **Arquitetura**

O sistema é dividido em três componentes principais:

1. **frontend-react**: A interface do usuário (UI) construída com React e Vite. Permite o upload de áudios e a visualização dos dashboards e análises.  
2. **backend-node**: O servidor principal (orquestrador) construído com Node.js, Express e Prisma. Ele gerencia as tarefas, a comunicação com o banco de dados e serve a API para o frontend.  
3. **worker-python**: O serviço de processamento pesado, construído em Python com Celery e FastAPI. É responsável pela transcrição do áudio, diarização (identificação de locutores) e a análise através da API da OpenAI.

## **Pré-requisitos**

Antes de começar, garanta que você tenha os seguintes softwares instalados em sua máquina:

* **Node.js**: (v18 ou superior)  
* **npm** (geralmente vem com o Node.js)  
* **Python**: (Exatamente v12.x)  
* **Docker** e **Docker Compose**: Para executar o servidor Redis (broker do Celery).  
* **Git**

## **Guia de Instalação e Execução**

Siga os passos abaixo para configurar e rodar cada parte do sistema em seu ambiente de desenvolvimento.

### **1\. Backend (Node.js)**

O backend é o coração do sistema, responsável por gerenciar o banco de dados e as tarefas.

\# 1\. Navegue até o diretório do backend  
cd backend-node

\# 2\. Instale as dependências  
npm install

\# 3\. Crie o arquivo de variáveis de ambiente  
\# Copie o arquivo de exemplo .env.example para .env  
cp .env.example .env

Agora, edite o arquivo .env com as suas configurações:

* **DATABASE\_URL**: Sua string de conexão para um banco de dados **PostgreSQL**. Ex: postgresql://USER:PASSWORD@HOST:PORT/DATABASE  
* **PYTHON\_WORKER\_URL**: O endereço do worker Python. O padrão (http://localhost:8000) deve funcionar.  
* **PORT**: A porta onde o backend irá rodar. O padrão é 3001\.

\# 4\. Execute as migrações do banco de dados com o Prisma  
\# Isso criará as tabelas necessárias no seu banco  
npm run db:migrate

\# 5\. (Opcional) Popule o banco com dados de exemplo  
npm run db:seed

\# 6\. Inicie o servidor de desenvolvimento  
npm run dev

Após esses passos, o servidor backend estará rodando em http://localhost:3001.

### **2\. Worker de IA (Python)**

O worker executa as tarefas de processamento de áudio em segundo plano.

\# 1\. Navegue até o diretório do worker  
cd worker-python

\# 2\. Crie e ative um ambiente virtual (Virtual Environment) com Python 12  
\# Certifique-se que o comando 'python' ou 'python3' aponta para sua instalação do Python 12  
\# No Windows:  
python \-m venv .venv  
.venv\\\\Scripts\\\\activate

\# No macOS/Linux:  
python3 \-m venv .venv  
source .venv/bin/activate

\# 3\. Instale as dependências Python  
\# O comando a seguir instala todas as bibliotecas necessárias, incluindo PyTorch para CUDA 12.1  
pip install openai celery fastapi dotenv gevent requests uvicorn numpy==1.26.4 pyannote.audio==3.1.1 whisperx torch==2.3.1 torchvision==0.18.1 torchaudio==2.3.1 \--index-url https://download.pytorch.org/whl/cu121

\# 4\. Crie o arquivo de variáveis de ambiente  
cp .env.example .env

Edite o arquivo .env com suas chaves de API e configurações:

* **OPENAI\_API\_KEY**: Sua chave secreta da API da OpenAI.  
* **HF\_TOKEN**: Seu token de acesso do Hugging Face (necessário para o modelo de diarização).  
* **OPENAI\_ASSISTANT\_ID**: O ID do assistente da OpenAI configurado para realizar as análises.  
* **REDIS\_URL**: Endereço do servidor Redis. O padrão (redis://localhost:6380/0) funciona com o manage.sh.

\# 5\. Inicie todos os serviços do worker (Redis, Celery e FastAPI)  
\# O script 'manage.sh' gerencia tudo para você.  
\# Certifique-se que o Docker está em execução antes de rodar este comando.  
./manage.sh start

Para verificar o status dos serviços, use ./manage.sh status. Para ver os logs, use ./manage.sh logs celery ou ./manage.sh logs api.

### **3\. Frontend (React)**

O frontend é a interface com a qual o usuário interage.

\# 1\. Navegue até o diretório do frontend  
cd frontend-react

\# 2\. Instale as dependências  
npm install

\# 3\. Crie o arquivo de variáveis de ambiente  
cp .env.example .env

Edite o arquivo .env para garantir que ele aponte para o seu backend:

* **VITE\_API\_URL**: O endereço da API do backend. O padrão (http://localhost:3001/api/v1) deve funcionar.

\# 4\. Inicie o servidor de desenvolvimento do Vite  
npm run dev

Após esses passos, a aplicação React estará acessível em seu navegador, geralmente em http://localhost:5173.

## **Ordem de Execução**

Para rodar o sistema completo:

1. Inicie os serviços do **Worker** (./manage.sh start).  
2. Inicie o servidor do **Backend** (npm run dev).  
3. Inicie o servidor do **Frontend** (npm run dev).

Agora você está pronto para usar a aplicação\!