
from datetime import datetime
import requests
from flask import current_app

def update_user_location_data(user, lat, lon):
    """
    Atualiza Lat/Lon e resolve o endereço APENAS se a mudança for significativa
    ou se não houver endereço salvo.
    """
    # Pequena otimização: se a distância mudou pouco (< 100m), não chama a API externa
    if user.last_known_latitude and abs(user.last_known_latitude - lat) < 0.001:
        if user.last_known_longitude and abs(user.last_known_longitude - lon) < 0.001:
            return # Não mudou o suficiente

    user.last_known_latitude = lat
    user.last_known_longitude = lon
    user.last_location_update = datetime.utcnow()

    try:
        # User-Agent é OBRIGATÓRIO para o Nominatim não dar erro 403/Timeout
        headers = {'User-Agent': 'GameficaEdu/1.0 (seu_email@dominio.com)'}
        geo_url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        
        response = requests.get(geo_url, headers=headers, timeout=5)
        if response.ok:
            data = response.json().get('address', {})
            user.cached_city = data.get('city') or data.get('town') or data.get('village')
            user.cached_state = data.get('state')
            user.cached_country = data.get('country')
            user.cached_suburb = data.get('suburb')
            # db.session.commit() deve ser chamado por quem invocou essa função
    except Exception as e:
        current_app.logger.error(f"Erro ao geocodificar usuário {user.id}: {e}")