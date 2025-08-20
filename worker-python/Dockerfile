# Imagem base com suporte a CUDA
FROM pytorch/pytorch:2.3.1-cuda12.1-cudnn8-runtime
WORKDIR /app

# Instala o Python e o pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Copia e instala as dependências do Python
COPY pips.txt ./requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Copia o script de inicialização e o torna executável
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Comando para iniciar os serviços usando o script
CMD ["./entrypoint.sh"]