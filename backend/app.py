# -*- coding: utf-8 -*-

# --- Importações de Bibliotecas ---
# Flask e extensões para criar o servidor web, lidar com CORS, banco de dados e autenticação JWT
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Text

# Módulos padrão do Python para manipulação do sistema operacional, variáveis de ambiente e tempo
import os
import logging
from dotenv import load_dotenv
from datetime import timedelta

# Werkzeug para hashing de senhas
from werkzeug.security import generate_password_hash, check_password_hash

# Bibliotecas do Google para autenticação com o Google Sign-In
from google.oauth2 import id_token
from google.auth.transport import requests

# Flask-JWT-Extended para gerenciar tokens de autenticação
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, current_user
)

# --- Configuração Inicial ---

# Carrega as variáveis de ambiente do arquivo .env para a aplicação
load_dotenv()

# Cria a instância principal da aplicação Flask
app = Flask(__name__)

# Configuração do Logging
# Define o nível de log para DEBUG, para capturar todas as informações durante o desenvolvimento.
# Em produção, pode ser alterado para INFO ou WARNING.
logging.basicConfig(level=logging.DEBUG)
handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)
app.logger.addHandler(handler)


# Habilita o CORS (Cross-Origin Resource Sharing) para permitir requisições de diferentes origens (ex: frontend em React)
CORS(app)

# --- Configurações da Aplicação Flask ---
# Define a URI do banco de dados a partir da variável de ambiente DATABASE_URL
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
# Desativa o rastreamento de modificações do SQLAlchemy para economizar recursos
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Chave secreta para proteger a aplicação contra ataques CSRF (Cross-Site Request Forgery)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
# Chave secreta para assinar os tokens JWT, garantindo sua integridade
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')


# --- Inicialização das Extensões ---
# Inicializa o JWTManager para gerenciar a autenticação baseada em token
jwt = JWTManager(app)
# Inicializa o SQLAlchemy para interagir com o banco de dados
db = SQLAlchemy(app)
# Inicializa o Flask-Migrate para gerenciar as migrações do esquema do banco de dados
migrate = Migrate(app, db)

# Define o Client ID do Google para o backend, usado para verificar os tokens do Google Sign-In
GOOGLE_CLIENT_ID_BACKEND = os.getenv('GOOGLE_CLIENT_ID')

# --- Modelos de Banco de Dados (SQLAlchemy) ---

# Modelo para a tabela 'user'
class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    google_id = db.Column(db.String(120), unique=True, nullable=True)
    name = db.Column(db.String(100), nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(50), default='aluno', nullable=False)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(50), nullable=True)
    game_preferences = db.Column(db.String(500), nullable=True)
    learning_preferences = db.Column(db.String(500), nullable=True)
    institution_name = db.Column(db.String(255), nullable=True)
    discipline = db.Column(db.String(100), nullable=True)

    def __repr__(self):
        return f'<User {self.email}>'

    # Converte o objeto User para um dicionário, útil para serialização em JSON
    # Este método DEVE retornar APENAS os atributos do User.
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'institution_name': self.institution_name,
            'discipline': self.discipline
        }

# Modelo para a tabela 'activity' (Atividade Gamificada)
# Modelo para a tabela 'activity' (Atividade Gamificada)
class Activity(db.Model):
    __tablename__ = 'activity'

    id = db.Column(db.Integer, primary_key=True)
    professor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)

    # Campos JSONB para armazenar dados estruturados da gamificação
    current_scenario = db.Column(JSONB, nullable=True)
    desired_scenario = db.Column(JSONB, nullable=True)
    activity_planning = db.Column(JSONB, nullable=True)
    player_profile = db.Column(JSONB, nullable=True)
    game_elements = db.Column(JSONB, nullable=True)
    rewards_offered = db.Column(JSONB, nullable=True)
    rewarded_actions = db.Column(JSONB, nullable=True)
    gamification_rules = db.Column(JSONB, nullable=True)

    area_knowledge = db.Column(db.String(100), nullable=True)
    is_public = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Relacionamento com o modelo User (um professor tem muitas atividades)
    professor = db.relationship('User', backref='activities', lazy=True)

    # Converte o objeto Activity para um dicionário
    def to_dict(self):
        return {
            'id': self.id,
            'professor_id': self.professor_id,
            'title': self.title,
            'description': self.description,
            'currentScenario': self.current_scenario,
            'desiredScenario': self.desired_scenario,
            'activityPlanning': self.activity_planning,
            'playerProfile': self.player_profile,
            'gameElements': self.game_elements,
            'rewardsOffered': self.rewards_offered,
            'rewardedActions': self.rewarded_actions,
            'gamificationRules': self.gamification_rules,
            'areaKnowledge': self.area_knowledge,
            'isPublic': self.is_public,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            # Incluir dados do professor para facilitar no frontend
            'professor_name': self.professor.name,
            'professor_email': self.professor.email,
        }

# --- Funções de Callback do JWT ---

# Esta função é chamada sempre que uma rota protegida é acessada.
# Ela usa o 'sub' (subject, que é o ID do usuário) do token para carregar o objeto User do banco.
# Isso permite que usemos a variável `current_user` nas rotas protegidas.
@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    app.logger.debug(f"Procurando usuário com ID: {identity}")
    return User.query.filter_by(id=identity).one_or_none()


# --- Dados dos Templates Predefinidos ---
# Estes templates são definidos diretamente no backend como uma lista de dicionários.
# Eles contêm os dados que serão pré-preenchidos no formulário de criação de atividade.
PREDEFINED_TEMPLATES = [
    {
        "id": "quiz-requisitos",
        "name": "Quiz de Requisitos Funcionais e Não Funcionais",
        "description": "Um template para criar um quiz rápido sobre requisitos de software, ideal para revisão de conceitos.",
        "icon": "🧠",
        "data": {
            "title": "Quiz: Requisitos de Software",
            "description": "Avalie seu conhecimento sobre requisitos funcionais e não funcionais com este quiz interativo.",
            "areaKnowledge": "Engenharia de Software",
            "currentScenario": {
                "problems": ["Dificuldades na compreensão de conceitos complexos de programação.", "Dificuldades em aplicar as teorias aprendidas na prática."],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": ["Aumentar a retenção de conhecimentos e habilidades adquiridos ao longo do curso", "Promover a participação ativa dos alunos nas atividades de aprendizagem"],
                "otherObjective": ""
            },
            "activityPlanning": {
                "characteristics": ["Online", "Individual", "Formativa (atividade de prática ou revisão)"],
                "participantsQuantity": "Turma toda",
                "expectedDuration": "30 minutos",
                "location": "Online",
                "otherInfo": "Pode ser usado como atividade pré-aula ou pós-aula."
            },
            "playerProfile": {
                "selectedProfiles": ["Jogador de realização", "Jogador competitivo"]
            },
            "gameElements": {
                "selectedElements": ["Níveis", "Sistema de pontuação", "Feedback claro sobre o desempenho", "Sistema de classificação e ranking", "Narrativas envolventes"],
                "otherElement": "",
                "narrativeTitle": "Desafio do Conhecimento",
                "narrativeContent": "Embarque em uma jornada para provar seu domínio sobre os requisitos de software, superando cada nível de dificuldade."
            },
            "rewardsOffered": {
                "selectedRewards": ["Pontos de bônus para a participação na aula.", "Conquistas digitais para metas alcançadas."],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": ["Responder corretamente a perguntas de revisão de material", "Atingir uma pontuação elevada em um jogo educacional"],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": ["Respeite as regras do jogo e as decisões do professor em todas as atividades.", "Busque sempre aprender e se esforçar para alcançar seus objetivos em cada atividade."],
                "specificRules": "Cada questão tem um tempo limite de 30 segundos. Respostas corretas concedem pontos, incorretas não."
            }
        }
    },
    {
        "id": "desafio-teste-software",
        "name": "Desafio de Teste de Software",
        "description": "Um cenário prático para identificar e propor soluções para defeitos em software.",
        "icon": "🐛",
        "data": {
            "title": "Desafio: Identificação de Bugs",
            "description": "Participe de um desafio prático para encontrar e documentar bugs em um sistema simulado.",
            "areaKnowledge": "Engenharia de Software",
            "currentScenario": {
                "problems": ["Dificuldades em aplicar as teorias aprendidas na prática.", "Dificuldades em lidar com ferramentas de desenvolvimento complexas."],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": ["Incentivar a aplicação prática dos conhecimentos teóricos em projetos reais", "Desenvolver habilidades cognitivas, sociais e de aprendizagem"],
                "otherObjective": ""
            },
            "activityPlanning": {
                "characteristics": ["Presencial", "Em grupos", "Somativa (avaliação)", "Foco em projetos ou desenvolvimento de software real"],
                "participantsQuantity": "Grupos de 3-4 alunos",
                "expectedDuration": "4 horas",
                "location": "Laboratório de Informática",
                "otherInfo": "Requer computadores com ambiente de desenvolvimento configurado."
            },
            "playerProfile": {
                "selectedProfiles": ["Jogador cooperativo", "Jogador de realização"]
            },
            "gameElements": {
                "selectedElements": ["Níveis", "Reconhecimento", "Progressão baseada em habilidade", "Cooperação", "Objetivo (missão, meta do jogo)", "Narrativas envolventes"],
                "otherElement": "",
                "narrativeTitle": "Caça aos Bugs",
                "narrativeContent": "A cidade digital está sob ataque de bugs traiçoeiros! Sua equipe de elite de testadores é a única esperança para restaurar a ordem."
            },
            "rewardsOffered": {
                "selectedRewards": ["Vantagens para jogos e desafios.", "Certificados digitais.", "Destaque na apresentação de trabalhos."],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": ["Colaboração com outros alunos em projetos de grupo", "Demonstrar pensamento crítico em tarefas desafiadoras", "Apresentar um trabalho com excelência"],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": ["Seja respeitoso e colaborativo com outros jogadores em todas as atividades.", "Comunique-se com outros jogadores de forma clara e objetiva em todas as atividades."],
                "specificRules": "Cada bug identificado e documentado corretamente concede pontos. A equipe com mais pontos vence."
            }
        }
    },
    {
        "id": "estudo-caso-padroes-projeto",
        "name": "Estudo de Caso de Padrões de Projeto",
        "description": "Analise um problema de design de software e aplique padrões de projeto para uma solução elegante.",
        "icon": "📐",
        "data": {
            "title": "Estudo de Caso: Padrões de Projeto",
            "description": "Resolva um problema de design de software aplicando padrões de projeto GoF.",
            "areaKnowledge": "Engenharia de Software",
            "currentScenario": {
                "problems": ["Dificuldades em aplicar as teorias aprendidas na prática.", "Dificuldades na compreensão de conceitos complexos de programação."],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": ["Incentivar a aplicação prática dos conhecimentos teóricos em projetos reais", "Estimular a criatividade e a inovação"],
                "otherObjective": ""
            },
            "activityPlanning": {
                "characteristics": ["Individual", "Online", "Somativa (avaliação)"],
                "participantsQuantity": "Individual",
                "expectedDuration": "2 horas",
                "location": "Online ou Presencial",
                "otherInfo": "Pode ser adaptado para trabalho em grupo."
            },
            "playerProfile": {
                "selectedProfiles": ["Jogador de realização", "Jogador imersivo"]
            },
            "gameElements": {
                "selectedElements": ["Sistema de pontuação", "Feedback claro sobre o desempenho", "Narrativas envolventes"],
                "otherElement": "",
                "narrativeTitle": "O Arquiteto de Software",
                "narrativeContent": "Você é um arquiteto de software renomado, e um novo cliente apresenta um desafio de design. Sua missão é criar a solução mais robusta e elegante usando os padrões de projeto corretos."
            },
            "rewardsOffered": {
                "selectedRewards": ["Pontos de bônus para a participação na aula.", "Reconhecimento público (por exemplo, menção em redes sociais ou na frente da turma)."],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": ["Apresentar um trabalho com excelência", "Demonstrar pensamento crítico em tarefas desafiadoras"],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": ["Respeite as regras e políticas da instituição em todas as atividades.", "Busque sempre a supervisão do professor em todas as atividades."],
                "specificRules": "A solução será avaliada pela correção da aplicação do padrão, clareza do código e justificativa das escolhas."
            }
        }
    }
]


# --- Rotas da API ---

# Rota para verificar o status da API
@app.route('/api/status', methods=['GET'])
def get_status():
    app.logger.info("Rota /api/status acessada.")
    return jsonify({"status": "online", "message": "Backend do Portal de Gamificação está funcionando!"}), 200

# Rota para registrar um novo usuário
@app.route('/api/register', methods=['POST'])
def register_user():
    app.logger.info("Tentativa de registro de usuário iniciada.")
    data = request.get_json()
    app.logger.debug(f"Dados recebidos para registro: {data}")

    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role', 'aluno')

    if not email or not password or not name:
        app.logger.warning("Falha no registro: campos obrigatórios ausentes.")
        return jsonify({"message": "Nome, e-mail e senha são obrigatórios."}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        app.logger.warning(f"Falha no registro: e-mail '{email}' já cadastrado.")
        return jsonify({"message": "E-mail já cadastrado."}), 409

    hashed_password = generate_password_hash(password)
    new_user = User(email=email, password_hash=hashed_password, name=name, role=role)

    try:
        db.session.add(new_user)
        db.session.commit()
        app.logger.info(f"Usuário '{email}' registrado com sucesso com ID: {new_user.id}")

        # Cria claims adicionais para incluir no token JWT
        additional_claims = {
            "email": new_user.email, "name": new_user.name, "role": new_user.role,
            "profile_picture": new_user.profile_picture,
            "institutionName": new_user.institution_name,
            "discipline": new_user.discipline
        }
        access_token = create_access_token(identity=str(new_user.id), additional_claims=additional_claims)

        user_data = {
            "id": new_user.id, "email": new_user.email, "name": new_user.name, "role": new_user.role,
            "profile_picture": new_user.profile_picture,
            "institutionName": new_user.institution_name,
            "discipline": new_user.discipline,
            "token": access_token
        }
        return jsonify(access_token=access_token, user=user_data), 201

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erro ao registrar usuário '{email}': {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro interno ao cadastrar usuário: {str(e)}"}), 500

# Rota para login de usuário com e-mail e senha
@app.route('/api/login', methods=['POST'])
def login_user():
    app.logger.info("Tentativa de login iniciada.")
    data = request.get_json()
    app.logger.debug(f"Dados recebidos para login: {data.get('email')}")

    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password_hash, password):
        app.logger.info(f"Login bem-sucedido para o usuário: {email}")
        additional_claims = {
            "email": user.email, "name": user.name, "role": user.role,
            "profile_picture": user.profile_picture,
            "institutionName": user.institution_name,
            "discipline": user.discipline
        }
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        
        user_data = {
            "id": user.id, "email": user.email, "name": user.name, "role": user.role,
            "profile_picture": user.profile_picture, "google_id": user.google_id,
            "institutionName": user.institution_name, "discipline": user.discipline,
            "token": access_token
        }
        return jsonify(access_token=access_token, user=user_data), 200
    else:
        app.logger.warning(f"Falha no login para o e-mail: {email}. Credenciais inválidas.")
        return jsonify({"message": "Credenciais inválidas."}), 401

# Rota para autenticação via Google Sign-In
@app.route('/api/auth/google', methods=['POST'])
@cross_origin()
def google_auth():
    app.logger.info("Tentativa de autenticação com Google iniciada.")
    data = request.get_json()
    token = data.get('id_token')
    selected_role = data.get('role', 'aluno')
    app.logger.debug(f"Token do Google recebido. Role selecionada: {selected_role}")

    if not token:
        app.logger.warning("Token do Google não fornecido na requisição.")
        return jsonify({"message": "Token do Google não fornecido."}), 400

    try:
        # Verifica o token com o backend do Google
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID_BACKEND)
        app.logger.debug(f"Informações do token Google verificado: {idinfo.get('email')}")

        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')

        user = User.query.filter_by(google_id=google_id).first()
        status_code = 200

        if user:
            app.logger.info(f"Usuário encontrado pelo google_id: {email}")
            if user.role != selected_role:
                app.logger.info(f"Atualizando role do usuário {email} de '{user.role}' para '{selected_role}'.")
                user.role = selected_role
                db.session.commit()
        else:
            app.logger.info(f"Usuário não encontrado pelo google_id. Buscando por e-mail: {email}")
            existing_email_user = User.query.filter_by(email=email).first()
            if existing_email_user:
                app.logger.info(f"Usuário existente encontrado por e-mail. Vinculando conta Google para {email}.")
                existing_email_user.google_id = google_id
                existing_email_user.name = name
                existing_email_user.profile_picture = picture
                if existing_email_user.role != selected_role:
                    app.logger.info(f"Atualizando role do usuário {email} de '{existing_email_user.role}' para '{selected_role}'.")
                    existing_email_user.role = selected_role
                db.session.commit()
                user = existing_email_user
            else:
                app.logger.info(f"Nenhum usuário encontrado. Criando novo usuário Google para {email}.")
                user = User(
                    email=email, password_hash='google_auth_only', google_id=google_id,
                    name=name, profile_picture=picture, role=selected_role
                )
                db.session.add(user)
                db.session.commit()
                status_code = 201

        app.logger.info(f"Gerando token de acesso para o usuário {user.email}")
        additional_claims = {
            "email": user.email, "name": user.name, "role": user.role,
            "profile_picture": user.profile_picture,
            "institutionName": user.institution_name,
            "discipline": user.discipline
        }
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

        user_data = {
            "id": user.id, "email": user.email, "name": user.name, "role": user.role,
            "profile_picture": user.profile_picture, "google_id": user.google_id,
            "institutionName": user.institution_name, "discipline": user.discipline,
        }
        return jsonify(access_token=access_token, user=user_data), status_code

    except ValueError as e:
        app.logger.error(f"Erro de validação do token Google: {str(e)}", exc_info=True)
        return jsonify({"message": f"Token do Google inválido ou expirado. {str(e)}"}), 401
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erro inesperado na autenticação Google: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro interno no servidor durante autenticação Google: {str(e)}"}), 500

# Rota protegida de exemplo
@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    app.logger.info(f"Rota protegida acessada pelo usuário ID: {current_user.id}")
    return jsonify({"message": f"Olá, usuário {current_user.name}! Você acessou uma rota protegida."}), 200

# Rota para alterar a senha do usuário
@app.route('/api/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    app.logger.info(f"Usuário ID {current_user_id} tentando alterar a senha.")
    data = request.get_json()
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')

    if not current_password or not new_password:
        app.logger.warning(f"Tentativa de alterar senha do ID {current_user_id} falhou: senhas não fornecidas.")
        return jsonify({"message": "Senha atual e nova senha são obrigatórios."}), 400

    user = User.query.get(current_user_id)

    if not user:
        app.logger.error(f"Tentativa de alterar senha para usuário inexistente: ID {current_user_id}")
        return jsonify({"message": "Usuário não encontrado."}), 404

    if user.password_hash == 'google_auth_only' or not check_password_hash(user.password_hash, current_password):
        app.logger.warning(f"Tentativa de alterar senha do ID {current_user_id} falhou: senha atual incorreta.")
        return jsonify({"message": "Senha atual incorreta ou usuário Google."}), 401
    
    if len(new_password) < 6:
        app.logger.warning(f"Tentativa de alterar senha do ID {current_user_id} falhou: nova senha muito curta.")
        return jsonify({"message": "A nova senha deve ter pelo menos 6 caracteres."}), 400

    user.password_hash = generate_password_hash(new_password)

    try:
        db.session.commit()
        app.logger.info(f"Senha do usuário ID {current_user_id} alterada com sucesso.")
        return jsonify({"message": "Senha alterada com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erro ao alterar senha do usuário {current_user_id}: {str(e)}", exc_info=True)
        return jsonify({"message": "Erro interno ao alterar a senha."}), 500

# Rota para professores atualizarem informações de instituição e disciplina
@app.route('/api/user/update-profile', methods=['POST'])
@cross_origin()
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    app.logger.info(f"Usuário ID {current_user_id} tentando atualizar o perfil.")
    
    user = User.query.get(current_user_id)

    if not user:
        app.logger.error(f"Tentativa de atualizar perfil para usuário inexistente: ID {current_user_id}")
        return jsonify({"message": "Usuário não encontrado."}), 404

    if user.role != 'professor':
        app.logger.warning(f"Acesso negado para ID {current_user_id} na rota update-profile. Role: {user.role}")
        return jsonify({"message": "Acesso negado. Apenas professores podem atualizar essas informações."}), 403

    data = request.get_json()
    app.logger.debug(f"Dados recebidos para atualização do perfil do ID {current_user_id}: {data}")

    try:
        if 'institution_name' in data:
            user.institution_name = data['institution_name']
        if 'discipline' in data:
            user.discipline = data['discipline']
        
        db.session.commit()
        app.logger.info(f"Perfil do usuário ID {current_user_id} atualizado com sucesso.")

        # Recrie as claims adicionais com os dados MAIS RECENTES do objeto 'user'
        # após o commit no banco de dados.
        additional_claims = {
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "institutionName": user.institution_name, # <-- AGORA PEGA O VALOR ATUALIZADO
            "discipline": user.discipline # <-- AGORA PEGA O VALOR ATUALIZADO
        }
        new_access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

        # Opcional: Inclua também o objeto user completo na resposta para o frontend
        # Isso pode simplificar a lógica do frontend, embora o token já contenha os dados.
        user_data = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "google_id": user.google_id, # Inclua se aplicável
            "institutionName": user.institution_name,
            "discipline": user.discipline,
        }

        return jsonify({
            "message": "Informações do perfil atualizadas com sucesso!",
            "access_token": new_access_token,
            "user": user_data # <--- ADICIONADO
        }), 200


    except Exception as e:
        db.session.rollback()
        app.logger.error(f"ERRO CRÍTICO em update_profile para ID {current_user_id}: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro interno ao atualizar o perfil: {str(e)}"}), 500

# Rota para criar uma nova atividade gamificada
@app.route('/api/activities', methods=['POST'])
@cross_origin()
@jwt_required()
def create_activity():
    current_user_id = get_jwt_identity()
    app.logger.info(f"Usuário ID {current_user_id} tentando criar uma nova atividade.")
    
    user = User.query.get(current_user_id)

    if not user or user.role != 'professor':
        app.logger.warning(f"Acesso negado para ID {current_user_id} na criação de atividade. Role: {user.role if user else 'N/A'}")
        return jsonify({"message": "Acesso negado. Apenas professores podem criar atividades."}), 403

    data = request.get_json()
    app.logger.debug(f"Dados recebidos para nova atividade: {data}")

    if not data or not data.get('title'):
        app.logger.warning(f"Tentativa de criar atividade pelo ID {current_user_id} falhou: título ausente.")
        return jsonify({"message": "O título da atividade é obrigatório."}), 400

    try:
        new_activity = Activity(
            professor_id=user.id,
            title=data.get('title'),
            description=data.get('description', ''),
            current_scenario=data.get('currentScenario', {}),
            desired_scenario=data.get('desiredScenario', {}),
            activity_planning=data.get('activityPlanning', {}),
            player_profile=data.get('playerProfile', {}),
            game_elements=data.get('gameElements', {}),
            rewards_offered=data.get('rewardsOffered', {}),
            rewarded_actions=data.get('rewardedActions', {}),
            gamification_rules=data.get('gamificationRules', {}),
            area_knowledge=data.get('areaKnowledge'),
            is_public=data.get('isPublic', False)
        )
        db.session.add(new_activity)
        db.session.commit()
        app.logger.info(f"Atividade '{new_activity.title}' (ID: {new_activity.id}) criada com sucesso pelo usuário ID {current_user_id}.")

        return jsonify({"message": "Atividade criada com sucesso!", "activity": new_activity.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erro ao criar atividade para o usuário ID {current_user_id}: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro interno do servidor ao criar atividade: {str(e)}"}), 500

# Nova rota para obter templates predefinidos
@app.route('/api/templates', methods=['GET'])
@cross_origin()
@jwt_required()
def get_predefined_templates():
    app.logger.info(f"Usuário ID {current_user.id} solicitou a lista de templates predefinidos.")
    # Verifica se o usuário é um professor. Se não for, nega o acesso.
    if current_user.role != 'professor':
        app.logger.warning(f"Acesso negado à lista de templates para o ID {current_user.id}. Role: {current_user.role}")
        return jsonify({"message": "Acesso negado. Apenas professores podem acessar os templates."}), 403
    
    # Retorna a lista de templates predefinidos
    return jsonify(PREDEFINED_TEMPLATES), 200

# --- Endpoints de Administração ---

# Rota para buscar dados para o dashboard do admin
@app.route('/api/admin/dashboard_data', methods=['GET'])
@jwt_required()
def get_admin_dashboard_data():
    app.logger.info(f"Usuário ID {current_user.id} (Role: {current_user.role}) acessando dashboard de admin.")
    if current_user.role != 'admin':
        app.logger.warning(f"Acesso negado ao dashboard de admin para o usuário ID {current_user.id}.")
        return jsonify({"msg": "Acesso não autorizado: Apenas administradores podem acessar estes dados."}), 403

    total_users = User.query.count()
    total_professors = User.query.filter_by(role='professor').count()
    total_students = User.query.filter_by(role='aluno').count()
    total_activities = Activity.query.count()
    total_visits = 12345  # Valor mockado para visitas

    dashboard_data = {
        "total_users": total_users,
        "total_professors": total_professors,
        "total_students": total_students,
        "total_activities": total_activities,
        "total_visits": total_visits
    }
    app.logger.debug(f"Dados do dashboard de admin: {dashboard_data}")
    return jsonify(dashboard_data), 200

# Rota para listar todos os usuários (apenas admin)
@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    app.logger.info(f"Admin ID {current_user.id} solicitou a lista de todos os usuários.")
    if current_user.role != 'admin':
        app.logger.warning(f"Acesso negado à lista de usuários para o ID {current_user.id}.")
        return jsonify({"msg": "Acesso não autorizado: Apenas administradores podem acessar estes dados."}), 403

    users = User.query.all()
    users_data = [user.to_dict() for user in users]
    app.logger.info(f"Retornando {len(users_data)} usuários para o admin ID {current_user.id}.")
    return jsonify(users_data), 200

# Rota para atualizar um usuário (apenas admin)
@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@cross_origin()
def update_user(user_id):
    app.logger.info(f"Admin ID {current_user.id} tentando atualizar o usuário ID {user_id}.")
    if current_user.role != 'admin':
        app.logger.warning(f"Acesso negado para admin ID {current_user.id} ao tentar atualizar usuário ID {user_id}.")
        return jsonify({"msg": "Acesso não autorizado: Apenas administradores podem atualizar dados de usuários."}), 403

    user_to_update = User.query.get(user_id)
    if not user_to_update:
        app.logger.error(f"Admin ID {current_user.id} tentou atualizar um usuário inexistente: ID {user_id}")
        return jsonify({"msg": "Usuário não encontrado"}), 404

    data = request.get_json()
    app.logger.debug(f"Dados recebidos para atualização do usuário ID {user_id}: {data}")

    try:
        user_to_update.name = data.get('name', user_to_update.name)
        user_to_update.email = data.get('email', user_to_update.email)
        user_to_update.role = data.get('role', user_to_update.role)
        user_to_update.institution_name = data.get('institution_name', user_to_update.institution_name)
        user_to_update.discipline = data.get('discipline', user_to_update.discipline)
        
        db.session.commit()
        app.logger.info(f"Usuário ID {user_id} atualizado com sucesso pelo admin ID {current_user.id}.")
        return jsonify({"msg": "Usuário atualizado com sucesso", "user": user_to_update.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erro ao atualizar usuário ID {user_id}: {e}", exc_info=True)
        return jsonify({"msg": "Erro interno do servidor durante a atualização do usuário"}), 500

# Rota para deletar um usuário (apenas admin)
@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@cross_origin()
def delete_user(user_id):
    app.logger.info(f"Admin ID {current_user.id} tentando deletar o usuário ID {user_id}.")
    if current_user.role != 'admin':
        app.logger.warning(f"Acesso negado para admin ID {current_user.id} ao tentar deletar usuário ID {user_id}.")
        return jsonify({"msg": "Acesso não autorizado: Apenas administradores podem deletar contas de usuário."}), 403

    user_to_delete = User.query.get(user_id)
    if not user_to_delete:
        app.logger.error(f"Admin ID {current_user.id} tentou deletar um usuário inexistente: ID {user_id}")
        return jsonify({"msg": "User not found"}), 404

    try:
        db.session.delete(user_to_delete)
        db.session.commit()
        app.logger.info(f"Usuário ID {user_id} deletado com sucesso pelo admin ID {current_user.id}.")
        return jsonify({"msg": "Usuário deletado com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erro ao deletar usuário ID {user_id}: {e}", exc_info=True)
        return jsonify({"msg": "Erro interno do servidor durante a deleção do usuário"}), 500

# NEW: Rota para listar todas as atividades (apenas admin)
@app.route('/api/admin/activities', methods=['GET'])
@jwt_required()
def get_all_activities_admin():
    app.logger.info(f"Admin ID {current_user.id} solicitou a lista de todas as atividades.")
    if current_user.role != 'admin':
        app.logger.warning(f"Acesso negado à lista de atividades para o ID {current_user.id}.")
        return jsonify({"msg": "Acesso não autorizado: Apenas administradores podem acessar estes dados."}), 403

    # Busca todas as atividades e as retorna como dicionários
    activities = Activity.query.all()
    activities_data = [activity.to_dict() for activity in activities]
    app.logger.info(f"Retornando {len(activities_data)} atividades para o admin ID {current_user.id}.")
    return jsonify(activities_data), 200

# NEW: Rota para listar atividades de um professor específico (apenas professor logado ou admin)
@app.route('/api/professor/activities', methods=['GET'])
@jwt_required()
def get_professor_activities():
    current_user_id = get_jwt_identity()
    app.logger.info(f"Usuário ID {current_user_id} solicitou a lista de suas atividades.")
    
    # Permite que um admin veja as atividades de qualquer professor, ou um professor veja as suas próprias.
    # Se for um professor, filtra pelas atividades dele. Se for um admin, pode ver todas.
    # Por enquanto, esta rota será apenas para o professor logado ver as suas.
    # A lógica para admin ver todas as atividades já está na rota '/api/admin/activities'.
    if current_user.role != 'professor':
        app.logger.warning(f"Acesso negado à lista de atividades do professor para o ID {current_user.id}. Role: {current_user.role}")
        return jsonify({"msg": "Acesso negado. Apenas professores podem acessar suas atividades."}), 403

    activities = Activity.query.filter_by(professor_id=current_user_id).all()
    activities_data = [activity.to_dict() for activity in activities]
    app.logger.info(f"Retornando {len(activities_data)} atividades para o professor ID {current_user_id}.")
    return jsonify(activities_data), 200



# --- Handlers de Erro do JWT ---

@jwt.unauthorized_loader
def unauthorized_response(callback):
    app.logger.warning(f"Requisição não autorizada: {callback}")
    return jsonify({"message": "Token de acesso ausente ou inválido."}), 401

@jwt.invalid_token_loader
def invalid_token_response(error):
    app.logger.warning(f"Token inválido: {error}")
    return jsonify({"message": "Token inválido ou malformado."}), 422

@jwt.expired_token_loader
def expired_token_response(jwt_header, jwt_payload):
    app.logger.info(f"Token expirado para identidade: {jwt_payload.get('sub')}")
    return jsonify({"message": "Token de acesso expirado."}), 401

# --- Bloco de Execução Principal ---
if __name__ == '__main__':
    # A linha db.create_all() é geralmente removida quando se usa Flask-Migrate,
    # pois as migrações cuidam da criação e atualização das tabelas.
    # with app.app_context():
    #     db.create_all()
    app.run(debug=True, port=5000)
