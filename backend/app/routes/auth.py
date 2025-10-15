# backend/app/routes/auth.py

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from ..models import db, User, EventLog
from ..config import Config
from flask_cors import cross_origin
from google.oauth2 import id_token
from google.auth.transport import requests
import requests
from sqlalchemy.orm.attributes import flag_modified
auth_bp = Blueprint('auth', __name__)
# --- ESTRUTURA DOS AVATARES PADRÃO ---
# Defina esta lista no topo do arquivo para ser reutilizada
DEFAULT_AVATARS = [
    {"url": "/avatars/avatar2.webp", "name": "Avatar Básico 2", "type": "normal"},
    {"url": "/avatars/avatar8.webp", "name": "Avatar Básico 8", "type": "normal"},
    {"url": "/avatars/avatar9.webp", "name": "Avatar Básico 9", "type": "normal"},
]
DEFAULT_PROFILE_PICTURE = "/avatars/avatar9.webp"
# --- 2. FUNÇÃO AUXILIAR PARA LOGGING DE AUTENTICAÇÃO ---
def _log_auth_event(user_id, action, details, is_success=True):
    """
    Cria e salva um evento de log de autenticação.
    O commit é feito separadamente para garantir que falhas sejam registradas.
    """
    try:
        event = EventLog(
            user_id=user_id,
            section='auth',
            action=action,
            details=details,
            ip_address=request.remote_addr,
            user_agent=request.headers.get("User-Agent")
        )
        db.session.add(event)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Falha CRÍTICA ao registrar evento de log de auth: {e}")
# ---------------------------------------------------------

# Rota para registrar um novo usuário
@auth_bp.route('/register', methods=['POST'])
def register_user():
    current_app.logger.info("Tentativa de registro de usuário iniciada.")
    data = request.get_json()
    current_app.logger.debug(f"Dados recebidos para registro: {data}")

    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role', 'aluno')

    if not email or not password or not name:
        current_app.logger.warning("Falha no registro: campos obrigatórios ausentes.")
        return jsonify({"message": "Nome, e-mail e senha são obrigatórios."}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        current_app.logger.warning(f"Falha no registro: e-mail '{email}' já cadastrado.")
        _log_auth_event(
            user_id=None,
            action='register_fail',
            details={'email': email, 'reason': 'email_exists'},
            is_success=False
        )
        return jsonify({"message": "E-mail já cadastrado."}), 409

    hashed_password = generate_password_hash(password)
    new_user = User(
        email=email, 
        password_hash=hashed_password, 
        name=name, 
        role=role,
        profile_picture=DEFAULT_PROFILE_PICTURE,      # Avatar padrão equipado
        unlocked_global_avatars=DEFAULT_AVATARS       # Lista de avatares desbloqueados
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        current_app.logger.info(f"Usuário '{email}' registrado com sucesso com ID: {new_user.id}")
        _log_auth_event(
            user_id=new_user.id,
            action='register_success',
            details={'email': new_user.email, 'method': 'email'}
        )

        additional_claims = {
            "email": new_user.email, "name": new_user.name, "role": new_user.role,
            "profile_picture": new_user.profile_picture,
            "institutionName": new_user.institution_name,
            "discipline": new_user.discipline,
            "unlocked_global_avatars": new_user.unlocked_global_avatars
        }
        access_token = create_access_token(identity=str(new_user.id), additional_claims=additional_claims)

        user_data = {
            "id": new_user.id, "email": new_user.email, "name": new_user.name, "role": new_user.role,
            "profile_picture": new_user.profile_picture,
            "institutionName": new_user.institution_name,
            "discipline": new_user.discipline,
            "unlocked_global_avatars": new_user.unlocked_global_avatars,
            "token": access_token
        }
        return jsonify(access_token=access_token, user=user_data), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro interno ao cadastrar usuário: {str(e)}"}), 500

# Rota para login de usuário com e-mail e senha
@auth_bp.route('/login', methods=['POST'])
def login_user():
    current_app.logger.info("Tentativa de login iniciada.")
    data = request.get_json()
    current_app.logger.debug(f"Dados recebidos para login: {data.get('email')}")

    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password_hash, password):
        current_app.logger.info(f"Login bem-sucedido para o usuário: {email}")
        _log_auth_event(
            user_id=user.id,
            action='login_success',
            details={'email': user.email, 'method': 'email'}
        )
        additional_claims = {
            "email": user.email, "name": user.name, "role": user.role,
            "profile_picture": user.profile_picture,
            "institutionName": user.institution_name,
            "discipline": user.discipline
        }
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        
        user_data = {
            "id": user.id, "email": user.email, "name": user.name, "role": user.role,
            "profile_picture": user.profile_picture, "google_id": user.google_id,
            "institutionName": user.institution_name, "discipline": user.discipline,
            "token": access_token,
            "unlocked_global_avatars": user.unlocked_global_avatars,
        }
        return jsonify(access_token=access_token, user=user_data), 200
    else:
        current_app.logger.warning(f"Falha no login para o e-mail: {email}. Credenciais inválidas.")
        _log_auth_event(
            user_id=user.id if user else None,  # Loga o ID se o usuário existir mas a senha estiver errada
            action='login_fail',
            details={'email': email, 'reason': 'invalid_credentials'},
            is_success=False
        )
        return jsonify({"message": "Credenciais inválidas."}), 401

# Rota para autenticação via Google Sign-In
@auth_bp.route('/google', methods=['POST'])
@cross_origin()
def google_auth():
    current_app.logger.info("Tentativa de autenticação com Google iniciada.")
    data = request.get_json()
    token = data.get('id_token')
    selected_role = data.get('role', 'aluno')
    current_app.logger.debug(f"Token do Google recebido. Role selecionada: {selected_role}")

    if not token:
        current_app.logger.warning("Token do Google não fornecido na requisição.")
        return jsonify({"message": "Token do Google não fornecido."}), 400

    try:
        # Verifica o token com o backend do Google
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), Config.GOOGLE_CLIENT_ID_BACKEND)
        current_app.logger.debug(f"Informações do token Google verificado: {idinfo.get('email')}")

        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')

        user = User.query.filter_by(google_id=google_id).first()
        status_code = 200

        if user:
            current_app.logger.info(f"Usuário encontrado pelo google_id: {email}")
            _log_auth_event(user_id=user.id, action='login_success', details={'email': user.email, 'method': 'google'})
            if user.role != selected_role:
                current_app.logger.info(f"Atualizando role do usuário {email} de '{user.role}' para '{selected_role}'.")
                user.role = selected_role
                db.session.commit()
        else:
            current_app.logger.info(f"Usuário não encontrado pelo google_id. Buscando por e-mail: {email}")
            existing_email_user = User.query.filter_by(email=email).first()
            if existing_email_user:
                current_app.logger.info(f"Usuário existente encontrado por e-mail. Vinculando conta Google para {email}.")
                existing_email_user.google_id = google_id
                existing_email_user.name = name
                existing_email_user.profile_picture = picture
                if existing_email_user.role != selected_role:
                    current_app.logger.info(f"Atualizando role do usuário {email} de '{existing_email_user.role}' para '{selected_role}'.")
                    existing_email_user.role = selected_role
                db.session.commit()
                user = existing_email_user
                _log_auth_event(user_id=user.id, action='link_google_account', details={'email': user.email})
            else:
                current_app.logger.info(f"Nenhum usuário encontrado. Criando novo usuário Google para {email}.")
                _log_auth_event(user_id=None, action='register_success', details={'email': email, 'method': 'google'})
                user = User(
                    email=email, password_hash='google_auth_only', google_id=google_id,
                    name=name, profile_picture=picture, role=selected_role,
                    unlocked_global_avatars=DEFAULT_AVATARS # Adiciona os avatares padrão
                )
                if not user.profile_picture:
                    user.profile_picture = DEFAULT_PROFILE_PICTURE # Define o avatar padrão se o Google não fornecer um

                db.session.add(user)
                db.session.commit()
                status_code = 201
            # --- FIM DA ALTERAÇÃO ---

        current_app.logger.info(f"Gerando token de acesso para o usuário {user.email}")
        additional_claims = {
            "email": user.email, "name": user.name, "role": user.role,
            "profile_picture": user.profile_picture,
            "institutionName": user.institution_name,
            "discipline": user.discipline,
            "unlocked_global_avatars": user.unlocked_global_avatars
        }
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

        user_data = {
            "id": user.id, "email": user.email, "name": user.name, "role": user.role,
            "profile_picture": user.profile_picture, "google_id": user.google_id,
            "institutionName": user.institution_name, "discipline": user.discipline,
            "token": access_token,
            "unlocked_global_avatars": user.unlocked_global_avatars,
        }
        return jsonify(access_token=access_token, user=user_data), status_code

    except ValueError as e:
        current_app.logger.error(f"Erro de validação do token Google: {str(e)}", exc_info=True)
        _log_auth_event(
            user_id=None,
            action='google_auth_fail',
            details={'reason': 'invalid_token', 'error': str(e)},
            is_success=False
        )
        return jsonify({"message": f"Token do Google inválido ou expirado. {str(e)}"}), 401
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro inesperado na autenticação Google: {str(e)}", exc_info=True)
        _log_auth_event(
            user_id=None,
            action='google_auth_fail',
            details={'reason': 'internal_server_error', 'error': str(e)},
            is_success=False
        )
        return jsonify({"message": f"Erro interno no servidor durante autenticação Google: {str(e)}"}), 500

# Rota para professores atualizarem informações de instituição e disciplina
@auth_bp.route('/user/update-profile', methods=['POST'])
@cross_origin()
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"Usuário ID {current_user_id} tentando atualizar o perfil.")
    
    user = User.query.get(current_user_id)

    if not user:
        current_app.logger.error(f"Tentativa de atualizar perfil para usuário inexistente: ID {current_user_id}")
        return jsonify({"message": "Usuário não encontrado."}), 404

    if user.role != 'professor':
        current_app.logger.warning(f"Acesso negado para ID {current_user_id} na rota update-profile. Role: {user.role}")
        return jsonify({"message": "Acesso negado. Apenas professores podem atualizar essas informações."}), 403

    data = request.get_json()
    current_app.logger.debug(f"Dados recebidos para atualização do perfil do ID {current_user_id}: {data}")

    try:
        if 'institution_name' in data:
            user.institution_name = data['institution_name']
        if 'discipline' in data:
            user.discipline = data['discipline']
        
        db.session.commit()
        current_app.logger.info(f"Perfil do usuário ID {current_user_id} atualizado com sucesso.")

        # Recrie as claims adicionais com os dados MAIS RECENTES do objeto 'user'
        # após o commit no banco de dados.
        additional_claims = {
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "institutionName": user.institution_name, # <-- AGORA PEGA O VALOR ATUALIZADO
            "discipline": user.discipline # <-- AGORA PEGA O VALOR ATUALIZADO
        }
        new_access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

        # Opcional: Inclua também o objeto user completo na resposta para o frontend
        # Isso pode simplificar a lógica do frontend, embora o token já contenha os dados.
        user_data = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "google_id": user.google_id, # Inclua se aplicável
            "institutionName": user.institution_name,
            "discipline": user.discipline,
        }

        return jsonify({
            "message": "Informações do perfil atualizadas com sucesso!",
            "access_token": new_access_token,
            "user": user_data # <--- ADICIONADO
        }), 200


    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"ERRO CRÍTICO em update_profile para ID {current_user_id}: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro interno ao atualizar o perfil: {str(e)}"}), 500


@auth_bp.route('/user/select-avatar', methods=['POST'])
@cross_origin()
@jwt_required()
def select_avatar():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"message": "Usuário não encontrado."}), 404

    data = request.get_json()
    avatar_url = data.get('avatar_url')

    if not avatar_url:
        return jsonify({"message": "Nenhum avatar selecionado."}), 400

    # Aqui você pode adicionar uma lógica para verificar se o aluno realmente desbloqueou o avatar
    # Por enquanto, vamos permitir a seleção direta
    
    user.profile_picture = avatar_url
    db.session.commit()
    
    return jsonify({"message": "Avatar selecionado com sucesso!", "user": user.to_dict()}), 200

@auth_bp.route('/user/change-password', methods=['POST'])
@cross_origin()
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"message": "Usuário não encontrado."}), 404

    # Não permite alterar senha de contas Google
    if user.password_hash == 'google_auth_only':
        return jsonify({"message": "Não é possível alterar a senha de uma conta vinculada ao Google."}), 400

    data = request.get_json()
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')

    if not check_password_hash(user.password_hash, current_password):
        return jsonify({"message": "Senha atual incorreta."}), 401

    try:
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        return jsonify({"message": "Senha alterada com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao alterar senha para o usuário ID {current_user_id}: {str(e)}")
        return jsonify({"message": "Erro interno ao alterar a senha."}), 500

@auth_bp.route('/user/delete_account', methods=['DELETE'])
@cross_origin()
@jwt_required()
def delete_account():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"message": "Usuário não encontrado."}), 404

    data = request.get_json()
    password = data.get('password')

    if not password:
        return jsonify({"message": "A senha é necessária para excluir a conta."}), 400

    if user.google_id and not user.password_hash:
         return jsonify({"message": "A exclusão de contas Google precisa de um método de verificação diferente."}), 400

    if not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Senha atual incorreta."}), 401

    try:
        # Futuramente, adicione aqui a lógica para deletar dados relacionados
        # (atividades, matrículas, etc.) antes de deletar o usuário.
        
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Conta excluída com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao excluir a conta do usuário ID {current_user_id}: {str(e)}")
        return jsonify({"message": "Erro interno ao excluir a conta."}), 500

@auth_bp.route('/user/location-info', methods=['GET'])
@jwt_required()
def get_user_location_info():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or not user.last_known_latitude:
        return jsonify(None), 200 # Retorna nulo se não houver localização

    try:
        lat = user.last_known_latitude
        lon = user.last_known_longitude
        
        # Chamada para a API Nominatim (gratuita e sem chave)
        geo_url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {'User-Agent': 'GamificaEduPortal/1.0'}
        geo_res = requests.get(geo_url, headers=headers, timeout=5)
        geo_res.raise_for_status()
        address = geo_res.json().get('address', {})
        
        location_info = {
            'city': address.get('city') or address.get('town') or address.get('village', 'N/A'),
            'state': address.get('state', 'N/A'),
            'country': address.get('country', 'N/A')
        }
        return jsonify(location_info), 200

    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Falha na geocodificação para o usuário {user.id}: {e}")
        return jsonify({"message": "Erro ao buscar informações de localização."}), 500