from flask import Blueprint, jsonify, request, current_app 
import threading
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Activity, QuizContent, NarrativeContent, User, LearningContent
from ..services.ai_service import ai_service
from ..services.content_editor_service import ContentEditorService
from ..utils.text_sanitizer import detect_prompt_injection
content_editor_bp = Blueprint('content_editor', __name__)

# Rota para buscar o conteúdo de um passo (Quiz ou Narrativa)
@content_editor_bp.route('/activity/<int:activity_id>/step/<string:step_id>/content', methods=['GET'])
@jwt_required()
def get_step_content(activity_id, step_id):
    user_id = get_jwt_identity()
    if not ContentEditorService.check_permission(user_id, activity_id):
        return jsonify({"message": "Acesso não autorizado."}), 403

    content_type = request.args.get('type', '').lower()
    
    result, error, status = ContentEditorService.get_step_content(activity_id, step_id, content_type)
    
    if error:
        return jsonify(error), status
    return jsonify(result), status

# Rota para salvar/atualizar o conteúdo de um passo
@content_editor_bp.route('/activity/<int:activity_id>/step/<string:step_id>/content', methods=['POST'])
@jwt_required()
def save_step_content(activity_id, step_id):
    user_id = get_jwt_identity()
    if not ContentEditorService.check_permission(user_id, activity_id):
        return jsonify({"message": "Acesso não autorizado."}), 403

    data = request.get_json()
    
    result, error, status = ContentEditorService.save_step_content(activity_id, step_id, data)
    
    if error:
        return jsonify(error), status
    return jsonify(result), status
    
def orchestrate_worker(app, data, room_id):
    from ..extensions import socketio
    with app.app_context():
        try:
            full_content_map = ai_service.orchestrate_story(
                data['context'], 
                data['structure'], 
                data['config'], 
                room_id=room_id,
                user_api_key=data.get('user_api_key')
            )
            socketio.emit('ai_complete', full_content_map, room=room_id, namespace='/')
        except Exception as e:
            current_app.logger.error(f"Erro na thread de IA: {str(e)}")
            socketio.emit('ai_error', {"message": str(e)}, room=room_id, namespace='/')

@content_editor_bp.route('/orchestrate', methods=['POST'])
@jwt_required()
def orchestrate_draft_activity():
    user_id = get_jwt_identity()
    data = request.get_json()
    app = current_app._get_current_object()
    from ..extensions import socketio

    user = User.query.get(user_id)
    if user and user.gemini_api_key:
        data['user_api_key'] = user.gemini_api_key

    # Verifica Prompt Injection nas configurações
    teaching_focus = data.get('config', {}).get('teachingFocus', '')
    title = data.get('context', {}).get('title', '')
    if detect_prompt_injection(teaching_focus) or detect_prompt_injection(title):
        return jsonify({"message": "Entrada contém comandos não permitidos pelas diretrizes do sistema."}), 400

    # Sala baseada no ID do usuário
    room_id = f"user_ai_{user_id}"

    # CORREÇÃO: Usar start_background_task para compatibilidade com Socket.IO (Eventlet/Gevent)
    socketio.start_background_task(orchestrate_worker, app, data, room_id)

    return jsonify({"message": "Iniciado", "room_id": room_id}), 202