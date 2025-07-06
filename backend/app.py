from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate # IMPORTANTE: Adicione esta importação
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Text
import os
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, decode_token
from datetime import timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from google.oauth2 import id_token
from google.auth.transport import requests

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

app = Flask(__name__)
CORS(app) # Habilita CORS para todas as rotas

# Configuração do Banco de Dados
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

jwt = JWTManager(app)
db = SQLAlchemy(app)

# IMPORTANTE: Inicializa o Flask-Migrate AQUI, APÓS 'app' e 'db' serem definidos
migrate = Migrate(app, db) # Garante que o Flask-Migrate esteja associado ao seu app e DB

GOOGLE_CLIENT_ID_BACKEND = os.getenv('GOOGLE_CLIENT_ID')

# Modelo de Usuário
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

# Modelo de Atividade Gamificada
class Activity(db.Model):
    __tablename__ = 'activity'

    id = db.Column(db.Integer, primary_key=True)
    professor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)

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

    professor = db.relationship('User', backref='activities', lazy=True)

    def __repr__(self):
        return f'<Activity {self.title}>'

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
        }

# --- Rotas da API ---

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"status": "online", "message": "Backend do Portal de Gamificação está funcionando!"}), 200

@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role', 'aluno')

    if not email or not password or not name:
        return jsonify({"message": "Nome, e-mail e senha são obrigatórios."}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "E-mail já cadastrado."}), 409

    hashed_password = generate_password_hash(password)
    new_user = User(email=email, password_hash=hashed_password, name=name, role=role)

    try:
        db.session.add(new_user)
        db.session.commit()

        additional_claims = {
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role,
            "profile_picture": new_user.profile_picture,
            "institutionName": new_user.institution_name,
            "discipline": new_user.discipline
        }
        access_token = create_access_token(identity=str(new_user.id), additional_claims=additional_claims)

        return jsonify(access_token=access_token, user={
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role,
            "profile_picture": new_user.profile_picture,
            "institutionName": new_user.institution_name,
            "discipline": new_user.discipline,
            "token": access_token
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao cadastrar usuário: {str(e)}")
        return jsonify({"message": f"Erro interno ao cadastrar usuário: {str(e)}"}), 500

@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password_hash, password):
        additional_claims = {
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "institutionName": user.institution_name,
            "discipline": user.discipline
        }
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        return jsonify(access_token=access_token, user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "google_id": user.google_id,
            "institutionName": user.institution_name,
            "discipline": user.discipline,
            "token": access_token
        }), 200
    else:
        return jsonify({"message": "Credenciais inválidas."}), 401

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('id_token')
    role = data.get('role', 'aluno')

    if not token:
        return jsonify({"message": "Token do Google não fornecido."}), 400

    try:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID_BACKEND)

        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')

        user = User.query.filter_by(google_id=google_id).first()

        if user:
            if user.role != role:
                user.role = role
                db.session.commit()
            message = "Login Google bem-sucedido!"
            status_code = 200
        else:
            existing_email_user = User.query.filter_by(email=email).first()
            if existing_email_user:
                existing_email_user.google_id = google_id
                existing_email_user.name = name
                existing_email_user.profile_picture = picture
                db.session.commit()
                user = existing_email_user
                message = "Conta existente vinculada ao Google!"
                status_code = 200
            else:
                user = User(
                    email=email,
                    password_hash='google_auth_only',
                    google_id=google_id,
                    name=name,
                    profile_picture=picture,
                    role=role
                )
                db.session.add(user)
                db.session.commit()
                message = "Cadastro Google bem-sucedido!"
                status_code = 201

        additional_claims = {
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "institutionName": user.institution_name,
            "discipline": user.discipline
        }
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

        return jsonify(access_token=access_token, user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "google_id": user.google_id,
            "institutionName": user.institution_name,
            "discipline": user.discipline,
            "token": access_token
        }), status_code

    except ValueError as e:
        print(f"Erro de validação do token Google: {str(e)}")
        return jsonify({"message": f"Token do Google inválido ou expirado. {str(e)}"}), 401
    except Exception as e:
        db.session.rollback()
        print(f"Erro inesperado no Google Auth: {str(e)}")
        return jsonify({"message": f"Erro interno no servidor durante autenticação Google: {str(e)}"}), 500

@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    return jsonify({"message": f"Olá, usuário com ID: {current_user_id}! Você acessou uma rota protegida."}), 200

@app.route('/api/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')

    if not current_password or not new_password:
        return jsonify({"message": "Senha atual e nova senha são obrigatórios."}), 400

    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"message": "Usuário não encontrado."}), 404

    if user.password_hash == 'google_auth_only' or not check_password_hash(user.password_hash, current_password):
        return jsonify({"message": "Senha atual incorreta ou usuário Google."}), 401
    
    if len(new_password) < 6:
        return jsonify({"message": "A nova senha deve ter pelo menos 6 caracteres."}), 400

    user.password_hash = generate_password_hash(new_password)

    try:
        db.session.commit()
        return jsonify({"message": "Senha alterada com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao alterar senha do usuário {current_user_id}: {str(e)}")
        return jsonify({"message": "Erro interno ao alterar a senha."}), 500

@app.route('/api/user/update-profile', methods=['POST'])
@cross_origin()
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({"message": "Usuário não encontrado."}), 404

        if user.role != 'professor':
            return jsonify({"message": "Acesso negado. Apenas professores podem atualizar essas informações."}), 403

        data = request.get_json()
        institution_name = data.get('institution_name')
        discipline = data.get('discipline')

        if institution_name is not None:
            user.institution_name = institution_name
        if discipline is not None:
            user.discipline = discipline
        
        db.session.commit()

        additional_claims = {
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "institutionName": user.institution_name,
            "discipline": user.discipline
        }
        new_access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

        return jsonify({
            "message": "Informações do perfil atualizadas com sucesso!",
            "access_token": new_access_token
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"ERRO CRÍTICO EM update_profile: {str(e)}")
        return jsonify({"message": f"Erro interno ao atualizar o perfil: {str(e)}"}), 500

# ROTA PARA CRIAR NOVA ATIVIDADE GAMIFICADA
@app.route('/api/activities', methods=['POST'])
@cross_origin()
@jwt_required()
def create_activity():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    # Verifica se o usuário existe e tem o papel de professor
    if not user or user.role != 'professor':
        return jsonify({"message": "Acesso negado. Apenas professores podem criar atividades."}), 403

    data = request.get_json()

    # Validação básica: verificar se o título da atividade foi fornecido
    # Você pode adicionar mais validações aqui conforme necessário
    if not data or not data.get('title'):
        return jsonify({"message": "O título da atividade é obrigatório."}), 400

    try:
        new_activity = Activity(
            professor_id=user.id,
            title=data.get('title'),
            description=data.get('description', ''), # Valor padrão vazio se não fornecido
            current_scenario=data.get('currentScenario', {}), # Garante que é um dict vazio se ausente
            desired_scenario=data.get('desiredScenario', {}),
            activity_planning=data.get('activityPlanning', {}),
            player_profile=data.get('playerProfile', {}),
            game_elements=data.get('gameElements', {}),
            rewards_offered=data.get('rewardsOffered', {}),
            rewarded_actions=data.get('rewardedActions', {}),
            gamification_rules=data.get('gamificationRules', {}),
            area_knowledge=data.get('areaKnowledge'), # Este campo virá do frontend
            is_public=data.get('isPublic', False)
        )
        db.session.add(new_activity)
        db.session.commit()

        return jsonify({"message": "Atividade criada com sucesso!", "activity": new_activity.to_dict()}), 201

    except Exception as e:
        db.session.rollback() # Em caso de erro, desfaz a transação
        print(f"Erro ao criar atividade: {str(e)}")
        return jsonify({"message": f"Erro interno do servidor ao criar atividade: {str(e)}"}), 500


@jwt.unauthorized_loader
def unauthorized_response(callback):
    return jsonify({"message": "Token de acesso ausente ou inválido."}), 401

@jwt.invalid_token_loader
def invalid_token_response(callback):
    return jsonify({"message": "Token inválido ou malformado."}), 422

@jwt.expired_token_loader
def expired_token_response(callback):
    return jsonify({"message": "Token de acesso expirado."}), 401

# Bloco principal para execução do aplicativo
if __name__ == '__main__':
    # REMOVA OU COMENTE a linha db.create_all() se for usar Flask-Migrate
    # with app.app_context():
    #     db.create_all()
    app.run(debug=True, port=5000)