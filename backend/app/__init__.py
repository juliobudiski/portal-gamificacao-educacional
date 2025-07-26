# backend/app/__init__.py
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
import sys

# 1. Inicialize as extensões aqui, sem a aplicação
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    """
    Application factory function.
    """
    app = Flask(__name__)
    
    # 2. Carregue a configuração a partir do objeto
    from .config import Config
    app.config.from_object(Config)

    # 3. Inicialize as extensões com a aplicação
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    from .utils.auth_utils import configure_jwt
    configure_jwt(app)

    # 4. Importe e registre os Blueprints
    from .routes import register_blueprints
    register_blueprints(app)
    
    # 5. Importe os modelos para que a migração os reconheça
    from . import models

    # 6. Configure o logging
    from .utils.logging import configure_logging
    configure_logging(app)

    # print("--- ROTAS REGISTRADAS ---", file=sys.stderr)
    # print(app.url_map, file=sys.stderr)
    
    return app