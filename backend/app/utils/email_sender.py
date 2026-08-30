import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

def send_reset_email(to_email, reset_url):
    # Pega configurações do .env
    smtp_server = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("MAIL_PORT", 587))
    smtp_user = os.environ.get("MAIL_USERNAME")
    smtp_password = os.environ.get("MAIL_PASSWORD")

    # Define a URL pública do logo (WebP ou PNG)
    # Importante: O Gmail não acessa 'localhost'. Apontamos para sua produção na Vercel.
    logo_url = "https://github.com/juliobudiski/portal-gamificacao-educacional/blob/main/frontend/images/logotipo-dark.webp?raw=true"

    # Assunto
    subject = "Recuperação de Senha - Gamefica.Edu"
        
    # HTML Profissional (Versão Texto Estilizado)
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha</title>
        <style>
            body {{ margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; }}
            table {{ border-collapse: collapse; }}
            a {{ text-decoration: none; }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td align="center" style="padding: 40px 10px;">
                    <table role="presentation" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); max-width: 600px; width: 100%; border: 1px solid #e4e4e7;" cellspacing="0" cellpadding="0" border="0">
                        
                        <tr>
                            <td align="center" style="padding: 40px 40px 0 40px;">
                                <h1 style="color: #0d9488; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
                                    Portal GamificaEdu
                                </h1>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 32px 40px;">
                                <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
                                    Redefinição de Senha
                                </h2>
                                
                                <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                                    Olá,
                                </p>
                                <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                                    Recebemos uma solicitação para redefinir a senha da sua conta. Se não foi você, por favor ignore este e-mail.
                                </p>

                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center">
                                            <a href="{reset_url}" target="_blank" style="background-color: #0d9488; color: #ffffff; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; display: inline-block; transition: background-color 0.2s;">
                                                Criar Nova Senha
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="color: #71717a; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
                                    Este link expira em 1 hora por segurança.
                                </p>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="background-color: #fafafa; border-radius: 0 0 12px 12px; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                                <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5; margin: 0;">
                                    © 2026 Gamefica.Edu<br>
                                    Enviado automaticamente pelo sistema.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    try:
        # Configura a mensagem
        msg = MIMEMultipart()
        msg['From'] = f"Gamefica.Edu <{smtp_user}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html'))

        # Conecta ao servidor SMTP do Gmail
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        
        # Envia
        text = msg.as_string()
        server.sendmail(smtp_user, to_email, text)
        server.quit()

        current_app.logger.info(f"E-mail enviado com sucesso para {to_email} via Gmail SMTP.")
        return True

    except Exception as e:
        current_app.logger.error(f"Erro ao enviar email via SMTP: {str(e)}")
        return False

def send_teacher_code_email(to_email, access_code, name):
    smtp_server = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("MAIL_PORT", 587))
    smtp_user = os.environ.get("MAIL_USERNAME")
    smtp_password = os.environ.get("MAIL_PASSWORD")

    subject = "Código de Acesso Institucional - Portal GamificaEdu"
        
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código Institucional</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td align="center" style="padding: 40px 10px;">
                    <table role="presentation" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); max-width: 600px; width: 100%; border: 1px solid #e4e4e7;" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td align="center" style="padding: 40px 40px 0 40px;">
                                <h1 style="color: #0d9488; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Portal GamificaEdu</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 32px 40px;">
                                <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">Bem-vindo(a) à Plataforma, Professor(a) {name}!</h2>
                                <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">Sua solicitação de acesso foi aprovada. Abaixo está o seu Código Institucional de segurança necessário para finalizar o seu cadastro no portal.</p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <span style="background-color: #f3f4f6; color: #0d9488; font-size: 24px; font-weight: 700; padding: 16px 32px; border-radius: 8px; border: 2px dashed #0d9488; display: inline-block;">
                                        {access_code}
                                    </span>
                                </div>
                                <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 32px 0; text-align: center;">Retorne à tela de cadastro, selecione o perfil "Professor" e insira este código.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #fafafa; border-radius: 0 0 12px 12px; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                                <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5; margin: 0;">© 2026 Gamefica.Edu<br>Enviado automaticamente pela equipe de administração.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    try:
        msg = MIMEMultipart()
        msg['From'] = f"Gamefica.Edu <{smtp_user}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_user, to_email, text)
        server.quit()
        current_app.logger.info(f"E-mail de código enviado para {to_email}.")
        return True
    except Exception as e:
        current_app.logger.error(f"Erro ao enviar email de código via SMTP: {str(e)}")
        return False