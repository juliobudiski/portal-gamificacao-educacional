from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from flask_cors import cross_origin
from ..models import db, User, Purchase, UserUnlockedMedal, Medal

# This logic will be injected into progress.py
@progress_bp.route('/<int:activity_id>/recent-events', methods=['GET'])
@jwt_required()
@cross_origin()
def get_recent_events(activity_id):
    """Busca o feed global de eventos recentes da turma na atividade."""
    # Últimas compras
    purchases = db.session.query(
        User.name, Purchase.item_name, Purchase.purchase_date
    ).join(User, User.id == Purchase.user_id)\
     .filter(Purchase.activity_id == activity_id)\
     .order_by(Purchase.purchase_date.desc()).limit(10).all()

    # Últimas medalhas ganhas (filtra activity_id se houver, mas a maioria não tem, então filtra pela turma)
    # Como UserUnlockedMedal pode não ter activity_id, buscamos as medalhas da atividade em si
    medals = db.session.query(
        User.name, Medal.name.label('medal_name'), UserUnlockedMedal.unlocked_at
    ).join(User, User.id == UserUnlockedMedal.user_id)\
     .join(Medal, Medal.id == UserUnlockedMedal.medal_id)\
     .filter(Medal.activity_id == activity_id)\
     .order_by(UserUnlockedMedal.unlocked_at.desc()).limit(10).all()

    events = []
    for p in purchases:
        events.append({
            "type": "purchase",
            "user": p.name,
            "description": f"comprou '{p.item_name}'",
            "timestamp": p.purchase_date
        })
        
    for m in medals:
        events.append({
            "type": "medal",
            "user": m.name,
            "description": f"desbloqueou a medalha '{m.medal_name}'",
            "timestamp": m.unlocked_at
        })
        
    # Ordena todos e pega os top 10
    events.sort(key=lambda x: x["timestamp"], reverse=True)
    events = events[:15]
    
    # Serializa timestamp
    for e in events:
        e["timestamp"] = e["timestamp"].isoformat() if e["timestamp"] else None
        
    return jsonify(events), 200
