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

PREDEFINED_TEMPLATES = [
    {
        "id": "quiz-requisitos",
        "name": "Quiz de Requisitos Funcionais e Não Funcionais",
        "description": "Um template para criar um quiz rápido sobre requisitos de software, ideal para revisão de conceitos.",
        "icon": "🧠",
        "data": {
            "title": "Quiz: Requisitos de Software",
            "description": "Avalie seu conhecimento sobre requisitos funcionais e não funcionais com este quiz interativo.",
            "areaKnowledge": "Engenharia de Software",
            "currentScenario": {
                "problems": ["Dificuldades na compreensão de conceitos complexos de programação.", "Dificuldades em aplicar as teorias aprendidas na prática."],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": ["Aumentar a retenção de conhecimentos e habilidades adquiridos ao longo do curso", "Promover a participação ativa dos alunos nas atividades de aprendizagem"],
                "otherObjective": ""
            },
            "activityPlanning": {
                "characteristics": ["Online", "Individual", "Formativa (atividade de prática ou revisão)"],
                "participantsQuantity": "Turma toda",
                "expectedDuration": "30 minutos",
                "location": "Online",
                "otherInfo": "Pode ser usado como atividade pré-aula ou pós-aula."
            },
            "playerProfile": {
                "selectedProfiles": ["Jogador de realização", "Jogador competitivo"]
            },
            "gameElements": {
                "selectedElements": ["Níveis", "Sistema de pontuação", "Feedback claro sobre o desempenho", "Sistema de classificação e ranking", "Narrativas envolventes"],
                "otherElement": "",
                "narrativeTitle": "Desafio do Conhecimento",
                "narrativeContent": "Embarque em uma jornada para provar seu domínio sobre os requisitos de software, superando cada nível de dificuldade."
            },
            "rewardsOffered": {
                "selectedRewards": ["Pontos de bônus para a participação na aula.", "Conquistas digitais para metas alcançadas."],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": ["Responder corretamente a perguntas de revisão de material", "Atingir uma pontuação elevada em um jogo educacional"],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": ["Respeite as regras do jogo e as decisões do professor em todas as atividades.", "Busque sempre aprender e se esforçar para alcançar seus objetivos em cada atividade."],
                "specificRules": "Cada questão tem um tempo limite de 30 segundos. Respostas corretas concedem pontos, incorretas não."
            }
        }
    },
    {
        "id": "desafio-teste-software",
        "name": "Desafio de Teste de Software",
        "description": "Um cenário prático para identificar e propor soluções para defeitos em software.",
        "icon": "🐛",
        "data": {
            "title": "Desafio: Identificação de Bugs",
            "description": "Participe de um desafio prático para encontrar e documentar bugs em um sistema simulado.",
            "areaKnowledge": "Engenharia de Software",
            "currentScenario": {
                "problems": ["Dificuldades em aplicar as teorias aprendidas na prática.", "Dificuldades em lidar com ferramentas de desenvolvimento complexas."],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": ["Incentivar a aplicação prática dos conhecimentos teóricos em projetos reais", "Desenvolver habilidades cognitivas, sociais e de aprendizagem"],
                "otherObjective": ""
            },
            "activityPlanning": {
                "characteristics": ["Presencial", "Em grupos", "Somativa (avaliação)", "Foco em projetos ou desenvolvimento de software real"],
                "participantsQuantity": "Grupos de 3-4 alunos",
                "expectedDuration": "4 horas",
                "location": "Laboratório de Informática",
                "otherInfo": "Requer computadores com ambiente de desenvolvimento configurado."
            },
            "playerProfile": {
                "selectedProfiles": ["Jogador cooperativo", "Jogador de realização"]
            },
            "gameElements": {
                "selectedElements": ["Níveis", "Reconhecimento", "Progressão baseada em habilidade", "Cooperação", "Objetivo (missão, meta do jogo)", "Narrativas envolventes"],
                "otherElement": "",
                "narrativeTitle": "Caça aos Bugs",
                "narrativeContent": "A cidade digital está sob ataque de bugs traiçoeiros! Sua equipe de elite de testadores é a única esperança para restaurar a ordem."
            },
            "rewardsOffered": {
                "selectedRewards": ["Vantagens para jogos e desafios.", "Certificados digitais.", "Destaque na apresentação de trabalhos."],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": ["Colaboração com outros alunos em projetos de grupo", "Demonstrar pensamento crítico em tarefas desafiadoras", "Apresentar um trabalho com excelência"],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": ["Seja respeitoso e colaborativo com outros jogadores em todas as atividades.", "Comunique-se com outros jogadores de forma clara e objetiva em todas as atividades."],
                "specificRules": "Cada bug identificado e documentado corretamente concede pontos. A equipe com mais pontos vence."
            }
        }
    },
    {
        "id": "estudo-caso-padroes-projeto",
        "name": "Estudo de Caso de Padrões de Projeto",
        "description": "Analise um problema de design de software e aplique padrões de projeto para uma solução elegante.",
        "icon": "📐",
        "data": {
            "title": "Estudo de Caso: Padrões de Projeto",
            "description": "Resolva um problema de design de software aplicando padrões de projeto GoF.",
            "areaKnowledge": "Engenharia de Software",
            "currentScenario": {
                "problems": ["Dificuldades em aplicar as teorias aprendidas na prática.", "Dificuldades na compreensão de conceitos complexos de programação."],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": ["Incentivar a aplicação prática dos conhecimentos teóricos em projetos reais", "Estimular a criatividade e a inovação"],
                "otherObjective": ""
            },
            "activityPlanning": {
                "characteristics": ["Individual", "Online", "Somativa (avaliação)"],
                "participantsQuantity": "Individual",
                "expectedDuration": "2 horas",
                "location": "Online ou Presencial",
                "otherInfo": "Pode ser adaptado para trabalho em grupo."
            },
            "playerProfile": {
                "selectedProfiles": ["Jogador de realização", "Jogador imersivo"]
            },
            "gameElements": {
                "selectedElements": ["Sistema de pontuação", "Feedback claro sobre o desempenho", "Narrativas envolventes"],
                "otherElement": "",
                "narrativeTitle": "O Arquiteto de Software",
                "narrativeContent": "Você é um arquiteto de software renomado, e um novo cliente apresenta um desafio de design. Sua missão é criar a solução mais robusta e elegante usando os padrões de projeto corretos."
            },
            "rewardsOffered": {
                "selectedRewards": ["Pontos de bônus para a participação na aula.", "Reconhecimento público (por exemplo, menção em redes sociais ou na frente da turma)."],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": ["Apresentar um trabalho com excelência", "Demonstrar pensamento crítico em tarefas desafiadoras"],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": ["Respeite as regras e políticas da instituição em todas as atividades.", "Busque sempre a supervisão do professor em todas as atividades."],
                "specificRules": "A solução será avaliada pela correção da aplicação do padrão, clareza do código e justificativa das escolhas."
            }
        }
    }
]

# --- ROTA PARA SUBMETER RESPOSTAS DO QUIZ (COM CORREÇÃO DE TIPO) ---
@activity_bp.route('/<int:activity_id>/submit_answer', methods=['POST'])
@jwt_required()
@cross_origin()
def submit_answer(activity_id):
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
        return jsonify({"message": "Erro interno ao salvar a resposta."}), 500

# --- ROTA PARA REGISTRAR EVENTOS GENÉRICOS ---
@activity_bp.route('/<int:activity_id>/log_event', methods=['POST'])
@jwt_required()
@cross_origin()
def log_activity_event(activity_id):
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
        return jsonify({"message": "Erro interno ao registrar evento."}), 500


@activity_bp.route('', methods=['POST'])
@jwt_required()
def create_activity():
    return activity_service.create_activity(current_user, request.json)

@activity_bp.route('/<int:activity_id>', methods=['GET'])
@jwt_required()
def get_activity_route(activity_id):
    return activity_service.get_activity(current_user, activity_id)

@activity_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_predefined_templates():
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    return jsonify(PREDEFINED_TEMPLATES)

@activity_bp.route('/search', methods=['GET'])
@jwt_required()
def search_activities():
    # Nova funcionalidade: busca com tags
    search_term = request.args.get('q')
    tags = request.args.getlist('tags')
    return activity_service.search_activities(search_term, tags)

@activity_bp.route('/<int:activity_id>/revisions', methods=['POST'])
@jwt_required()
def create_revision(activity_id):
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
    """Rota para buscar as atividades do professor logado, com filtro de busca opcional."""
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    
    
    search_term = request.args.get('search', None) # Pega o parâmetro 'search' da URL
    activities = activity_service.get_activities_by_professor(current_user.id, search_term)
    
    
    return jsonify(activities), 200

@activity_bp.route('/public', methods=['GET'])
@jwt_required()
def get_public_activities():
    """Rota para buscar todas as atividades públicas de outros professores."""
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    search_term = request.args.get('search', None) # Pega o parâmetro 'search' da URL
    activities = activity_service.get_public_activities(current_user.id, search_term)

    return jsonify(activities), 200

@activity_bp.route('/<int:activity_id>', methods=['PUT'])
@jwt_required()
def update_activity_route(activity_id):
    """Rota para atualizar uma atividade."""
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    data = request.get_json()
    return activity_service.update_activity(current_user, activity_id, data)

@activity_bp.route('/<int:activity_id>/copy', methods=['POST'])
@jwt_required()
def copy_activity_route(activity_id):
    """Rota para copiar uma atividade pública."""
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    return activity_service.copy_activity(current_user, activity_id)

@activity_bp.route('/<int:activity_id>', methods=['DELETE'])
@jwt_required()
def delete_activity(activity_id):
    activity = Activity.query.get(activity_id)
    if not activity:
        return jsonify({"message": "Atividade não encontrada"}), 404
    if activity.professor_id != current_user.id:
        return jsonify({"message": "Acesso negado"}), 403
    
    try:
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
        return jsonify({"message": f"Erro ao deletar: {str(e)}"}), 500

@activity_bp.route('/<int:activity_id>/quiz', methods=['PUT'])
@jwt_required()
@cross_origin() 
def update_activity_quiz(activity_id):
    """
    Rota para adicionar ou atualizar as perguntas de um quiz de uma atividade.
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
        return jsonify({"message": "Erro interno ao salvar o quiz."}), 500

@activity_bp.route('/bulk-delete', methods=['DELETE'])
@jwt_required()
def bulk_delete_activities_route():
    """
    Rota para deletar múltiplas atividades de uma vez.
    Espera um JSON no corpo da requisição com uma chave "activity_ids".
    Ex: { "activity_ids": [1, 5, 12] }
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    
    data = request.get_json()
    activity_ids = data.get('activity_ids')

    if not activity_ids or not isinstance(activity_ids, list):
        return jsonify({"message": "A lista de IDs de atividades ('activity_ids') é obrigatória."}), 400

    # Chama a função do serviço para executar a lógica de negócio
    result, status_code = activity_service.bulk_delete_activities(current_user, activity_ids)
    
    return jsonify(result), status_code


@activity_bp.route('/<int:activity_id>/structure', methods=['PATCH'])
@jwt_required()
def update_activity_structure_route(activity_id):
    """
    Rota leve para salvar apenas a estrutura de gamificação (gamificationDesign).
    """
    if current_user.role != 'professor':
        return jsonify({"message": "Acesso negado"}), 403
    
    data = request.get_json()
    return activity_service.update_activity_structure(current_user, activity_id, data)


@activity_bp.route('/<int:activity_id>/rate', methods=['POST'])
@jwt_required()
def rate_activity(activity_id):
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
        return jsonify({"message": f"Erro ao salvar avaliação: {str(e)}"}), 500