from app import db
from app.models import ContactMessage

class ContactService:
    @staticmethod
    def send_message(user_id, data):
        if not data.get('message') or not data.get('email'):
            return {"error": "Campos obrigatórios faltando."}, 400

        try:
            new_message = ContactMessage(
                user_id=user_id,
                name=data.get('name', 'Anônimo'),
                email=data.get('email'),
                subject=data.get('subject', 'Sem Assunto'),
                message=data.get('message')
            )

            db.session.add(new_message)
            db.session.commit()

            return {"message": "Mensagem enviada com sucesso!"}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": "Erro ao salvar a mensagem de contato."}, 500
