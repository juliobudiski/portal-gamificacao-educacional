from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy # Importa SQLAlchemy
import os
from dotenv import load_dotenv # Importa para carregar variáveis do .env

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

app = Flask(__name__)
CORS(app) # Habilita CORS para todas as rotas (importante para desenvolvimento local)

# Configuração do Banco de Dados
# Pega a URL do banco de dados do arquivo .env
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
# Desativa o rastreamento de modificações para economizar recursos
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Pega a chave secreta para segurança de sessões do Flask do arquivo .env
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

db = SQLAlchemy(app) # Inicializa o SQLAlchemy com o aplicativo Flask

# Importa as funções de segurança para hash de senha
from werkzeug.security import generate_password_hash, check_password_hash

# Definir o modelo de Usuário (estrutura da tabela no banco de dados)
# Esta classe representa a tabela 'user' no seu banco de dados
class User(db.Model):
    # Define o nome da tabela no banco de dados
    __tablename__ = 'user'

    # Colunas da tabela
    id = db.Column(db.Integer, primary_key=True) # Chave primária, auto-incrementável
    email = db.Column(db.String(120), unique=True, nullable=False) # E-mail, deve ser único e não nulo
    password_hash = db.Column(db.String(128), nullable=False) # Armazena o hash da senha
    # Campos adicionais para Google Sign-In
    google_id = db.Column(db.String(120), unique=True, nullable=True) # ID único do usuário do Google
    name = db.Column(db.String(100), nullable=True) # Nome do usuário
    profile_picture = db.Column(db.String(255), nullable=True) # URL da foto de perfil do Google

    # Adicione campos de perfil do aluno/professor conforme RF001.4 e RF007.4
    # 'aluno' ou 'professor' como valor padrão
    role = db.Column(db.String(50), default='aluno', nullable=False)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(50), nullable=True)
    # Exemplo de campo para preferências de jogos (JSON ou TEXT para serializar)
    game_preferences = db.Column(db.String(500), nullable=True)
    # Exemplo de campo para preferências de aprendizagem
    learning_preferences = db.Column(db.String(500), nullable=True)


    # Representação string do objeto User (útil para depuração)
    def __repr__(self):
        return f'<User {self.email}>'

# --- Rotas da API ---

# Rota de teste simples
@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"status": "online", "message": "Backend do Portal de Gamificação está funcionando!"}), 200

# Rota de cadastro tradicional (com e-mail e senha)
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name') # Pega o nome do corpo da requisição

    # Validação básica dos campos obrigatórios
    if not email or not password or not name:
        return jsonify({"message": "Nome, e-mail e senha são obrigatórios."}), 400

    # Verifica se o e-mail já está cadastrado no banco de dados
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "E-mail já cadastrado."}), 409 # Código 409 para Conflito

    # Gera o hash da senha antes de armazenar (SEGURANÇA!)
    hashed_password = generate_password_hash(password)
    # Cria uma nova instância de User
    new_user = User(email=email, password_hash=hashed_password, name=name, role='aluno') # Define 'aluno' como padrão

    try:
        db.session.add(new_user) # Adiciona o novo usuário à sessão do banco de dados
        db.session.commit() # Salva as mudanças no banco de dados
        return jsonify({"message": "Usuário cadastrado com sucesso!", "user_id": new_user.id, "email": new_user.email}), 201 # Código 201 para Criado
    except Exception as e:
        db.session.rollback() # Desfaz a transação em caso de erro
        print(f"Erro ao cadastrar usuário: {str(e)}") # Loga o erro para depuração
        return jsonify({"message": f"Erro interno ao cadastrar usuário: {str(e)}"}), 500 # Código 500 para Erro Interno do Servidor

# Rota de login tradicional (com e-mail e senha)
@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Procura o usuário pelo e-mail no banco de dados
    user = User.query.filter_by(email=email).first()

    # Verifica se o usuário existe e se a senha está correta (comparando o hash)
    if user and check_password_hash(user.password_hash, password):
        # Futuramente, aqui você implementaria a criação de uma sessão ou JWT
        return jsonify({"message": "Login bem-sucedido!", "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}}), 200
    else:
        return jsonify({"message": "Credenciais inválidas."}), 401 # Código 401 para Não Autorizado

# Importa as bibliotecas do Google para validação de token
from google.oauth2 import id_token
from google.auth.transport import requests

# Pega o Client ID do Google do arquivo .env (o mesmo usado no frontend)
GOOGLE_CLIENT_ID_BACKEND = os.getenv('GOOGLE_CLIENT_ID')

# Rota para login/cadastro com Google
@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('id_token') # O token de ID enviado pelo frontend

    if not token:
        return jsonify({"message": "Token do Google não fornecido."}), 400

    try:
        # Verifica o token de ID do Google usando o Client ID do backend
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID_BACKEND)

        # Obtém informações do usuário do Google a partir do token verificado
        google_id = idinfo['sub'] # O ID único do usuário Google
        email = idinfo['email']
        name = idinfo.get('name', '') # Nome do usuário (pode não vir em todos os tokens)
        picture = idinfo.get('picture', '') # URL da foto de perfil (pode não vir)

        # Procura o usuário no seu banco de dados pelo google_id
        user = User.query.filter_by(google_id=google_id).first()

        if user:
            # Se o usuário já existe com este Google ID, é um login
            message = "Login Google bem-sucedido!"
            status_code = 200
        else:
            # Se não existe com google_id, verifica se já existe com o mesmo e-mail
            existing_email_user = User.query.filter_by(email=email).first()
            if existing_email_user:
                # Se o e-mail já existe (mas sem google_id), associa a conta Google a ele
                existing_email_user.google_id = google_id
                existing_email_user.name = name # Atualiza nome, se necessário
                existing_email_user.profile_picture = picture # Atualiza foto, se necessário
                db.session.commit()
                user = existing_email_user
                message = "Conta existente vinculada ao Google!"
                status_code = 200
            else:
                # Se não existe, cria um novo usuário no banco de dados
                user = User(
                    email=email,
                    password_hash='google_auth_only', # Senha dummy para usuários que só usam Google Sign-In
                    google_id=google_id,
                    name=name,
                    profile_picture=picture,
                    role='aluno' # Define 'aluno' como padrão para novos cadastros Google
                )
                db.session.add(user) # Adiciona o novo usuário
                db.session.commit() # Salva no banco
                message = "Cadastro Google bem-sucedido!"
                status_code = 201

        return jsonify({
            "message": message,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "google_id": user.google_id # Inclui o google_id na resposta
            }
        }), status_code

    except ValueError as e:
        # Erro de validação do token (token inválido, expirado, etc.)
        print(f"Erro de validação do token Google: {str(e)}")
        return jsonify({"message": f"Token do Google inválido ou expirado. {str(e)}"}), 401
    except Exception as e:
        # Outros erros inesperados
        db.session.rollback() # Desfaz a transação
        print(f"Erro inesperado no Google Auth: {str(e)}")
        return jsonify({"message": f"Erro interno no servidor durante autenticação Google: {str(e)}"}), 500


# Bloco principal para execução do aplicativo
if __name__ == '__main__':
    # Cria todas as tabelas definidas nos modelos (class User) no banco de dados
    # Isso só acontece se as tabelas ainda não existirem
    with app.app_context():
        db.create_all()
    # Inicia o servidor Flask
    app.run(debug=True, port=5000) # O backend rodará na porta 5000 em modo de depuração
