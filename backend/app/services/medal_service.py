"""
Serviço de Medalhas e Conquistas (MedalService & Strategy Pattern)
Responsável pelo motor escalável de regras de badges.

Padrão de Arquitetura:
- Strategy Pattern: Cada regra de medalha é uma classe desacoplada derivada de BadgeStrategy.
- Registry/Observer: O BadgeEvaluator registra as estratégias por evento e avalia critérios de forma segura.
- Idempotência Estrita: Nunca concede a mesma medalha duas vezes (DB UniqueConstraint + Cache de verificação).
- Resiliência / Fail-Safe: Exceções na avaliação de medalhas nunca abortam nem quebram o fluxo transacional principal.
"""
from abc import ABC, abstractmethod
from flask import current_app
from ..models import db, Medal, UserUnlockedMedal, User, ActivityProgress, StudentResponse, Activity


class BaseBadgeStrategy(ABC):
    """Classe base abstrata para qualquer regra de medalha."""
    
    @property
    @abstractmethod
    def medal_name(self) -> str:
        """Nome exato da medalha como cadastrado no banco de dados."""
        pass

    @property
    @abstractmethod
    def event_types(self) -> list:
        """Lista de tipos de evento que disparam a avaliação desta medalha."""
        pass

    @abstractmethod
    def evaluate(self, user: User, activity_id: int, **kwargs) -> bool:
        """Avalia se o usuário cumpriu todos os critérios da conquista."""
        pass


class ExploradorBadgeStrategy(BaseBadgeStrategy):
    """Regra: Completar 100% dos passos de uma trilha/tabuleiro de atividade."""
    medal_name = "Medalha do Explorador"
    event_types = ["activity_completed", "step_completed"]

    def evaluate(self, user: User, activity_id: int, **kwargs) -> bool:
        if not activity_id:
            return False
        progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()
        activity = Activity.query.get(activity_id)

        if not all([progress, activity, activity.gamification_design]):
            return False

        progression_path = activity.gamification_design.get('progression_path')
        if not progression_path or not isinstance(progression_path, list):
            return progress.status == 'completed'

        all_step_ids = {step.get('id') for step in progression_path if isinstance(step, dict) and step.get('id')}
        completed_steps_set = set(progress.completed_steps or [])

        return all_step_ids.issubset(completed_steps_set) if all_step_ids else progress.status == 'completed'


class InspetorBadgeStrategy(BaseBadgeStrategy):
    """Regra: Terminar a atividade sem cometer nenhum erro em quizzes/enigmas."""
    medal_name = "Medalha do Inspetor"
    event_types = ["activity_completed"]

    def evaluate(self, user: User, activity_id: int, **kwargs) -> bool:
        if not activity_id:
            return False
        incorrect_response = StudentResponse.query.filter_by(
            student_id=user.id, activity_id=activity_id, is_correct=False
        ).first()
        return incorrect_response is None


class VelocistaBadgeStrategy(BaseBadgeStrategy):
    """Regra: Ser um dos 3 primeiros alunos a finalizar a atividade."""
    medal_name = "Medalha do Velocista"
    event_types = ["activity_completed"]

    def evaluate(self, user: User, activity_id: int, **kwargs) -> bool:
        if not activity_id:
            return False
        completion_count = ActivityProgress.query.filter(
            ActivityProgress.activity_id == activity_id,
            ActivityProgress.completed_at.isnot(None),
            ActivityProgress.student_id != user.id
        ).count()
        return completion_count < 3


class FenixBadgeStrategy(BaseBadgeStrategy):
    """Regra: Superação - Acertar uma questão/enigma após errar em tentativa anterior."""
    medal_name = 'Medalha "Fênix"'
    event_types = ["quiz_answer_submitted", "step_completed"]

    def evaluate(self, user: User, activity_id: int, **kwargs) -> bool:
        is_current_correct = kwargs.get('is_correct', False)
        if not is_current_correct or not activity_id:
            return False

        question_text = kwargs.get('question_text')
        if not question_text:
            return False

        # Verifica tentativa prévia incorreta com a mesma questão
        previous_incorrect = StudentResponse.query.filter(
            StudentResponse.student_id == user.id,
            StudentResponse.activity_id == activity_id,
            StudentResponse.response_data['question'].astext == question_text,
            StudentResponse.is_correct == False
        ).first()

        return previous_incorrect is not None


class PecaChaveBadgeStrategy(BaseBadgeStrategy):
    """Regra: Resolver enigmas ou caça-palavras/quebra-cabeças dentro da atividade."""
    medal_name = 'Medalha "Peça-Chave"'
    event_types = ["step_completed", "enigma_solved", "wordsearch_completed"]

    def evaluate(self, user: User, activity_id: int, **kwargs) -> bool:
        step_type = kwargs.get('step_type', '')
        # Se o passo concluído for do tipo puzzle, enigma, caça-palavras ou quebra-cabeça
        puzzle_types = ['enigma', 'caca_palavras', 'wordsearch', 'puzzle', 'quebra_cabeca']
        return any(pt in str(step_type).lower() for pt in puzzle_types) or kwargs.get('is_puzzle_solved', False)


class BadgeRegistry:
    """Registro unificado de estratégias de avaliação de medalhas."""
    def __init__(self):
        self._strategies = []
        self._register_defaults()

    def register(self, strategy: BaseBadgeStrategy):
        self._strategies.append(strategy)

    def _register_defaults(self):
        self.register(ExploradorBadgeStrategy())
        self.register(InspetorBadgeStrategy())
        self.register(VelocistaBadgeStrategy())
        self.register(FenixBadgeStrategy())
        self.register(PecaChaveBadgeStrategy())

    def get_strategies_for_event(self, event_type: str) -> list:
        return [s for s in self._strategies if event_type in s.event_types]


# Instância Singleton do Registry
badge_registry = BadgeRegistry()


class MedalService:
    @staticmethod
    def check_and_award_medals(user_id, activity_id, event_type, **kwargs):
        """
        Ponto de entrada do motor de conquistas.
        Garante Idempotência absoluta e isolamento transacional para nunca quebrar o fluxo principal.
        """
        try:
            user = User.query.get(user_id)
            if not user:
                return []

            strategies = badge_registry.get_strategies_for_event(event_type)
            if not strategies:
                return []

            # 1. Carrega em memória as medalhas que o aluno já possui (O(1) lookups)
            existing_unlocked_ids = {
                m.medal_id for m in UserUnlockedMedal.query.filter_by(user_id=user_id).all()
            }

            medals_awarded = []

            for strategy in strategies:
                medal = Medal.query.filter_by(name=strategy.medal_name).first()
                if not medal:
                    continue

                # Idempotência: Se já possui, ignora sem computar regras caras
                if medal.id in existing_unlocked_ids:
                    continue

                try:
                    is_eligible = strategy.evaluate(user, activity_id, **kwargs)
                    if is_eligible:
                        # Double check antes do insert para máxima concorrência segura
                        already_has = UserUnlockedMedal.query.filter_by(user_id=user.id, medal_id=medal.id).first()
                        if not already_has:
                            new_unlock = UserUnlockedMedal(
                                user_id=user.id,
                                medal_id=medal.id,
                                activity_id=activity_id
                            )
                            db.session.add(new_unlock)
                            existing_unlocked_ids.add(medal.id)
                            medals_awarded.append({
                                "id": medal.id,
                                "name": medal.name,
                                "imageUrl": f"/{medal.image_url.lstrip('/')}" if medal.image_url else "/medals/default.webp",
                                "description": medal.description
                            })
                            current_app.logger.info(f"[BadgeEngine] 🏅 Medalha '{medal.name}' concedida ao usuário {user.id} ({event_type}).")
                except Exception as eval_err:
                    current_app.logger.warning(f"[BadgeEngine] Falha ao avaliar estratégia {strategy.medal_name}: {eval_err}")

            if medals_awarded:
                db.session.commit()

            return medals_awarded

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"[BadgeEngine CRITICAL] Erro no motor de medalhas para user {user_id}: {e}", exc_info=True)
            return []

    @staticmethod
    def get_my_unlocked_medals_service(user_id, activity_id=None):
        """
        Retorna as medalhas desbloqueadas do usuário com hidratação completa
        de metadados para consumo no Dashboard ou Tabs.
        """
        query = UserUnlockedMedal.query.filter_by(user_id=user_id)
        if activity_id:
            query = query.filter_by(activity_id=activity_id)

        unlocked_records = query.all()
        
        # Retorna lista de IDs para compatibilidade com o hook do frontend
        return [record.medal_id for record in unlocked_records]

    @staticmethod
    def get_user_badges_full(user_id):
        """
        Retorna o catálogo completo de medalhas com status (is_unlocked: bool, unlocked_at),
        permitindo que o frontend exiba medalhas ganhas e medalhas bloqueadas para gerar desejo.
        """
        all_medals = Medal.query.order_by(Medal.type, Medal.name).all()
        unlocked_records = {m.medal_id: m for m in UserUnlockedMedal.query.filter_by(user_id=user_id).all()}

        badges = []
        for medal in all_medals:
            unlock_info = unlocked_records.get(medal.id)
            badges.append({
                "id": medal.id,
                "name": medal.name,
                "description": medal.description,
                "imageUrl": f"/{medal.image_url.lstrip('/')}" if medal.image_url else "/medals/default.webp",
                "type": medal.type,
                "notes": medal.notes,
                "is_unlocked": unlock_info is not None,
                "unlocked_at": unlock_info.unlocked_at.isoformat() if unlock_info and unlock_info.unlocked_at else None
            })

        return badges
