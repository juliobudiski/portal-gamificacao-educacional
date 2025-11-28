import google.generativeai as genai
import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

api_key = os.environ.get("GOOGLE_API_KEY")

if not api_key:
    print("ERRO: GOOGLE_API_KEY não encontrada no .env")
else:
    print(f"Chave encontrada: {api_key[:5]}...")
    try:
        genai.configure(api_key=api_key)
        print("\n--- MODELOS DISPONÍVEIS ---")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
    except Exception as e:
        print(f"Erro ao conectar: {e}")