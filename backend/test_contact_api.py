import json
import sys
import os

# Adiciona o diretório backend ao path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models import ContactMessage

def run_test():
    print("Iniciando teste da API de Contato (/api/contact)...")
    app = create_app()
    
    with app.app_context():
        # Cria apenas a tabela contact_messages se necessário para compatibilidade com SQLite
        ContactMessage.__table__.create(db.engine, checkfirst=True)
        
        client = app.test_client()
        
        payload = {
            "name": "Professora Teste",
            "email": "professora.teste@exemplo.com",
            "subject": "Solicitação de Chave de Acesso Institucional",
            "message": "Olá, sou professora da rede pública e gostaria de solicitar a chave de acesso."
        }
        
        print("\n1. Testando POST /api/contact com payload válido...")
        response = client.post(
            '/api/contact',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.get_data(as_text=True)}")
        
        assert response.status_code == 201, f"Esperado 201, recebido {response.status_code}"
        
        # Verifica se foi salvo no banco
        saved = ContactMessage.query.filter_by(email="professora.teste@exemplo.com").first()
        assert saved is not None, "A mensagem deveria estar no banco de dados."
        print(f"✅ Mensagem persistida com sucesso no banco: ID {saved.id}, Assunto: '{saved.subject}'")

        print("\n2. Testando POST /api/contact/ com barra no final (tolerância a trailing slash)...")
        response_slash = client.post(
            '/api/contact/',
            data=json.dumps({
                "name": "Aluno Curioso",
                "email": "aluno@exemplo.com",
                "subject": "Dúvida sobre medalhas",
                "message": "Como desbloqueio a medalha Explorador?"
            }),
            content_type='application/json'
        )
        print(f"Status Code: {response_slash.status_code}")
        print(f"Response Body: {response_slash.get_data(as_text=True)}")
        assert response_slash.status_code == 201, f"Esperado 201, recebido {response_slash.status_code}"

        print("\n3. Testando POST /api/contact com payload inválido (campos ausentes)...")
        response_invalid = client.post(
            '/api/contact',
            data=json.dumps({"name": "Sem email nem mensagem"}),
            content_type='application/json'
        )
        print(f"Status Code: {response_invalid.status_code}")
        print(f"Response Body: {response_invalid.get_data(as_text=True)}")
        assert response_invalid.status_code == 400, f"Esperado 400, recebido {response_invalid.status_code}"

        print("\n🎉 TODOS OS TESTES DA API DE CONTATO PASSARAM COM SUCESSO!")

if __name__ == '__main__':
    run_test()
