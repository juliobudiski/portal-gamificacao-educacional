"""
Fixtures Globais de Teste (Hermetic Enterprise Fixtures)
Garante banco em memória SQLite isolado, transações limpas e geradores de tokens JWT.
Execução ultra-rápida (in-memory) sem tocar no banco de desenvolvimento ou produção.
"""

import os
import pytest
from app import create_app, db
from app.models import User, Class, Enrollment, Team, Activity, ContactMessage
from app.utils.resilience.circuit_breaker import CircuitBreakerRegistry
from app.utils.resilience.idempotency import clear_idempotency_cache
from flask_jwt_extended import create_access_token

@pytest.fixture(scope="session")
def app():
    """Cria uma instância da aplicação Flask configurada exclusivamente para testes."""
    os.environ["FLASK_ENV"] = "testing"
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    os.environ["SECRET_KEY"] = "test-secret-key-gamificaedu"
    os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-gamificaedu"
    os.environ["RUN_SCHEDULER"] = "false"

    flask_app = create_app()
    flask_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "WTF_CSRF_ENABLED": False,
        "SCHEDULER_API_ENABLED": False
    })

    with flask_app.app_context():
        yield flask_app

@pytest.fixture(scope="function", autouse=True)
def db_session(app):
    """
    Cria um banco de dados limpo e efêmero a cada teste.
    Garante teardown 100% automático e hermetismo total.
    """
    with app.app_context():
        # Limpa caches de resiliência
        clear_idempotency_cache()
        CircuitBreakerRegistry.reset_all()

        db.create_all()
        yield db.session
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Cliente de testes HTTP para requisições na API."""
    return app.test_client()

@pytest.fixture
def create_user(db_session):
    """Factory fixture para criar usuários dinamicamente."""
    from werkzeug.security import generate_password_hash

    def _create_user(name, email, password="Password123!", role="aluno"):
        user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
            role=role,
            status="ACTIVE"
        )
        db.session.add(user)
        db.session.commit()
        return user
    return _create_user

@pytest.fixture
def student_user(create_user):
    return create_user("aluno_teste", "aluno@gamifica.edu", role="aluno")

@pytest.fixture
def professor_user(create_user):
    return create_user("prof_teste", "prof@gamifica.edu", role="professor")

@pytest.fixture
def admin_user(create_user):
    return create_user("admin_teste", "admin@gamifica.edu", role="admin")

@pytest.fixture
def student_auth_headers(app, student_user):
    with app.app_context():
        token = create_access_token(identity=str(student_user.id))
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

@pytest.fixture
def professor_auth_headers(app, professor_user):
    with app.app_context():
        token = create_access_token(identity=str(professor_user.id))
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

@pytest.fixture
def admin_auth_headers(app, admin_user):
    with app.app_context():
        token = create_access_token(identity=str(admin_user.id))
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
