import google.generativeai as genai
import os
import sys
from dotenv import load_dotenv
from google.api_core import exceptions

def check_gemini_models():
    load_dotenv()
    api_key = os.environ.get("GOOGLE_API_KEY")

    print("="*60)
    print("DIAGNÓSTICO DE MODELOS - GAMEFICA.EDU")
    print("="*60)

    if not api_key:
        print("❌ ERRO: GOOGLE_API_KEY não encontrada no arquivo .env")
        return

    print(f"✅ API Key detectada: {api_key[:5]}...{api_key[-5:]}")
    
    try:
        genai.configure(api_key=api_key)
        
        # Versão do SDK para debug
        import google.generativeai.version as gversion
        print(f"📦 SDK Version: {gversion.__version__}")
        print("-" * 60)

        models = genai.list_models()
        
        print(f"{'NOME DO MODELO (String para o código)':<40} | {'MÉTODO SUPORTADO'}")
        print("-" * 60)

        found_models = False
        for m in models:
            # Filtramos apenas modelos que geram conteúdo de texto
            if 'generateContent' in m.supported_generation_methods:
                found_models = True
                # Removemos o prefixo 'models/' para exibir a string limpa
                model_id = m.name.replace('models/', '')
                
                # Exibe detalhes úteis para um Ph.D. em Computação
                print(f"👉 {model_id:<37} | Context: {m.input_token_limit} tokens")
                
        if not found_models:
            print("⚠️ Nenhum modelo de geração de conteúdo encontrado para esta chave.")

    except exceptions.Unauthenticated:
        print("❌ ERRO: Chave de API inválida ou sem permissão.")
    except exceptions.PermissionDenied:
        print("❌ ERRO: Acesso negado. Verifique as restrições da sua API Key.")
    except Exception as e:
        print(f"❌ ERRO INESPERADO: {type(e).__name__}: {e}")

    print("="*60)
    print("DICA: Use as strings acima exatamente como aparecem na lista")
    print("dentro da sua MODEL_HIERARCHY no ai_service.py.")
    print("="*60)

if __name__ == "__main__":
    check_gemini_models()