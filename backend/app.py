from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin # Importe cross_origin aqui
from flask_sqlalchemy import SQLAlchemy
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
CORS(app) # Habilita CORS para todas as rotas (importante para desenvolvimento local)

# Configuração do Banco de Dados
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY') # Chave para sessões do Flask
print(f"DEBUG: SECRET_KEY carregada: {app.config['SECRET_KEY']}") # Para depuração

# Configuração da chave secreta para JWT
# É CRÍTICO que esta chave seja a mesma usada para assinar e verificar tokens.
# Usamos JWT_SECRET_KEY do .env, que é a chave específica para JWTs.
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY') # <--- CORREÇÃO AQUI!
print(f"DEBUG: JWT_SECRET_KEY carregada: {app.config['JWT_SECRET_KEY']}") # Para depuração

jwt = JWTManager(app) # Inicializa o Flask-JWT-Extended

db = SQLAlchemy(app) # Inicializa o SQLAlchemy com o aplicativo Flask

GOOGLE_CLIENT_ID_BACKEND = os.getenv('GOOGLE_CLIENT_ID')

# Definir o modelo de Usuário (estrutura da tabela no banco de dados)
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
    institution_name = db.Column(db.String(255), nullable=True) # Nova coluna
    discipline = db.Column(db.String(100), nullable=True) # Nova coluna

    def __repr__(self):
        return f'<User {self.email}>'

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
            "institutionName": new_user.institution_name, # Inclui no token
            "discipline": new_user.discipline # Inclui no token
        }
        access_token = create_access_token(identity=str(new_user.id), additional_claims=additional_claims) # Converta para string

        return jsonify(access_token=access_token, user={
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role,
            "profile_picture": new_user.profile_picture,
            "institutionName": new_user.institution_name, # Inclui no objeto user
            "discipline": new_user.discipline, # Inclui no objeto user
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
            "institutionName": user.institution_name, # Inclui no token
            "discipline": user.discipline # Inclui no token
        }
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims) # Converta para string
        return jsonify(access_token=access_token, user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "google_id": user.google_id,
            "institutionName": user.institution_name, # Inclui no objeto user
            "discipline": user.discipline, # Inclui no objeto user
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
                    role=role # Use o role selecionado pelo usuário
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
            "institutionName": user.institution_name, # Inclui no token
            "discipline": user.discipline # Inclui no token
        }
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims) # Converta para string

        return jsonify(access_token=access_token, user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "google_id": user.google_id,
            "institutionName": user.institution_name, # Inclui no objeto user
            "discipline": user.discipline, # Inclui no objeto user
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

# Rota para atualizar informações de perfil (exclusiva para professor)
@app.route('/api/user/update-profile', methods=['POST'])
@cross_origin() # Garante que CORS funcione para esta rota
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity() # Obtém o ID do usuário do token JWT
        print(f"DEBUG: update_profile - current_user_id do token: {current_user_id}")

        user = User.query.get(current_user_id)
        print(f"DEBUG: update_profile - Usuário encontrado no DB: {user}")

        if not user:
            print(f"DEBUG: update_profile - Usuário com ID {current_user_id} NÃO encontrado.")
            return jsonify({"message": "Usuário não encontrado."}), 404

        # Apenas professores podem atualizar essas informações de perfil específicas
        if user.role != 'professor':
            print(f"DEBUG: update_profile - Usuário {user.email} (ID: {user.id}) NÃO é professor. Role: {user.role}")
            return jsonify({"message": "Acesso negado. Apenas professores podem atualizar essas informações."}), 403

        data = request.get_json()
        institution_name = data.get('institution_name')
        discipline = data.get('discipline')
        print(f"DEBUG: update_profile - Dados recebidos: Instituição='{institution_name}', Disciplina='{discipline}'")

        # Atualiza os campos se eles forem fornecidos na requisição
        # Permite que o professor "limpe" o campo enviando uma string vazia
        if institution_name is not None:
            user.institution_name = institution_name
        if discipline is not None:
            user.discipline = discipline
        
        # O commit e a geração do token devem ser feitos APÓS todas as atualizações de campos
        db.session.commit() # <--- MOVIDO PARA FORA DOS IFS DE ATUALIZAÇÃO DE CAMPO

        # Gerar um NOVO token JWT com as informações de perfil atualizadas
        # Isso é crucial para que o frontend tenha os dados mais recentes no user object do AuthContext
        additional_claims = {
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "institutionName": user.institution_name, # Inclui a nova info no token (camelCase para o frontend)
            "discipline": user.discipline # Inclui a nova info no token (camelCase para o frontend)
        }
        new_access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims) # Converta para string
        print(f"DEBUG: update_profile - Novo token gerado para usuário {user.id}")

        return jsonify({
            "message": "Informações do perfil atualizadas com sucesso!",
            "access_token": new_access_token # Retorna o novo token
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"ERRO CRÍTICO EM update_profile: {str(e)}")
        # Retorna um erro 500 com a mensagem de erro para depuração
        return jsonify({"message": f"Erro interno ao atualizar o perfil: {str(e)}"}), 500


# Adicione esta função para lidar com erros de JWT inválidos/expirados
@jwt.unauthorized_loader
def unauthorized_response(callback):
    print(f"DEBUG: Unauthorized loader - {callback}")
    return jsonify({"message": "Token de acesso ausente ou inválido."}), 401

@jwt.invalid_token_loader
def invalid_token_response(callback):
    print(f"DEBUG: Invalid token loader - {callback}")
    return jsonify({"message": "Token inválido ou malformado."}), 422

@jwt.expired_token_loader
def expired_token_response(callback):
    print(f"DEBUG: Expired token loader - {callback}")
    return jsonify({"message": "Token de acesso expirado."}), 401

# Bloco principal para execução do aplicativo
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
