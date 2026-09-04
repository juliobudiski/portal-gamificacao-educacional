import os
import json
import urllib.request
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

def _get_smtp_connection(smtp_server, smtp_port, smtp_user, smtp_password):
    """
    Tenta conectar ao servidor SMTP com timeout e fallback inteligente de portas:
    1. Tenta a porta configurada no env (padrão 587 STARTTLS com timeout=10s)
    2. Se a porta configurada for 465, usa SMTP_SSL com timeout=10s
    3. Se 587 falhar ou der timeout (comum na infraestrutura de nuvem como Render),
       tenta automaticamente a porta 465 (SMTP_SSL).
    """
    timeout = 10

    if smtp_port == 465:
        server = smtplib.SMTP_SSL(smtp_server, 465, timeout=timeout)
        server.login(smtp_user, smtp_password)
        return server

    try:
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=timeout)
        server.starttls()
        server.login(smtp_user, smtp_password)
        return server
    except Exception as e:
        if current_app:
            current_app.logger.warning(f"Falha/Timeout na porta SMTP {smtp_port} ({e}). Tentando fallback para Porta 465 (SSL)...")
        try:
            server = smtplib.SMTP_SSL(smtp_server, 465, timeout=timeout)
            server.login(smtp_user, smtp_password)
            return server
        except Exception as e2:
            if current_app:
                current_app.logger.error(f"Fallback na porta 465 também falhou: {e2}")
            raise e2

def _dispatch_email(to_email, subject, html_content):
    """
    Despacha o e-mail verificando primeiro se há a configuração do Google Apps Script.
    Caso contrário, tenta o fallback pelo SMTP tradicional.
    Isso burla o bloqueio de portas SMTP do Render Free (usa porta 443 HTTPS).
    """
    apps_script_url = os.environ.get("GOOGLE_APPS_SCRIPT_URL")

    if apps_script_url:
        try:
            payload = json.dumps({
                "to_email": to_email,
                "subject": subject,
                "html_content": html_content
            }).encode('utf-8')
            
            req = urllib.request.Request(apps_script_url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode('utf-8')
                if current_app:
                    current_app.logger.info(f"E-mail disparado via Google Apps Script (HTTP). Resposta: {res_body}")
                return True
        except Exception as e:
            if current_app:
                current_app.logger.error(f"Erro ao disparar via Google Apps Script: {str(e)}")
            return False

    # Fallback SMTP tradicional (útil para desenvolvimento local)
    smtp_server = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("MAIL_PORT", 587))
    smtp_user = os.environ.get("MAIL_USERNAME")
    smtp_password = os.environ.get("MAIL_PASSWORD")

    try:
        msg = MIMEMultipart()
        msg['From'] = f"Gamefica.Edu <{smtp_user}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html'))

        server = _get_smtp_connection(smtp_server, smtp_port, smtp_user, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_user, to_email, text)
        server.quit()

        if current_app:
            current_app.logger.info(f"E-mail disparado com sucesso via SMTP tradicional para {to_email}.")
        return True
    except Exception as e:
        if current_app:
            current_app.logger.error(f"Erro no disparo SMTP para {to_email}: {str(e)}")
        return False


def send_reset_email(to_email, reset_url):
    subject = "Recuperação de Senha - Gamefica.Edu"
        
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

    return _dispatch_email(to_email, subject, html_content)


def send_teacher_code_email(to_email, access_code, name):
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

    return _dispatch_email(to_email, subject, html_content)


def send_html_email(to_email, subject, html_content):
    """
    Método genérico para disparar um e-mail HTML (Strategy base para o Gmail SMTP ou API Relay).
    """
    return _dispatch_email(to_email, subject, html_content)