# backend/app/routes/progress.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity # Mude de current_user para get_jwt_identity
from ..models import User, ActivityProgress # Importe o User

progress_bp = Blueprint('progress', __name__)

@progress_bp.route('/<int:activity_id>', methods=['GET'])
@jwt_required()
def get_activity_progress(activity_id):
    # É melhor pegar o ID e depois o objeto usuário
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    progress = ActivityProgress.query.filter_by(
        student_id=user.id,
        activity_id=activity_id
    ).first()
    
    # --- CORREÇÃO AQUI ---
    if not progress:
        # Se não houver progresso, retorne um objeto padrão "não iniciado"
        default_progress = {
            "points_earned": 0,
            "status": "not_started",
            "attempts": 0,
            # Adicione outros campos que seu frontend possa esperar
            "level": 1,
            "xp": 0,
            "xpForNextLevel": 100 
        }
        return jsonify(default_progress), 200 # Retorne 200 OK!
    
    # Se encontrou, retorne o progresso normal
    return jsonify({
        "points_earned": progress.points_earned,
        "status": progress.status,
        "attempts": progress.attempts
    }), 200

@progress_bp.route('/<int:activity_id>/store-items', methods=['GET'])
@jwt_required()
def get_store_items(activity_id):
    # Por enquanto, vamos retornar uma lista de itens de mentira (mockada).
    # No futuro, você buscaria isso do banco de dados.
    dummy_store_items = [
        { "id": 1, "name": "Dica Extra", "price": 50, "icon": "💡" },
        { "id": 2, "name": "Pular Questão", "price": 200, "icon": "⏩" },
        { "id": 3, "name": "Segunda Chance", "price": 150, "icon": "❤️" }
    ]
    return jsonify(dummy_store_items), 200

# --- FAÇA O MESMO PARA O LEADERBOARD E ANALYTICS ---

@progress_bp.route('/<int:activity_id>/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard(activity_id):
    # Mock para o leaderboard
    dummy_leaderboard = [
        { "rank": 1, "name": "Julio (Você)", "points": 1500, "avatar": "/avatars/avatar1.png" },
        { "rank": 2, "name": "Ana", "points": 1250, "avatar": "/avatars/avatar2.png" },
        { "rank": 3, "name": "Beto", "points": 1100, "avatar": "/avatars/avatar3.png" },
    ]
    return jsonify(dummy_leaderboard), 200

@progress_bp.route('/<int:activity_id>/analytics', methods=['GET'])
@jwt_required()
def get_analytics(activity_id):
    # Mock para analytics do professor
    dummy_analytics = {
        "completionRate": 75,
        "averageScore": 850,
        "students": [
            { "id": 1, "name": "Julio", "status": "Concluído" },
            { "id": 2, "name": "Ana", "status": "Concluído" },
            { "id": 3, "name": "Beto", "status": "Em Andamento" },
        ]
    }
    return jsonify(dummy_analytics), 200