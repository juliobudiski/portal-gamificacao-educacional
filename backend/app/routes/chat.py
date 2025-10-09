# backend/app/routes/chat.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_socketio import emit, join_room
from .. import db, socketio
from ..models import User, Activity, Conversation, ChatMessage

chat_bp = Blueprint('chat', __name__)

# --- ROTA HTTP PARA BUSCAR HISTÓRICO ---
@chat_bp.route('/activity/<int:activity_id>/messages', methods=['GET'])
@jwt_required()
def get_activity_chat_history(activity_id):
    # Encontra ou cria a conversa para a atividade
    conversation = Conversation.query.filter_by(activity_id=activity_id).first()
    if not conversation:
        # Se não existe, cria uma nova conversa em grupo
        activity = Activity.query.get_or_404(activity_id)
        conversation = Conversation(type='group', activity_id=activity.id)
        db.session.add(conversation)
        db.session.commit()

    messages = ChatMessage.query.filter_by(conversation_id=conversation.id).order_by(ChatMessage.created_at.asc()).all()
    return jsonify([msg.to_dict() for msg in messages]), 200

# --- EVENTOS DE WEBSOCKET ---

@socketio.on('join')
def on_join(data):
    """Cliente entra em uma sala de chat."""
    user_id = data.get('user_id') # Em uma aplicação real, você validaria o token JWT aqui
    activity_id = data.get('activity_id')
    room = f'activity_{activity_id}'
    join_room(room)
    print(f'Usuário {user_id} entrou na sala {room}')

@socketio.on('send_message')
def handle_send_message(data):
    """Cliente envia uma mensagem."""
    activity_id = data['activity_id']
    sender_id = data['sender_id'] # Novamente, valide o token na produção
    content = data['content']
    room = f'activity_{activity_id}'

    # Encontra a conversa e salva a mensagem no banco de dados
    conversation = Conversation.query.filter_by(activity_id=activity_id).first()
    if conversation:
        new_message = ChatMessage(
            conversation_id=conversation.id,
            sender_id=sender_id,
            content=content
        )
        db.session.add(new_message)
        db.session.commit()

        # Emite a nova mensagem para todos na sala
        emit('new_message', new_message.to_dict(), room=room)