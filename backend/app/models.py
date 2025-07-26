# backend/app/models.py
from . import db # Importa a instância do db do __init__.py
from sqlalchemy.dialects.postgresql import JSONB

# --- Modelos de Banco de Dados (SQLAlchemy) ---

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

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'institution_name': self.institution_name,
            'discipline': self.discipline,
            'profile_picture': self.profile_picture
        }

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
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=True)
    
    professor = db.relationship('User', backref='activities', lazy=True)
    class_obj = db.relationship('Class', backref='assigned_activities', lazy=True)

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
            'professor_name': self.professor.name,
            'professor_email': self.professor.email,
            'class_id': self.class_id,
            'class_name': self.class_obj.name if self.class_obj else None,
        }

class Class(db.Model):
    __tablename__ = 'class'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    professor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    enrollment_code = db.Column(db.String(50), unique=True, nullable=False)
    
    professor = db.relationship('User', backref='created_classes', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'professor_id': self.professor_id,
            'enrollment_code': self.enrollment_code
        }

class Enrollment(db.Model):
    __tablename__ = 'enrollment'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    enrollment_date = db.Column(db.DateTime, default=db.func.current_timestamp())

    student = db.relationship('User', backref='enrollments', lazy=True)
    class_obj = db.relationship('Class', backref='enrollments', lazy=True)
    __table_args__ = (db.UniqueConstraint('student_id', 'class_id', name='_student_class_uc'),)

class ActivityProgress(db.Model):
    __tablename__ = 'activity_progress'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    points_earned = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default='not_started')
    completed_at = db.Column(db.DateTime, nullable=True)
    attempts = db.Column(db.Integer, default=0)

    student = db.relationship('User', backref='activity_progresses', lazy=True)
    activity = db.relationship('Activity', backref='progresses', lazy=True)
    class_obj = db.relationship('Class', backref='activity_progresses', lazy=True)
    __table_args__ = (db.UniqueConstraint('student_id', 'activity_id', name='_student_activity_uc'),)


class EventLog(db.Model):
    __tablename__ = 'event_log'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    event_type = db.Column(db.String(100), nullable=False)
    event_data = db.Column(JSONB)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.Text)
    
    user = db.relationship('User', backref='event_logs')

class StudentResponse(db.Model):
    __tablename__ = 'student_response'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    response_data = db.Column(JSONB, nullable=False)
    is_correct = db.Column(db.Boolean)
    score = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    student = db.relationship('User', backref='responses')
    activity = db.relationship('Activity', backref='responses')

class Tag(db.Model):
    __tablename__ = 'tag'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

# Tabela de associação para tags de atividades
activity_tag = db.Table('activity_tag',
    db.Column('activity_id', db.Integer, db.ForeignKey('activity.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

class ActivityRevision(db.Model):
    __tablename__ = 'activity_revision'
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    revision_data = db.Column(JSONB, nullable=False)
    revision_notes = db.Column(db.Text)
    revised_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    activity = db.relationship('Activity', backref='revisions')
    revised_by = db.relationship('User')

class ManualFeedback(db.Model):
    __tablename__ = 'manual_feedback'
    id = db.Column(db.Integer, primary_key=True)
    response_id = db.Column(db.Integer, db.ForeignKey('student_response.id'), nullable=False)
    feedback_text = db.Column(db.Text, nullable=False)
    given_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    score_adjustment = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    response = db.relationship('StudentResponse', backref='feedbacks')
    given_by = db.relationship('User')