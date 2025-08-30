# Estágio 1: Instalar dependências
FROM node:20-slim AS deps
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install

# Estágio 2: Construir a aplicação
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# O comando abaixo agora lerá o schema.prisma copiado e gerará os binários corretos
RUN npx prisma generate
RUN npm run build

# (Opcional) Adicione esta linha para depurar e ver o que está na pasta dist
# RUN ls -la dist

# Estágio 3: Produção - Imagem final
FROM node:20-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]