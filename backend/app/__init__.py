# backend/app/__init__.py

from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# 1. Crie as instâncias das extensões FORA da função, sem associá-las a um app
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    """
    Função 'Application Factory'. Todo o setup da aplicação acontece aqui dentro.
    """
    app = Flask(__name__)

    # 2. Carregue a configuração a partir de um arquivo/objeto
    # Certifique-se de que você tem um arquivo 'config.py' com uma classe 'Config'
    from .config import Config
    app.config.from_object(Config)

    # 3. Associe as instâncias das extensões com o objeto 'app'
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)  # Habilita o CORS globalmente

    # Importa e configura o JWT
    from .utils.auth_utils import configure_jwt
    configure_jwt(app)
    
    # É CRUCIAL que a importação e o registro dos Blueprints (rotas)
    # aconteçam DENTRO da função create_app, depois que tudo foi inicializado.
    with app.app_context():
        # 4. Importe e registre os Blueprints aqui
        from .routes import register_blueprints
        register_blueprints(app)

    # 5. Importe os modelos para que a migração os reconheça
    from . import models

    # 6. Configure o logging (se tiver)
    from .utils.logging import configure_logging
    configure_logging(app)

    return app