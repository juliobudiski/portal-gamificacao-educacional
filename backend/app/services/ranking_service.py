"""
Serviço de Ranking (RankingService)
Responsável por calcular e gerar os leaderboards globais (como o ranking de professores criadores),
garantindo que o usuário atual saiba a sua posição relativa mesmo que não esteja no Top 10.
"""

import logging
from ..models import db, User, Activity

logger = logging.getLogger(__name__)

class TeacherPrivacyNameFormatter:
    """
    Formatador de nomes orientado a objetos para conformidade com a LGPD.
    Exibe o primeiro nome e as iniciais dos sobrenomes (ex: 'Julio Cesar da Silva' -> 'Julio C. S.').
    """
    PREPOSITIONS = {'de', 'da', 'do', 'das', 'dos', 'e'}

    @classmethod
    def format(cls, raw_name: str) -> str:
        if not raw_name or not isinstance(raw_name, str):
            return "Professor Anônimo"
        
        cleaned = " ".join(raw_name.strip().split())
        if not cleaned:
            return "Professor Anônimo"
        
        tokens = cleaned.split(" ")
        first_name = tokens[0].capitalize()
        
        if len(tokens) == 1:
            return first_name
        
        initials = []
        for token in tokens[1:]:
            lower_token = token.lower()
            if lower_token in cls.PREPOSITIONS:
                continue
            char = token[0].upper()
            if char.isalnum():
                initials.append(f"{char}.")
        
        if not initials:
            return first_name
            
        return f"{first_name} {' '.join(initials)}"


class RankingService:
    @staticmethod
    def get_teacher_creators_ranking(current_user_id):
        """
        Agrupa todas as atividades criadas pelos professores e calcula
        quem são os mais ativos (Top 10).
        - Anonimiza o nome exibido (LGPD: primeiro nome + iniciais dos sobrenomes).
        - Utiliza critério de desempate determinístico (User.id asc).
        - Se o professor atual estiver fora do Top 10, sua posição é anexada no final da lista.
        - Se o professor atual nunca tiver criado uma atividade, ele é incluído com score 0 e a última posição.
        """
        try:
            # Conta o número de atividades associadas a cada professor com critério determinístico de desempate
            ranking_query = db.session.query(
                User.id,
                User.name,
                User.profile_picture,
                db.func.count(Activity.id).label('activity_count')
            ).join(Activity, User.id == Activity.professor_id)\
             .filter(User.role == 'professor')\
             .group_by(User.id)\
             .order_by(db.func.count(Activity.id).desc(), User.id.asc())
            
            all_teachers_ranked = ranking_query.all()

            top_10_ranking = []
            current_user_in_ranking = None
            user_is_in_top_10 = False

            # Itera sobre todos para encontrar o top 10 e a posição do usuário atual simultaneamente
            for i, teacher in enumerate(all_teachers_ranked):
                rank = i + 1
                teacher_data = {
                    "rank": rank,
                    "id": teacher.id,
                    "name": TeacherPrivacyNameFormatter.format(teacher.name),
                    "avatar_url": teacher.profile_picture,
                    "score": teacher.activity_count
                }

                if rank <= 10:
                    top_10_ranking.append(teacher_data)
                    if teacher.id == current_user_id:
                        user_is_in_top_10 = True
                
                if teacher.id == current_user_id:
                    current_user_in_ranking = teacher_data
            
            # Se não está no top 10, mas tem pelo menos 1 atividade criada, anexa ao final
            if not user_is_in_top_10 and current_user_in_ranking:
                top_10_ranking.append(current_user_in_ranking)

            # Caso o usuário nunca tenha criado atividades, ele não aparece no Join. Forçamos a aparição.
            if not current_user_in_ranking:
                user_obj = User.query.get(current_user_id)
                if user_obj and user_obj.role == 'professor':
                    top_10_ranking.append({
                        "rank": len(all_teachers_ranked) + 1, # Último lugar + 1
                        "id": user_obj.id,
                        "name": TeacherPrivacyNameFormatter.format(user_obj.name),
                        "avatar_url": user_obj.profile_picture,
                        "score": 0
                    })

            return top_10_ranking, None

        except Exception as e:
            logger.error(f"Erro ao gerar ranking de criadores: {e}", exc_info=True)
            return None, "Erro interno ao processar o ranking."
