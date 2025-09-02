# backend/app/utils/logging.py
import logging

def configure_logging(app):
    app.logger.setLevel(logging.DEBUG)
    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG)
    app.logger.addHandler(handler)


from flask import request, current_app
from ..models import db, EventLog

def _log_system_event(user_id, action, section='activity_management', details=None, activity_id=None):
    """
    Cria e salva um evento de log do sistema de forma centralizada.
    O commit é feito de forma independente para garantir o registro do evento.
    """
    try:
        # Garante que 'details' seja sempre um dicionário
        if details is None:
            details = {}

        event = EventLog(
            user_id=user_id,
            activity_id=activity_id,
            section=section,
            action=action,
            details=details,
            ip_address=request.remote_addr,
            user_agent=request.headers.get("User-Agent")
        )
        db.session.add(event)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        # Usamos o logger da aplicação Flask para registrar falhas críticas no log
        current_app.logger.error(f"Falha CRÍTICA ao registrar evento de log do sistema: {e}")
