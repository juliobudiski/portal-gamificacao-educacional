"""
Serviço de Chat (ChatService)
Gerencia as mensagens trocadas nos fóruns/chats das atividades gamificadas.
Inclui controles anti-spam (Rate Limiting em memória), sanitização de texto,
bloqueio de palavras ofensivas (profanity check) e o sistema de denúncias
(onde a mensagem é censurada automaticamente após 5 denúncias).
"""
import time
from ..models import db, Activity, Conversation, ChatMessage, MessageReport, ActivityProgress, User, StoreItem, Title
import json
from ..utils.text_sanitizer import clean_text, check_profanity, detect_prompt_injection
from flask import current_app

class ChatService:
    user_msg_timestamps = {}
    RATE_LIMIT_MSG = 5       # Max mensagens
    RATE_LIMIT_WINDOW = 10   # Segundos

    @classmethod
    def is_rate_limited(cls, user_id):
        """
        Implementação simples de Rate Limiting em memória (Sliding Window).
        Evita que um usuário faça flood no chat da atividade.
        """
        now = time.time()
        if user_id not in cls.user_msg_timestamps:
            cls.user_msg_timestamps[user_id] = []
        
        cls.user_msg_timestamps[user_id] = [t for t in cls.user_msg_timestamps[user_id] if now - t < cls.RATE_LIMIT_WINDOW]
        
        if len(cls.user_msg_timestamps[user_id]) >= cls.RATE_LIMIT_MSG:
            return True
        
        cls.user_msg_timestamps[user_id].append(now)
        return False

    @staticmethod
    def _enrich_messages_with_cosmetics(messages_dicts, activity_id):
        if not messages_dicts:
            return messages_dicts

        sender_ids = list(set(msg['sender_id'] for msg in messages_dicts))
        
        progress_records = ActivityProgress.query.filter(
            ActivityProgress.activity_id == activity_id,
            ActivityProgress.student_id.in_(sender_ids)
        ).all()
        
        users = User.query.filter(User.id.in_(sender_ids)).all()
        user_avatars = {u.id: u.profile_picture for u in users}

        cosmetic_map = {}
        for p in progress_records:
            name_cosmetic = p.equipped_name_cosmetic.effect_id if p.equipped_name_cosmetic else None
            title_cosmetic = p.equipped_title_cosmetic.effect_id if p.equipped_title_cosmetic else None
            
            # Converte JSON se estiver em string
            if isinstance(name_cosmetic, str):
                try: name_cosmetic = json.loads(name_cosmetic)
                except: pass
            if isinstance(title_cosmetic, str):
                try: title_cosmetic = json.loads(title_cosmetic)
                except: pass

            cosmetic_map[p.student_id] = {
                "title": p.equipped_title.display_text if p.equipped_title else None,
                "name_cosmetic": name_cosmetic,
                "title_cosmetic": title_cosmetic,
                "avatar": p.equipped_activity_avatar_url or user_avatars.get(p.student_id) or '/avatars/default_avatar.webp'
            }
            
        for msg in messages_dicts:
            c = cosmetic_map.get(msg['sender_id'], {})
            msg['title'] = c.get('title')
            msg['name_cosmetic'] = c.get('name_cosmetic')
            msg['title_cosmetic'] = c.get('title_cosmetic')
            msg['avatar'] = c.get('avatar', user_avatars.get(msg['sender_id'], '/avatars/default_avatar.webp'))
            
        return messages_dicts

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
        messages_dicts = [msg.to_dict() for msg in messages]
        return ChatService._enrich_messages_with_cosmetics(messages_dicts, activity_id)

    @classmethod
    def process_message(cls, sender_id, activity_id, raw_content):
        """
        Recebe uma mensagem, aplica os filtros de segurança (spam, tamanho, injeção, ofensas)
        e salva no banco de dados se for aprovada.
        """
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
            
            enriched = ChatService._enrich_messages_with_cosmetics([new_message.to_dict()], activity_id)
            return enriched[0], None
        return None, "Conversa não encontrada."

    @staticmethod
    def report_message(msg_id, user_id):
        """
        Processa uma denúncia de mensagem feita por um usuário.
        Se a mensagem atingir o limite (ex: 5 denúncias de usuários diferentes),
        ela é ocultada do chat publicamente (auto-moderação).
        """
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
