from .. import db
from ..models import Activity, ActivityRevision, Tag, EventLog
from flask import jsonify
import logging
from flask_jwt_extended import jwt_required, current_user, get_jwt_identity
from ..models import db, Activity, Tag, activity_tag, ActivityRevision, User, Class, Enrollment

logger = logging.getLogger(__name__)

def create_activity(user, data):
    logger.info(f"Usuário ID {current_user_id} tentando criar uma nova atividade.")

    if user.role != 'professor':
        return {"message": "Acesso negado"}, 403
    
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
        
        # Processar tags se existirem
        if 'tags' in data:
            for tag_name in data['tags']:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                new_activity.tags.append(tag)
        
        db.session.add(new_activity)
        db.session.commit()
        
        # Registrar evento de criação
        log_event(user.id, 'activity_created', {
            'activity_id': new_activity.id,
            'title': new_activity.title
        })
        
        return {"message": "Atividade criada", "activity": new_activity.to_dict()}, 201
    
    except Exception as e:
        db.session.rollback()
        return {"message": str(e)}, 500

def search_activities(search_term, tags):
    query = Activity.query.filter(Activity.is_public == True)
    
    if search_term:
        query = query.filter(
            (Activity.title.ilike(f'%{search_term}%')) |
            (Activity.description.ilike(f'%{search_term}%'))
        )
    
    if tags:
        query = query.join(Activity.tags).filter(Tag.name.in_(tags))
    
    results = query.all()
    return jsonify([a.to_dict() for a in results])

def create_revision(user, activity_id, data):
    activity = Activity.query.get(activity_id)
    if not activity or activity.professor_id != user.id:
        return {"message": "Acesso negado"}, 403
    
    try:
        revision = ActivityRevision(
            activity_id=activity_id,
            revision_data=activity.to_dict(),  # Salva snapshot atual
            revision_notes=data.get('notes'),
            revised_by_id=user.id
        )
        
        # Atualizar atividade principal
        for field in data.get('updates', {}):
            setattr(activity, field, data['updates'][field])
        
        db.session.add(revision)
        db.session.commit()
        
        return {"message": "Revisão criada"}, 201
    
    except Exception as e:
        db.session.rollback()
        return {"message": str(e)}, 500

# Função auxiliar para registro de eventos
def log_event(user_id, event_type, event_data):
    from ..models import EventLog
    event = EventLog(
        user_id=user_id,
        event_type=event_type,
        event_data=event_data
    )
    db.session.add(event)
    db.session.commit()


def get_activity(user, activity_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    activity = Activity.query.get(activity_id)

    if not user:
        return jsonify({"message": "Usuário não encontrado."}), 404

    if not activity:
        return jsonify({"message": "Atividade não encontrada."}), 404

    # Lógica de autorização: quem pode ver a atividade?
    # Apenas o professor que a criou ou os alunos da turma para a qual ela foi designada.
    enrollment = Enrollment.query.filter_by(student_id=user.id, class_id=activity.class_id).first()
    is_professor = user.role == 'professor' and activity.professor_id == user.id
    
    if not (enrollment or is_professor):
        return jsonify({"message": "Acesso negado."}), 403

    return jsonify(activity.to_dict()), 200