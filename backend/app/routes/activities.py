# backend/app/routes/activities.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, current_user, get_jwt_identity
from flask_cors import cross_origin
from copy import deepcopy
import logging
from ..models import db, Activity, ActivityRating, Tag, activity_tag, ActivityRevision, User, Class, ActivityProgress, StudentResponse, EventLog, Conversation, ChatMessage, ActivityRating
from ..services import activity_service
from ..utils.logging import _log_system_event
from .medals import check_and_award_medals
from datetime import datetime, time
activity_bp = Blueprint('activities', __name__)
logger = logging.getLogger(__name__)

from ..presets.activity_templates import PREDEFINED_TEMPLATES

# --- ROTA PARA SUBMETER RESPOSTAS DO QUIZ (COM CORREÇÃO DE TIPO) ---
@activity_bp.route('/<int:activity_id>/submit_answer', methods=['POST'])
@jwt_required()
@cross_origin()
def submit_answer(activity_id):
    """
    Processa a submissão de uma resposta de quiz por um aluno.
    
    @desc Verifica a resposta, calcula pontos, atualiza o progresso e checa medalhas.
    @param {int} activity_id - ID da atividade sendo respondida.
    @return {JSON} - Resultado da submissão e novos pontos.
    """
    # LOG: [submit_answer] Iniciando processamento de resposta.
    logger.info(f"[submit_answer] Iniciando submissão para atividade {activity_id}")
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'aluno':
        return jsonify({"message": "Apenas alunos podem submeter respostas."}), 403

    data = request.get_json()
    
    try:
        # --- CORREÇÃO APLICADA AQUI ---
        # Extraímos todas as variáveis necessárias do 'data' no início do bloco try.
        points_earned = int(data.get('points_earned', 0))
        is_correct = data.get('is_correct', False)
        question_text = data.get('question_text')
        # --- FIM DA CORREÇÃO ---

        progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()
        activity = Activity.query.get(activity_id)

        if not progress:
            progress = ActivityProgress(
                student_id=user.id, activity_id=activity_id,
                class_id=activity.class_id, status='in_progress'
            )
            db.session.add(progress)
            db.session.flush()

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

        progress.points_earned = (progress.points_earned or 0) + points_earned
        progress.total_xp_earned = (progress.total_xp_earned or 0) + points_earned
        progress.attempts = (progress.attempts or 0) + 1
        
        current_app.logger.info(f"[DEBUG_POINTS] New progress.total_xp_earned AFTER update: {progress.total_xp_earned}")
        # O gatilho agora tem acesso às variáveis 'is_correct' and 'question_text'
        try:
            check_and_award_medals(
                user_id=current_user_id,
                activity_id=activity_id,
                event_type='quiz_answer_submitted',
                is_correct=is_correct,
                question_text=question_text
            )
        except Exception as e:
            current_app.logger.error(f"Erro ao verificar medalhas 'on_submit' para user {current_user_id}: {str(e)}")

        db.session.commit()
        return jsonify({"message": "Resposta registrada e progresso atualizado.", "new_total_points": progress.points_earned}), 200

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
    Registra eventos genéricos de interação do usuário com a atividade.
    
    @param {int} activity_id - ID da atividade.
    @payload {json} - Deve conter 'event_type' (ex: 'narrative_viewed').
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
    Cria uma nova atividade.
    
    @desc Delega a criação para o serviço activity_service.
    @return {JSON} - A atividade criada.
    """
    # LOG: [create_activity] Recebendo requisição de criação.
    logger.info("[create_activity] Iniciando criação de nova atividade.")
    return activity_service.create_activity(current_user, request.json)

@activity_bp.route('/<int:activity_id>', methods=['GET'])
@jwt_required()
def get_activity_route(activity_id):
    """
    Busca os detalhes de uma atividade específica.
    
    @param {int} activity_id - ID da atividade.
    """
    return activity_service.get_activity(current_user, activity_id)

@activity_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_predefined_templates():
    """
    Retorna os templates de atividades predefinidos.
    
    @desc Apenas professores podem acessar.
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    return jsonify(PREDEFINED_TEMPLATES)

@activity_bp.route('/search', methods=['GET'])
@jwt_required()
def search_activities():
    """
    Busca atividades com base em termos e tags.
    
    @param {string} q - Termo de busca (query param).
    @param {list} tags - Lista de tags (query param).
    """
    # LOG: [search_activities] Processando busca.
    # TODO: Otimizar busca para grandes volumes de dados (paginação).
    # Nova funcionalidade: busca com tags
    search_term = request.args.get('q')
    tags = request.args.getlist('tags')
    return activity_service.search_activities(search_term, tags)

@activity_bp.route('/<int:activity_id>/revisions', methods=['POST'])
@jwt_required()
def create_revision(activity_id):
    """
    Cria uma revisão para uma atividade.
    
    @param {int} activity_id - ID da atividade.
    """
    logger.info(f"[create_revision] Criando revisão para atividade {activity_id}")
    # Nova funcionalidade: criar revisão
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
    Atribui uma atividade a uma turma.
    
    @desc Pode atribuir diretamente (se for modelo mestre) ou criar uma cópia.
    @param {int} activity_id - ID da atividade original.
    @payload {json} - Espera 'class_id', datas de início/fim.
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
    
    available_from_date_str = data.get('available_from_date')
    available_from_time_str = data.get('available_from_time')
    expires_at_date_str = data.get('expires_at_date')
    expires_at_time_str = data.get('expires_at_time')

    available_from = None
    expires_at = None

    # TODO: Extrair lógica de parsing de data/hora para uma função utilitária (DRY).
    # Processa a data/hora de TÉRMINO
    if expires_at_date_str:
        expires_date = datetime.strptime(expires_at_date_str, '%Y-%m-%d').date()
        # Se o professor NÃO informou a hora, assume 23:59:59
        if not expires_at_time_str:
            expires_time = time(23, 59, 59)
        else:
            expires_time = datetime.strptime(expires_at_time_str, '%H:%M').time()
        expires_at = datetime.combine(expires_date, expires_time)

    # Processa a data/hora de INÍCIO
    if available_from_date_str:
        available_date = datetime.strptime(available_from_date_str, '%Y-%m-%d').date()
        # Se o professor NÃO informou a hora, assume a hora atual
        if not available_from_time_str:
            available_time = datetime.utcnow().time()
        else:
            available_time = datetime.strptime(available_from_time_str, '%H:%M').time()
        available_from = datetime.combine(available_date, available_time)

    

    if not class_id:
        return jsonify({"message": "O ID da turma é obrigatório para atribuir a atividade."}), 400

    target_class = Class.query.get(class_id)
    if not target_class or target_class.professor_id != user.id:
        return jsonify({"message": "Turma não encontrada ou você não tem permissão sobre ela."}), 404

    try:
        
        # Lógica de Negócio: Diferenciação entre atribuição direta e cópia
        # CASO 1: A atividade é um "modelo mestre" e nunca foi atribuída.
        if original_activity.class_id is None:
            current_app.logger.info(f"Atividade ID {activity_id} é um modelo. Atribuindo diretamente à turma ID {class_id}.")
            _log_system_event(
                user_id=user.id,
                action='activity_assigned',
                activity_id=original_activity.id,
                details={'class_id': class_id, 'method': 'direct_assignment'}
            )
            # Apenas atualiza a atividade original com o ID da turma
            original_activity.class_id = class_id
            original_activity.assignment_count += 1 # Incrementa o contador
            original_activity.available_from = available_from
            original_activity.expires_at = expires_at
            
            db.session.add(original_activity)
            db.session.commit()
            
            return jsonify({
                "message": "Atividade atribuída à turma com sucesso!", 
                "activity": original_activity.to_dict()
            }), 200

        # CASO 2: A atividade já está em uso. Cria uma cópia.
        else:
            current_app.logger.info(f"Atividade ID {activity_id} já está em uso. Criando uma cópia para a turma ID {class_id}.")
            _log_system_event(
                user_id=user.id,
                action='activity_assigned',
                activity_id=new_activity.id, # Loga o ID da nova atividade copiada
                details={
                    'class_id': class_id, 
                    'method': 'copy_assignment',
                    'original_activity_id': original_activity.id
                }
            )
            # Cria uma cópia da atividade original
            new_activity = Activity(
                professor_id=user.id,
                title=original_activity.title,
                description=original_activity.description,
                current_scenario=deepcopy(original_activity.current_scenario),
                desired_scenario=deepcopy(original_activity.desired_scenario),
                activity_planning=deepcopy(original_activity.activity_planning),
                player_profile=deepcopy(original_activity.player_profile),
                game_elements=deepcopy(original_activity.game_elements),
                rewards_offered=deepcopy(original_activity.rewards_offered),
                rewarded_actions=deepcopy(original_activity.rewarded_actions),
                gamification_rules=deepcopy(original_activity.gamification_rules),
                area_knowledge=original_activity.area_knowledge,
                is_public=False,
                class_id=class_id, # Atribui a cópia à nova turma
                available_from=available_from,
                expires_at=expires_at
            )

            # Incrementa o contador da atividade original
            original_activity.assignment_count += 1

            db.session.add(original_activity)
            db.session.add(new_activity)
            db.session.commit()
            
            return jsonify({
                "message": "Atividade copiada e atribuída à turma com sucesso!", 
                "activity": new_activity.to_dict()
            }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao atribuir atividade ID {activity_id} à turma ID {class_id}: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro interno do servidor ao atribuir atividade à turma: {str(e)}"}), 500


@activity_bp.route('/my_activities', methods=['GET'])
@jwt_required()
def get_my_activities():
    
    """
    Rota para buscar as atividades do professor logado, com filtro de busca opcional.
    
    @desc Retorna apenas atividades criadas pelo usuário atual.
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
    Rota para buscar todas as atividades públicas de outros professores.
    
    @desc Exclui atividades privadas e do próprio usuário.
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
    Rota para atualizar uma atividade existente.
    
    @param {int} activity_id - ID da atividade a ser atualizada.
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    data = request.get_json()
    return activity_service.update_activity(current_user, activity_id, data)

@activity_bp.route('/<int:activity_id>/copy', methods=['POST'])
@jwt_required()
def copy_activity_route(activity_id):
    
    """
    Rota para copiar uma atividade pública para o acervo do professor.
    
    @param {int} activity_id - ID da atividade pública original.
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    return activity_service.copy_activity(current_user, activity_id)

@activity_bp.route('/<int:activity_id>', methods=['DELETE'])
@jwt_required()
def delete_activity(activity_id):
    """
    Deleta uma atividade e seus dados relacionados.
    @desc Remove conversas, avaliações e progressos antes de deletar a atividade.
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
        
        # 4. Deleta a atividade
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
    Rota para adicionar ou atualizar as perguntas de um quiz de uma atividade.
    @param {int} activity_id - ID da atividade.
    @payload {json} - Espera lista de 'questions'.
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
        # TODO: Verificar se há uma maneira mais eficiente de atualizar JSONB sem cópia completa.
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
    Rota para deletar múltiplas atividades de uma vez.
    Espera um JSON no corpo da requisição com uma chave "activity_ids".
    
    @payload {json} - { "activity_ids": [int, int, ...] }
    Ex: { "activity_ids": [1, 5, 12] }
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    
    data = request.get_json()
    activity_ids = data.get('activity_ids')

    if not activity_ids or not isinstance(activity_ids, list):
        return jsonify({"message": "A lista de IDs de atividades ('activity_ids') é obrigatória."}), 400

    logger.info(f"[bulk_delete] Solicitada deleção de {len(activity_ids)} atividades.")
    # Chama a função do serviço para executar a lógica de negócio
    result, status_code = activity_service.bulk_delete_activities(current_user, activity_ids)
    
    return jsonify(result), status_code


@activity_bp.route('/<int:activity_id>/structure', methods=['PATCH'])
@jwt_required()
def update_activity_structure_route(activity_id):
    """
    Rota leve para salvar apenas a estrutura de gamificação (gamificationDesign).
    @param {int} activity_id - ID da atividade.
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    
    data = request.get_json()
    return activity_service.update_activity_structure(current_user, activity_id, data)


@activity_bp.route('/<int:activity_id>/rate', methods=['POST'])
@jwt_required()
def rate_activity(activity_id):
    """
    Registra ou atualiza a avaliação (nota) de um usuário para uma atividade.
    
    @param {int} activity_id - ID da atividade.
    @payload {json} - { "score": int (1-5) }
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    score = data.get('score')

    if not score or not isinstance(score, int) or not (1 <= score <= 5):
        return jsonify({"message": "Nota inválida. Deve ser entre 1 e 5."}), 400

    try:
        # Verifica se já existe avaliação para atualizar ou criar nova
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