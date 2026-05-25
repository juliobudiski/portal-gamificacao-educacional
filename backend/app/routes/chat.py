# backend/app/routes/chat.py
import time
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_socketio import emit, join_room
from .. import db, socketio
from ..models import User, Activity, Conversation, ChatMessage, MessageReport
from ..utils.text_sanitizer import clean_text, check_profanity
from flask_cors import cross_origin
chat_bp = Blueprint('chat', __name__)

# --- RATE LIMITER EM MEMÓRIA (Simples) ---
# Dicionário para rastrear envios: {user_id: [timestamp1, timestamp2, ...]}
user_msg_timestamps = {}
RATE_LIMIT_MSG = 5       # Max mensagens
RATE_LIMIT_WINDOW = 10   # Segundos

def is_rate_limited(user_id):
    now = time.time()
    if user_id not in user_msg_timestamps:
        user_msg_timestamps[user_id] = []
    
    # Remove timestamps antigos fora da janela
    user_msg_timestamps[user_id] = [t for t in user_msg_timestamps[user_id] if now - t < RATE_LIMIT_WINDOW]
    
    if len(user_msg_timestamps[user_id]) >= RATE_LIMIT_MSG:
        return True
    
    user_msg_timestamps[user_id].append(now)
    return False

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
    Processo: Rate Limit -> Validação Tamanho -> Sanitização -> Profanidade -> Persistência
    """
    try:
        sender_id = data.get('sender_id')
        activity_id = data.get('activity_id')
        raw_content = data.get('content', '')
        room = f'activity_{activity_id}'

        # 1. Rate Limiting
        if is_rate_limited(sender_id):
            emit('error_message', {'msg': 'Você está enviando mensagens muito rápido.'}, to=request.sid) # Envia só pro socket que pediu
            return

        # 2. Validação de Tamanho (Regra de Negócio)
        if len(raw_content) > 500:
             emit('error_message', {'msg': 'Mensagem muito longa (máx 500 caracteres).'}, to=request.sid)
             return
        if len(raw_content.strip()) == 0:
            return

        # 3. Sanitização (HTML Injection)
        # Remove tags script, style, onEvent, etc.
        safe_content = clean_text(raw_content)

        # 4. Profanidade (Regex/Lista Bloqueada - Rápido)
        # Retorna True se tiver palavrão
        if check_profanity(safe_content):
            emit('error_message', {'msg': 'Sua mensagem contém termos bloqueados pelas diretrizes da comunidade.'}, to=request.sid)
            return

        # 5. Persistência
        conversation = Conversation.query.filter_by(activity_id=activity_id).first()
        if conversation:
            new_message = ChatMessage(
                conversation_id=conversation.id,
                sender_id=sender_id,
                content=safe_content # Salva o conteúdo limpo
            )
            db.session.add(new_message)
            db.session.commit()

            emit('new_message', new_message.to_dict(), room=room)
            
    except Exception as e:
        print(f"Erro no chat: {e}")
        emit('error_message', {'msg': 'Erro interno ao processar mensagem.'}, to=request.sid)
        
        
@chat_bp.route('/messages/<int:msg_id>/report', methods=['POST'])
@jwt_required()
@cross_origin()
def report_message(msg_id):
    user_id = get_jwt_identity()
    
    message = ChatMessage.query.get(msg_id)
    if not message:
        return jsonify({"error": "Mensagem não encontrada."}), 404
        
    # Opcional: Impedir que o cara denuncie a própria mensagem
    if int(message.sender_id) == int(user_id):
        return jsonify({"error": "Você não pode denunciar sua própria mensagem."}), 400

    # Verifica se já denunciou
    existing_report = MessageReport.query.filter_by(message_id=msg_id, user_id=user_id).first()
    if existing_report:
        return jsonify({"error": "Você já denunciou esta mensagem."}), 400

    try:
        # Cria a denúncia
        new_report = MessageReport(message_id=msg_id, user_id=user_id)
        db.session.add(new_report)
        
        # Incrementa o contador
        message.report_count += 1
        
        # LÓGICA DE CENSURA (Se chegar a 5 denúncias)
        if message.report_count >= 5 and not message.is_censored:
            message.is_censored = True
            
            # Avisa o frontend ao vivo para esconder a mensagem de quem está com a tela aberta
            room = f'activity_{message.conversation.activity_id}'
            socketio.emit('message_censored', {'msg_id': message.id}, room=room)
            
        db.session.commit()
        return jsonify({"success": "Denúncia registrada com sucesso."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao processar denúncia."}), 500