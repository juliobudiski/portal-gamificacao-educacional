from flask import Blueprint, jsonify, request, current_app 
import threading
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Activity, QuizContent, NarrativeContent, User, LearningContent
from ..services.ai_service import ai_service
content_editor_bp = Blueprint('content_editor', __name__)

# Função auxiliar para verificar se o usuário é o professor da atividade
def check_permission(activity_id):
    user_id = get_jwt_identity()
    activity = Activity.query.get(activity_id)

    # Log para depuração (pode ser removido depois de confirmar a correção)
    if activity:
        current_app.logger.info(f"Verificando permissão: User ID do Token: {user_id} (tipo: {type(user_id)}), Professor ID da Atividade: {activity.professor_id} (tipo: {type(activity.professor_id)})")

    # --- CORREÇÃO APLICADA AQUI ---
    # Convertemos ambos os IDs para inteiros antes de comparar para evitar erros de tipo (ex: '2' != 2).
    if not activity or int(activity.professor_id) != int(user_id):
        return False
    
    return True

# Rota para buscar o conteúdo de um passo (Quiz ou Narrativa)
@content_editor_bp.route('/activity/<int:activity_id>/step/<string:step_id>/content', methods=['GET'])
@jwt_required()
def get_step_content(activity_id, step_id):
    if not check_permission(activity_id):
        return jsonify({"message": "Acesso não autorizado."}), 403

    learning_content = LearningContent.query.filter_by(activity_id=activity_id, step_id=step_id).first()
    # Log para debug
    current_app.logger.info(f"Buscando conteúdo para step_id: {step_id}")

    # Tenta encontrar o conteúdo em ambas as tabelas
    quiz_content = QuizContent.query.filter_by(activity_id=activity_id, step_id=step_id).first()
    narrative_content = NarrativeContent.query.filter_by(activity_id=activity_id, step_id=step_id).first()

    # Verifica se foi especificado um tipo via parâmetro de query
    content_type = request.args.get('type', '').lower()

    # Determina o tipo com base no conteúdo encontrado ou parâmetro
    if quiz_content:
        current_app.logger.info(f"Conteúdo encontrado na tabela QuizContent para step_id: {step_id}")
        return jsonify({
            "type": "quiz",
            "questions": quiz_content.questions
        })
    elif narrative_content:
        current_app.logger.info(f"Conteúdo encontrado na tabela NarrativeContent para step_id: {step_id}")
        return jsonify({
            "type": "narrative",
            "scenario": narrative_content.scenario,
            "characters": narrative_content.characters,
            "dialogue": narrative_content.dialogue
        })
    elif content_type == 'quiz':
        current_app.logger.info(f"Retornando quiz vazio baseado no parâmetro type para step_id: {step_id}")
        return jsonify({
            "type": "quiz",
            "questions": []
        })
    elif content_type == 'narrative':
        current_app.logger.info(f"Retornando narrative vazio baseado no parâmetro type para step_id: {step_id}")
        return jsonify({
            "type": "narrative",
            "scenario": "",
            "characters": [],
            "dialogue": []
        })
    elif learning_content:
        current_app.logger.info(f"Conteúdo Learning encontrado para step_id: {step_id}")
        return jsonify({
            "type": "content",
            "video_url": learning_content.video_url,
            "text_content": learning_content.text_content,
            "material_link": learning_content.material_link
        })
    # Adicione o fallback do parametro type
    elif content_type == 'content':
         return jsonify({
            "type": "content",
            "video_url": "",
            "text_content": "",
            "material_link": ""
        })
    else:
        # Se não houver conteúdo e não foi especificado um tipo, retorna erro
        current_app.logger.error(f"Não foi possível determinar o tipo para step_id: {step_id}")
        return jsonify({"message": "Tipo de conteúdo inválido. Especifique o parâmetro 'type' como 'quiz' ou 'narrative'."}), 400

# Rota para salvar/atualizar o conteúdo de um passo
@content_editor_bp.route('/activity/<int:activity_id>/step/<string:step_id>/content', methods=['POST'])
@jwt_required()
def save_step_content(activity_id, step_id):
    if not check_permission(activity_id):
        return jsonify({"message": "Acesso não autorizado."}), 403

    data = request.get_json()
    # Pega o tipo explicitamente do corpo da requisição
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
        return jsonify({"message": "O campo 'type' ('quiz' ou 'narrative') é obrigatório no corpo da requisição."}), 400

    try:
        db.session.commit()
        current_app.logger.info(f"Conteúdo salvo com sucesso para step_id: {step_id}")
        # Retorna o conteúdo salvo para confirmação no frontend
        return jsonify({"message": "Conteúdo salvo com sucesso!", "saved_content": data}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao salvar conteúdo para step_id: {step_id}: {str(e)}")
        return jsonify({"message": "Erro interno do servidor."}), 500
    
def orchestrate_worker(app, data, room_id):
    from ..extensions import socketio
    with app.app_context():
        try:
            full_content_map = ai_service.orchestrate_story(
                data['context'], 
                data['structure'], 
                data['config'], 
                room_id=room_id
            )
            socketio.emit('ai_complete', full_content_map, to=room_id)
        except Exception as e:
            current_app.logger.error(f"Erro na thread de IA: {str(e)}")
            socketio.emit('ai_error', {"message": str(e)}, to=room_id)

@content_editor_bp.route('/orchestrate', methods=['POST'])
@jwt_required()
def orchestrate_draft_activity():
    user_id = get_jwt_identity()
    data = request.get_json()
    app = current_app._get_current_object()
    from ..extensions import socketio

    # Sala baseada no ID do usuário
    room_id = f"user_ai_{user_id}"

    # CORREÇÃO: Usar start_background_task para compatibilidade com Socket.IO (Eventlet/Gevent)
    socketio.start_background_task(orchestrate_worker, app, data, room_id)

    return jsonify({"message": "Iniciado", "room_id": room_id}), 202