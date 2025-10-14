# backend/app/routes/medals.py

from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Medal, UserUnlockedMedal, User, ActivityProgress, StudentResponse, Activity

medals_bp = Blueprint('medals', __name__)

# ==============================================================================
# FUNÇÕES DE VERIFICAÇÃO DE MEDALHAS (GATILHOS)
# ==============================================================================
# Cada função aqui é responsável por verificar UMA única medalha.
# Elas são projetadas para serem claras e fáceis de modificar no futuro.
# ------------------------------------------------------------------------------

def _check_medal_explorador(user, activity_id, **kwargs):
    """
    Verifica a Medalha do Explorador.
    Critério: Completar todos os passos definidos na trilha da atividade.
    """
    progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()
    activity = Activity.query.get(activity_id)

    # Guarda de segurança: se não houver progresso, atividade ou design, não faz nada.
    if not all([progress, activity, activity.gamification_design, activity.gamification_design.get('progression_path')]):
        return False

    # Pega o ID de todos os passos definidos na trilha
    all_step_ids = {step['id'] for step in activity.gamification_design['progression_path']}
    
    # Pega o conjunto de passos que o aluno completou
    completed_steps_set = set(progress.completed_steps or [])

    # Verifica se o conjunto de todos os passos é um subconjunto (ou igual) dos passos completados
    # .issubset() verifica se todos os elementos de all_step_ids estão em completed_steps_set
    return all_step_ids.issubset(completed_steps_set)

def _check_medal_inspetor(user, activity_id):
    """Verifica a Medalha do Inspetor: não ter cometido erros na atividade."""
    incorrect_response = StudentResponse.query.filter_by(
        student_id=user.id, activity_id=activity_id, is_correct=False
    ).first()
    # Se não houver respostas incorretas, o critério é atingido.
    return incorrect_response is None

def _check_medal_velocista(user, activity_id, **kwargs):
    """Verifica a Medalha do Velocista: estar entre os 3 primeiros a concluir a atividade."""
    # Conta quantos OUTROS utilizadores já completaram esta atividade
    completion_count = ActivityProgress.query.filter(
        ActivityProgress.activity_id == activity_id,
        ActivityProgress.completed_at.isnot(None),
        ActivityProgress.student_id != user.id  # <-- A CORREÇÃO ESTÁ AQUI
    ).count()
    
    # Se a contagem de OUTROS for 0, 1 ou 2, o utilizador atual está no top 3.
    return completion_count < 3

def _check_medal_fenix(user, activity_id, **kwargs):
    """
    Verifica a Medalha Fênix: superar um erro anterior no mesmo quiz.
    É acionada quando uma resposta CORRETA é submetida.
    """
    # Este gatilho só deve ser avaliado quando o aluno ACERTA uma questão.
    is_current_answer_correct = kwargs.get('is_correct', False)
    if not is_current_answer_correct:
        return False

    question_text = kwargs.get('question_text')
    if not question_text:
        return False

    # Procura por uma resposta ANTERIOR e INCORRETA para a MESMA pergunta nesta atividade.
    previous_incorrect_response = StudentResponse.query.filter(
        StudentResponse.student_id == user.id,
        StudentResponse.activity_id == activity_id,
        StudentResponse.response_data['question'].astext == question_text,
        StudentResponse.is_correct == False
    ).first()

    # Se encontrarmos uma resposta incorreta anterior, o critério foi cumprido.
    return previous_incorrect_response is not None

def _check_medal_peca_chave(user, activity_id, **kwargs):
    """Verifica a Medalha "Peça-Chave": completar um passo 'bloqueador'."""
    # Placeholder: Esta lógica requer que o professor possa marcar um passo como 'bloqueador'.
    # O gatilho seria no 'handleStepCompletion'.
    # A verificação seria: if kwargs.get('step_is_blocker'): return True
    return False

# ------------------------------------------------------------------------------
# FUNÇÃO PRINCIPAL DE CONCESSÃO DE MEDALHAS
# ------------------------------------------------------------------------------

def check_and_award_medals(user_id, activity_id, event_type, **kwargs):
    """Função central que é chamada em pontos chave da aplicação."""
    user = User.query.get(user_id)
    if not user: return

    # Mapeamento explícito de eventos para gatilhos de medalhas
    event_triggers = {
        'activity_completed': [
            {'name': 'Medalha do Explorador', 'func': _check_medal_explorador},
            {'name': 'Medalha do Inspetor', 'func': _check_medal_inspetor},
            {'name': 'Medalha do Velocista', 'func': _check_medal_velocista},
        ],
        'quiz_answer_submitted': [
            {'name': 'Medalha "Fênix"', 'func': _check_medal_fenix}, # Ativar no futuro
        ],
        'step_completed': [
            # {'name': 'Medalha "Peça-Chave"', 'func': _check_medal_peca_chave}, # Ativar no futuro
        ]
    }

    triggered_checks = event_triggers.get(event_type, [])
    if not triggered_checks: return

    unlocked_medal_ids = {m.medal_id for m in UserUnlockedMedal.query.filter_by(user_id=user_id).all()}
    medals_to_award = []

    for trigger in triggered_checks:
        medal_name = trigger['name']
        check_function = trigger['func']
        medal = Medal.query.filter_by(name=medal_name).first()

        if not medal or medal.id in unlocked_medal_ids:
            continue

        if check_function(user, activity_id, **kwargs):
            new_unlock = UserUnlockedMedal(user_id=user.id, medal_id=medal.id, activity_id=activity_id)
            db.session.add(new_unlock)
            medals_to_award.append(medal.name)
            current_app.logger.info(f"Medalha '{medal.name}' concedida ao usuário {user_id} na atividade {activity_id}.")

    if medals_to_award:
        db.session.commit()

# ==============================================================================
# ROTAS DA API
# ==============================================================================

@medals_bp.route('', methods=['GET'])
@jwt_required()
def get_all_medals():
    """Retorna uma lista de todas as medalhas existentes na plataforma."""
    medals = Medal.query.order_by(Medal.type, Medal.name).all()
    
    # --- INÍCIO DA CORREÇÃO ---
    # Adicionamos uma barra '/' no início do image_url se ela não existir.
    medals_data = [{
        "id": medal.id,
        "name": medal.name,
        "description": medal.description,
        "imageUrl": f"/{medal.image_url.lstrip('/')}", # Garante que o caminho comece com /
        "type": medal.type,
        "notes": medal.notes
    } for medal in medals]
    # --- FIM DA CORREÇÃO ---
    
    return jsonify(medals_data), 200

@medals_bp.route('/my-unlocked', methods=['GET'])
@jwt_required()
def get_my_unlocked_medals():
    """
    Retorna uma lista de IDs das medalhas que o utilizador atual desbloqueou.
    Pode ser filtrada por activity_id através de um query parameter.
    Ex: /my-unlocked?activity_id=22
    """
    user_id = get_jwt_identity()
    activity_id = request.args.get('activity_id', type=int) # Pega o ID da atividade da URL

    # Começa a query base
    query = UserUnlockedMedal.query.filter_by(user_id=user_id)

    # Se um activity_id foi fornecido na URL, adiciona o filtro
    if activity_id:
        query = query.filter_by(activity_id=activity_id)

    unlocked_medals = query.all()
    unlocked_ids = [unlocked.medal_id for unlocked in unlocked_medals]
    
    return jsonify(unlocked_ids), 200