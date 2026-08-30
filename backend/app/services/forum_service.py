from flask import current_app
from ..models import db, ForumTopic, ForumPost, ForumCategory, TopicLike, PostLike
from ..utils.text_sanitizer import clean_text, censor_text, detect_prompt_injection
from ..services.ai_service import ai_service
from sqlalchemy import case

class ForumService:
    @staticmethod
    def create_default_categories(activity_id):
        """Cria categorias padrão em vez de tópicos padrão."""
        default_categories = [
            ForumCategory(
                activity_id=activity_id,
                title="Dúvidas Gerais",
                description="Tem alguma pergunta sobre a matéria? Crie um tópico aqui!"
            ),
            ForumCategory(
                activity_id=activity_id,
                title="Sugestões e Feedback",
                description="Ideias para melhorar a atividade? Partilhe aqui."
            )
        ]
        db.session.add_all(default_categories)
        db.session.commit()
        current_app.logger.info(f"Categorias padrão criadas para a atividade ID {activity_id}.")

    @staticmethod
    def create_topic_with_moderation(category_id, user_id, raw_title, raw_body):
        """Cria um novo tópico com Sanitização e Moderação."""
        if len(raw_title) > 150:
            return None, {"message": "O título é muito longo (máx 150 caracteres)."}, 400
        if len(raw_body) > 5000:
            return None, {"message": "O texto é muito longo (máx 5000 caracteres)."}, 400
        if not raw_title or not raw_body:
            return None, {"message": "Título e corpo são obrigatórios."}, 400

        if detect_prompt_injection(raw_title) or detect_prompt_injection(raw_body):
            return None, {"message": "Conteúdo contém comandos não permitidos pelas diretrizes do sistema."}, 400

        safe_title = clean_text(raw_title, context='forum')
        safe_body = clean_text(raw_body, context='forum')

        censored_title = censor_text(safe_title)
        censored_body = censor_text(safe_body)

        full_text_analysis = f"TÍTULO: {censored_title}\n\nCONTEÚDO: {censored_body}"
        ai_check = ai_service.moderate_content(full_text_analysis)
        if not ai_check.get('safe', True):
            return None, {
                "message": "Seu tópico não pôde ser publicado.",
                "reason": ai_check.get('reason', 'Violação das diretrizes da comunidade.'),
                "detail": "Discurso de ódio ou assédio detectado."
            }, 400
        
        category = ForumCategory.query.get(category_id)
        if not category:
            return None, {"message": "Categoria não encontrada."}, 404

        new_topic = ForumTopic(
            title=censored_title, 
            body=censored_body, 
            category_id=category_id, 
            author_id=user_id,
            activity_id=category.activity_id
        )
        db.session.add(new_topic)
        db.session.commit()
        return new_topic.to_dict(), None, 201

    @staticmethod
    def create_post_with_moderation(topic_id, user_id, raw_body):
        """Adiciona uma nova resposta a um tópico com Sanitização."""
        if len(raw_body) > 5000:
            return None, {"message": "A resposta é muito longa (máx 5000 caracteres)."}, 400
        if not raw_body:
            return None, {"message": "O corpo da resposta é obrigatório."}, 400

        if detect_prompt_injection(raw_body):
            return None, {"message": "A resposta contém comandos não permitidos pelas diretrizes do sistema."}, 400

        safe_body = clean_text(raw_body, context='forum')
        censored_body = censor_text(safe_body)

        if len(censored_body) > 10:
            ai_check = ai_service.moderate_content(censored_body)
            if not ai_check.get('safe', True):
                return None, {
                    "message": "Sua resposta não foi publicada.",
                    "reason": ai_check.get('reason', 'Conteúdo ofensivo detectado.'),
                }, 400

        topic = ForumTopic.query.get(topic_id)
        if not topic:
            return None, {"message": "Tópico não encontrado."}, 404

        new_post = ForumPost(body=censored_body, topic_id=topic.id, author_id=user_id)
        db.session.add(new_post)
        db.session.commit()
        return new_post.to_dict(), None, 201
