# backend/app/presets/activity_templates.py

PREDEFINED_TEMPLATES = [
    {
        "id": "quiz-requisitos",
        "name": "Quiz de Requisitos (Iniciante)",
        "description": "Revisão rápida sobre conceitos fundamentais de software.",
        "icon": "🧠",
        
        "data": {
            "ai_preset": {
                "teachingFocus": "Diferença entre Requisitos Funcionais e Não Funcionais",
                "targetAudience": "Iniciante",
                "tone": "corporativo",
                "personality": "Socrático",
                "narrativeGoal": "A startup 'DevFast' está perdendo clientes porque o software trava e faltam botões. A equipe precisa classificar os problemas.",
                "charactersList": [
                    {"role": "Product Owner Ana", "type": "Mentor"},
                    {"role": "Estagiário Dev", "type": "Aluno"}
                ]
            },
            "title": "Fundamentos de Requisitos",
            "description": "Avalie seu conhecimento sobre especificações de software com este quiz interativo.",
            "areaKnowledge": "Computação e Engenharia de Software",
            "subdomain": "Fundamentos e Programação Introdutória",
            
            "currentScenario": {
                "problems": [
                    "Barreira da Abstração",
                    "Falta de motivação e interesse na teoria."
                ],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": [
                    "Aumento de Motivação e Engajamento Inicial",
                    "Desenvolvimento do Pensamento Computacional e Raciocínio Lógico"
                ],
                "otherObjective": ""
            },
            "activityPlanning": {
                "isTeamActivity": False,
                "characteristics": [
                    "Online / Ensino a Distância", 
                    "Formativa (prática ou revisão)",
                    "Uso de plataformas de aprendizado"
                ],
                "participantsQuantity": "Turma toda",
                "expectedDuration": "30 minutos",
                "location": "Online",
                "otherInfo": "Pode ser usado como atividade pré-aula."
            },
            "playerProfile": { 
                "selectedProfiles": ["Explorador", "Realizador"] 
            },
            "gameElements": {
                "selectedElements": [
                    "Níveis", 
                    "Sistema de pontuação", 
                    "Feedback claro sobre o desempenho", 
                    "Sistema de classificação e ranking", 
                    "Narrativas envolventes"
                ],
                "otherElement": ""
            },
            "rewardsOffered": {
                "selectedRewards": [
                    "Pontos de bônus para a participação.", 
                    "Conquistas digitais para metas alcançadas."
                ],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": [
                    "Responder corretamente a perguntas de revisão", 
                    "Atingir uma pontuação elevada em um jogo"
                ],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": [
                    "Respeite as regras do jogo e as decisões do professor.", 
                    "Busque sempre aprender e se esforçar para alcançar seus objetivos."
                ],
                "specificRules": "Cada questão tem um tempo limite de 30 segundos."
            },
            "gamificationDesign": {
                "theme": "escritorio_startup",
                "progression_path": [
                    {"id": "step_1", "type": "narrative", "isMandatory": True, "content": {}},
                    {"id": "step_2", "type": "quiz", "isMandatory": True, "content": {}}
                ],
                "hub_elements": []
            }
        }
    },
    {
        "id": "desafio-debug-hardcore",
        "name": "Operação Caça-Bugs (Prático)",
        "description": "Simulação de crise onde o aluno precisa identificar erros sob pressão.",
        "icon": "🐛",
        
        "data": {
            "ai_preset": {
                "teachingFocus": "Técnicas de Debugging e Leitura de Logs",
                "targetAudience": "Junior",
                "tone": "scifi",
                "personality": "Hardcore",
                "narrativeGoal": "O servidor central da CyberCity foi hackeado. O código está cheio de loops infinitos e variáveis nulas. A equipe tem 20 minutos antes do shutdown total.",
                "charactersList": [
                    {"role": "Comandante Kernel", "type": "Mentor"},
                    {"role": "Soldado Byte", "type": "Aluno"}
                ]
            },
            "title": "Operação Debug: Protocolo Omega",
            "description": "Identifique e corrija falhas críticas no sistema de defesa da cidade.",
            "areaKnowledge": "Computação e Engenharia de Software",
            "subdomain": "Testes e Qualidade de Software",
            
            "currentScenario": {
                "problems": [
                    "Bloqueio Psicológico e Viés do Desenvolvedor",
                    "Dificuldade de comunicação e trabalho em equipe."
                ],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": [
                    "Internalizar a Cultura de 'Qualidade em Primeiro Lugar' (Shift-Left)",
                    "Melhorar a cooperação e trabalho em equipe"
                ],
                "otherObjective": ""
            },
            "activityPlanning": {
                "isTeamActivity": True,
                "characteristics": [
                    "Presencial em Laboratório (Com PC/Internet)", 
                    "Somativa (avaliação)", 
                    "Foco em projetos e desenvolvimento"
                ],
                "participantsQuantity": "Grupos de 3-4 alunos",
                "expectedDuration": "4 horas",
                "location": "Laboratório de Informática",
                "otherInfo": "Requer IDE configurada e acesso aos logs do servidor simulado."
            },
            "playerProfile": { 
                "selectedProfiles": ["Competitivo", "Social"] 
            },
            "gameElements": { 
                "selectedElements": [
                    "Níveis", 
                    "Pressão de tempo", 
                    "Conquistas digitais para metas alcançadas", 
                    "Cooperação", 
                    "Narrativas envolventes"
                ], 
                "otherElement": ""
            },
            "rewardsOffered": {
                "selectedRewards": [
                    "Vantagens para jogos e desafios.", 
                    "Certificados digitais de conclusão."
                ],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": [
                    "Colaboração efetiva em projetos de grupo.", 
                    "Demonstrar pensamento crítico em desafios."
                ],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": [
                    "Seja respeitoso e colaborativo com outros jogadores.", 
                    "Comunique-se com outros jogadores de forma clara e objetiva."
                ],
                "specificRules": "Cada bug crítico corrigido vale 100 pontos. O tempo é limitado."
            },
            "gamificationDesign": {
                "theme": "cyberpunk_neon",
                "progression_path": [
                    {"id": "step_intro", "type": "narrative", "isMandatory": True, "content": {}},
                    {"id": "step_challenge", "type": "quiz", "isMandatory": True, "content": {}}
                ],
                "hub_elements": []
            }
        }
    },
    {
        "id": "estudo-padroes-projeto",
        "name": "Arquitetura de Software (Avançado)",
        "description": "Aplicação de Design Patterns em cenários complexos.",
        "icon": "📐",
        
        "data": {
            "ai_preset": {
                "teachingFocus": "Design Patterns GoF (Strategy e Factory)",
                "targetAudience": "Senior",
                "tone": "mistério",
                "personality": "Storyteller",
                "narrativeGoal": "Um arquiteto antigo deixou um sistema legado complexo chamado 'O Monolito'. Para escalá-lo, é preciso refatorar o código usando padrões modernos sem quebrar a funcionalidade.",
                "charactersList": [
                    {"role": "O Arquiteto Sênior", "type": "Mentor"},
                    {"role": "Dev Lead", "type": "Aluno"}
                ]
            },
            "title": "O Enigma do Monolito",
            "description": "Refatore o sistema legado aplicando padrões de projeto adequados.",
            "areaKnowledge": "Computação e Engenharia de Software",
            "subdomain": "Engenharia de Software e Projetos",
            
            "currentScenario": {
                "problems": [
                    "Natureza Subjetiva da Qualidade do Design",
                    "Síndrome do 'Problema de Brinquedo'"
                ],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": [
                    "Pensamento Sistêmico e Arquitetural",
                    "Proficiência na Modelagem de Soluções"
                ],
                "otherObjective": ""
            },
            "activityPlanning": {
                "isTeamActivity": False,
                "characteristics": [
                    "Online / Ensino a Distância", 
                    "Somativa (avaliação)", 
                    "Foco em projetos e desenvolvimento"
                ],
                "participantsQuantity": "Individual",
                "expectedDuration": "2 horas",
                "location": "Online",
                "otherInfo": "Foco em qualidade de código e justificativa arquitetural."
            },
            "playerProfile": { 
                "selectedProfiles": ["Explorador", "Realizador"] 
            },
            "gameElements": {
                "selectedElements": [
                    "Sistema de pontuação", 
                    "Feedback claro sobre o desempenho", 
                    "Narrativas envolventes", 
                    "Quebra-cabeça"
                ],
                "otherElement": ""
            },
            "rewardsOffered": {
                "selectedRewards": [
                    "Pontos de bônus para a participação.", 
                    "Reconhecimento público na turma."
                ],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": [
                    "Apresentar um trabalho com excelência.", 
                    "Demonstrar pensamento crítico em desafios."
                ],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": [
                    "Busque sempre a supervisão do professor quando necessário.",
                    "Entenda as regras e como elas se aplicam a cada atividade."
                ],
                "specificRules": "A solução será avaliada pela redução de acoplamento."
            },
            "gamificationDesign": {
                "theme": "mapa_antigo",
                "progression_path": [
                    {"id": "step_1", "type": "narrative", "isMandatory": True, "content": {}},
                    {"id": "step_2", "type": "quiz", "isMandatory": True, "content": {}}
                ],
                "hub_elements": []
            }
        }
    }
]