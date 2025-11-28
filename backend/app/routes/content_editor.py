from flask import Blueprint, jsonify, request, current_app 
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Activity, QuizContent, NarrativeContent, User
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
    
@content_editor_bp.route('/orchestrate', methods=['POST'])
@jwt_required()
def orchestrate_draft_activity():
    """
    Gera conteúdo IA sem precisar salvar a atividade no banco.
    O contexto vem todo do frontend.
    """
    user_id = get_jwt_identity()
    current_app.logger.info(f"Rota /orchestrate chamada pelo usuário {user_id}")
    try:
        data = request.get_json()
        if not data:
            current_app.logger.error("Recebido body vazio na requisição.")
            return jsonify({"message": "Body vazio"}), 400
        skeleton_path = data.get('structure')
        ai_config = data.get('config')
        
        # O Frontend deve enviar isso agora
        context_data = data.get('context', {}) 
        # Logs dos dados de entrada
        current_app.logger.info(f"Structure size: {len(skeleton_path) if skeleton_path else 0}")
        current_app.logger.info(f"AI Config presente? {bool(ai_config)}")
        current_app.logger.info(f"Context Title: {context_data.get('title')}")
        if not context_data.get('title'):
            return jsonify({"message": "Título e descrição são necessários para a IA."}), 400

        # Chama o serviço
        full_content_map = ai_service.orchestrate_story(context_data, skeleton_path, ai_config)
        current_app.logger.info("Orquestração concluída com sucesso. Retornando ao frontend.")
        return jsonify(full_content_map), 200

    except Exception as e:
        current_app.logger.error(f"Erro na rota orchestrate: {str(e)}")
        return jsonify({"message": f"Erro na IA: {str(e)}"}), 500