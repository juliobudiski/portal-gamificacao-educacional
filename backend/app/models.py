# backend/app/models.py
"""
Define todos os modelos de dados da aplicação utilizando SQLAlchemy.
Cada classe representa uma tabela no banco de dados e suas respectivas colunas e relações.
"""
from . import db # Importa a instância do db do __init__.py
from sqlalchemy.dialects.postgresql import JSONB
from .extensions import socketio
from sqlalchemy.orm import validates
# --- Modelos de Banco de Dados (SQLAlchemy) ---

class User(db.Model):
    """Modelo para representar um usuário (aluno ou professor) no sistema."""
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    google_id = db.Column(db.String(120), unique=True, nullable=True)
    name = db.Column(db.String(100), nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True) # Este é o Avatar Global EQUIPADO
    role = db.Column(db.String(50), default='aluno', nullable=False)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(50), nullable=True)
    game_preferences = db.Column(db.String(500), nullable=True)
    learning_preferences = db.Column(db.String(500), nullable=True)
    institution_name = db.Column(db.String(255), nullable=True)
    discipline = db.Column(db.String(100), nullable=True)
    last_known_latitude = db.Column(db.Float, nullable=True)
    last_known_longitude = db.Column(db.Float, nullable=True)
    last_location_update = db.Column(db.DateTime, nullable=True)
    unlocked_global_avatars = db.Column(JSONB, nullable=True, server_default='[]')
    forum_topics = db.relationship('ForumTopic', backref=db.backref('author', lazy='joined'), lazy=True, foreign_keys='ForumTopic.author_id')
    forum_posts = db.relationship('ForumPost', backref=db.backref('author', lazy='joined'), lazy=True, foreign_keys='ForumPost.author_id')
    global_xp = db.Column(db.Integer, default=0, nullable=False, server_default='0')
    cached_city = db.Column(db.String(100), nullable=True)
    cached_state = db.Column(db.String(100), nullable=True)
    cached_country = db.Column(db.String(100), nullable=True)
    cached_suburb = db.Column(db.String(100), nullable=True)
    
    @validates('name')
    def validate_and_format_name(self, key, name):
        """
        Garante que o nome seja sempre salvo com as 
        primeiras letras de cada palavra em maiúsculo (Title Case).
        """
        if not name:
            return name 
        return name.title()
    

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'institution_name': self.institution_name,
            'discipline': self.discipline,
            'profile_picture': self.profile_picture,
            'location': {
                'city': self.cached_city,
                'state': self.cached_state,
                'country': self.cached_country
            } if self.cached_city else None
        }

class LearningContent(db.Model):
    """Modelo para conteúdo educacional de um passo (ex: vídeo, texto)."""
    __tablename__ = 'learning_content'
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id', ondelete='CASCADE'), nullable=False)
    step_id = db.Column(db.String(50), nullable=False)
    
    # Conteúdo Educacional
    video_url = db.Column(db.String(255), nullable=True) # YouTube/Vimeo
    text_content = db.Column(db.Text, nullable=True)     # Markdown
    material_link = db.Column(db.String(255), nullable=True) # Link extra (PDF, Slide)

    activity = db.relationship('Activity', backref=db.backref('learning_contents', cascade="all, delete-orphan"))
    __table_args__ = (db.UniqueConstraint('activity_id', 'step_id', name='_activity_step_uc_learning'),)

class Activity(db.Model):
    """Modelo central que representa uma atividade gamificada criada por um professor."""
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
    narrative_image_url = db.Column(db.String(512), nullable=True)
    rewards_offered = db.Column(JSONB, nullable=True)
    rewarded_actions = db.Column(JSONB, nullable=True)
    gamification_rules = db.Column(JSONB, nullable=True)
    area_knowledge = db.Column(db.String(100), nullable=True)
    is_public = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=True)
    copy_count = db.Column(db.Integer, nullable=False, default=0, server_default='0')
    assignment_count = db.Column(db.Integer, nullable=False, default=0, server_default='0')
    professor = db.relationship('User', backref='activities', lazy='joined')
    class_obj = db.relationship('Class', backref='assigned_activities', lazy='joined')
    gamification_design = db.Column(JSONB, nullable=True)
    forum_topics = db.relationship('ForumTopic', backref='activity', lazy=True, cascade="all, delete-orphan")
    available_from = db.Column(db.DateTime, nullable=True) # Data de início da disponibilidade
    expires_at = db.Column(db.DateTime, nullable=True)     # Data final (prazo)
    ratings = db.relationship('ActivityRating', backref='activity', lazy=True)
    
    def to_dict(self):
        design = self.gamification_design or {}
        # TODO: Otimizar cálculo de rating para evitar problema N+1.
        # Carregar a contagem e a média de ratings diretamente na query principal
        # que busca as atividades, usando, por exemplo, subqueries ou funções de agregação do DB.
        ratings_count = len(self.ratings)
        average_rating = sum(r.score for r in self.ratings) / ratings_count if ratings_count > 0 else 0
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
            'narrativeImageUrl': self.narrative_image_url,
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
            'copy_count': self.copy_count,
            'assignment_count': self.assignment_count,
            'availableFrom': self.available_from.isoformat() if self.available_from else None,
            'expiresAt': self.expires_at.isoformat() if self.expires_at else None,
            'average_rating': round(average_rating, 1), # Arredonda para 1 casa decimal (ex: 4.5)
            'rating_count': ratings_count,
            'gamificationDesign': {
                'theme': design.get('theme', 'vila_da_aventura'), # Adicione um padrão
                'progression_path': design.get('progression_path', []),
                'hub_elements': design.get('hub_elements', [])
            }
        }

# --- NOVAS TABELAS PARA CONTEÚDO DOS PASSOS ---

class QuizContent(db.Model):
    """Modelo para o conteúdo de um passo do tipo 'Quiz'."""
    __tablename__ = 'quiz_content'
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id', ondelete='CASCADE'), nullable=False)
    step_id = db.Column(db.String(50), nullable=False)
    questions = db.Column(JSONB, nullable=False, default=[])
    
    activity = db.relationship('Activity', backref=db.backref('quiz_contents', cascade="all, delete-orphan"))
    __table_args__ = (db.UniqueConstraint('activity_id', 'step_id', name='_activity_step_uc_quiz'),)

class NarrativeContent(db.Model):
    """Modelo para o conteúdo de um passo do tipo 'Narrativa'."""
    __tablename__ = 'narrative_content'
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id', ondelete='CASCADE'), nullable=False)
    step_id = db.Column(db.String(50), nullable=False)
    scenario = db.Column(db.String(255), nullable=True)
    characters = db.Column(JSONB, nullable=True, default=[])
    dialogue = db.Column(JSONB, nullable=True, default=[])

    activity = db.relationship('Activity', backref=db.backref('narrative_contents', cascade="all, delete-orphan"))
    __table_args__ = (db.UniqueConstraint('activity_id', 'step_id', name='_activity_step_uc_narrative'),)



class Class(db.Model):
    """Modelo para uma turma, criada por um professor para organizar alunos e atividades."""
    __tablename__ = 'class'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    professor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    enrollment_code = db.Column(db.String(50), unique=True, nullable=False)
    assignment_count = db.Column(db.Integer, nullable=False, default=0, server_default='0')
    professor = db.relationship('User', backref='created_classes', lazy=True)
    is_enrollment_code_public = db.Column(db.Boolean, default=False, nullable=False, server_default='f') 
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'professor_id': self.professor_id,
            'enrollment_code': self.enrollment_code,
            'is_enrollment_code_public': self.is_enrollment_code_public
        }

class Enrollment(db.Model):
    """Modelo de associação que representa a matrícula de um aluno em uma turma."""
    __tablename__ = 'enrollment'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    enrollment_date = db.Column(db.DateTime, default=db.func.current_timestamp())

    student = db.relationship('User', backref='enrollments', lazy=True)
    class_obj = db.relationship('Class', backref='enrollments', lazy=True)
    __table_args__ = (db.UniqueConstraint('student_id', 'class_id', name='_student_class_uc'),)

class ActivityProgress(db.Model):
    """Armazena o progresso de um aluno em uma atividade específica."""
    __tablename__ = 'activity_progress'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    points_earned = db.Column(db.Integer, default=0)
    total_xp_earned = db.Column(db.Integer, default=0, nullable=False, server_default='0')
    coins = db.Column(db.Integer, nullable=False, default=0, server_default='0')
    status = db.Column(db.String(50), default='not_started')
    completed_at = db.Column(db.DateTime, nullable=True)
    attempts = db.Column(db.Integer, default=0)
    last_spin_date = db.Column(db.DateTime, nullable=True)
    completed_steps = db.Column(JSONB, nullable=True, server_default='[]')

    # --- Campos de Customização ---
    equipped_activity_avatar_url = db.Column(db.String(255), nullable=True)
    equipped_title_id = db.Column(db.Integer, db.ForeignKey('title.id'), nullable=True)
    
    # NOVOS CAMPOS: Armazenam o ID do item da loja (StoreItem) que é o cosmético
    equipped_name_cosmetic_id = db.Column(db.Integer, db.ForeignKey('store_item.id'), nullable=True)
    equipped_title_cosmetic_id = db.Column(db.Integer, db.ForeignKey('store_item.id'), nullable=True)

    # --- Campos de Itens Desbloqueados ---
    unlocked_activity_avatars = db.Column(JSONB, nullable=True, server_default='[]')
    
    # --- Relações (Relationships) ---
    student = db.relationship('User', backref='activity_progresses', lazy=True)
    activity = db.relationship('Activity', backref=db.backref('progresses', cascade="all, delete-orphan"))
    class_obj = db.relationship('Class', backref='activity_progresses', lazy=True)
    
    equipped_title = db.relationship('Title')
    # NOVAS RELAÇÕES: Usamos foreign_keys para resolver a ambiguidade de múltiplas FKs para a mesma tabela
    equipped_name_cosmetic = db.relationship('StoreItem', foreign_keys=[equipped_name_cosmetic_id])
    equipped_title_cosmetic = db.relationship('StoreItem', foreign_keys=[equipped_title_cosmetic_id])
    __table_args__ = (db.UniqueConstraint('student_id', 'activity_id', name='_student_activity_uc'),)
    
    # --- ADICIONE ESTE MÉTODO ---
    def to_dict(self):
        """Converte o objeto ActivityProgress para um dicionário serializável."""
        # A função calculate_level não está disponível aqui, então calculamos no endpoint.
        # Aqui, retornamos os dados brutos que o frontend precisa.
        return {
            "points_earned": self.points_earned,
            "total_xp_earned": self.total_xp_earned,
            "coins": self.coins,
            "status": self.status,
            "attempts": self.attempts,
            "completed_steps": self.completed_steps or [],
            "unlocked_activity_avatars": self.unlocked_activity_avatars or [],
            "equipped_activity_avatar_url": self.equipped_activity_avatar_url,
            # Adicione outros campos se forem necessários no frontend após a compra
        }


class EventLog(db.Model):
    """Registra eventos importantes no sistema para análise e gamificação."""
    __tablename__ = 'event_log'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # --- Contexto do usuário ---
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=True)
    
    # --- Nova Estrutura de Logging ---
    section = db.Column(db.String(50), nullable=True)   # Ex: 'quiz', 'store', 'ranking'
    action = db.Column(db.String(100), nullable=False)  # Ex: 'start_quiz', 'purchase_item'
    details = db.Column(JSONB, nullable=True)           # Dados extras flexíveis
        
    # --- Metadados ---
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.Text)

    # Relacionamentos
    user = db.relationship('User', backref='event_logs')
    activity = db.relationship('Activity', backref=db.backref('event_logs', cascade="all, delete-orphan"))

class StudentResponse(db.Model):
    """Armazena a resposta de um aluno a uma questão ou tarefa dissertativa."""
    __tablename__ = 'student_response'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    response_data = db.Column(JSONB, nullable=False)
    is_correct = db.Column(db.Boolean)
    score = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    student = db.relationship('User', backref='responses')
    activity = db.relationship('Activity', backref=db.backref('responses', cascade="all, delete-orphan"))

class Tag(db.Model):
    """Modelo para tags que podem ser associadas a atividades para categorização."""
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
    """Armazena o histórico de revisões de uma atividade."""
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
    """Permite que professores deem feedback manual para respostas de alunos."""
    __tablename__ = 'manual_feedback'
    id = db.Column(db.Integer, primary_key=True)
    response_id = db.Column(db.Integer, db.ForeignKey('student_response.id'), nullable=False)
    feedback_text = db.Column(db.Text, nullable=False)
    given_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    score_adjustment = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    response = db.relationship('StudentResponse', backref='feedbacks')
    given_by = db.relationship('User')


class RouletteWin(db.Model):
    """Registra os prêmios ganhos por um usuário na roleta de uma atividade."""
    __tablename__ = 'roulette_win'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    prize_label = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())

    # Relações para facilitar as consultas
    user = db.relationship('User', backref='roulette_wins')
    activity = db.relationship('Activity', backref=db.backref('roulette_wins', cascade="all, delete-orphan"))

class SlotWin(db.Model):
    """Registra os prêmios ganhos por um usuário no caça-níquel de uma atividade."""
    __tablename__ = 'slot_win'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    prize_description = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())
    user = db.relationship('User', backref='slot_wins')
    activity = db.relationship('Activity', backref=db.backref('slot_wins', cascade="all, delete-orphan"))

class Purchase(db.Model):
    """Registra a compra de um item da loja por um usuário em uma atividade."""
    __tablename__ = 'purchase'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('store_item.id'), nullable=False)
    
    item_name = db.Column(db.String(100), nullable=False)
    price_paid = db.Column(db.Integer, nullable=False)
    purchase_date = db.Column(db.DateTime, default=db.func.current_timestamp())
    expires_at = db.Column(db.DateTime, nullable=True)

    # Para itens consumíveis (ex: Dica Extra), podemos controlar se já foi usado.
    is_consumed = db.Column(db.Boolean, default=False, nullable=False)

    # Relações para facilitar as consultas
    user = db.relationship('User', backref='purchases')
    activity = db.relationship('Activity', backref=db.backref('purchases', cascade="all, delete-orphan"))
    item = db.relationship('StoreItem', backref=db.backref('purchases', cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'item_id': self.item_id,
            'item_name': self.item_name,
            'price_paid': self.price_paid,
            'purchase_date': self.purchase_date.isoformat(),
            'is_consumed': self.is_consumed,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }



class StoreItem(db.Model):
    """Representa um item que pode ser comprado na loja de uma atividade."""
    __tablename__ = 'store_item'
    
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    price = db.Column(db.Integer, nullable=False, default=50)
    icon = db.Column(db.String(50), nullable=True, default='💡')
    
    # --- NOVOS CAMPOS ---
    item_type = db.Column(db.String(50), nullable=False, default='utility') 
    # Um identificador único para o efeito (ex: 'RANKING_COLOR_GOLD')
    effect_id = db.Column(JSONB, nullable=True) 

    activity = db.relationship('Activity', backref=db.backref('store_items', cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            'id': self.id,
            'activity_id': self.activity_id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'icon': self.icon,
            'item_type': self.item_type,
            'effect_id': self.effect_id
        }


class Title(db.Model):
    """Define um título cosmético que pode ser desbloqueado e equipado por usuários."""
    __tablename__ = 'title'
    id = db.Column(db.Integer, primary_key=True)
    # ID único para referência interna (ex: TITLE_LUCKY, TITLE_MASTER)
    effect_id = db.Column(db.String(100), unique=True, nullable=False)
    # O texto que será exibido para o jogador (ex: "O Sortudo")
    display_text = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)

class UserUnlockedTitle(db.Model):
    """Associação que indica que um usuário desbloqueou um título específico em uma atividade."""
    __tablename__ = 'user_unlocked_title'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    title_id = db.Column(db.Integer, db.ForeignKey('title.id'), nullable=False)

    user = db.relationship('User')
    activity = db.relationship('Activity')
    title = db.relationship('Title')
    
    # Garante que um usuário não possa desbloquear o mesmo título na mesma atividade várias vezes
    __table_args__ = (db.UniqueConstraint('user_id', 'activity_id', 'title_id', name='_user_activity_title_uc'),)

class Medal(db.Model):
    """Define uma medalha/conquista que pode ser desbloqueada por usuários."""
    __tablename__ = 'medal'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=False) # Como obter
    image_url = db.Column(db.String(255), nullable=False)
    # Tipo: 'PLATFORM' para automáticas, 'ACTIVITY' para as do professor
    type = db.Column(db.String(50), nullable=False, default='PLATFORM')
    # Notas extras, como o propósito pedagógico
    notes = db.Column(db.Text, nullable=True)

class UserUnlockedMedal(db.Model):
    """Associação que indica que um usuário desbloqueou uma medalha."""
    __tablename__ = 'user_unlocked_medal'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    medal_id = db.Column(db.Integer, db.ForeignKey('medal.id'), nullable=False)
    unlocked_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    # Opcional: em qual atividade a medalha foi ganha (se aplicável)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=True)

    # Relações
    user = db.relationship('User', backref='unlocked_medals')
    medal = db.relationship('Medal')
    activity = db.relationship('Activity')

    # Garante que um usuário não ganhe a mesma medalha mais de uma vez
    __table_args__ = (db.UniqueConstraint('user_id', 'medal_id', name='_user_medal_uc'),)


class ForumTopic(db.Model):
    """Representa um tópico de discussão no fórum de uma atividade."""
    __tablename__ = 'forum_topic'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    category_id = db.Column(db.Integer, db.ForeignKey('forum_category.id', ondelete="CASCADE"), nullable=False)

    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id', ondelete="CASCADE"), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    best_answer_id = db.Column(db.Integer, db.ForeignKey('forum_post.id', use_alter=True), nullable=True)

    # --- ADICIONE ESTA LINHA ---
    is_pinned = db.Column(db.Boolean, default=False, nullable=False, server_default='f')

    posts = db.relationship('ForumPost', backref='topic', lazy='dynamic', foreign_keys='ForumPost.topic_id', cascade="all, delete-orphan")
    best_answer = db.relationship('ForumPost', foreign_keys=[best_answer_id])
    likes = db.relationship('TopicLike', backref='topic', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        # TODO: Otimizar contagens para evitar queries extras (problema N+1).
        # Carregar 'post_count' e 'likes_count' na query principal usando subqueries.
        return {
            "id": self.id,
            "title": self.title,
            "body": self.body,
            "created_at": self.created_at.isoformat(),
            "activity_id": self.activity_id,
            "author_id": self.author_id,
            "author_name": self.author.name if self.author else None,
            "best_answer_id": self.best_answer_id,
            "post_count": self.posts.count(), # Cuidado: pode gerar uma query extra
            "likes_count": len(self.likes),   # Cuidado: pode gerar uma query extra
            "is_pinned": self.is_pinned
        }

class ForumPost(db.Model):
    """Representa uma resposta (post) dentro de um tópico do fórum."""
    __tablename__ = 'forum_post'
    
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    # Chaves estrangeiras que conectam a resposta
    topic_id = db.Column(db.Integer, db.ForeignKey('forum_topic.id', ondelete="CASCADE"), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    likes = db.relationship('PostLike', backref='post', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "body": self.body,
            "created_at": self.created_at.isoformat(),
            "topic_id": self.topic_id,
            "author_id": self.author_id,
            "author_name": self.author.name if self.author else None,
            "likes_count": len(self.likes)
        }

class ForumCategory(db.Model):
    """Define uma categoria para organizar os tópicos do fórum dentro de uma atividade."""
    __tablename__ = 'forum_category'
    
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id', ondelete="CASCADE"), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    # Futuramente, podemos adicionar um 'is_locked' para o professor fechar uma categoria
    
    # Relação com os tópicos que pertencem a esta categoria
    topics = db.relationship('ForumTopic', backref='category', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "activity_id": self.activity_id,
            "title": self.title,
            "description": self.description,
            "topic_count": len(self.topics) # Conta os tópicos
        }
        
class TopicLike(db.Model):
    """Associação que representa um 'like' de um usuário em um tópico do fórum."""
    __tablename__ = 'topic_like'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete="CASCADE"), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('forum_topic.id', ondelete="CASCADE"), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    __table_args__ = (db.UniqueConstraint('user_id', 'topic_id', name='_user_topic_like_uc'),)

class PostLike(db.Model):
    """Associação que representa um 'like' de um usuário em um post do fórum."""
    __tablename__ = 'post_like'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete="CASCADE"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('forum_post.id', ondelete="CASCADE"), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='_user_post_like_uc'),)


# Tabela de associação para os participantes da conversa
conversation_participants = db.Table('conversation_participants',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('conversation_id', db.Integer, db.ForeignKey('conversation.id'), primary_key=True)
)

class Conversation(db.Model):
    """Representa uma conversa no chat, que pode ser em grupo (atividade) ou direta."""
    __tablename__ = 'conversation'
    
    id = db.Column(db.Integer, primary_key=True)
    # 'group' para chats de atividade, 'direct' para mensagens diretas
    type = db.Column(db.String(50), nullable=False, default='group')
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    # Opcional: Se for um chat de grupo, pode estar associado a uma atividade
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=True, unique=True)
    
    # Relação muitos-para-muitos com os usuários (participantes)
    participants = db.relationship('User', secondary=conversation_participants, lazy='subquery',
                                   backref=db.backref('conversations', lazy=True))
    messages = db.relationship('ChatMessage', backref='conversation', lazy=True, cascade="all, delete-orphan")

class ChatMessage(db.Model):
    """Representa uma única mensagem enviada em uma conversa de chat."""
    __tablename__ = 'chat_message'
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversation.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    sender = db.relationship('User', backref='sent_chat_messages', lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.name if self.sender else None,
            'content': self.content,
            'created_at': self.created_at.isoformat()
        }


class ActivityRating(db.Model):
    """Armazena a avaliação (nota de 1 a 5) que um usuário deu para uma atividade."""
    __tablename__ = 'activity_rating'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False) # 1 a 5
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    # Restrição: Um aluno só pode avaliar uma atividade uma vez (opcional)
    __table_args__ = (db.UniqueConstraint('user_id', 'activity_id', name='_user_activity_rating_uc'),)
    
class ContactMessage(db.Model):
    __tablename__ = 'contact_messages'

    id = db.Column(db.Integer, primary_key=True)
    # CORREÇÃO 1: 'user.id' no singular (para bater com __tablename__ = 'user')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) 
    
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    
    # CORREÇÃO 2: Usar db.func.current_timestamp() para consistência com o resto do sistema
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    is_read = db.Column(db.Boolean, default=False) 

    # Relacionamento opcional
    user = db.relationship('User', backref='sent_messages')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'subject': self.subject,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_read': self.is_read
        }
    