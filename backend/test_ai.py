import json
import logging
from app import create_app
from app.services.ai_service import ai_service

# Ativar logs
logging.basicConfig(level=logging.DEBUG)

app = create_app()

dummy_context = {
    "title": "A Missão do Explorador",
    "description": "Você é um astronauta explorando o sistema solar.",
    "areaKnowledge": "Ciências",
}

dummy_structure = [
    {"type": "narrative", "id": "step_1"},
    {"type": "content", "id": "step_2"},
    {"type": "quiz", "id": "step_3"}
]

dummy_config = {
    "teachingFocus": "Ensinar sobre a gravidade",
    "tone": "Aventureiro"
}

with app.app_context():
    print("Iniciando orquestração...")
    try:
        result = ai_service.orchestrate_story(
            activity_context=dummy_context,
            path_structure=dummy_structure,
            ai_config=dummy_config,
            room_id=None,
            user_api_key=None
        )
        print("RESULTADO JSON:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Erro na simulação: {e}")
