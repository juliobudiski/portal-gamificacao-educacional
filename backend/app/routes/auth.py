"""
Módulo de Rotas de Autenticação (Auth)
Responsável por gerenciar o ciclo de vida do usuário na plataforma:
Cadastro, login, gerenciamento de perfil, senhas, avatares, localização e API Keys (BYOK).
Todas as regras de negócio complexas estão delegadas ao AuthService.
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from ..models import db, User, EventLog
from ..config import Config
from flask_cors import cross_origin
#from google.oauth2 import id_token
#from google.auth.transport import requests as google_requests
#import requests
from datetime import datetime
from sqlalchemy.orm.attributes import flag_modified
from ..utils.geo import update_user_location_data  
from ..utils.email_sender import send_reset_email
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature

from ..services.auth_service import AuthService
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register_user():
    """
    Cadastra um novo usuário no sistema.
    - Acesso: Público.
    - Payload esperado: { "email", "password", "name", "role", "accessCode" (se professor) }.
    - Retorna: JSON de sucesso (201) ou erro (400/403/409) com base na validação.
    """
    data = request.get_json()
    result, error, status = AuthService.register_user(data, request.remote_addr, request.headers.get("User-Agent"))
    if error:
        return jsonify(error), status
    return jsonify(result), status

@auth_bp.route('/login', methods=['POST'])
def login_user():
    """
    Autentica um usuário existente com e-mail e senha.
    - Acesso: Público.
    - Retorno: Token JWT de acesso (access_token) e dados básicos do usuário (200 OK).
    """
    data = request.get_json()
    result, error, status = AuthService.login_user(data, request.remote_addr, request.headers.get("User-Agent"))
    if error:
        return jsonify(error), status
    return jsonify(result), status
    
@auth_bp.route('/user/update-profile', methods=['POST'])
@cross_origin()
@jwt_required()
def update_profile():
    """
    Atualiza informações cadastrais do perfil (como instituição e disciplina para professores).
    - Acesso: Autenticado.
    """
    current_user_id = get_jwt_identity()
    data = request.get_json()
    result, error, status = AuthService.update_profile(current_user_id, data)
    if error:
        return jsonify(error), status
    return jsonify(result), status


@auth_bp.route('/user/select-avatar', methods=['POST'])
@cross_origin()
@jwt_required()
def select_avatar():
    """
    Permite ao usuário selecionar um avatar já desbloqueado na sua conta.
    - Acesso: Autenticado.
    """
    current_user_id = get_jwt_identity()
    data = request.get_json()
    avatar_url = data.get('avatar_url')
    result, error, status = AuthService.select_avatar(current_user_id, avatar_url)
    if error:
        return jsonify(error), status
    return jsonify(result), status

@auth_bp.route('/user/change-password', methods=['POST'])
@cross_origin()
@jwt_required()
def change_password():
    """
    Permite alterar a senha do usuário logado (requer a senha antiga para confirmar).
    - Acesso: Autenticado.
    """
    current_user_id = get_jwt_identity()
    data = request.get_json()
    result, error, status = AuthService.change_password(current_user_id, data)
    if error:
        return jsonify(error), status
    return jsonify(result), status

@auth_bp.route('/user/delete_account', methods=['DELETE'])
@cross_origin()
@jwt_required()
def delete_account():
    """
    Exclui a conta do usuário logado permanentemente, exigindo a senha atual por segurança.
    - Acesso: Autenticado.
    """
    current_user_id = get_jwt_identity()
    data = request.get_json()
    result, error, status = AuthService.delete_account(current_user_id, data)
    if error:
        return jsonify(error), status
    return jsonify(result), status

@auth_bp.route('/user/location-info', methods=['GET'])
@jwt_required()
def get_user_location_info():
    """
    Retorna a localização salva no banco (cache), sem chamar API externa.
    Muito mais rápido e evita bloqueios (Rate Limit) da API de GeoIP.
    """
    current_user_id = get_jwt_identity()
    result, error, status = AuthService.get_user_location_info(current_user_id)
    if error:
        return jsonify(error), status
    return jsonify(result), status
    
@auth_bp.route('/user/avatar', methods=['PUT'])
@jwt_required()
def update_avatar():
    """
    Atualiza a foto de perfil base do usuário logado.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    new_avatar_url = data.get('avatar_url')
    result, error, status = AuthService.update_avatar(user_id, new_avatar_url)
    if error:
        return jsonify(error), status
    return jsonify(result), status


@auth_bp.route('/user/unlock-location-avatar', methods=['POST'])
@jwt_required()
def unlock_location_avatar():
    """
    Desbloqueia um avatar especial baseado na região (país) identificada pelo IP do usuário.
    - Acesso: Autenticado.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    result, error, status = AuthService.unlock_location_avatar(user_id, data)
    if error:
        return jsonify(error), status
    return jsonify(result), status
    
    
# --- 1. ROTA NOVA: SALVAR STATUS DO TUTORIAL ---
@auth_bp.route('/user/update-onboarding', methods=['POST'])
@jwt_required()
def update_onboarding():
    """
    Atualiza o estado (dict) do processo de onboarding (ex: Joyride/Tutoriais) do usuário,
    permitindo que o sistema lembre quais tutoriais ele já assistiu.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    tour_key = data.get('tour_key')
    result, error, status = AuthService.update_onboarding(user_id, tour_key)
    if error:
        return jsonify(error), status
    return jsonify(result), status
    
@auth_bp.route('/forgot-password', methods=['POST'])
@cross_origin()
def forgot_password():
    """
    Gera um token seguro e envia um e-mail de recuperação de senha.
    - Acesso: Público.
    """
    data = request.get_json()
    frontend_url = current_app.config.get('FRONTEND_URL')
    result, error, status = AuthService.forgot_password(data, frontend_url)
    if error:
        return jsonify(error), status
    return jsonify(result), status

@auth_bp.route('/reset-password/<token>', methods=['POST'])
@cross_origin() # <--- IMPORTANTE
def reset_password(token):
    """
    Redefine a senha do usuário verificando o token recebido pelo e-mail.
    - Acesso: Público, mas protegido pelo Token JWT/Signature de uso único.
    """
    data = request.get_json()
    password = data.get('password')
    result, error, status = AuthService.reset_password(token, password)
    if error:
        return jsonify(error), status
    return jsonify(result), status

@auth_bp.route('/user/api-keys', methods=['GET'])
@jwt_required()
def get_api_keys():
    """
    Retorna o status ou chaves mascaradas das APIs (ex: Gemini) do usuário (BYOK).
    """
    user_id = get_jwt_identity()
    result, error, status = AuthService.get_api_keys(user_id)
    if error:
        return jsonify(error), status
    return jsonify(result), status

@auth_bp.route('/user/api-keys', methods=['POST'])
@jwt_required()
def update_api_keys():
    """
    Salva uma nova API Key fornecida pelo usuário no banco de dados (Bring Your Own Key).
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    result, error, status = AuthService.update_api_keys(user_id, data)
    if error:
        return jsonify(error), status
    return jsonify(result), status

@auth_bp.route('/user/test-api-key', methods=['POST'])
@jwt_required()
def test_api_key():
    """
    Testa uma API Key do Gemini (ou OpenAI) antes de salvá-la no banco de dados.
    """
    data = request.get_json()
    result, error, status = AuthService.test_api_key(data)
    if error:
        return jsonify(error), status
    return jsonify(result), status
