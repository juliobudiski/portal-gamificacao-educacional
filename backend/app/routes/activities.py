"""
Módulo de Rotas de Atividades (Activities)
Responsável pelo CRUD completo de atividades, desde a criação (incluindo rascunhos e autosave),
distribuição para turmas, duplicação (cópias), exclusão em massa, até a submissão
de respostas pelos alunos e cálculo de pontuação (gamificação).
As regras complexas estão delegadas ao 'activity_service'.
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, current_user, get_jwt_identity
from flask_cors import cross_origin
from copy import deepcopy
import logging
from ..models import db, Activity, ActivityRating, Tag, activity_tag, ActivityRevision, User, Class, ActivityProgress, StudentResponse, EventLog, Conversation, ChatMessage, ActivityRating
from ..services import activity_service
from ..utils.logging import _log_system_event
from ..services.medal_service import MedalService
from datetime import datetime, time
activity_bp = Blueprint('activities', __name__)
logger = logging.getLogger(__name__)
from app.services.recommendation_engine import ContextualRecommendationEngine
from ..presets.activity_templates import PREDEFINED_TEMPLATES

# --- ROTA PARA SUBMETER RESPOSTAS DO QUIZ ---
@activity_bp.route('/<int:activity_id>/submit_answer', methods=['POST'])
@jwt_required()
@cross_origin()
def submit_answer(activity_id):
    """
    Processa a submissão de uma resposta de quiz (ou interação pontuada) por um aluno.
    
    Lógica Principal:
    1. Registra a resposta bruta em 'StudentResponse'.
    2. Soma a pontuação ganha no progresso total (ActivityProgress).
    3. Aciona o 'MedalService' para avaliar, em tempo real, se a resposta 
       desbloqueou alguma medalha condicional.
       
    - Acesso: Apenas Alunos.
    - Payload JSON: { "points_earned": int, "is_correct": bool, "question_text": str, "selected_option": str }
    - Retorno: Nova pontuação total do aluno.
    """
    logger.info(f"[submit_answer] Iniciando submissão para atividade {activity_id}")
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'aluno':
        return jsonify({"message": "Apenas alunos podem submeter respostas."}), 403

    data = request.get_json()
    
    try:
        # Extraímos todas as variáveis necessárias do 'data' no início do bloco try.
        points_earned = int(data.get('points_earned', 0))
        is_correct = data.get('is_correct', False)
        question_text = data.get('question_text')

        # Verifica o estado atual de progresso do aluno nesta atividade
        progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()
        activity = Activity.query.get(activity_id)

        # Se for o primeiro acesso/resposta, inicializa o registro de progresso
        if not progress:
            progress = ActivityProgress(
                student_id=user.id, activity_id=activity_id,
                class_id=activity.class_id, status='in_progress'
            )
            db.session.add(progress)
            db.session.flush()

        # Cria a auditoria da resposta
        new_response = StudentResponse(
            student_id=user.id,
            activity_id=activity_id,
            response_data={'question': question_text, 'answer': data.get('selected_option')},
            is_correct=is_correct,
            score=points_earned
        )
        current_app.logger.info(f"[DEBUG_POINTS] User {user.id} responding to activity {activity_id}.")
        current_app.logger.info(f"[DEBUG_POINTS] Incoming points_earned from request: {points_earned}")
        current_app.logger.info(f"[DEBUG_POINTS] Current progress.total_xp_earned BEFORE update: {progress.total_xp_earned or 0}")
        db.session.add(new_response)

        # Soma os pontos de forma cumulativa
        progress.points_earned = (progress.points_earned or 0) + points_earned
        progress.total_xp_earned = (progress.total_xp_earned or 0) + points_earned
        progress.attempts = (progress.attempts or 0) + 1
        
        current_app.logger.info(f"[DEBUG_POINTS] New progress.total_xp_earned AFTER update: {progress.total_xp_earned}")
        
        new_medals = []
        # O gatilho de medalhas atua de forma independente. Se falhar, a resposta ainda será salva.
        try:
            new_medals = MedalService.check_and_award_medals(
                user_id=current_user_id,
                activity_id=activity_id,
                event_type='quiz_answer_submitted',
                is_correct=is_correct,
                question_text=question_text
            )
        except Exception as e:
            current_app.logger.error(f"Erro ao verificar medalhas 'on_submit' para user {current_user_id}: {str(e)}")

        db.session.commit()
        return jsonify({
            "message": "Resposta registrada e progresso atualizado.",
            "new_total_points": progress.points_earned,
            "new_medals": new_medals or []
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao submeter resposta para user {current_user_id} na atividade {activity_id}: {str(e)}")
        # LOG: [submit_answer] Erro crítico capturado com stack trace.
        current_app.logger.error(f"Erro ao submeter resposta para user {current_user_id} na atividade {activity_id}: {str(e)}", exc_info=True)
        return jsonify({"message": "Erro interno ao salvar a resposta."}), 500

# --- ROTA PARA REGISTRAR EVENTOS GENÉRICOS ---
@activity_bp.route('/<int:activity_id>/log_event', methods=['POST'])
@jwt_required()
@cross_origin()
def log_activity_event(activity_id):
    """
    Registra eventos genéricos de interação do usuário com a atividade 
    para análise de engajamento (analytics).
    
    - Acesso: Autenticado.
    - Payload JSON: { "event_type": "str" } (ex: 'narrative_viewed', 'completed').
    """
    logger.info(f"[log_activity_event] Registrando evento para atividade {activity_id}")
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    data = request.get_json()
    event_type = data.get('event_type') # Ex: 'narrative_viewed'

    if not event_type:
        return jsonify({"message": "O tipo do evento é obrigatório."}), 400

    try:
        event = EventLog(
            user_id=user.id,
            event_type=event_type,
            event_data={'activity_id': activity_id}
        )
        db.session.add(event)
        db.session.commit()
        return jsonify({"message": "Evento registrado com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao registrar evento '{event_type}' para user {current_user_id} na atividade {activity_id}: {str(e)}")
        # LOG: [log_activity_event] Erro ao salvar evento.
        current_app.logger.error(f"Erro ao registrar evento '{event_type}' para user {current_user_id} na atividade {activity_id}: {str(e)}", exc_info=True)
        return jsonify({"message": "Erro interno ao registrar evento."}), 500


@activity_bp.route('', methods=['POST'])
@jwt_required()
def create_activity():
    """
    Cria a entidade básica de uma nova atividade no banco.
    A lógica pesada de parsing JSON e tratamento de tags fica na camada Service.
    - Acesso: Professor.
    """
    logger.info("[create_activity] Iniciando criação de nova atividade.")
    return activity_service.create_activity(current_user, request.json)

@activity_bp.route('/<int:activity_id>', methods=['GET'])
@jwt_required()
def get_activity_route(activity_id):
    """
    Recupera os detalhes (configuração completa, quizzes, mapa) de uma atividade específica.
    """
    return activity_service.get_activity(current_user, activity_id)

@activity_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_predefined_templates():
    """
    Retorna os templates pedagógicos predefinidos (armazenados estaticamente 
    em presets/activity_templates) para facilitar a criação rápida por professores.
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    return jsonify(PREDEFINED_TEMPLATES)

@activity_bp.route('/search', methods=['GET'])
@jwt_required()
def search_activities():
    """
    Busca de atividades no acervo público, baseada em termos e filtragem avançada (Tags).
    - Params URL: `q` (termo textual) e `tags` (lista de temas/disciplinas).
    """
    search_term = request.args.get('q')
    tags = request.args.getlist('tags')
    return activity_service.search_activities(search_term, tags)

@activity_bp.route('/<int:activity_id>/revisions', methods=['POST'])
@jwt_required()
def create_revision(activity_id):
    """
    Salva uma nova versão histórica (revisão) da atividade. 
    Permite rollback se o professor errar na edição.
    """
    logger.info(f"[create_revision] Criando revisão para atividade {activity_id}")
    return activity_service.create_revision(
        current_user, 
        activity_id, 
        request.json
    )

@activity_bp.route('/<int:activity_id>/assign', methods=['POST'])
@cross_origin()
@jwt_required()
def assign_activity_to_class(activity_id):
    """
    Vincula uma atividade pronta a uma turma específica.
    O Service gerará as instâncias/progressos para cada aluno da turma.
    - Acesso: Apenas o professor dono da atividade.
    """
    logger.info(f"[assign_activity_to_class] Iniciando atribuição da atividade {activity_id}")
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    original_activity = Activity.query.get(activity_id)

    if not user or user.role != 'professor':
        return jsonify({"message": "Acesso negado. Apenas professores podem atribuir atividades."}), 403

    if not original_activity:
        return jsonify({"message": "Atividade não encontrada."}), 404

    if original_activity.professor_id != user.id:
        return jsonify({"message": "Acesso negado. Você não é o professor responsável por esta atividade."}), 403

    data = request.get_json()
    class_id = data.get('class_id')
    
    try:
        response, status_code = activity_service.assign_activity_to_class_service(
            user, 
            original_activity, 
            class_id, 
            data
        )
        return jsonify(response), status_code
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao atribuir atividade ID {activity_id} à turma ID {class_id}: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro interno do servidor ao atribuir atividade à turma: {str(e)}"}), 500


@activity_bp.route('/my_activities', methods=['GET'])
@jwt_required()
def get_my_activities():
    """
    Lista todas as atividades (rascunhos e públicas) cujo autor é o professor atual.
    Usado para popular o "Meu Acervo".
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    
    search_term = request.args.get('search', None) # Pega o parâmetro 'search' da URL
    activities = activity_service.get_activities_by_professor(current_user.id, search_term)
    
    return jsonify(activities), 200

@activity_bp.route('/public', methods=['GET'])
@jwt_required()
def get_public_activities():
    """
    Retorna o Feed de Atividades Compartilhadas por outros professores.
    Exclui as atividades privadas (Drafts) e exclui as do próprio usuário.
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    search_term = request.args.get('search', None) # Pega o parâmetro 'search' da URL
    activities = activity_service.get_public_activities(current_user.id, search_term)

    return jsonify(activities), 200

@activity_bp.route('/<int:activity_id>', methods=['PUT'])
@jwt_required()
def update_activity_route(activity_id):
    """
    Atualiza as configurações básicas e metadados de uma atividade existente.
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    data = request.get_json()
    return activity_service.update_activity(current_user, activity_id, data)

@activity_bp.route('/<int:activity_id>/copy', methods=['POST'])
@jwt_required()
def copy_activity_route(activity_id):
    """
    Duplica uma atividade pública existente e define o usuário atual como dono da cópia.
    (Funcionalidade de "Clonar" para aproveitar o acervo global).
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    return activity_service.copy_activity(current_user, activity_id)

@activity_bp.route('/<int:activity_id>', methods=['DELETE'])
@jwt_required()
def delete_activity(activity_id):
    """
    Soft-Delete ou Delete Cascata de uma atividade.
    Como muitas coisas dependem da atividade (fóruns, chats, avaliações, métricas),
    precisamos limpar essas tabelas relacionadas antes para evitar erros de Integridade Relacional (Foreign Key).
    """
    activity = Activity.query.get(activity_id)
    if not activity:
        return jsonify({"message": "Atividade não encontrada"}), 404
    if activity.professor_id != current_user.id:
        return jsonify({"message": "Acesso negado"}), 403
    
    try:
        logger.info(f"[delete_activity] Iniciando deleção da atividade {activity_id}")
        _log_system_event(
            user_id=current_user.id,
            action='activity_deleted',
            activity_id=activity.id,
            details={'title': activity.title}
        )
        
        # 1. Limpa Conversas de Chat vinculadas a esta atividade
        conversation = Conversation.query.filter_by(activity_id=activity_id).first()
        if conversation:
            ChatMessage.query.filter_by(conversation_id=conversation.id).delete()
            db.session.delete(conversation)

        # 2. Limpa Avaliações (Ratings)
        ActivityRating.query.filter_by(activity_id=activity_id).delete()

        # 3. Deleta registros de progresso
        ActivityProgress.query.filter_by(activity_id=activity_id).delete()
        
        # 4. Deleta a atividade principal
        db.session.delete(activity)

        db.session.commit()
        return jsonify({"message": "Atividade deletada com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao deletar atividade ID {activity_id}: {str(e)}")
        current_app.logger.error(f"Erro ao deletar atividade ID {activity_id}: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro ao deletar: {str(e)}"}), 500

@activity_bp.route('/<int:activity_id>/quiz', methods=['PUT'])
@jwt_required()
@cross_origin() 
def update_activity_quiz(activity_id):
    """
    Adiciona ou sobrescreve diretamente a camada de Quizzes (JSONB) de uma atividade.
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403

    activity = Activity.query.get(activity_id)

    if not activity:
        return jsonify({"message": "Atividade não encontrada"}), 404
    
    if activity.professor_id != user.id:
        return jsonify({"message": "Você não tem permissão para editar esta atividade."}), 403

    data = request.get_json()
    questions = data.get('questions')

    if questions is None or not isinstance(questions, list):
        return jsonify({"message": "Dados de perguntas inválidos."}), 400

    try:
        # Se game_elements for nulo, inicializa como um dicionário
        if activity.game_elements is None:
            activity.game_elements = {}

        # Cria uma cópia para garantir que o SQLAlchemy detecte a mudança no JSONB
        game_elements_copy = dict(activity.game_elements)
        game_elements_copy['questions'] = questions
        activity.game_elements = game_elements_copy
        
        db.session.commit()
        return jsonify({"message": "Quiz atualizado com sucesso!", "activity": activity.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao atualizar quiz para atividade ID {activity_id}: {str(e)}")
        current_app.logger.error(f"Erro ao atualizar quiz para atividade ID {activity_id}: {str(e)}", exc_info=True)
        return jsonify({"message": "Erro interno ao salvar o quiz."}), 500

@activity_bp.route('/bulk-delete', methods=['DELETE'])
@jwt_required()
def bulk_delete_activities_route():
    """
    Exclui em lote múltiplas atividades (Usado nas tabelas do Painel Admin/Professor).
    - Payload JSON: { "activity_ids": [int, int, ...] }
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    
    data = request.get_json()
    activity_ids = data.get('activity_ids')

    if not activity_ids or not isinstance(activity_ids, list):
        return jsonify({"message": "A lista de IDs de atividades ('activity_ids') é obrigatória."}), 400

    logger.info(f"[bulk_delete] Solicitada deleção de {len(activity_ids)} atividades.")
    # A deleção em lote, devido à complexidade das Foreign Keys, é encapsulada no service
    result, status_code = activity_service.bulk_delete_activities(current_user, activity_ids)
    
    return jsonify(result), status_code


@activity_bp.route('/<int:activity_id>/structure', methods=['PATCH'])
@jwt_required()
def update_activity_structure_route(activity_id):
    """
    Atualiza, de forma otimizada, apenas o 'gamificationDesign' da atividade (ex: layout do caminho, nodes do mapa).
    Impede que requisições longas sobrescrevam textos pesados sem necessidade.
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    
    data = request.get_json()
    return activity_service.update_activity_structure(current_user, activity_id, data)


@activity_bp.route('/<int:activity_id>/rate', methods=['POST'])
@jwt_required()
def rate_activity(activity_id):
    """
    Permite que o usuário atribua uma nota (rating) a uma atividade após completá-la (1 a 5 estrelas).
    Se o aluno já tiver avaliado, a avaliação anterior é atualizada (Upsert).
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    score = data.get('score')

    if not score or not isinstance(score, int) or not (1 <= score <= 5):
        return jsonify({"message": "Nota inválida. Deve ser entre 1 e 5."}), 400

    try:
        existing_rating = ActivityRating.query.filter_by(user_id=user_id, activity_id=activity_id).first()

        if existing_rating:
            existing_rating.score = score
            existing_rating.created_at = db.func.current_timestamp() # Atualiza data
            message = "Avaliação atualizada."
        else:
            new_rating = ActivityRating(user_id=user_id, activity_id=activity_id, score=score)
            db.session.add(new_rating)
            message = "Avaliação registrada."

        db.session.commit()
        return jsonify({"message": message}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"[rate_activity] Erro ao avaliar atividade {activity_id}: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro ao salvar avaliação: {str(e)}"}), 500
    
# --- ROTAS DE RASCUNHO (AUTOSAVE) ---


@activity_bp.route('/autosave', methods=['POST'])
@jwt_required()
@cross_origin()
def autosave_route():
    """
    Salva silenciosamente o progresso da edição de uma atividade enquanto o professor cria,
    evitando perda de dados se o navegador fechar acidentalmente.
    """
    print("--- [DEBUG BACKEND] Entrou na função autosave_route ---")
    return activity_service.save_autosave(current_user, request.json)

@activity_bp.route('/drafts', methods=['GET'])
@jwt_required()
def get_drafts_route():
    """
    Retorna apenas as atividades marcadas como 'draft' (Rascunho) criadas pelo professor atual.
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    drafts = activity_service.get_user_drafts(current_user.id)
    return jsonify(drafts), 200

@activity_bp.route('/<int:activity_id>/publish', methods=['POST'])
@jwt_required()
def publish_route(activity_id):
    """
    Muda o estado da atividade de 'draft' para 'published', tornando-a disponível
    para ser associada a turmas e visualizada na aba "Meu Acervo".
    """
    return activity_service.publish_draft(current_user, activity_id, request.json)


@activity_bp.route('/recommendations', methods=['POST'])
@jwt_required()
def get_activity_recommendations(): 
    """
    Gera dicas dinâmicas (Intelligence/Recommendation) de como melhorar o rascunho atual.
    Avalia a estrutura JSON recebida (texto, tamanho de passos, gamificação)
    e retorna sugestões de design instrucional.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Instancia a regra de negócio central de heurísticas recomendativas
        engine = ContextualRecommendationEngine()
        results = engine.calculate_recommendations(data)
        
        return jsonify(results), 200
    except Exception as e:
        logger.error(f"Erro ao gerar recomendações: {str(e)}", exc_info=True)
        return jsonify({"message": "Erro ao processar recomendações."}), 500