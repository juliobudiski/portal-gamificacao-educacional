# backend/app/tasks.py
from datetime import datetime, timedelta
from .extensions import db, scheduler
from .models import Activity
import logging

logger = logging.getLogger(__name__)

def register_tasks(app):
    """Registra as tarefas agendadas no contexto da aplicação."""
    
    @scheduler.task('interval', id='delete_expired_drafts', hours=24)
    def delete_expired_drafts():
        """
        Tarefa agendada: Remove rascunhos não modificados há mais de 7 dias.
        Roda a cada 24 horas.
        """
        with app.app_context():
            try:
                expiration_date = datetime.utcnow() - timedelta(days=7)
                
                # Deleta rascunhos antigos
                deleted_count = Activity.query.filter(
                    Activity.is_draft == True,
                    Activity.updated_at < expiration_date
                ).delete()
                
                db.session.commit()
                
                if deleted_count > 0:
                    logger.info(f"[Auto-Cleanup] {deleted_count} rascunhos expirados foram removidos.")
                else:
                    logger.info("[Auto-Cleanup] Nenhum rascunho expirado encontrado hoje.")
                    
            except Exception as e:
                db.session.rollback()
                logger.error(f"[Auto-Cleanup] Erro ao limpar rascunhos: {str(e)}")