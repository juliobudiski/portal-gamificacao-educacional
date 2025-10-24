import requests
import json
import os
from datetime import date, timedelta

# --- CONFIGURAÇÃO ---
# Coloque sua API Key aqui
API_KEY = 'waka_c0fa51f8-159b-45c5-aee3-0af9740c5068'
HISTORY_FILE = 'wakatime_history.json'
# --------------------

def fetch_last_7_days_data():
    """Busca os resumos dos últimos 7 dias na API do WakaTime."""
    today = date.today()
    seven_days_ago = today - timedelta(days=6)
    
    print(f"Buscando dados de {seven_days_ago} até {today}...")
    
    url = f"https://wakatime.com/api/v1/users/current/summaries?start={seven_days_ago}&end={today}&api_key={API_KEY}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()['data']
    except requests.exceptions.RequestException as e:
        print(f"Erro ao fazer a requisição para a API: {e}")
    except json.JSONDecodeError:
        print("Erro: A resposta da API não foi um JSON válido.")
    return []

def update_history_file(new_data):
    """Carrega o histórico, adiciona novos dados sem duplicar e salva."""
    
    # Carrega os dados existentes (se o arquivo existir)
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            try:
                history_data = json.load(f)
            except json.JSONDecodeError:
                history_data = []
    else:
        history_data = []

    # Para evitar buscas lentas, cria um conjunto com as datas que já temos
    existing_dates = {item['range']['date'] for item in history_data}
    
    new_entries_added = 0
    
    # Itera sobre os novos dados e adiciona apenas o que for novo
    for daily_summary in new_data:
        summary_date = daily_summary['range']['date']
        if summary_date not in existing_dates:
            history_data.append(daily_summary)
            existing_dates.add(summary_date)
            new_entries_added += 1

    # Ordena os dados por data para manter o arquivo organizado
    history_data.sort(key=lambda x: x['range']['date'])

    # Salva o arquivo de histórico atualizado
    with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(history_data, f, ensure_ascii=False, indent=4)
        
    if new_entries_added > 0:
        print(f"Sucesso! {new_entries_added} novo(s) dia(s) de dados adicionado(s) ao '{HISTORY_FILE}'.")
    else:
        print(f"Nenhum dado novo para adicionar. O arquivo '{HISTORY_FILE}' já está atualizado.")


# --- SCRIPT PRINCIPAL ---
if __name__ == "__main__":
    new_data_from_api = fetch_last_7_days_data()
    if new_data_from_api:
        update_history_file(new_data_from_api)
