# backend/app/extensions.py
from flask_socketio import SocketIO

# Criamos o objeto aqui, isolado de tudo
socketio = SocketIO(cors_allowed_origins="*")