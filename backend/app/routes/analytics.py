# backend/app/routes/analytics.py

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.analytics_service import AnalyticsService

# O prefixo registrado no __init__.py é '/api/analytics'
analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/professor/filters', methods=['GET'])
@jwt_required()
def get_professor_filters():
    current_user_id = get_jwt_identity()
    result, error, status = AnalyticsService.get_professor_filters(current_user_id)
    if error:
        return jsonify(error), status
    return jsonify(result), status


@analytics_bp.route('/professor/performance', methods=['GET'])
@jwt_required()
def get_student_performance():
    class_id = request.args.get('class_id')
    activity_id = request.args.get('activity_id')
    search_term = request.args.get('search')
    
    result, error, status = AnalyticsService.get_student_performance(class_id, activity_id, search_term)
    if error:
        return jsonify(error), status
    return jsonify(result), status
    
@analytics_bp.route('/feedback/check-eligibility', methods=['GET'])
@jwt_required()
def check_feedback_eligibility():
    user_id = get_jwt_identity()
    result, error, status = AnalyticsService.check_feedback_eligibility(user_id)
    if error:
        return jsonify(error), status
    return jsonify(result), status

@analytics_bp.route('/feedback/submit', methods=['POST'])
@jwt_required()
def submit_feedback():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    result, error, status = AnalyticsService.submit_feedback(user_id, data)
    if error:
        return jsonify(error), status
    return jsonify(result), status