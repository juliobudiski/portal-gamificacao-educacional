"""
Serviço de Usuário (UserService)
Um módulo de serviço auxiliar (herdado de refatorações anteriores) focado
exclusivamente na gestão e atualização de atributos básicos do perfil do usuário.
(Nota: Algumas dessas rotas podem se sobrepor ao auth_service em projetos futuros).
"""
from .. import db
from ..models import User
import logging
from werkzeug.security import generate_password_hash, check_password_hash

logger = logging.getLogger(__name__)

def update_user_profile(user_id, data):
    """Atualiza metadados do professor (Instituição e Disciplina)."""
    try:
        user = User.query.get(user_id)
        if not user:
            return {"message": "Usuário não encontrado"}, 404
        
        if 'institution_name' in data:
            user.institution_name = data['institution_name']
        if 'discipline' in data:
            user.discipline = data['discipline']
        
        db.session.commit()
        return {"message": "Perfil atualizado com sucesso", "user": user.to_dict()}, 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao atualizar perfil: {str(e)}", exc_info=True)
        return {"message": str(e)}, 500

def change_password(user_id, current_password, new_password):
    """
    Troca de senha segura.
    Bloqueia tentativas caso a conta tenha sido criada via Google (OAuth) puro,
    pois a senha nesses casos é marcada como 'google_auth_only'.
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return {"message": "Usuário não encontrado"}, 404
        
        if user.password_hash == 'google_auth_only' or not check_password_hash(user.password_hash, current_password):
            return {"message": "Senha atual incorreta"}, 401
        
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        return {"message": "Senha alterada com sucesso"}, 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao alterar senha: {str(e)}", exc_info=True)
        return {"message": str(e)}, 500