"""
Módulo de Configuração (Config)

Define as variáveis de ambiente, configurações do banco de dados (SQLAlchemy),
chaves secretas (JWT, Flask) e diretórios do sistema.
"""
import os
from dotenv import load_dotenv
from datetime import timedelta
load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Otimização de concorrência para muitos usuários simultâneos
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': int(os.getenv('DB_POOL_SIZE', 20)),
        'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', 20)),
        'pool_timeout': 30,
        'pool_recycle': 1800
    }
    
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads/avatars')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    GOOGLE_CLIENT_ID_BACKEND = os.getenv('GOOGLE_CLIENT_ID_BACKEND')
    
    if not GOOGLE_CLIENT_ID_BACKEND:
        raise ValueError("A variável de ambiente GOOGLE_CLIENT_ID_BACKEND não foi definida!")
