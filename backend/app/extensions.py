import os
from flask_socketio import SocketIO
from flask_apscheduler import APScheduler
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

# Configuração de fila de mensagens para escalabilidade (ex: Gunicorn com múltiplos workers)
redis_url = os.environ.get('REDIS_URL')
socketio = SocketIO(
    cors_allowed_origins="*", 
    message_queue=redis_url if redis_url else None,
    ping_timeout=300,
    ping_interval=60
)
scheduler = APScheduler()