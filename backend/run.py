# backend/run.py
import eventlet
eventlet.monkey_patch()

import os
from dotenv import load_dotenv # <--- 1. Importa a biblioteca

# 2. Carrega as variáveis do arquivo .env AGORA
# Isso precisa acontecer ANTES de importar o 'create_app'
load_dotenv() 

from app import create_app, socketio

# Cria a instância da aplicação
app = create_app()

if __name__ == '__main__':
    print("--- INICIANDO SERVIDOR COM SOCKETIO ---")
    print("Acesse: http://localhost:5000")
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)