import os
import time
from app import create_app
from app.services.ai_service import ai_service
import google.generativeai as genai

app = create_app()

def run_test():
    with app.app_context():
        # Mock data
        activity_context = {
            "title": "Introdução ao Python",
            "description": "Uma aula básica de Python"
        }
        path_structure = [
            {"id": "step_1", "type": "narrative"},
            {"id": "step_2", "type": "quiz"}
        ]
        ai_config = {
            "personality": "Socrático",
            "tone": "aventura",
            "teachingFocus": "Listas e Dicionários",
            "targetAudience": "Junior",
            "narrativeGoal": "O aluno precisa consertar o código do robô",
            "charactersList": [
                {"role": "Mestre", "type": "Mentor"},
                {"role": "Aluno", "type": "Aluno"}
            ],
            "questionsPerQuiz": 2,
            "linesPerNarrative": 4
        }
        
        print("Iniciando orquestração mock...")
        start_time = time.time()
        try:
            result = ai_service.orchestrate_story(
                activity_context=activity_context,
                path_structure=path_structure,
                ai_config=ai_config,
                room_id=None,
                user_api_key=None
            )
            print("Resultado gerado com sucesso!")
            print(f"Tempo total: {time.time() - start_time:.2f}s")
            # print(result)
        except Exception as e:
            print(f"Falha na orquestração: {e}")

if __name__ == '__main__':
    run_test()
