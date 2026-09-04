import threading
from flask import current_app, render_template
from ..utils.email_sender import send_html_email

class NotificationService:
    """
    Serviço de Domínio responsável por orquestrar notificações (e-mails, alertas, push).
    Opera de forma assíncrona para não onerar o ciclo de vida da requisição HTTP principal.
    """
    @staticmethod
    def dispatch_welcome_email(user, frontend_url):
        """
        Gera e dispara o e-mail de boas-vindas após o cadastro.
        """
        try:
            # 1. Renderiza o HTML utilizando o contexto atual do Flask (Jinja2)
            html_content = render_template('emails/welcome.html', user_name=user.name, frontend_url=frontend_url)
            subject = "Bem-vindo(a) ao Portal GamificaEdu! 🎉"
            
            # 2. Captura a instância real do app para usar dentro da Thread
            app = current_app._get_current_object()
            
            # 3. Define a função que rodará em background
            def send_async(app_context, to_email, subj, html):
                with app_context.app_context():
                    # No futuro, aqui podemos fazer um IF: se usar Resend, chama API. Se usar SMTP, chama SMTP.
                    send_html_email(to_email, subj, html)
            
            # 4. Dispara a Thread
            thread = threading.Thread(target=send_async, args=(app, user.email, subject, html_content))
            thread.start()
            
        except Exception as e:
            current_app.logger.error(f"Erro ao agendar e-mail de boas vindas para {user.email}: {str(e)}")

notification_service = NotificationService()
