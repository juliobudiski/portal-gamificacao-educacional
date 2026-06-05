import json
from recommendation_engine import ContextualRecommendationEngine

def imprimir_relatorio(nome_cenario, dados_entrada, resultado):
    print("\n" + "="*80)
    print(f" 🎬 CENÁRIO: {nome_cenario.upper()}")
    print("="*80)
    
    print("\n📥 [INPUT DO PROFESSOR (REACT)]")
    print(f"   - Área: {dados_entrada['areaKnowledge']}")
    print(f"   - Perfis Marcados: {', '.join(dados_entrada['playerProfile']['selectedProfiles'])}")
    print(f"   - Dores/Objetivos: {', '.join(dados_entrada['currentScenario']['problems'] + dados_entrada['desiredScenario']['objectives'])}")
    print(f"   - Logística: {', '.join(dados_entrada['activityPlanning']['characteristics'])}")
    
    print("\n✅ [TOP 3 RECOMENDADOS (VERDES)]")
    for item in resultado["recommended"][:3]:
        print(f"   ⭐ {item['name']} (Score: {item['score']}) -> {item['reason']}")
    if not resultado["recommended"]: print("   (Nenhum elemento atingiu sinergia máxima para este contexto)")

    print("\n🚫 [TOP 3 VETADOS (VERMELHOS)]")
    for item in resultado["not_recommended"][:3]:
        print(f"   ❌ {item['name']} (Score: {item['score']}) -> {item['reason']}")
    if not resultado["not_recommended"]: print("   (Nenhum veto acionado)")
    print("-" * 80 + "\n")

def rodar_showcase():
    # Inicia o motor real (O mesmo que o site usa)
    engine = ContextualRecommendationEngine("knowledge_base.json")

    # ---------------------------------------------------------
    # CENÁRIO 1: O CAMINHO FELIZ (Match Perfeito)
    # Turma focada em realizar tarefas práticas.
    # ---------------------------------------------------------
    cenario_1 = {
        "areaKnowledge": "SOFTWARE CONSTRUCTION",
        "currentScenario": {"problems": ["Tarefas repetitivas e bugs"]},
        "desiredScenario": {"objectives": ["Melhorar a prática e experimentação"]},
        "playerProfile": {"selectedProfiles": ["realizador"]},
        "activityPlanning": {"characteristics": ["Presencial em Laboratório com PC"]}
    }
    res_1 = engine.calculate_recommendations(cenario_1)
    imprimir_relatorio("A Aula Prática Perfeita", cenario_1, res_1)

    # ---------------------------------------------------------
    # CENÁRIO 2: A PROTEÇÃO PSICOLÓGICA (Veto Pedagógico)
    # Turma social, que não gosta de pressão, querendo colaborar.
    # ---------------------------------------------------------
    cenario_2 = {
        "areaKnowledge": "SOFTWARE ENGINEERING PROCESS",
        "currentScenario": {"problems": ["Turma desunida", "Falta de empatia"]},
        "desiredScenario": {"objectives": ["Melhorar colaboração e trabalho em equipe"]},
        "playerProfile": {"selectedProfiles": ["social"]},
        "activityPlanning": {"characteristics": ["Online"]}
    }
    res_2 = engine.calculate_recommendations(cenario_2)
    imprimir_relatorio("O Resgate Social (Veto de Competição)", cenario_2, res_2)

    # ---------------------------------------------------------
    # CENÁRIO 3: A REALIDADE DA ESCOLA (Veto Logístico)
    # Professor no papel e giz querendo usar gamificação.
    # ---------------------------------------------------------
    cenario_3 = {
        "areaKnowledge": "SOFTWARE QUALITY",
        "currentScenario": {"problems": ["Leitura densa"]},
        "desiredScenario": {"objectives": ["Estimular pensamento sistêmico"]},
        "playerProfile": {"selectedProfiles": ["explorador"]},
        "activityPlanning": {"characteristics": ["Presencial desplugado (Sem internet)"]}
    }
    res_3 = engine.calculate_recommendations(cenario_3)
    imprimir_relatorio("A Aula de Papel (Hard Block Logístico)", cenario_3, res_3)

    # ---------------------------------------------------------
    # CENÁRIO 4: PROTEÇÃO DA CARGA COGNITIVA (Sweller)
    # Área matemática super difícil. Pressão de tempo faria estrago.
    # ---------------------------------------------------------
    cenario_4 = {
        "areaKnowledge": "MATHEMATICAL FOUNDATIONS",
        "currentScenario": {"problems": ["Dificuldade com abstração lógica"]},
        "desiredScenario": {"objectives": ["Entendimento de teoria"]},
        "playerProfile": {"selectedProfiles": ["competitivo"]}, # O aluno até gosta, mas a disciplina não permite!
        "activityPlanning": {"characteristics": ["Laboratório"]}
    }
    res_4 = engine.calculate_recommendations(cenario_4)
    imprimir_relatorio("Protegendo o Cérebro (Veto Cognitivo)", cenario_4, res_4)

if __name__ == "__main__":
    rodar_showcase()
