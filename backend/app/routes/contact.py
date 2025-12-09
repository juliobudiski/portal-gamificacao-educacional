from flask import Blueprint, request, jsonify
from app import db
from app.models import ContactMessage, User
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/', methods=['POST'])
def send_message():
    data = request.get_json()
    
    # Validação básica
    if not data.get('message') or not data.get('email'):
        return jsonify({'error': 'Campos obrigatórios faltando.'}), 400

    user_id = None
    
    # Tenta identificar o usuário se houver token, mas não bloqueia se não houver
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
        if current_user_id:
            user_id = current_user_id
    except:
        pass # É um visitante anônimo

    new_message = ContactMessage(
        user_id=user_id,
        name=data.get('name', 'Anônimo'),
        email=data.get('email'),
        subject=data.get('subject', 'Sem Assunto'),
        message=data.get('message')
    )

    db.session.add(new_message)
    db.session.commit()

    return jsonify({'message': 'Mensagem enviada com sucesso!'}), 201