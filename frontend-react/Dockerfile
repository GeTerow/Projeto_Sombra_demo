# Usar a imagem oficial do Node.js
FROM node:20-alpine
WORKDIR /app

# Copiar os arquivos de dependência e instalar
COPY package*.json ./
RUN npm install

# Copiar o restante do código da aplicação
COPY . .

# O Vite por padrão roda na porta 5173
EXPOSE 5173

# O comando "host" no seu package.json ("vite --host")
# garante que o servidor seja acessível de fora do container.
CMD ["npm", "run", "host"]