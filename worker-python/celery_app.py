import os
import torch
from celery import Celery

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6380/0')

celery_app = Celery(
    'audio_worker',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['tasks'],
)

# Config robusta + serialização
celery_app.conf.update(
    task_track_started=True,
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,

    # MUITO IMPORTANTE p/ evitar duas transcrições simultâneas no mesmo GPU
    worker_concurrency=int(os.getenv('CELERY_CONCURRENCY', '1')),
    worker_prefetch_multiplier=int(os.getenv('CELERY_PREFETCH', '1')),
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # Opcional: reciclar worker para evitar fragmentação (especialmente em CUDA)
    worker_max_tasks_per_child=int(os.getenv('CELERY_MAX_TASKS_PER_CHILD', '20')),
)