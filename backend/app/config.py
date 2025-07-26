import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads/avatars')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    GOOGLE_CLIENT_ID_BACKEND = os.getenv('GOOGLE_CLIENT_ID')