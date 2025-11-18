# backend/app/routes/student.py

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
# Importe o SQLAlchemy para usar funções de join mais avançadas
from .. import db 
from ..models import User, Class, Enrollment, Activity, ActivityProgress, UserUnlockedMedal
from flask_cors import cross_origin


student_bp = Blueprint('student', __name__)

def calculate_global_level(total_xp):
    """Calcula o nível global do aluno (curva mais lenta)."""
    if total_xp is None:
        total_xp = 0
        
    level = 1
    xp_needed = 250 # Nível 1 para 2 -> 250 XP
    xp_cumulative = 0

    while total_xp >= xp_needed:
        total_xp -= xp_needed
        xp_cumulative += xp_needed
        level += 1
        xp_needed = int(xp_needed * 1.5) # Próximo nível custa 50% a mais
    
    return {
        "level": level,
        "xp_to_next_level": xp_needed,
        "xp_current": total_xp,
        "xp_cumulative": xp_cumulative
    }

@student_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@cross_origin()
def student_dashboard():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'aluno':
        return jsonify({"message": "Acesso não autorizado"}), 403

    # Buscar turmas em que o aluno está matriculado
    enrolled_classes = Class.query.join(Enrollment).filter(Enrollment.student_id == user.id).all()
    
    classes_data = []
    for cls in enrolled_classes:
        classes_data.append({
            "id": cls.id,
            "name": cls.name,
            "description": cls.description,
            "professor_name": cls.professor.name,
            "activities_count": len(cls.assigned_activities)
        })
    # --- NOVA LÓGICA PARA BUSCAR ATIVIDADES PENDENTES ---

    # 1. Buscamos todas as atividades das turmas em que o aluno está matriculado.
    #    Usamos um LEFT JOIN com ActivityProgress para pegar o status do progresso,
    #    mesmo que o aluno ainda não tenha começado a atividade (nesse caso, progress será None).
    pending_activities_query = db.session.query(
        Activity, 
        ActivityProgress.status
    ).select_from(Activity).join(
        Enrollment, Activity.class_id == Enrollment.class_id
    ).outerjoin(
        ActivityProgress, 
        db.and_(
            ActivityProgress.activity_id == Activity.id,
            ActivityProgress.student_id == user.id
        )
    ).filter(
        Enrollment.student_id == user.id
    ).all()

    pending_activities_data = []
    for activity, progress_status in pending_activities_query:
        # 2. Para cada atividade, montamos o dicionário com os campos que o frontend precisa.
        pending_activities_data.append({
            "id": activity.id,
            "title": activity.title,
            "class_name": activity.class_obj.name if activity.class_obj else "N/A",
            
            # 3. Adicionamos o 'expiresAt' que estava faltando
            "expiresAt": activity.expires_at.isoformat() if activity.expires_at else None,
            
            # 4. Criamos dinamicamente o campo 'is_completed'
            "is_completed": progress_status == 'completed'
        })

    # Busca o nível global usando a função auxiliar
    global_level_info = calculate_global_level(user.global_xp)
    
    # Busca o total de medalhas (conquistas)
    total_achievements = UserUnlockedMedal.query.filter_by(user_id=user.id).count()
    
    # --- Lógica de Performance (pode ser aprimorada no futuro) ---
    performance_data = {
        "global_level_info": global_level_info, # Objeto com level, xp_current, etc.
        "total_achievements": total_achievements # Contagem real
    }

    dashboard_data = {
        "classes": classes_data,
        "pendingActivities": pending_activities_data,
        "performance": performance_data
    }

    return jsonify(dashboard_data), 200


@student_bp.route('/activities/all', methods=['GET'])
@jwt_required()
@cross_origin()
def get_all_student_activities():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'aluno':
        return jsonify({"message": "Acesso não autorizado"}), 403

    # 1. Query Complexa:
    # Busca Atividades das turmas onde o aluno tem matrícula
    # Faz Left Join com ActivityProgress para pegar dados de quem já começou/terminou
    activities_query = db.session.query(
        Activity,
        ActivityProgress
    ).join(
        Enrollment, Activity.class_id == Enrollment.class_id
    ).outerjoin(
        ActivityProgress,
        db.and_(
            ActivityProgress.activity_id == Activity.id,
            ActivityProgress.student_id == user.id
        )
    ).filter(
        Enrollment.student_id == user.id
    ).all()

    activities_list = []

    for activity, progress in activities_query:
        # --- LÓGICA DE CÁLCULO DE PROGRESSO (NOVA) ---
        total_steps = 0
        completed_steps_count = 0
        percentage = 0

        # 1. Conta quantos passos existem no design da atividade
        if activity.gamification_design and 'progression_path' in activity.gamification_design:
            total_steps = len(activity.gamification_design['progression_path'])

        # 2. Conta quantos passos o aluno completou (se houver registro de progresso)
        if progress and progress.completed_steps:
            completed_steps_count = len(progress.completed_steps)

        # 3. Calcula a porcentagem (regra de 3 simples)
        if total_steps > 0:
            percentage = int((completed_steps_count / total_steps) * 100)
        
        # Trava em 100% se o status já estiver explicitamente como concluído 
        # (Isso evita casos onde o arredondamento daria 99% ou algo assim)
        if progress and progress.status == 'completed':
            percentage = 100
        # -----------------------------------------------

        # Tenta extrair o XP de recompensa das regras da atividade
        xp_reward = 0
        if activity.gamification_rules and 'reward_xp' in activity.gamification_rules:
             xp_reward = int(activity.gamification_rules['reward_xp'])
        elif activity.rewards_offered and 'completion_xp' in activity.rewards_offered:
             xp_reward = int(activity.rewards_offered['completion_xp'])
        else:
            xp_reward = 100 

        activities_list.append({
            "id": activity.id,
            "title": activity.title,
            "description": activity.description,
            "class_name": activity.class_obj.name if activity.class_obj else "Turma Desconhecida",
            "expiresAt": activity.expires_at.isoformat() if activity.expires_at else None,
            
            # Dados de Progresso (pode ser None se o aluno nunca abriu a atividade)
            "is_completed": progress.status == 'completed' if progress else False,
            "xp_earned": progress.total_xp_earned if progress else 0,
            "xp_reward": xp_reward,
            "grade": progress.points_earned if progress else None,
            
            # CAMPO NOVO
            "progress_percentage": percentage 
        })

    return jsonify(activities_list), 200