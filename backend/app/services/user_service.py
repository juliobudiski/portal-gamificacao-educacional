"""
Serviço de Usuário (UserService)
Um módulo de serviço auxiliar (herdado de refatorações anteriores) focado
exclusivamente na gestão e atualização de atributos básicos do perfil do usuário.
(Nota: Algumas dessas rotas podem se sobrepor ao auth_service em projetos futuros).
"""
from .. import db
from ..models import User, Class, Activity, EventLog
import logging
from werkzeug.security import generate_password_hash, check_password_hash
from enum import Enum

logger = logging.getLogger(__name__)

# --- VALUE OBJECTS & DOMAIN EXCEPTIONS ---

class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class DomainException(Exception):
    """Exceção base de regras de negócio."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class TeacherHasAssociatedClassesException(DomainException):
    """Lançada ao tentar excluir fisicamente professor com turmas associadas."""
    def __init__(self, teacher_id: int, total_classes: int):
        message = (
            f"Não é possível excluir o professor pois existem {total_classes} "
            "turma(s) vinculada(s) ao seu perfil. Desative a conta ou reatribua as turmas."
        )
        super().__init__(message, status_code=409)
        self.teacher_id = teacher_id
        self.total_classes = total_classes

class TeacherHasAssociatedActivitiesException(DomainException):
    """Lançada ao tentar excluir fisicamente professor com atividades associadas."""
    def __init__(self, teacher_id: int, total_activities: int):
        message = (
            f"Não é possível excluir o professor pois existem {total_activities} "
            "atividade(s) vinculada(s) ao seu perfil. Desative a conta ou remova as atividades."
        )
        super().__init__(message, status_code=409)
        self.teacher_id = teacher_id
        self.total_activities = total_activities

# --- REGRAS DE DOMÍNIO E CICLO DE VIDA (FAIL-FAST) ---

def validate_user_deletion_invariants(user: User):
    """
    Validação de invariante de Domínio (Fail-Fast).
    Garante integridade referencial antes de interagir com o banco de dados.
    """
    if user.role == 'professor':
        associated_classes_count = Class.query.filter_by(professor_id=user.id).count()
        if associated_classes_count > 0:
            raise TeacherHasAssociatedClassesException(user.id, associated_classes_count)

        associated_activities_count = Activity.query.filter_by(professor_id=user.id).count()
        if associated_activities_count > 0:
            raise TeacherHasAssociatedActivitiesException(user.id, associated_activities_count)

def delete_user_securely(user_id: int):
    """
    Exclui um usuário e suas dependências.
    Para professores, realiza exclusão em cascata das turmas (e times/matrículas) e atividades,
    preservando intactas as contas dos alunos.
    """
    user = User.query.get(user_id)
    if not user:
        return {"success": False, "message": "Usuário não encontrado."}, 404

    try:
        from ..models import (
            Class, Activity, Enrollment, Team, ActivityProgress, 
            Conversation, ChatMessage, ActivityRating, Purchase, StoreItem, 
            SlotWin, RouletteWin, StudentResponse, QuizContent, NarrativeContent, 
            LearningContent, UserUnlockedTitle, UserUnlockedMedal, ActivityRevision,
            ForumTopic, ForumPost, TopicLike, PostLike, MessageReport, ManualFeedback
        )

        # 1. Se for professor, deletar turmas e atividades associadas em cascata (preservando os alunos)
        if user.role == 'professor':
            # A. Turmas do professor
            classes = Class.query.filter_by(professor_id=user.id).all()
            for cls in classes:
                # Remove progresso atrelado diretamente à turma
                ActivityProgress.query.filter_by(class_id=cls.id).delete(synchronize_session=False)
                # Remove matrículas na turma (o aluno continua existindo!)
                Enrollment.query.filter_by(class_id=cls.id).delete(synchronize_session=False)
                # Remove equipes da turma
                Team.query.filter_by(class_id=cls.id).delete(synchronize_session=False)
                # Desvincula atividades que apontavam para essa turma
                Activity.query.filter_by(class_id=cls.id).update({'class_id': None}, synchronize_session=False)
                # Deleta a turma
                db.session.delete(cls)
            db.session.flush()

            # B. Atividades do professor
            activities = Activity.query.filter_by(professor_id=user.id).all()
            activity_ids = [act.id for act in activities]
            if activity_ids:
                item_ids = [item.id for item in StoreItem.query.filter(StoreItem.activity_id.in_(activity_ids)).all()]
                if item_ids:
                    ActivityProgress.query.filter(ActivityProgress.equipped_name_cosmetic_id.in_(item_ids)).update({'equipped_name_cosmetic_id': None}, synchronize_session=False)
                    ActivityProgress.query.filter(ActivityProgress.equipped_title_cosmetic_id.in_(item_ids)).update({'equipped_title_cosmetic_id': None}, synchronize_session=False)

                conversations = Conversation.query.filter(Conversation.activity_id.in_(activity_ids)).all()
                if conversations:
                    conv_ids = [c.id for c in conversations]
                    ChatMessage.query.filter(ChatMessage.conversation_id.in_(conv_ids)).delete(synchronize_session=False)
                    Conversation.query.filter(Conversation.id.in_(conv_ids)).delete(synchronize_session=False)

                ActivityRating.query.filter(ActivityRating.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                Purchase.query.filter(Purchase.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                StoreItem.query.filter(StoreItem.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                SlotWin.query.filter(SlotWin.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                RouletteWin.query.filter(RouletteWin.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                StudentResponse.query.filter(StudentResponse.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                QuizContent.query.filter(QuizContent.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                NarrativeContent.query.filter(NarrativeContent.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                LearningContent.query.filter(LearningContent.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                UserUnlockedTitle.query.filter(UserUnlockedTitle.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                ActivityProgress.query.filter(ActivityProgress.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                EventLog.query.filter(EventLog.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                ActivityRevision.query.filter(ActivityRevision.activity_id.in_(activity_ids)).delete(synchronize_session=False)
                UserUnlockedMedal.query.filter(UserUnlockedMedal.activity_id.in_(activity_ids)).delete(synchronize_session=False)

                Activity.query.filter(Activity.id.in_(activity_ids)).delete(synchronize_session=False)
                db.session.flush()

        # 2. Se for aluno, remove registros de matrícula e progresso
        if user.role == 'aluno':
            Enrollment.query.filter_by(student_id=user.id).delete(synchronize_session=False)
            ActivityProgress.query.filter_by(student_id=user.id).delete(synchronize_session=False)
            StudentResponse.query.filter_by(student_id=user.id).delete(synchronize_session=False)
            UserUnlockedTitle.query.filter_by(user_id=user.id).delete(synchronize_session=False)
            UserUnlockedMedal.query.filter_by(user_id=user.id).delete(synchronize_session=False)
            Purchase.query.filter_by(user_id=user.id).delete(synchronize_session=False)
            SlotWin.query.filter_by(user_id=user.id).delete(synchronize_session=False)
            RouletteWin.query.filter_by(user_id=user.id).delete(synchronize_session=False)
            ActivityRating.query.filter_by(user_id=user.id).delete(synchronize_session=False)

        # 3. Limpeza de logs e dados diretos do usuário
        EventLog.query.filter_by(user_id=user.id).delete(synchronize_session=False)
        ManualFeedback.query.filter_by(given_by_id=user.id).delete(synchronize_session=False)
        ActivityRevision.query.filter_by(revised_by_id=user.id).delete(synchronize_session=False)

        # 4. Deletar o próprio usuário
        db.session.delete(user)
        db.session.commit()
        return {"success": True, "message": "Usuário e suas dependências excluídos com sucesso."}, 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao deletar usuário {user_id}: {str(e)}", exc_info=True)
        return {"success": False, "message": f"Erro ao deletar usuário. Detalhes: {str(e)}"}, 500

def deactivate_user(user_id: int):
    """
    Desativa o usuário (Soft Delete), preservando a integridade das turmas,
    atividades e histórico gamificado dos alunos.
    """
    user = User.query.get(user_id)
    if not user:
        return {"success": False, "message": "Usuário não encontrado."}, 404

    try:
        user.status = UserStatus.INACTIVE.value
        db.session.commit()
        return {
            "success": True, 
            "message": "Usuário desativado com sucesso.", 
            "user": user.to_dict()
        }, 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao desativar usuário {user_id}: {str(e)}", exc_info=True)
        return {"success": False, "message": f"Erro ao desativar usuário: {str(e)}"}, 500

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