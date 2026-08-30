import os
from flask import current_app, request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from sqlalchemy.orm.attributes import flag_modified
from ..models import db, User, EventLog
from ..utils.geo import update_user_location_data  
from ..utils.email_sender import send_reset_email
from ..utils.text_sanitizer import clean_text, detect_strict_sql_injection, detect_prompt_injection

DEFAULT_AVATARS = [
    {"url": "/avatars/avatar1.webp", "name": "Avatar Básico 1", "type": "normal"},
    {"url": "/avatars/avatar2.webp", "name": "Avatar Básico 2", "type": "normal"},
    {"url": "/avatars/avatar6.webp", "name": "Avatar Básico 6", "type": "normal"},
    {"url": "/avatars/avatar7.webp", "name": "Avatar Básico 7", "type": "normal"},
    {"url": "/avatars/avatar8.webp", "name": "Avatar Básico 8", "type": "normal"},
    {"url": "/avatars/avatar9.webp", "name": "Avatar Básico 9", "type": "normal"},
    {"url": "/avatars/default_avatar.webp", "name": "Avatar Padrão", "type": "normal"},
]
DEFAULT_PROFILE_PICTURE = "/avatars/default_avatar.webp"

def get_serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'])

class AuthService:
    @staticmethod
    def _log_auth_event(user_id, action, details, is_success=True, remote_addr=None, user_agent=None):
        try:
            event = EventLog(
                user_id=user_id,
                section='auth',
                action=action,
                details=details,
                ip_address=remote_addr,
                user_agent=user_agent
            )
            db.session.add(event)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Falha CRÍTICA ao registrar evento de log de auth: {e}")

    @staticmethod
    def _generate_jwt_claims(user):
        return {
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "institutionName": user.institution_name,
            "discipline": user.discipline,
            "unlocked_global_avatars": user.unlocked_global_avatars,
            "onboarding_status": user.onboarding_status
        }

    @staticmethod
    def register_user(data, remote_addr, user_agent):
        email = data.get('email', '')
        password = data.get('password', '')
        raw_name = data.get('name', '')
        role = data.get('role', 'aluno')
        access_code = data.get('accessCode', '')

        # Validação do código de acesso para professores
        if role == 'professor':
            required_code = os.environ.get('TEACHER_ACCESS_CODE', 'GAMIFICA_PROF_2026')
            if not access_code or access_code.strip() != required_code:
                return None, {"message": "Código de Acesso Institucional inválido para professor."}, 403

        # WAF Interno: Bloqueia injeções claras
        if detect_strict_sql_injection(email) or detect_strict_sql_injection(raw_name) or detect_prompt_injection(raw_name):
            AuthService._log_auth_event(None, 'register_fail', {'email': email, 'reason': 'waf_block'}, False, remote_addr, user_agent)
            return None, {"message": "Entrada inválida detectada pelo firewall de segurança."}, 400

        # Anti-XSS no nome
        name = clean_text(raw_name, context='chat')

        if not email or not password or not name:
            return None, {"message": "Nome, e-mail e senha são obrigatórios."}, 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            AuthService._log_auth_event(None, 'register_fail', {'email': email, 'reason': 'email_exists'}, False, remote_addr, user_agent)
            return None, {"message": "E-mail já cadastrado."}, 409

        hashed_password = generate_password_hash(password)
        new_user = User(
            email=email, 
            password_hash=hashed_password, 
            name=name, 
            role=role,
            profile_picture=DEFAULT_PROFILE_PICTURE,      
            unlocked_global_avatars=DEFAULT_AVATARS       
        )

        try:
            db.session.add(new_user)
            db.session.commit()
            AuthService._log_auth_event(new_user.id, 'register_success', {'email': new_user.email, 'method': 'email'}, True, remote_addr, user_agent)

            additional_claims = AuthService._generate_jwt_claims(new_user)
            access_token = create_access_token(identity=str(new_user.id), additional_claims=additional_claims)

            user_data = {
                "id": new_user.id, "email": new_user.email, "name": new_user.name, "role": new_user.role,
                "profile_picture": new_user.profile_picture,
                "institutionName": new_user.institution_name,
                "discipline": new_user.discipline,
                "unlocked_global_avatars": new_user.unlocked_global_avatars,
                "token": access_token,
                "onboarding_status": new_user.onboarding_status
            }
            return {"access_token": access_token, "user": user_data}, None, 201
        except Exception as e:
            db.session.rollback()
            return None, {"message": f"Erro interno ao cadastrar usuário: {str(e)}"}, 500

    @staticmethod
    def login_user(data, remote_addr, user_agent):
        email = data.get('email', '')
        password = data.get('password', '')

        if detect_strict_sql_injection(email):
            AuthService._log_auth_event(None, 'login_fail', {'email': email, 'reason': 'waf_block'}, False, remote_addr, user_agent)
            return None, {"message": "Entrada inválida detectada pelo firewall de segurança."}, 400

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            AuthService._log_auth_event(user.id, 'login_success', {'email': user.email, 'method': 'email'}, True, remote_addr, user_agent)
            additional_claims = AuthService._generate_jwt_claims(user)
            access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
            
            user_data = {
                "id": user.id, "email": user.email, "name": user.name, "role": user.role,
                "profile_picture": user.profile_picture, "google_id": user.google_id,
                "institutionName": user.institution_name, "discipline": user.discipline,
                "token": access_token,
                "unlocked_global_avatars": user.unlocked_global_avatars,
                "onboarding_status": user.onboarding_status
            }
            return {"access_token": access_token, "user": user_data}, None, 200
        else:
            AuthService._log_auth_event(user.id if user else None, 'login_fail', {'email': email, 'reason': 'invalid_credentials'}, False, remote_addr, user_agent)
            return None, {"message": "Credenciais inválidas."}, 401

    @staticmethod
    def update_profile(current_user_id, data):
        user = User.query.get(current_user_id)
        if not user:
            return None, {"message": "Usuário não encontrado."}, 404
        if user.role != 'professor':
            return None, {"message": "Acesso negado. Apenas professores podem atualizar essas informações."}, 403

        try:
            if 'institution_name' in data:
                inst_name = data['institution_name']
                if detect_strict_sql_injection(inst_name) or detect_prompt_injection(inst_name):
                    return None, {"message": "Entrada inválida detectada."}, 400
                user.institution_name = clean_text(inst_name, context='chat')
                
            if 'discipline' in data:
                disc = data['discipline']
                if detect_strict_sql_injection(disc) or detect_prompt_injection(disc):
                    return None, {"message": "Entrada inválida detectada."}, 400
                user.discipline = clean_text(disc, context='chat')
                
            db.session.commit()

            additional_claims = AuthService._generate_jwt_claims(user)
            new_access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

            user_data = {
                "id": user.id, "email": user.email, "name": user.name, "role": user.role,
                "profile_picture": user.profile_picture, "google_id": user.google_id,
                "institutionName": user.institution_name, "discipline": user.discipline,
                "onboarding_status": user.onboarding_status
            }

            return {"message": "Informações do perfil atualizadas com sucesso!", "access_token": new_access_token, "user": user_data}, None, 200
        except Exception as e:
            db.session.rollback()
            return None, {"message": f"Erro interno ao atualizar o perfil: {str(e)}"}, 500

    @staticmethod
    def select_avatar(current_user_id, avatar_url):
        user = User.query.get(current_user_id)
        if not user:
            return None, {"message": "Usuário não encontrado."}, 404
        if not avatar_url:
            return None, {"message": "Nenhum avatar selecionado."}, 400
        
        user.profile_picture = avatar_url
        db.session.commit()
        return {"message": "Avatar selecionado com sucesso!", "user": user.to_dict()}, None, 200

    @staticmethod
    def change_password(current_user_id, data):
        user = User.query.get(current_user_id)
        if not user:
            return None, {"message": "Usuário não encontrado."}, 404
        if user.password_hash == 'google_auth_only':
            return None, {"message": "Não é possível alterar a senha de uma conta vinculada ao Google."}, 400

        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')

        if not check_password_hash(user.password_hash, current_password):
            return None, {"message": "Senha atual incorreta."}, 401

        try:
            user.password_hash = generate_password_hash(new_password)
            db.session.commit()
            return {"message": "Senha alterada com sucesso!"}, None, 200
        except Exception as e:
            db.session.rollback()
            return None, {"message": "Erro interno ao alterar a senha."}, 500

    @staticmethod
    def delete_account(current_user_id, data):
        user = User.query.get(current_user_id)
        if not user:
            return None, {"message": "Usuário não encontrado."}, 404
        password = data.get('password')
        if not password:
            return None, {"message": "A senha é necessária para excluir a conta."}, 400
        if user.google_id and not user.password_hash:
             return None, {"message": "A exclusão de contas Google precisa de um método de verificação diferente."}, 400
        if not check_password_hash(user.password_hash, password):
            return None, {"message": "Senha atual incorreta."}, 401
        try:
            db.session.delete(user)
            db.session.commit()
            return {"message": "Conta excluída com sucesso."}, None, 200
        except Exception as e:
            db.session.rollback()
            return None, {"message": "Erro interno ao excluir a conta."}, 500

    @staticmethod
    def get_user_location_info(current_user_id):
        user = User.query.get(current_user_id)
        if not user or not user.cached_city:
            return None, None, 200 
        location_info = {
            "city": user.cached_city,
            "state": user.cached_state,
            "country": user.cached_country,
            "suburb": user.cached_suburb
        }
        return location_info, None, 200

    @staticmethod
    def update_avatar(user_id, new_avatar_url):
        if not new_avatar_url:
            return None, {"msg": "URL do avatar é obrigatória."}, 400
        user = User.query.get(user_id)
        if not user:
            return None, {"msg": "Usuário não encontrado."}, 404
        user.profile_picture = new_avatar_url
        db.session.commit()
        additional_claims = AuthService._generate_jwt_claims(user)
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        return {"access_token": access_token}, None, 200

    @staticmethod
    def unlock_location_avatar(user_id, data):
        user = User.query.get(user_id)
        if not user:
            return None, {"msg": "Usuário não encontrado."}, 404

        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if latitude is None or longitude is None:
            return None, {"msg": "Coordenadas inválidas."}, 400

        try:
            update_user_location_data(user, latitude, longitude)
            
            location_avatar = {
                "url": "/avatars/avatar3.webp", 
                "name": "Explorador",
                "type": "special",
                "promotable": True
            }

            if user.unlocked_global_avatars is None:
                user.unlocked_global_avatars = []

            has_avatar = any(a.get('url') == location_avatar['url'] for a in user.unlocked_global_avatars)

            if not has_avatar:
                user.unlocked_global_avatars.append(location_avatar)
                flag_modified(user, "unlocked_global_avatars")
            
            db.session.commit() 

            additional_claims = AuthService._generate_jwt_claims(user)
            access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
            
            return {
                "message": "Localização atualizada e recompensa desbloqueada!",
                "access_token": access_token,
                "user": { 
                    "cached_city": user.cached_city,
                    "cached_state": user.cached_state
                }
            }, None, 200

        except Exception as e:
            db.session.rollback()
            return None, {"msg": "Erro interno ao salvar localização."}, 500

    @staticmethod
    def update_onboarding(user_id, tour_key):
        user = User.query.get(user_id)
        if not user:
            return None, {"msg": "Usuário não encontrado."}, 404
        if not tour_key:
            return None, {"msg": "Chave do tutorial é obrigatória."}, 400

        if user.onboarding_status is None:
            user.onboarding_status = {}

        user.onboarding_status[tour_key] = True
        flag_modified(user, "onboarding_status")
        
        try:
            db.session.commit()
            additional_claims = AuthService._generate_jwt_claims(user)
            new_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
            return {"message": "Tutorial concluído!", "access_token": new_token}, None, 200
        except Exception as e:
            db.session.rollback()
            return None, {"msg": "Erro ao salvar progresso."}, 500

    @staticmethod
    def forgot_password(data, frontend_url):
        try:
            email = data.get('email')
            user = User.query.filter_by(email=email).first()
            if not user:
                return {"message": "Se o e-mail existir, um link foi enviado."}, None, 200

            s = get_serializer()
            token = s.dumps(user.email, salt='password-reset')
            
            if not frontend_url:
                frontend_url = 'http://localhost:5173'

            reset_url = f"{frontend_url}/reset-password/{token}"
            email_sent = send_reset_email(user.email, reset_url)
            
            if email_sent:
                return {"message": "Se o e-mail existir, um link foi enviado."}, None, 200
            else:
                return None, {"error": "Erro interno ao enviar e-mail."}, 500
        except Exception as e:
            return None, {"error": "Erro interno do servidor."}, 500

    @staticmethod
    def reset_password(token, password):
        s = get_serializer()
        try:
            email = s.loads(token, salt='password-reset', max_age=3600)
        except SignatureExpired:
            return None, {"error": "O link expirou."}, 400
        except BadSignature:
            return None, {"error": "Link inválido."}, 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return None, {"error": "Usuário não encontrado."}, 404

        user.password_hash = generate_password_hash(password)
        db.session.commit()
        return {"message": "Senha atualizada com sucesso!"}, None, 200

    @staticmethod
    def get_api_keys(user_id):
        user = User.query.get(user_id)
        if not user:
            return None, {"message": "Usuário não encontrado."}, 404
        
        return {
            "gemini_api_key": user.gemini_api_key,
            "openai_api_key": user.openai_api_key
        }, None, 200

    @staticmethod
    def update_api_keys(user_id, data):
        user = User.query.get(user_id)
        if not user:
            return None, {"message": "Usuário não encontrado."}, 404
            
        if 'gemini_api_key' in data:
            user.gemini_api_key = data['gemini_api_key'] if data['gemini_api_key'] else None
        if 'openai_api_key' in data:
            user.openai_api_key = data['openai_api_key'] if data['openai_api_key'] else None
            
        try:
            db.session.commit()
            # Retorna token atualizado para segurança? Não é necessário, pois as chaves não ficam no JWT.
            return {"message": "Chaves atualizadas com sucesso."}, None, 200
        except Exception as e:
            db.session.rollback()
            return None, {"message": "Erro ao atualizar chaves."}, 500
