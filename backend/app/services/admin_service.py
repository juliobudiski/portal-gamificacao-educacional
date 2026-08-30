"""
Serviço de Administração (AdminService)
Encapsula lógicas pesadas consumidas pelo painel do administrador,
como processamento em lote de CSVs e integração com APIs externas de geolocalização.
"""

import requests
import csv
from io import StringIO
from datetime import datetime, timedelta
from sqlalchemy import func, cast, Numeric
from flask import current_app

from ..models import db, User, EventLog, Activity, ActivityProgress, Purchase

class AdminService:
    @staticmethod
    def get_user_locations_data():
        """
        Busca todos os usuários com coordenadas válidas e resolve o nome
        das cidades via API externa (Nominatim / OpenStreetMap).
        - Implementa um cache em memória (geo_cache) para evitar consultas
          repetidas à API para coordenadas idênticas e economizar requisições.
        """
        users_with_location = User.query.filter(
            User.last_known_latitude.isnot(None),
            User.last_known_longitude.isnot(None)
        ).all()

        locations_data = []
        geo_cache = {}

        for user in users_with_location:
            lat = user.last_known_latitude
            lon = user.last_known_longitude
            cache_key = f"{lat:.4f},{lon:.4f}"

            if cache_key in geo_cache:
                address = geo_cache[cache_key]
            else:
                try:
                    geo_url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
                    # Header essencial exigido pela política de uso do Nominatim
                    headers = {'User-Agent': 'GamificaEduPortal/1.0'}
                    geo_res = requests.get(geo_url, headers=headers, timeout=5)
                    geo_res.raise_for_status()
                    geo_data = geo_res.json().get('address', {})
                    
                    address = {
                        'city': geo_data.get('city') or geo_data.get('town') or geo_data.get('village', 'N/A'),
                        'state': geo_data.get('state', 'N/A'),
                        'country': geo_data.get('country', 'N/A'),
                        'suburb': geo_data.get('suburb', 'N/A')
                    }
                    geo_cache[cache_key] = address
                except requests.exceptions.RequestException as e:
                    current_app.logger.error(f"Falha na geocodificação para user {user.id}: {e}")
                    address = None
            
            if address:
                locations_data.append({
                    "user_id": user.id,
                    "user_name": user.name,
                    "latitude": lat,
                    "longitude": lon,
                    "city": address.get('city'),
                    "state": address.get('state'),
                    "country": address.get('country'),
                    "suburb": address.get('suburb'),
                    "last_update": user.last_location_update.isoformat() if user.last_location_update else 'N/A'
                })
        return locations_data

    @staticmethod
    def generate_csv_logs(search_user=None, filter_action=None, start_date_str=None, end_date_str=None):
        """
        Constrói e exporta um arquivo CSV contendo os logs do sistema (EventLog).
        - Utiliza Yield e StringIO para gerar as linhas sob demanda (streaming),
          evitando sobrecarregar a memória RAM do servidor com arrays imensos.
        - Aplica filtros opcionais por usuário, ação e período de tempo.
        """
        query = db.session.query(
            EventLog, User.name, User.email, User.role
        ).join(User, User.id == EventLog.user_id)

        if search_user: 
            query = query.filter(User.name.ilike(f'%{search_user}%'))
        if filter_action: 
            query = query.filter(EventLog.action == filter_action)
        
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
                query = query.filter(EventLog.created_at >= start_date)
            except ValueError: 
                pass
                
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)
                query = query.filter(EventLog.created_at < end_date)
            except ValueError: 
                pass
        
        query = query.order_by(EventLog.created_at.desc())
        logs = query.all()

        def generate():
            data = StringIO()
            writer = csv.writer(data, delimiter=';')
            writer.writerow(['ID_Log', 'Data_Hora', 'Usuario', 'Email', 'Role', 'Secao', 'Acao', 'Detalhes_JSON', 'IP'])
            yield data.getvalue()
            data.seek(0)
            data.truncate(0)

            for log, user_name, user_email, user_role in logs:
                writer.writerow([
                    log.id,
                    log.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    user_name,
                    user_email,
                    user_role,
                    log.section,
                    log.action,
                    log.details,
                    log.ip_address
                ])
                yield data.getvalue()
                data.seek(0)
                data.truncate(0)

        return generate()
