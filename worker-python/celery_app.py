# celery_app.py
from celery import Celery


# NOVO: Define a aplicação Celery, conectando-a ao nosso broker Redis.
# O 'backend' também é Redis, usado para armazenar resultados (opcional para o nosso caso, mas boa prática).
celery_app = Celery(
    'audio_worker',
    broker='redis://localhost:6380/0',
    backend='redis://localhost:6380/0',
    include=['tasks']
)

# Configuração opcional para garantir que as tarefas sejam tratadas de forma robusta
celery_app.conf.update(
    task_track_started=True,
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
)