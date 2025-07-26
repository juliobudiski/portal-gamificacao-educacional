# backend/app/routes/student.py

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
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

    # Buscar atividades pendentes (exemplo simples)
    # Uma lógica mais complexa poderia verificar o status em ActivityProgress
    pending_activities = Activity.query.join(Enrollment, Activity.class_id == Enrollment.class_id).filter(Enrollment.student_id == user.id).all()
    
    pending_activities_data = []
    for activity in pending_activities:
        pending_activities_data.append({
            "id": activity.id,
            "title": activity.title,
            "class_name": activity.class_obj.name if activity.class_obj else "N/A"
        })

    # Dados de performance (exemplo mockado)
    performance_data = {
        "totalPoints": 1250,
        "level": 8,
        "achievements": 12
    }

    dashboard_data = {
        "classes": classes_data,
        "pendingActivities": pending_activities_data,
        "performance": performance_data
    }

    return jsonify(dashboard_data), 200

