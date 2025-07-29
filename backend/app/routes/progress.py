# backend/app/routes/progress.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, User, ActivityProgress, Activity
from sqlalchemy.orm import joinedload
from flask_cors import cross_origin 
progress_bp = Blueprint('progress', __name__)

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
    
    if not progress:
        # Se o aluno ainda não interagiu, criamos um registro de progresso inicial.
        # Isso garante que a página sempre tenha dados para exibir.
        try:
            progress = ActivityProgress(student_id=user.id, activity_id=activity_id, status='not_started')
            db.session.add(progress)
            db.session.commit()
        except Exception: # Se houver erro (ex: activity_id inválido), retorna o padrão
            default_progress = {
                "points_earned": 0, "status": "not_started", "attempts": 0,
                "level": 1, "xp": 0, "xpForNextLevel": 100 
            }
            return jsonify(default_progress), 200

    # Retorna o progresso real do banco de dados
    return jsonify({
        "points_earned": progress.points_earned,
        "status": progress.status,
        "attempts": progress.attempts,
        # Adicione aqui a lógica real de level/xp se for implementada no futuro
        "level": 1, 
        "xp": progress.points_earned, # Exemplo: XP é igual aos pontos
        "xpForNextLevel": 100 
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
    
    # Busca a atividade para garantir que o professor é o dono
    activity = Activity.query.get(activity_id)
    if not activity or activity.professor_id != user.id:
        return jsonify({"message": "Você não tem permissão para ver a análise desta atividade."}), 403

    # Busca os dados de progresso dos alunos para esta atividade
    progress_data = db.session.query(
        User.id,
        User.name,
        ActivityProgress.status,
        ActivityProgress.points_earned
    ).join(
        ActivityProgress, User.id == ActivityProgress.student_id
    ).filter(
        ActivityProgress.activity_id == activity_id
    ).all()
    
    total_students = len(progress_data)
    completed_students = sum(1 for p in progress_data if p.status == 'completed')
    
    analytics = {
        "completionRate": (completed_students / total_students * 100) if total_students > 0 else 0,
        "averageScore": sum(p.points_earned for p in progress_data) / total_students if total_students > 0 else 0,
        "students": [
            { "id": p.id, "name": p.name, "status": p.status }
            for p in progress_data
        ]
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
        current_app.logger.error(f"Erro ao atualizar progresso para user {current_user_id} na atividade {activity_id}: {str(e)}")
        return jsonify({"message": "Erro interno ao salvar o progresso."}), 500
    # --- FIM DA CORREÇÃO ---