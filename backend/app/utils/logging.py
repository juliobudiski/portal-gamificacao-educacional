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

        # Trata segurança quando invocado fora do contexto de requisição HTTP (ex: testes de serviços ou tarefas assíncronas)
        from flask import has_request_context
        ip_addr = request.remote_addr if has_request_context() else "127.0.0.1"
        u_agent = request.headers.get("User-Agent") if has_request_context() else "system_service"

        event = EventLog(
            user_id=user_id,
            activity_id=activity_id,
            section=section,
            action=action,
            details=details,
            ip_address=ip_addr,
            user_agent=u_agent
        )
        db.session.add(event)
        # Observação: Não realizar db.session.commit() isolado aqui para não cortar
        # nem dar rollback na transação de negócio da operação chamadora
    except Exception as e:
        current_app.logger.error(f"Falha ao registrar evento de log do sistema: {e}")
