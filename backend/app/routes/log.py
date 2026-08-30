# backend/app/routes/log.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from ..services.log_service import LogService
log_bp = Blueprint('log', __name__)

@log_bp.route('/event', methods=['POST'])
@cross_origin()
@jwt_required()
def log_event():
    """
    Endpoint para logging centralizado.
    Aceita um único evento {section, action, details, activity_id?}
    ou uma lista de eventos em {events: [...] } (batch logging).
    """
    current_user_id = get_jwt_identity()
    data = request.get_json()

    result, status = LogService.log_events(current_user_id, data, request.remote_addr, request.headers.get("User-Agent"))
    return jsonify(result), status
