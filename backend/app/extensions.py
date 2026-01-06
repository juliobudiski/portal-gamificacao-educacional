# backend/app/extensions.py
from flask_socketio import SocketIO
from flask_apscheduler import APScheduler
from flask_sqlalchemy import SQLAlchemy # <--- Adicione
from flask_migrate import Migrate
# Criamos o objeto aqui, isolado de tudo
db = SQLAlchemy()   # <--- Movido para cá
migrate = Migrate() # <--- Movido para cá
socketio = SocketIO(cors_allowed_origins="*")
scheduler = APScheduler()