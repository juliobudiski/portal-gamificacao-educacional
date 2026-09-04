import google.generativeai as genai
import time

genai.configure(api_key="AIzaSyFakeKey1234567890", transport="rest")
model = genai.GenerativeModel("models/gemini-2.5-flash")

print("Chamando REST...")
start = time.time()
try:
    response = model.generate_content("Hello")
    print(response.text)
except Exception as e:
    print(f"Erro: {e}")
print(f"Tempo: {time.time() - start}s")
