import time
from ..models import db, Activity, Conversation, ChatMessage, MessageReport
from ..utils.text_sanitizer import clean_text, check_profanity, detect_prompt_injection
from flask import current_app

class ChatService:
    user_msg_timestamps = {}
    RATE_LIMIT_MSG = 5       # Max mensagens
    RATE_LIMIT_WINDOW = 10   # Segundos

    @classmethod
    def is_rate_limited(cls, user_id):
        now = time.time()
        if user_id not in cls.user_msg_timestamps:
            cls.user_msg_timestamps[user_id] = []
        
        cls.user_msg_timestamps[user_id] = [t for t in cls.user_msg_timestamps[user_id] if now - t < cls.RATE_LIMIT_WINDOW]
        
        if len(cls.user_msg_timestamps[user_id]) >= cls.RATE_LIMIT_MSG:
            return True
        
        cls.user_msg_timestamps[user_id].append(now)
        return False

    @staticmethod
    def get_activity_chat_history(activity_id):
        conversation = Conversation.query.filter_by(activity_id=activity_id).first()
        if not conversation:
            activity = Activity.query.get(activity_id)
            if not activity:
                return None
            conversation = Conversation(type='group', activity_id=activity.id)
            db.session.add(conversation)
            db.session.commit()

        messages = ChatMessage.query.filter_by(conversation_id=conversation.id).order_by(ChatMessage.created_at.asc()).all()
        return [msg.to_dict() for msg in messages]

    @classmethod
    def process_message(cls, sender_id, activity_id, raw_content):
        if cls.is_rate_limited(sender_id):
            return None, "Você está enviando mensagens muito rápido."

        if len(raw_content) > 500:
             return None, "Mensagem muito longa (máx 500 caracteres)."
        if len(raw_content.strip()) == 0:
            return None, "Mensagem vazia."

        safe_content = clean_text(raw_content)

        if detect_prompt_injection(safe_content):
            return None, "Sua mensagem contém comandos não permitidos pelas diretrizes do sistema."

        if check_profanity(safe_content):
            return None, "Sua mensagem contém termos bloqueados pelas diretrizes da comunidade."

        conversation = Conversation.query.filter_by(activity_id=activity_id).first()
        if conversation:
            new_message = ChatMessage(
                conversation_id=conversation.id,
                sender_id=sender_id,
                content=safe_content
            )
            db.session.add(new_message)
            db.session.commit()
            return new_message.to_dict(), None
        return None, "Conversa não encontrada."

    @staticmethod
    def report_message(msg_id, user_id):
        message = ChatMessage.query.get(msg_id)
        if not message:
            return None, "Mensagem não encontrada.", 404
            
        if int(message.sender_id) == int(user_id):
            return None, "Você não pode denunciar sua própria mensagem.", 400

        existing_report = MessageReport.query.filter_by(message_id=msg_id, user_id=user_id).first()
        if existing_report:
            return None, "Você já denunciou esta mensagem.", 400

        new_report = MessageReport(message_id=msg_id, user_id=user_id)
        db.session.add(new_report)
        
        message.report_count += 1
        
        is_censored_now = False
        if message.report_count >= 5 and not message.is_censored:
            message.is_censored = True
            is_censored_now = True
            
        db.session.commit()
        return {"msg_id": message.id, "is_censored_now": is_censored_now, "activity_id": message.conversation.activity_id}, None, 200
