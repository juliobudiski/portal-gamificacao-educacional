"""
Módulo de Inicialização das Rotas (Routes Init)
Responsável por importar todos os blueprints (grupos de rotas) da aplicação 
e registrá-los no objeto principal do Flask (app).
Centraliza o roteamento, facilitando a organização das URLs da API.
"""

from .auth import auth_bp
from .activities import activity_bp
from .admin import admin_bp
from .classes import class_bp
from .progress import progress_bp
from .analytics import analytics_bp
from .student import student_bp
from .log import log_bp
from .rankings import rankings_bp
from .content_editor import content_editor_bp
from .medals import medals_bp
from .forum import forum_bp
from .chat import chat_bp
from .contact import contact_bp

def register_blueprints(app):
    """
    Registra todos os blueprints da aplicação associando a um prefixo de URL.
    
    :param app: Instância da aplicação Flask
    
    Cada blueprint agrupa rotas relacionadas a um domínio específico.
    Por exemplo, todas as rotas em auth_bp responderão no prefixo '/api/auth'.
    """
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(activity_bp, url_prefix='/api/activities')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(class_bp, url_prefix='/api/classes')
    app.register_blueprint(progress_bp, url_prefix='/api/progress')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(student_bp, url_prefix='/api/student')
    app.register_blueprint(log_bp, url_prefix='/api/log')
    app.register_blueprint(rankings_bp, url_prefix='/api/rankings')
    app.register_blueprint(content_editor_bp, url_prefix='/api/content_editor')
    app.register_blueprint(medals_bp, url_prefix='/api/medals')
    app.register_blueprint(forum_bp, url_prefix='/api/forum')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(contact_bp, url_prefix='/api/contact')