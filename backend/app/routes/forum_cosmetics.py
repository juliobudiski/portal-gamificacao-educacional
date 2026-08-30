# Temporary file to inject the logic
import json
from ..models import db, ActivityProgress, User

def _enrich_forum_with_cosmetics(items_dicts, activity_id):
    if not items_dicts:
        return items_dicts

    author_ids = list(set(item['author_id'] for item in items_dicts if 'author_id' in item))
    if not author_ids:
        return items_dicts
        
    progress_records = ActivityProgress.query.filter(
        ActivityProgress.activity_id == activity_id,
        ActivityProgress.student_id.in_(author_ids)
    ).all()
    
    users = User.query.filter(User.id.in_(author_ids)).all()
    user_avatars = {u.id: u.profile_picture for u in users}

    cosmetic_map = {}
    for p in progress_records:
        name_cosmetic = p.equipped_name_cosmetic.effect_id if p.equipped_name_cosmetic else None
        title_cosmetic = p.equipped_title_cosmetic.effect_id if p.equipped_title_cosmetic else None
        
        if isinstance(name_cosmetic, str):
            try: name_cosmetic = json.loads(name_cosmetic)
            except: pass
        if isinstance(title_cosmetic, str):
            try: title_cosmetic = json.loads(title_cosmetic)
            except: pass

        cosmetic_map[p.student_id] = {
            "title": p.equipped_title.display_text if p.equipped_title else None,
            "name_cosmetic": name_cosmetic,
            "title_cosmetic": title_cosmetic,
            "avatar": p.equipped_activity_avatar_url or user_avatars.get(p.student_id) or '/avatars/default_avatar.webp'
        }
        
    for item in items_dicts:
        c = cosmetic_map.get(item.get('author_id'), {})
        item['title'] = c.get('title')
        item['name_cosmetic'] = c.get('name_cosmetic')
        item['title_cosmetic'] = c.get('title_cosmetic')
        item['avatar'] = c.get('avatar', user_avatars.get(item.get('author_id'), '/avatars/default_avatar.webp'))
        
    return items_dicts
