from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from ..services.contact_service import ContactService

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/', methods=['POST'])
def send_message():
    data = request.get_json()
    
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
        if current_user_id:
            user_id = current_user_id
    except Exception as e:
        from flask import current_app
        current_app.logger.debug(f"Falha opcional de JWT em contact: {e}")

    result, status = ContactService.send_message(user_id, data)
    return jsonify(result), status