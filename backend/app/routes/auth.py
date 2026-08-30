# backend/app/routes/auth.py

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

# Rota para registrar um novo usuário
@auth_bp.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    result, error, status = AuthService.register_user(data, request.remote_addr, request.headers.get("User-Agent"))
    if error:
        return jsonify(error), status
    return jsonify(result), status

# Rota para login de usuário com e-mail e senha
@auth_bp.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    result, error, status = AuthService.login_user(data, request.remote_addr, request.headers.get("User-Agent"))
    if error:
        return jsonify(error), status
    return jsonify(result), status


    

# Rota para professores atualizarem informações de instituição e disciplina
@auth_bp.route('/user/update-profile', methods=['POST'])
@cross_origin()
@jwt_required()
def update_profile():
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
    Muito mais rápido e evita bloqueios.
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
    Atualiza a foto de perfil do usuário logado.
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
    user_id = get_jwt_identity()
    data = request.get_json()
    result, error, status = AuthService.unlock_location_avatar(user_id, data)
    if error:
        return jsonify(error), status
    return jsonify(result), status
    
    
# --- 1. ROTA NOVA: SALVAR STATUS DO TUTORIAL ---
# Adicione esta rota no final do arquivo (antes ou depois de unlock-location-avatar)
@auth_bp.route('/user/update-onboarding', methods=['POST'])
@jwt_required()
def update_onboarding():
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
    data = request.get_json()
    frontend_url = current_app.config.get('FRONTEND_URL')
    result, error, status = AuthService.forgot_password(data, frontend_url)
    if error:
        return jsonify(error), status
    return jsonify(result), status

@auth_bp.route('/reset-password/<token>', methods=['POST'])
@cross_origin() # <--- IMPORTANTE
def reset_password(token):
    data = request.get_json()
    password = data.get('password')
    result, error, status = AuthService.reset_password(token, password)
    if error:
        return jsonify(error), status
    return jsonify(result), status
@auth_bp.route('/user/api-keys', methods=['GET'])
@jwt_required()
def get_api_keys():
    user_id = get_jwt_identity()
    result, error, status = AuthService.get_api_keys(user_id)
    if error:
        return jsonify(error), status
    return jsonify(result), status

@auth_bp.route('/user/api-keys', methods=['POST'])
@jwt_required()
def update_api_keys():
    user_id = get_jwt_identity()
    data = request.get_json()
    result, error, status = AuthService.update_api_keys(user_id, data)
    if error:
        return jsonify(error), status
    return jsonify(result), status
