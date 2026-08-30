# backend/app/routes/chat.py
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
    messages = ChatService.get_activity_chat_history(activity_id)
    if messages is None:
        return jsonify({"error": "Atividade não encontrada."}), 404
    return jsonify(messages), 200

# --- EVENTOS DE WEBSOCKET ---

@socketio.on('join')
def on_join(data):
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
        join_room(room)
        # Opcional: Logar entrada

@socketio.on('send_message')
def handle_send_message(data):
    """
    Cliente envia uma mensagem.
    Processo delegado ao ChatService.
    """
    try:
        sender_id = data.get('sender_id')
        activity_id = data.get('activity_id')
        raw_content = data.get('content', '')
        room = f'activity_{activity_id}'

        new_message_dict, error = ChatService.process_message(sender_id, activity_id, raw_content)
        
        if error:
            if error != "Mensagem vazia.":
                emit('error_message', {'msg': error}, to=request.sid)
            return
            
        if new_message_dict:
            emit('new_message', new_message_dict, room=room)
            
    except Exception as e:
        print(f"Erro no chat: {e}")
        emit('error_message', {'msg': 'Erro interno ao processar mensagem.'}, to=request.sid)
        
        
@chat_bp.route('/messages/<int:msg_id>/report', methods=['POST'])
@jwt_required()
@cross_origin()
def report_message(msg_id):
    user_id = get_jwt_identity()
    
    try:
        result, error, status_code = ChatService.report_message(msg_id, user_id)
        
        if error:
            return jsonify({"error": error}), status_code
            
        if result and result.get("is_censored_now"):
            room = f'activity_{result["activity_id"]}'
            socketio.emit('message_censored', {'msg_id': result["msg_id"]}, room=room)
            
        return jsonify({"success": "Denúncia registrada com sucesso."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao processar denúncia."}), 500