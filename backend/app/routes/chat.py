"""
Módulo de Rotas de Chat (WebSocket + HTTP)
Responsável por gerenciar as conversas em tempo real das atividades
(salas de chat), histórico de mensagens e o sistema de denúncias/censura 
(moderação de linguagem).
"""

import time
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_socketio import emit, join_room
from .. import db, socketio
from ..models import User, Activity, Conversation, ChatMessage, MessageReport
from ..utils.text_sanitizer import clean_text, check_profanity
from flask_cors import cross_origin
from ..services.chat_service import ChatService

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/activity/<int:activity_id>/messages', methods=['GET'])
@jwt_required()
def get_activity_chat_history(activity_id):
    """
    Recupera o histórico de mensagens do chat associado a uma atividade específica.
    - Acesso: Autenticado.
    - Parâmetros: `activity_id` (via URL).
    - Retorno: Lista de mensagens contendo emissor, timestamp e conteúdo (ou conteúdo censurado se aplicável).
    """
    messages = ChatService.get_activity_chat_history(activity_id)
    if messages is None:
        return jsonify({"error": "Atividade não encontrada."}), 404
    return jsonify(messages), 200

# --- EVENTOS DE WEBSOCKET ---

@socketio.on('connect')
def on_connect():
    print(f"[SOCKET] CLiente Conectado! SID: {request.sid}")

@socketio.on('disconnect')
def on_disconnect():
    print(f"[SOCKET] Cliente Desconectado! SID: {request.sid}")

@socketio.on('join')
def on_join(data):
    """
    Inscreve um cliente WebSocket na "sala" virtual de chat de uma atividade.
    Isto garante que o cliente receba os eventos 'new_message' apenas dessa atividade.
    """
    room = None
    user_id = None
    
    if isinstance(data, dict):
        user_id = data.get('user_id') 
        activity_id = data.get('activity_id')
        if activity_id:
            room = f'activity_{activity_id}'
    elif isinstance(data, str):
        room = data
    
    if room:
        print(f"[SOCKET] Join received for room: {room}")
        join_room(room)
        # Opcional: Logar entrada do usuário na sala

@socketio.on('send_message')
def handle_send_message(data):
    """
    Evento WebSocket acionado quando um cliente envia uma nova mensagem.
    Processa a mensagem (validação de palavrões, injeção de prompt), salva no DB
    e a transmite (broadcast) para todos na mesma sala da atividade.
    """
    try:
        sender_id = data.get('sender_id')
        activity_id = data.get('activity_id')
        raw_content = data.get('content', '')
        room = f'activity_{activity_id}'

        # A lógica de persistência e validação está encapsulada no Service
        new_message_dict, error = ChatService.process_message(sender_id, activity_id, raw_content)
        
        if error:
            # Emite evento de erro apenas para o próprio remetente (sid)
            if error != "Mensagem vazia.":
                emit('error_message', {'msg': error}, to=request.sid)
            return
            
        if new_message_dict:
            # Transmite a mensagem formatada e validada para todos na sala
            emit('new_message', new_message_dict, room=room)
            
    except Exception as e:
        print(f"Erro no chat: {e}")
        emit('error_message', {'msg': 'Erro interno ao processar mensagem.'}, to=request.sid)
        
        
@chat_bp.route('/messages/<int:msg_id>/report', methods=['POST'])
@jwt_required()
@cross_origin()
def report_message(msg_id):
    """
    [Arquitetura]
    Por que: Isola a responsabilidade de moderação. A camada de controller (esta rota)
    apenas faz a ponte (HTTP/WebSocket) enquanto as regras de denúncia e rollback ficam no Service.
    """
    user_id = get_jwt_identity()
    
    result, error, status_code = ChatService.report_message(msg_id, user_id)
    
    if error:
        return jsonify({"error": error}), status_code
        
    if result and result.get("is_censored_now"):
        room = f'activity_{result["activity_id"]}'
        socketio.emit('message_censored', {'msg_id': result["msg_id"]}, room=room)
        
    return jsonify({"success": "Denúncia registrada com sucesso."}), 200