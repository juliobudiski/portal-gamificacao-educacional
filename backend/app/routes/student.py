# backend/app/routes/student.py

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
# Importe o SQLAlchemy para usar funções de join mais avançadas
from .. import db 
from ..models import User, Class, Enrollment, Activity, ActivityProgress

student_bp = Blueprint('student', __name__)

@student_bp.route('/dashboard', methods=['GET'])
@jwt_required()
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

    # --- Lógica de Performance (pode ser aprimorada no futuro) ---
    performance_data = {
        "totalPoints": 1250, # Exemplo mockado
        "level": 8,        # Exemplo mockado
        "achievements": 12 # Exemplo mockado
    }

    dashboard_data = {
        "classes": classes_data,
        "pendingActivities": pending_activities_data,
        "performance": performance_data
    }

    return jsonify(dashboard_data), 200