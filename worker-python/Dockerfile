# Imagem base Python leve para a versão de demonstração
FROM python:3.10-slim

WORKDIR /app

# Copia e instala as dependências do Python
COPY pips.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Copia o script de inicialização e o torna executável
COPY entrypoint.sh .
RUN sed -i 's/\r$//g' ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Comando para iniciar os serviços usando o script
CMD ["./entrypoint.sh"]