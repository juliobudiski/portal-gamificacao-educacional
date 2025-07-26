# backend/app/utils/auth_utils.py
from flask_jwt_extended import JWTManager

jwt = JWTManager()

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    from ..models import User
    return User.query.get(identity)

def configure_jwt(app):
    jwt.init_app(app)