# backend/app/routes/log.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from .. import db
from ..models import db, EventLog, Activity, User
from datetime import datetime
from sqlalchemy.orm.attributes import flag_modified
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
        # --- LÓGICA DE RECOMPENSA ATUALIZADA AQUI ---
        if action == 'location_access_granted' and 'latitude' in details:
            user_to_update = User.query.get(current_user_id)
            if user_to_update:
                # Atualiza a localização no perfil do usuário
                user_to_update.last_known_latitude = details.get('latitude')
                user_to_update.last_known_longitude = details.get('longitude')
                user_to_update.last_location_update = datetime.utcnow()

                # Define o NOVO avatar especial que será concedido (avatar3)
                special_avatar = {
                    "url": "/avatars/avatar3.webp", # <-- AVATAR ATUALIZADO
                    "name": "Explorador",           # <-- NOME ATUALIZADO
                    "type": "special" 
                }

                if user_to_update.unlocked_global_avatars is None:
                    user_to_update.unlocked_global_avatars = []

                # Adiciona o avatar apenas se ele ainda não existir na lista
                if not any(avatar['url'] == special_avatar['url'] for avatar in user_to_update.unlocked_global_avatars):
                    user_to_update.unlocked_global_avatars.append(special_avatar)
                    flag_modified(user_to_update, "unlocked_global_avatars")
        # --- FIM DA LÓGICA ATUALIZADA ---
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
    # --- INÍCIO DA LÓGICA DE RECOMPENSA ---
    if action == 'location_access_granted' and 'latitude' in details:
        user_to_update = User.query.get(current_user_id)
        if user_to_update:
            user_to_update.last_known_latitude = details.get('latitude')
            user_to_update.last_known_longitude = details.get('longitude')
            user_to_update.last_location_update = datetime.utcnow()

            # Define o avatar especial que será concedido
            special_avatar = {
                "url": "/avatars/special/avatar_map_location.webp",
                "name": "Explorador Global",
                "type": "special" 
            }

            # Garante que a lista de avatares exista
            if user_to_update.unlocked_global_avatars is None:
                user_to_update.unlocked_global_avatars = []

            # Verifica se o avatar já foi concedido para não duplicar
            if not any(avatar['url'] == special_avatar['url'] for avatar in user_to_update.unlocked_global_avatars):
                user_to_update.unlocked_global_avatars.append(special_avatar)
                # Notifica o SQLAlchemy que o campo JSON foi modificado
                flag_modified(user_to_update, "unlocked_global_avatars")
    # --- FIM DA LÓGICA DE RECOMPENSA --
    try:
        db.session.add_all(events_to_save)
        db.session.commit()
        return jsonify({"message": f"{len(events_to_save)} evento(s) registrado(s) com sucesso"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
