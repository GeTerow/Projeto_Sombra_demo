import torch
import multiprocessing

# Este script garante que o método de start para multiprocessing seja 'spawn'
# ANTES de qualquer outra importação que possa inicializar o CUDA.
# Essencial para que os workers do Celery funcionem corretamente com GPUs.
if torch.cuda.is_available():
    print("CUDA disponível. Configurando o método de start do multiprocessing para 'spawn'.")
    try:
        multiprocessing.set_start_method('spawn', force=True)
        print("Método de start configurado com sucesso para 'spawn'.")
    except RuntimeError as e:
        # Se já foi configurado, pode dar um erro. Desde que seja 'spawn', está tudo bem.
        if "context has already been set" in str(e):
             print("Contexto de multiprocessing já foi configurado anteriormente. Ignorando.")
        else:
             raise e
else:
    print("CUDA não disponível. Nenhuma ação de pré-inicialização necessária.")