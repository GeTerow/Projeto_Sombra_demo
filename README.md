# Projeto Sombra

Este projeto é uma aplicação web full-stack projetada para fazer upload e analisar gravações de chamadas de vendas. A plataforma transcreve o áudio, identifica os interlocutores e utiliza um assistente de IA para gerar insights sobre o desempenho da vendedora, destacando pontos fortes e oportunidades de melhoria.

## Tecnologias

O projeto é construído com as seguintes tecnologias principais:

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Worker**: Python, Celery, FastAPI, WhisperX, Pyannote
- **Infraestrutura**: Docker, Docker Compose, Redis

## Arquitetura

O sistema é containerizado e orquestrado com o Docker Compose, sendo composto pelos seguintes serviços:

- **`frontend`**: A interface do usuário (UI) que interage com a API do backend.
- **`backend`**: O servidor principal que gerencia a lógica de negócios, autenticação, e atua como orquestrador das tarefas de processamento.
- **`worker`**: O serviço em Python que realiza o processamento pesado de áudio em segundo plano, incluindo transcrição e análise com IA.
- **`db`**: Um banco de dados PostgreSQL para persistência dos dados.
- **`redis`**: Um servidor Redis que atua como message broker para o Celery.

## Pré-requisitos

Para executar este projeto, você precisará ter instalado em sua máquina:

- **Docker**
- **Docker Compose**

## Como Executar o Projeto

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento completo.

### 1. Configuração do Ambiente

O projeto utiliza um arquivo `.env` na raiz para gerenciar todas as variáveis de ambiente. Comece copiando o arquivo de exemplo:

```bash
cp .env.example .env
```

Agora, **edite o arquivo `.env`** e preencha todas as variáveis necessárias. As mais importantes são:

- **`DATABASE_URL`**: String de conexão do PostgreSQL (o valor padrão já está configurado para o ambiente Docker).
- **`ENCRYPTION_KEY`**: Uma chave de 32 caracteres para criptografia.
- **`JWT_SECRET`**: Um segredo para a geração de tokens de autenticação.
- **`INTERNAL_API_KEY`**: Uma chave para comunicação segura entre os serviços internos.
- **`ADMIN_EMAIL`**, **`ADMIN_NAME`**, **`ADMIN_PASSWORD`**: Credenciais para a criação do usuário administrador inicial.

### 2. Inicializando os Serviços

Com o arquivo `.env` configurado, você pode iniciar todos os serviços com um único comando:

```bash
docker-compose up --build
```

Este comando irá construir as imagens Docker para cada serviço (se ainda não tiverem sido construídas) e iniciar os contêineres. O frontend e o backend são iniciados em modo de desenvolvimento com hot-reload.

### 3. Migração do Banco de Dados

Após os contêineres estarem em execução, você precisa aplicar as migrações do banco de dados para criar as tabelas. Abra um **novo terminal** e execute:

```bash
docker-compose exec backend npm run db:migrate
```

### 4. Popular o Banco com Dados (primeiro usuário admin)

Para popular o banco de dados com um usuário administrador e outros dados de exemplo, execute:

```bash
docker-compose exec backend npm run db:seed
```

### 5. Acessando a Aplicação

Após os passos acima, a aplicação estará disponível nos seguintes endereços:

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

## Execução com Suporte a GPU (NVIDIA)

Se sua máquina possui uma placa de vídeo NVIDIA e você tem os drivers corretos e o `nvidia-container-toolkit` instalado, você pode acelerar o processo de transcrição. Para isso, utilize o arquivo de configuração adicional `docker-compose.gpu.yml`:

```bash
docker-compose -f docker-compose.yml -f docker-compose.gpu.yml up --build
```

Este comando mescla a configuração padrão com a de GPU, ativando o suporte à placa de vídeo para o serviço do `worker`.

## Comandos Úteis do Docker Compose

- **Parar todos os serviços**:
  ```bash
  docker-compose down
  ```
- **Ver logs de um serviço específico (ex: worker)**:
  ```bash
  docker-compose logs -f worker
  ```
- **Entrar no shell de um contêiner (ex: backend)**:
  ```bash
  docker-compose exec backend sh
  ```
