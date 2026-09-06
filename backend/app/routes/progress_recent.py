from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from flask_cors import cross_origin
from ..models import db, User, Purchase, UserUnlockedMedal, Medal

# This logic will be injected into progress.py
@progress_bp.route('/<int:activity_id>/recent-events', methods=['GET'])
@jwt_required()
@cross_origin()
def get_recent_events(activity_id):
    """
    [Arquitetura]
    Por que: Isolar a lógica complexa de agregação, junção e mescla temporal de múltiplos tipos de eventos 
    (compras, medalhas) no ProgressService evita vazamento do modelo de persistência na camada HTTP.
    """
    from ..services.progress_service import ProgressService
    return jsonify(ProgressService.get_recent_events_service(activity_id)), 200
