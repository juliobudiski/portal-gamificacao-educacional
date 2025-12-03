# backend/run.py
from app import create_app, socketio

# Cria a instância da aplicação usando sua Factory Function
app = create_app()

if __name__ == '__main__':
    print("--- INICIANDO SERVIDOR COM SOCKETIO (Mata o problema de Threading) ---")
    print("Acesse: http://localhost:5000")
    
    # O socketio.run envelopa o Flask e gerencia as threads de WebSocket corretamente
    # allow_unsafe_werkzeug=True é útil em dev para evitar erros de ambiente restrito
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)