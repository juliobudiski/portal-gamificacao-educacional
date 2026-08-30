# backend/app/routes/student.py

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
# Importe o SQLAlchemy para usar funções de join mais avançadas
from .. import db 
from ..models import User, Class, Enrollment, Activity, ActivityProgress, UserUnlockedMedal
from flask_cors import cross_origin


from ..services.student_service import StudentService

student_bp = Blueprint('student', __name__)

@student_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@cross_origin()
def student_dashboard():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'aluno':
        return jsonify({"message": "Acesso não autorizado"}), 403

    dashboard_data = StudentService.get_dashboard_data(user)
    return jsonify(dashboard_data), 200


@student_bp.route('/activities/all', methods=['GET'])
@jwt_required()
@cross_origin()
def get_all_student_activities():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'aluno':
        return jsonify({"message": "Acesso não autorizado"}), 403

    activities_list = StudentService.get_all_activities(user)
    return jsonify(activities_list), 200