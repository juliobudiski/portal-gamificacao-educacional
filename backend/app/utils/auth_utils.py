# backend/app/utils/auth_utils.py
from flask import jsonify
from flask_jwt_extended import JWTManager

jwt = JWTManager()

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data.get("sub")
    if not identity:
        return None
    from ..models import User
    return User.query.get(identity)

@jwt.invalid_token_loader
def invalid_token_callback(reason):
    """
    Retorna resposta limpa de 401 para tokens malformados em vez de crashar a requisição.
    """
    return jsonify({"msg": "Token inválido ou malformado.", "detail": str(reason)}), 401

@jwt.unauthorized_loader
def missing_token_callback(reason):
    return jsonify({"msg": "Cabeçalho de autorização ausente.", "detail": str(reason)}), 401

def configure_jwt(app):
    jwt.init_app(app)