# backend/app/routes/__init__.py
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

def register_blueprints(app):
    """
    Registra todos os blueprints da aplicação.
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