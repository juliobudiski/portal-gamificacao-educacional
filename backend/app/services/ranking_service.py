import logging
from ..models import db, User, Activity

logger = logging.getLogger(__name__)

class RankingService:
    @staticmethod
    def get_teacher_creators_ranking(current_user_id):
        try:
            ranking_query = db.session.query(
                User.id,
                User.name,
                User.profile_picture,
                db.func.count(Activity.id).label('activity_count')
            ).join(Activity, User.id == Activity.professor_id)\
             .filter(User.role == 'professor')\
             .group_by(User.id)\
             .order_by(db.func.count(Activity.id).desc())
            
            all_teachers_ranked = ranking_query.all()

            top_10_ranking = []
            current_user_in_ranking = None
            user_is_in_top_10 = False

            for i, teacher in enumerate(all_teachers_ranked):
                rank = i + 1
                teacher_data = {
                    "rank": rank,
                    "id": teacher.id,
                    "name": teacher.name,
                    "avatar_url": teacher.profile_picture,
                    "score": teacher.activity_count
                }

                if rank <= 10:
                    top_10_ranking.append(teacher_data)
                    if teacher.id == current_user_id:
                        user_is_in_top_10 = True
                
                if teacher.id == current_user_id:
                    current_user_in_ranking = teacher_data
            
            if not user_is_in_top_10 and current_user_in_ranking:
                top_10_ranking.append(current_user_in_ranking)

            if not current_user_in_ranking:
                user_obj = User.query.get(current_user_id)
                if user_obj and user_obj.role == 'professor':
                    top_10_ranking.append({
                        "rank": len(all_teachers_ranked) + 1,
                        "id": user_obj.id,
                        "name": user_obj.name,
                        "avatar_url": user_obj.profile_picture,
                        "score": 0
                    })

            return top_10_ranking, None

        except Exception as e:
            logger.error(f"Erro ao gerar ranking de criadores: {e}", exc_info=True)
            return None, "Erro interno ao processar o ranking."
