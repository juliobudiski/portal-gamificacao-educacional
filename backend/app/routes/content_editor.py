"""
Módulo de Rotas do Editor de Conteúdo (Content Editor)
Gerencia as rotas usadas para visualizar, salvar e gerar via Inteligência Artificial (IA) 
os conteúdos específicos de cada passo (etapa) de uma atividade.
Engloba Quizzes, Narrativas, Textos e integra a orquestração via WebSocket (SocketIO).
"""

from flask import Blueprint, jsonify, request, current_app 
import threading
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Activity, QuizContent, NarrativeContent, User, LearningContent
from ..services.ai_service import ai_service
from ..services.content_editor_service import ContentEditorService
from ..utils.text_sanitizer import detect_prompt_injection

content_editor_bp = Blueprint('content_editor', __name__)

@content_editor_bp.route('/activity/<int:activity_id>/step/<string:step_id>/content', methods=['GET'])
@jwt_required()
def get_step_content(activity_id, step_id):
    """
    Recupera o conteúdo salvo de uma etapa específica da atividade.
    - Acesso: Somente autores da atividade ou administradores (via ContentEditorService.check_permission).
    - Params URL: `type` (quizz, narrativa, conteudo_aprendizagem).
    - Retorno: Dados do conteúdo salvo no formato JSON.
    """
    user_id = get_jwt_identity()
    if not ContentEditorService.check_permission(user_id, activity_id):
        return jsonify({"message": "Acesso não autorizado."}), 403

    content_type = request.args.get('type', '').lower()
    
    result, error, status = ContentEditorService.get_step_content(activity_id, step_id, content_type)
    
    if error:
        return jsonify(error), status
    return jsonify(result), status

@content_editor_bp.route('/activity/<int:activity_id>/step/<string:step_id>/content', methods=['POST'])
@jwt_required()
def save_step_content(activity_id, step_id):
    """
    Salva ou atualiza o conteúdo de uma etapa específica da atividade.
    - Acesso: Somente autores da atividade.
    - Payload JSON esperado: Dados estruturados do conteúdo (depende se é Quiz, Narrativa, etc).
    - Retorno: Mensagem de sucesso (200) e os dados atualizados.
    """
    user_id = get_jwt_identity()
    if not ContentEditorService.check_permission(user_id, activity_id):
        return jsonify({"message": "Acesso não autorizado."}), 403

    data = request.get_json()
    
    result, error, status = ContentEditorService.save_step_content(activity_id, step_id, data)
    
    if error:
        return jsonify(error), status
    return jsonify(result), status
    
def orchestrate_worker(app, data, room_id):
    """
    Thread Worker em segundo plano que orquestra as chamadas de API (Gemini/LLM).
    Foi movido para background para não bloquear a requisição HTTP.
    Utiliza SocketIO para emitir o progresso em tempo real ao frontend.
    """
    from ..extensions import socketio
    with app.app_context():
        try:
            # Chama o serviço de IA passando o BYOK (chave própria do usuário) se disponível
            full_content_map = ai_service.orchestrate_story(
                data['context'], 
                data['structure'], 
                data['config'], 
                room_id=room_id,
                user_api_key=data.get('user_api_key')
            )
            # Notifica o cliente via WebSocket            # Emitindo sucesso via socket
            socketio.emit('ai_complete', {'result': full_content_map, 'room_id': room_id}, namespace='/')
        except Exception as e:
            current_app.logger.error(f"Erro na thread de IA: {str(e)}")
            socketio.emit('ai_error', {"message": str(e), 'room_id': room_id}, namespace='/')

@content_editor_bp.route('/orchestrate', methods=['POST'])
@jwt_required()
def orchestrate_draft_activity():
    """
    Inicia o fluxo assíncrono de geração de rascunho de atividade completa via IA.
    - Acesso: Requer login.
    - Payload JSON esperado: 'context', 'structure', 'config' com instruções pedagógicas e layout da trilha.
    - Proteção WAF: Verifica "prompt injection" nos textos inseridos pelo professor.
    - Retorno: `room_id` para o cliente se inscrever via WebSocket e 202 Accepted.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    app = current_app._get_current_object()
    from ..extensions import socketio

    # [Arquitetura]
    # Por que: A rota não deve conhecer os detalhes do modelo de banco de dados (User).
    # O ContentEditorService passa a ser responsável por encapsular a lógica do BYOK.
    data['user_api_key'] = ContentEditorService.get_user_api_key(user_id)

    # Validação Básica de Segurança (Anti Prompt Injection)
    teaching_focus = data.get('config', {}).get('teachingFocus', '')
    title = data.get('context', {}).get('title', '')
    if detect_prompt_injection(teaching_focus) or detect_prompt_injection(title):
        return jsonify({"message": "Entrada contém comandos não permitidos pelas diretrizes do sistema."}), 400

    # Cria uma sala WebSocket exclusiva para este usuário
    room_id = f"user_ai_{user_id}"

    # Usa o wrapper do Flask-SocketIO para executar tarefas em background compatíveis com Eventlet/Gevent
    socketio.start_background_task(orchestrate_worker, app, data, room_id)

    return jsonify({"message": "Iniciado", "room_id": room_id}), 202

def test_worker(app, room_id):
    from ..extensions import socketio
    with app.app_context():
        for i in range(5):
            socketio.sleep(1)
            print(f"Emitting test_progress {i}")
            socketio.emit('ai_progress', {'percent': i * 20, 'message': f'Test {i}'}, room=room_id, namespace='/')
        socketio.emit('ai_complete', {'result': 'success'}, room=room_id, namespace='/')

@content_editor_bp.route('/test_socket', methods=['POST'])
@jwt_required()
def test_socket():
    user_id = get_jwt_identity()
    room_id = f"user_ai_{user_id}"
    from flask import current_app
    app = current_app._get_current_object()
    from ..extensions import socketio
    socketio.start_background_task(test_worker, app, room_id)
    return jsonify({"message": "Test Started", "room_id": room_id}), 202