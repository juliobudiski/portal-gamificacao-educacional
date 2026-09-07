"""
Módulo de Rotas de Medalhas (Medals)
Responsável por listar todas as medalhas disponíveis no sistema e 
permitir que os usuários consultem as medalhas que já desbloquearam.
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Medal
from ..services.medal_service import MedalService

medals_bp = Blueprint('medals', __name__)

@medals_bp.route('', methods=['GET'])
@jwt_required()
def get_all_medals():
    """
    Retorna o catálogo completo de medalhas da plataforma.
    """
    medals = Medal.query.order_by(Medal.type, Medal.name).all()
    medals_data = [{
        "id": medal.id,
        "name": medal.name,
        "description": medal.description,
        "imageUrl": f"/{medal.image_url.lstrip('/')}" if medal.image_url else "/medals/default.webp",
        "type": medal.type,
        "notes": medal.notes
    } for medal in medals]
    
    return jsonify(medals_data), 200

@medals_bp.route('/my-unlocked', methods=['GET'])
@jwt_required()
def get_my_unlocked_medals():
    """
    Retorna os IDs das medalhas desbloqueadas pelo usuário (compatível com filtros por activity_id).
    """
    user_id = get_jwt_identity()
    activity_id = request.args.get('activity_id', type=int)
    return jsonify(MedalService.get_my_unlocked_medals_service(user_id, activity_id)), 200

@medals_bp.route('/user-summary', methods=['GET'])
@jwt_required()
def get_user_badges_summary():
    """
    Retorna o catálogo completo com status 'is_unlocked' e 'unlocked_at' para o Dashboard.
    """
    user_id = get_jwt_identity()
    return jsonify(MedalService.get_user_badges_full(user_id)), 200
