"""
Serviço de Telemetria e Logs (LogService)
Responsável por salvar os eventos analíticos gerados no frontend,
suportando tanto o envio individual quanto o envio em lote (batching).
Esses dados alimentam os gráficos e dashboards do painel de administração.
"""

from ..models import db, EventLog

class LogService:
    @staticmethod
    def log_events(current_user_id, data, remote_addr, user_agent):
        """
        Recebe um payload contendo um único evento ou uma lista deles ("events": []),
        valida a integridade (exigindo section e action) e persiste no banco usando add_all
        para otimização de performance.
        """
        if not data:
            return {"error": "Nenhum dado enviado"}, 400

        events_to_save = []

        # Normaliza o payload para que seja sempre uma lista iterável
        if "events" in data and isinstance(data["events"], list):
            events = data["events"]
        else:
            events = [data]

        for ev in events:
            section = ev.get("section")
            action = ev.get("action")
            details = ev.get("details", {})
            activity_id = ev.get("activity_id")

            if not section or not action:
                return {"error": "Cada evento precisa de 'section' e 'action'"}, 400
            
            new_event = EventLog(
                user_id=current_user_id,
                activity_id=activity_id,
                section=section,
                action=action,
                details=details,
                ip_address=remote_addr,
                user_agent=user_agent
            )
            events_to_save.append(new_event)
        
        try:
            # add_all é muito mais performático que adicionar um a um e commitar
            db.session.add_all(events_to_save)
            db.session.commit()
            return {"message": f"{len(events_to_save)} evento(s) registrado(s) com sucesso"}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
