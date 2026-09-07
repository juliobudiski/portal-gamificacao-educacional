"""
Serviço de Contato (ContactService)
Responsável por abstrair as regras e persistência de mensagens enviadas
pelos usuários na página de contato do portal.
"""

import sys
import traceback
from flask import current_app
from app import db
from app.models import ContactMessage
from app.utils.email_sender import send_html_email

class ContactService:
    @staticmethod
    def send_message(user_id, data):
        """
        Valida os campos obrigatórios e salva uma nova mensagem no banco de dados.
        Se user_id for fornecido (usuário logado), ele será vinculado, 
        senão será tratado como um visitante anônimo.
        O envio de e-mail de notificação/confirmação é desacoplado e protegido
        por fail-safe: falhas no SMTP ou no serviço de e-mail não impedem o registro.
        """
        if not data or not isinstance(data, dict):
            return {"error": "Dados inválidos."}, 400

        # Validação simples de requisitos mínimos
        message_content = data.get('message', '').strip() if isinstance(data.get('message'), str) else ''
        email = data.get('email', '').strip() if isinstance(data.get('email'), str) else ''
        name = data.get('name', 'Anônimo').strip() if isinstance(data.get('name'), str) else 'Anônimo'
        subject = data.get('subject', 'Sem Assunto').strip() if isinstance(data.get('subject'), str) else 'Sem Assunto'

        if not message_content or not email:
            return {"error": "Campos obrigatórios faltando."}, 400

        try:
            new_message = ContactMessage(
                user_id=user_id,
                name=name or 'Anônimo',
                email=email,
                subject=subject or 'Sem Assunto',
                message=message_content
            )

            db.session.add(new_message)
            db.session.commit()
            saved_id = new_message.id
        except Exception as db_err:
            db.session.rollback()
            err_str = str(db_err)
            # Se o erro for coluna 'status' ou 'access_code' inexistente no banco legado do Render:
            if 'column "status"' in err_str or 'column "access_code"' in err_str or 'no such column: status' in err_str:
                try:
                    from sqlalchemy import text
                    # Tenta adicionar as colunas faltantes dinamicamente
                    with db.engine.connect() as conn:
                        try:
                            conn.execute(text("ALTER TABLE contact_messages ADD COLUMN status VARCHAR(50) DEFAULT 'Pendente' NOT NULL;"))
                            conn.commit()
                        except Exception:
                            pass
                        try:
                            conn.execute(text("ALTER TABLE contact_messages ADD COLUMN access_code VARCHAR(100);"))
                            conn.commit()
                        except Exception:
                            pass
                    
                    # Tenta salvar novamente via ORM
                    new_message = ContactMessage(
                        user_id=user_id,
                        name=name or 'Anônimo',
                        email=email,
                        subject=subject or 'Sem Assunto',
                        message=message_content
                    )
                    db.session.add(new_message)
                    db.session.commit()
                    saved_id = new_message.id
                except Exception as retry_err:
                    # Fallback final: INSERT cru apenas nas colunas que sempre existiram
                    db.session.rollback()
                    try:
                        with db.engine.connect() as conn:
                            res = conn.execute(
                                text("""
                                    INSERT INTO contact_messages (user_id, name, email, subject, message, is_read)
                                    VALUES (:user_id, :name, :email, :subject, :message, false)
                                """),
                                {
                                    "user_id": user_id,
                                    "name": name or 'Anônimo',
                                    "email": email,
                                    "subject": subject or 'Sem Assunto',
                                    "message": message_content
                                }
                            )
                            conn.commit()
                            saved_id = getattr(res, 'lastrowid', 1) or 1
                    except Exception as fatal_err:
                        err_trace = traceback.format_exc()
                        sys.stderr.write(f"\n[FATAL DB ERROR IN CONTACT SERVICE]\n{err_trace}\n")
                        sys.stderr.flush()
                        return {
                            "error": "Erro ao salvar a mensagem de contato no banco de dados.",
                            "details": str(fatal_err),
                            "trace": err_trace
                        }, 500
            else:
                err_trace = traceback.format_exc()
                sys.stderr.write(f"\n[DATABASE ERROR IN CONTACT SERVICE]\n{err_trace}\n")
                sys.stderr.flush()
                if current_app:
                    current_app.logger.error(f"[DATABASE ERROR IN CONTACT SERVICE] {db_err}:\n{err_trace}")
                return {
                    "error": "Erro ao salvar a mensagem de contato no banco de dados.",
                    "details": str(db_err),
                    "trace": err_trace
                }, 500

        # Envio de notificação por e-mail isolado em try/except (Fail-Safe)

        email_dispatched = False
        try:
            admin_email = current_app.config.get('MAIL_USERNAME') if current_app else None
            if admin_email:
                html_body = f"""
                <h3>Nova mensagem de contato recebida no Portal GamificaEdu</h3>
                <p><strong>Nome:</strong> {name}</p>
                <p><strong>E-mail:</strong> {email}</p>
                <p><strong>Assunto:</strong> {subject}</p>
                <p><strong>Mensagem:</strong><br>{message_content}</p>
                """
                email_dispatched = send_html_email(admin_email, f"[Fale Conosco] {subject}", html_body)
        except Exception as mail_err:
            mail_trace = traceback.format_exc()
            sys.stderr.write(f"\n[EMAIL DISPATCH WARNING]\n{mail_trace}\n")
            sys.stderr.flush()
            if current_app:
                current_app.logger.warning(f"[EMAIL FAIL-SAFE] Falha ao enviar e-mail de contato ({mail_err}). Mensagem foi salva com sucesso.")

        if email_dispatched:
            return {
                "message": "Mensagem enviada com sucesso!",
                "id": saved_id,
                "email_status": "enviado"
            }, 201
        else:
            return {
                "message": "Mensagem salva com sucesso!",
                "id": saved_id,
                "email_status": "nao_enviado_ou_fallback"
            }, 201


