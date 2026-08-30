from flask import current_app
from ..models import db, Activity, QuizContent, NarrativeContent, LearningContent

class ContentEditorService:
    @staticmethod
    def check_permission(user_id, activity_id):
        activity = Activity.query.get(activity_id)
        if activity:
            current_app.logger.info(f"Verificando permissão: User ID do Token: {user_id} (tipo: {type(user_id)}), Professor ID da Atividade: {activity.professor_id} (tipo: {type(activity.professor_id)})")

        if not activity or int(activity.professor_id) != int(user_id):
            return False
        return True

    @staticmethod
    def get_step_content(activity_id, step_id, content_type):
        learning_content = LearningContent.query.filter_by(activity_id=activity_id, step_id=step_id).first()
        current_app.logger.info(f"Buscando conteúdo para step_id: {step_id}")

        quiz_content = QuizContent.query.filter_by(activity_id=activity_id, step_id=step_id).first()
        narrative_content = NarrativeContent.query.filter_by(activity_id=activity_id, step_id=step_id).first()

        if quiz_content:
            current_app.logger.info(f"Conteúdo encontrado na tabela QuizContent para step_id: {step_id}")
            return {
                "type": "quiz",
                "questions": quiz_content.questions
            }, None, 200
        elif narrative_content:
            current_app.logger.info(f"Conteúdo encontrado na tabela NarrativeContent para step_id: {step_id}")
            return {
                "type": "narrative",
                "scenario": narrative_content.scenario,
                "characters": narrative_content.characters,
                "dialogue": narrative_content.dialogue
            }, None, 200
        elif content_type == 'quiz':
            current_app.logger.info(f"Retornando quiz vazio baseado no parâmetro type para step_id: {step_id}")
            return {
                "type": "quiz",
                "questions": []
            }, None, 200
        elif content_type == 'narrative':
            current_app.logger.info(f"Retornando narrative vazio baseado no parâmetro type para step_id: {step_id}")
            return {
                "type": "narrative",
                "scenario": "",
                "characters": [],
                "dialogue": []
            }, None, 200
        elif learning_content:
            current_app.logger.info(f"Conteúdo Learning encontrado para step_id: {step_id}")
            return {
                "type": "content",
                "video_url": learning_content.video_url,
                "text_content": learning_content.text_content,
                "material_link": learning_content.material_link
            }, None, 200
        elif content_type == 'content':
             return {
                "type": "content",
                "video_url": "",
                "text_content": "",
                "material_link": ""
            }, None, 200
        else:
            current_app.logger.error(f"Não foi possível determinar o tipo para step_id: {step_id}")
            return None, {"message": "Tipo de conteúdo inválido. Especifique o parâmetro 'type' como 'quiz' ou 'narrative'."}, 400

    @staticmethod
    def save_step_content(activity_id, step_id, data):
        content_type = data.get('type')

        current_app.logger.info(f"Salvando conteúdo para step_id: {step_id} do tipo: {content_type}")
        current_app.logger.info(f"Dados recebidos: {data}")

        if content_type == 'quiz':
            content = QuizContent.query.filter_by(activity_id=activity_id, step_id=step_id).first()
            if not content:
                content = QuizContent(activity_id=activity_id, step_id=step_id)
                db.session.add(content)
            content.questions = data.get('questions', [])

        elif content_type == 'narrative':
            content = NarrativeContent.query.filter_by(activity_id=activity_id, step_id=step_id).first()
            if not content:
                content = NarrativeContent(activity_id=activity_id, step_id=step_id)
                db.session.add(content)
            content.scenario = data.get('scenario')
            content.characters = data.get('characters', [])
            content.dialogue = data.get('dialogue', [])
            
        elif content_type == 'content':
            content = LearningContent.query.filter_by(activity_id=activity_id, step_id=step_id).first()
            if not content:
                content = LearningContent(activity_id=activity_id, step_id=step_id)
                db.session.add(content)
            
            content.video_url = data.get('video_url')
            content.text_content = data.get('text_content')
            content.material_link = data.get('material_link')
        
        else:
            current_app.logger.error(f"Tipo de conteúdo inválido ou não fornecido para step_id: {step_id}")
            return None, {"message": "O campo 'type' ('quiz' ou 'narrative') é obrigatório no corpo da requisição."}, 400

        try:
            db.session.commit()
            current_app.logger.info(f"Conteúdo salvo com sucesso para step_id: {step_id}")
            return {"message": "Conteúdo salvo com sucesso!", "saved_content": data}, None, 200
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Erro ao salvar conteúdo para step_id: {step_id}: {str(e)}")
            return None, {"message": "Erro interno do servidor."}, 500
