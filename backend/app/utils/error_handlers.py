# backend/app/utils/error_handlers.py
from flask import jsonify
from . import jwt

@jwt.unauthorized_loader
def unauthorized_response(callback):
    return jsonify({"message": "Token de acesso ausente ou inválido."}), 401

@jwt.invalid_token_loader
def invalid_token_response(error):
    return jsonify({"message": "Token inválido ou malformado."}), 422

@jwt.expired_token_loader
def expired_token_response(jwt_header, jwt_payload):
    return jsonify({"message": "Token de acesso expirado."}), 401