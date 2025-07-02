from flask import Flask, jsonify, request
from flask_cors import CORS # Necessário para permitir comunicação entre frontend e backend

app = Flask(__name__)
CORS(app) # Habilita CORS para todas as rotas (importante para desenvolvimento local)

# Rota de teste simples
@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"status": "online", "message": "Backend do Portal de Gamificação está funcionando!"}), 200

# Exemplo de rota de login (placeholder)
@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Aqui você faria a validação real com seu banco de dados
    if email == "teste@email.com" and password == "senha123":
        return jsonify({"message": "Login bem-sucedido!", "user": {"email": email, "role": "professor"}}), 200
    else:
        return jsonify({"message": "Credenciais inválidas."}), 401

# Exemplo de rota de cadastro (placeholder)
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    # Aqui você faria a lógica de salvar o novo usuário no banco de dados
    print(f"Novo usuário para cadastro: Nome={name}, Email={email}, Senha={password}")
    return jsonify({"message": "Usuário cadastrado com sucesso!", "user": {"email": email}}), 201


if __name__ == '__main__':
    app.run(debug=True, port=5000) # O backend rodará na porta 5000