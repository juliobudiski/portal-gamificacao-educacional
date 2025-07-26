from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, current_user
from .. import db
from ..models import ActivityProgress, EventLog

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/activity/<int:activity_id>', methods=['GET'])
@jwt_required()
def get_activity_analytics(activity_id):
    # Implementação futura
    return jsonify({"message": "Endpoint de analytics em desenvolvimento"}), 200