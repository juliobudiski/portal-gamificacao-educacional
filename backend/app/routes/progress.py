# backend/app/routes/progress.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, User, ActivityProgress, Activity, StudentResponse, EventLog, RouletteWin
from sqlalchemy.orm import joinedload
from flask_cors import cross_origin 
progress_bp = Blueprint('progress', __name__)
from datetime import datetime, timedelta # Adicione timedelta
import random # Adicione random

def xp_for_next_level(level):
    """Calcula o XP necessário para o próximo nível com base no nível atual."""
    # Nível 1 -> 100, Nível 2 -> 150, Nível 3 -> 200, etc.
    return 100 + (level - 1) * 50

def calculate_level(total_points):
    """Calcula o nível atual, o XP para o próximo nível e o XP acumulado até o nível atual."""
    level = 1
    xp_required_for_current_level = 0
    xp_needed = xp_for_next_level(level)

    if total_points is None:
        total_points = 0

    while total_points >= xp_needed:
        total_points -= xp_needed
        xp_required_for_current_level += xp_needed
        level += 1
        xp_needed = xp_for_next_level(level)
    
    return {
        "level": level,
        "xpForNextLevel": xp_needed,
        "xpEarnedForCurrentLevel": total_points,
        "xpAccumulatedUntilCurrentLevel": xp_required_for_current_level
    }

@progress_bp.route('/<int:activity_id>', methods=['GET'])
@jwt_required()
@cross_origin()
def get_activity_progress(activity_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'aluno':
        return jsonify({"message": "Apenas alunos podem ver o progresso."}), 403

    progress = ActivityProgress.query.filter_by(
        student_id=user.id,
        activity_id=activity_id
    ).first()

    activity = Activity.query.get(activity_id)

    total_points = progress.points_earned if progress else 0
    level_info = calculate_level(total_points)
    
    # --- LÓGICA DE ESTATÍSTICAS ATUALIZADA ---
    total_possible_points = 0
    total_questions = 0
    if activity and activity.game_elements and isinstance(activity.game_elements.get('questions'), list):
        questions = activity.game_elements['questions']
        total_questions = len(questions)
        # Soma os pontos de cada questão para obter o total possível
        total_possible_points = sum(int(q.get('points', 0)) for q in questions)

    stats = {
        "scoreAchieved": total_points,
        "totalPossibleScore": total_possible_points,
        "totalQuestions": total_questions,
        "averageTime": 35,
        "achievements": 3
    }
    
    return jsonify({
        "points_earned": total_points,
        "status": progress.status if progress else 'not_started',
        "attempts": progress.attempts if progress else 0,
        "level": level_info["level"],
        "xp": level_info["xpEarnedForCurrentLevel"],
        "xpForNextLevel": level_info["xpForNextLevel"],
        "stats": stats
    }), 200


@progress_bp.route('/<int:activity_id>/leaderboard', methods=['GET'])
@jwt_required()
@cross_origin()
def get_leaderboard(activity_id):
    # Esta consulta busca todos os progressos para uma atividade,
    # ordena pelos pontos em ordem decrescente e pega os 10 primeiros.
    leaderboard_data = db.session.query(
        User.name,
        User.profile_picture,
        ActivityProgress.points_earned
    ).join(
        ActivityProgress, User.id == ActivityProgress.student_id
    ).filter(
        ActivityProgress.activity_id == activity_id
    ).order_by(
        ActivityProgress.points_earned.desc()
    ).limit(10).all()

    # Formata os dados para o frontend
    leaderboard = [
        {
            "rank": index + 1,
            "name": row.name,
            "avatar": row.profile_picture or f"https://ui-avatars.com/api/?name={row.name.replace(' ', '+')}&background=random",
            "points": row.points_earned
        }
        for index, row in enumerate(leaderboard_data)
    ]
    
    return jsonify(leaderboard), 200


@progress_bp.route('/<int:activity_id>/analytics', methods=['GET'])
@jwt_required()
@cross_origin()
def get_analytics(activity_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'professor':
        return jsonify({"message": "Acesso negado."}), 403
    
    activity = Activity.query.get(activity_id)
    if not activity or activity.professor_id != user.id:
        return jsonify({"message": "Você não tem permissão para ver a análise desta atividade."}), 403

    # Buscamos os dados de progresso e também o User para pegar o total de pontos globais
    progress_data = db.session.query(
        User,
        ActivityProgress
    ).join(
        ActivityProgress, User.id == ActivityProgress.student_id
    ).filter(
        ActivityProgress.activity_id == activity_id
    ).all()
    
    # --- LÓGICA DE ANÁLISE ATUALIZADA E EXPANDIDA ---
    students_analytics = []
    total_score_sum = 0

    for student_user, progress in progress_data:
        # Contagem de respostas corretas e incorretas
        correct_answers = StudentResponse.query.filter_by(student_id=student_user.id, activity_id=activity_id, is_correct=True).count()
        wrong_answers = StudentResponse.query.filter_by(student_id=student_user.id, activity_id=activity_id, is_correct=False).count()
        total_answers = correct_answers + wrong_answers
        
        # NOVO: Cálculo da taxa de acerto
        accuracy = (correct_answers / total_answers * 100) if total_answers > 0 else 0

        # NOVO: Contagem de mensagens no chat (a ser implementado com a tabela de chat)
        chat_messages = 0 # Placeholder, pois a tabela ChatMessages ainda não existe

        # NOVO: Cálculo do nível do aluno (usando a mesma função que já temos)
        # Supondo que o nível geral do aluno é baseado em todos os pontos que ele já ganhou.
        # Precisaríamos de uma coluna `total_points` na tabela User para isso.
        # Por enquanto, vamos calcular o nível baseado nos pontos desta atividade.
        level_info = calculate_level(progress.points_earned)

        # Contagem de visualizações da narrativa
        narrative_views = EventLog.query.filter(
            EventLog.user_id == student_user.id,
            EventLog.event_type == 'narrative_viewed',
            EventLog.event_data['activity_id'].astext == str(activity_id)
        ).count()
        
        total_score_sum += progress.points_earned or 0

        students_analytics.append({
            "id": student_user.id,
            "name": student_user.name,
            "status": progress.status,
            "points": progress.points_earned,
            "level": level_info['level'], # NOVO
            "accuracy": accuracy, # NOVO
            "chat_messages": chat_messages, # NOVO (Placeholder)
            "total_answers": total_answers,
            "correct_answers": correct_answers,
            "wrong_answers": wrong_answers,
            "narrative_views": narrative_views
        })

    total_students = len(progress_data)
    completed_students = sum(1 for _, progress in progress_data if progress.status == 'completed')
    
    analytics = {
        "completionRate": (completed_students / total_students * 100) if total_students > 0 else 0,
        "averageScore": (total_score_sum / total_students) if total_students > 0 else 0,
        "students": students_analytics
    }
    
    return jsonify(analytics), 200


@progress_bp.route('/<int:activity_id>/store-items', methods=['GET'])
@jwt_required()
@cross_origin()
def get_store_items(activity_id):
    # No futuro, isso viria do banco de dados e poderia ser configurado pelo professor.
    # Por enquanto, manteremos os dados mockados, pois não há um modelo para eles.
    dummy_store_items = [
        { "id": 1, "name": "Dica Extra", "price": 50, "icon": "💡" },
        { "id": 2, "name": "Pular Questão", "price": 200, "icon": "⏩" },
        { "id": 3, "name": "Segunda Chance", "price": 150, "icon": "❤️" }
    ]
    return jsonify(dummy_store_items), 200

@progress_bp.route('/<int:activity_id>/update', methods=['POST'])
@jwt_required()
@cross_origin()
def update_activity_progress(activity_id):
    """
    Recebe os pontos ganhos por um aluno em uma atividade e atualiza o progresso.
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'aluno':
        return jsonify({"message": "Apenas alunos podem atualizar o progresso."}), 403

    data = request.get_json()
    points_to_add = data.get('points')

    if points_to_add is None:
        return jsonify({"message": "Pontos não fornecidos."}), 400

    try:
        # Garante que os pontos recebidos sejam tratados como um número inteiro
        points_to_add = int(points_to_add)
    except (ValueError, TypeError):
        return jsonify({"message": "Valor de pontos inválido."}), 400
    
    # 1. Busca a atividade primeiro para obter o class_id
    activity = Activity.query.get(activity_id)
    if not activity or not activity.class_id:
        return jsonify({"message": "Atividade ou turma associada não encontrada."}), 404

       # --- INÍCIO DA CORREÇÃO ---
    # Busca o progresso existente DENTRO de uma transação para evitar race conditions
    try:
        progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()

        if not progress:
            # Se não existe, CRIA um novo com os pontos atuais
            progress = ActivityProgress(
                student_id=user.id,
                activity_id=activity_id,
                class_id=activity.class_id,
                points_earned=points_to_add, # Apenas os pontos novos
                attempts=1,
                status='in_progress'
            )
            db.session.add(progress)
        else:
            # Se já existe, SOMA os novos pontos
            progress.points_earned += points_to_add
        
        db.session.commit()
        
        return jsonify({
            "message": "Progresso atualizado com sucesso.",
            "new_total_points": progress.points_earned
        }), 200

    except Exception as e:
        db.session.rollback()
        # current_app.logger.error(f"Erro ao atualizar progresso para user {current_user_id} na atividade {activity_id}: {str(e)}")
        return jsonify({"message": "Erro interno ao salvar o progresso."}), 500

# --- ROTA DA ROLETA (VERSÃO CORRIGIDA) ---
@progress_bp.route('/<int:activity_id>/spin', methods=['POST'])
@jwt_required()
def spin_roulette_for_activity(activity_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role != 'aluno':
        return jsonify({"message": "Apenas alunos podem girar a roleta."}), 403

    progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()

    if not progress:
        activity = Activity.query.get(activity_id)
        if not activity:
            return jsonify({"message": "Atividade não encontrada."}), 404
        progress = ActivityProgress(student_id=user.id, activity_id=activity_id, class_id=activity.class_id)
        db.session.add(progress)

    #if progress.last_spin_date:
    #    if datetime.utcnow() < progress.last_spin_date + timedelta(days=1):
    #        return jsonify({"message": "Você já girou a roleta hoje para esta atividade. Volte amanhã!"}), 403

    prizes = [
        {"type": "xp", "value": 50, "label": "50 XP"},
        {"type": "xp", "value": 100, "label": "100 XP"},
        {"type": "xp", "value": 200, "label": "200 XP"},
        {"type": "title", "value": "Sortudo", "label": "Título: Sortudo"},
        {"type": "avatar", "value": "/avatars/avatar_special.png", "label": "Avatar Raro!"},
    ]
    prize = random.choice(prizes)

    if prize['type'] == 'xp':
        # --- INÍCIO DA CORREÇÃO ---
        # Garante que, se os pontos forem None, usamos 0 como base
        current_points = progress.points_earned or 0
        progress.points_earned = current_points + prize['value']
        # --- FIM DA CORREÇÃO ---

    progress.last_spin_date = datetime.utcnow()
    
    # --- NOVO: Salvar o registro do prêmio ---
    new_win = RouletteWin(
        user_id=user.id,
        activity_id=activity_id,
        prize_label=prize['label']
    )
    db.session.add(new_win)
    # ------------------------------------

    db.session.commit()

    return jsonify({
        "message": f"Você ganhou {prize['label']}!", 
        "prize": prize,
        "new_total_points": progress.points_earned
    }), 200

# --- NOVA ROTA PARA BUSCAR OS VENCEDORES ---
@progress_bp.route('/<int:activity_id>/roulette-winners', methods=['GET'])
@jwt_required()
@cross_origin()
def get_roulette_winners(activity_id):
    """Retorna os últimos 5 vencedores da roleta para uma atividade específica."""
    
    winners = db.session.query(
        User.name,
        RouletteWin.prize_label
    ).join(
        User, User.id == RouletteWin.user_id
    ).filter(
        RouletteWin.activity_id == activity_id
    ).order_by(
        RouletteWin.timestamp.desc()
    ).limit(5).all()

    # Formata os dados para o frontend
    winners_data = [
        {
            "userName": row.name,
            "prize": row.prize_label
        }
        for row in winners
    ]
    
    return jsonify(winners_data), 200
