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
    [Arquitetura]
    Por que: Isolar o registro de rotas (Registry Pattern) no Init evita dependências circulares 
    durante a instanciação do app e garante que o mapeamento de prefixos (/api/...) fique centralizado.
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