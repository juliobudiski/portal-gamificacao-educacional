# backend/app/routes/log.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from .. import db
from ..models import EventLog, Activity

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

    if not data:
        return jsonify({"error": "Nenhum dado enviado"}), 400

    events_to_save = []

    # --- Suporte a batch logging ---
    if "events" in data and isinstance(data["events"], list):
        events = data["events"]
    else:
        # Se não for batch, trata como evento único
        events = [data]

    for ev in events:
        section = ev.get("section")
        action = ev.get("action")
        details = ev.get("details", {})
        activity_id = ev.get("activity_id")

        # Validação mínima
        if not section or not action:
            return jsonify({"error": "Cada evento precisa de 'section' e 'action'"}), 400

        new_event = EventLog(
            user_id=current_user_id,
            activity_id=activity_id,
            section=section,
            action=action,
            details=details,
            ip_address=request.remote_addr,
            user_agent=request.headers.get("User-Agent")
        )
        events_to_save.append(new_event)

    try:
        db.session.add_all(events_to_save)
        db.session.commit()
        return jsonify({"message": f"{len(events_to_save)} evento(s) registrado(s) com sucesso"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
