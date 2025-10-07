# backend/app/routes/medals.py

from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Medal, UserUnlockedMedal, User, ActivityProgress, StudentResponse

medals_bp = Blueprint('medals', __name__)

# ==============================================================================
# FUNÇÕES DE VERIFICAÇÃO DE MEDALHAS (GATILHOS)
# ==============================================================================
# Cada função aqui é responsável por verificar UMA única medalha.
# Elas são projetadas para serem claras e fáceis de modificar no futuro.
# ------------------------------------------------------------------------------

def _check_medal_explorador(user, activity_id):
    """Verifica a Medalha do Explorador: completar a atividade."""
    progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()
    return progress and progress.status == 'completed'

def _check_medal_inspetor(user, activity_id):
    """Verifica a Medalha do Inspetor: não ter cometido erros na atividade."""
    incorrect_response = StudentResponse.query.filter_by(
        student_id=user.id, activity_id=activity_id, is_correct=False
    ).first()
    # Se não houver respostas incorretas, o critério é atingido.
    return incorrect_response is None

def _check_medal_velocista(user, activity_id):
    """Verifica a Medalha do Velocista: estar entre os 3 primeiros a concluir a atividade."""
    # Conta quantos outros utilizadores já completaram esta atividade (têm um 'completed_at' definido)
    completion_count = ActivityProgress.query.filter(
        ActivityProgress.activity_id == activity_id,
        ActivityProgress.completed_at.isnot(None)
    ).count()
    # Se a contagem ANTES do commit atual for 0, 1 ou 2, o utilizador atual está no top 3.
    return completion_count < 3

def _check_medal_fenix(user, activity_id):
    """Verifica a Medalha Fênix: superar um erro anterior."""
    # Placeholder: A lógica exata dependerá de um gatilho no momento da resposta do quiz.
    # Por exemplo, verificar se a pergunta já foi respondida incorretamente antes.
    # Por enquanto, está desativada.
    return False

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
             # {'name': 'Medalha "Fênix"', 'func': _check_medal_fenix}, # Ativar no futuro
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
    
    medals_data = [{
        "id": medal.id,
        "name": medal.name,
        "description": medal.description,
        "imageUrl": medal.image_url,
        "type": medal.type,
        "notes": medal.notes
    } for medal in medals]
    
    return jsonify(medals_data), 200

@medals_bp.route('/my-unlocked', methods=['GET'])
@jwt_required()
def get_my_unlocked_medals():
    """Retorna uma lista de IDs das medalhas que o utilizador atual desbloqueou."""
    user_id = get_jwt_identity()
    unlocked_medals = UserUnlockedMedal.query.filter_by(user_id=user_id).all()
    unlocked_ids = [unlocked.medal_id for unlocked in unlocked_medals]
    return jsonify(unlocked_ids), 200