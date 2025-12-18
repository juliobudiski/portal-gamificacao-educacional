# backend/app/presets/activity_templates.py

PREDEFINED_TEMPLATES = [
    {
        "id": "quiz-requisitos",
        "name": "Quiz de Requisitos (Iniciante)",
        "description": "Revisão rápida sobre conceitos fundamentais de software.",
        "icon": "🧠",
        
        # --- DADOS DA ATIVIDADE (Mapeados estritamente com as constantes válidas) ---
        "data": {
            # --- PRESET PARA A IA
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
            "areaKnowledge": "Engenharia de Software",
            
            "currentScenario": {
                "problems": [
                    "Dificuldades na compreensão de conceitos complexos de programação.",
                    "Dificuldades em aplicar as teorias aprendidas na prática.",
                    "Dificuldades em aprender novas ferramentas e tecnologias rapidamente.",
                    "Falta de motivação e interesse no assunto.",
                    "Dificuldades em lidar com ferramentas de desenvolvimento complexas."
                ],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": [
                    "Aumentar a retenção de conhecimentos e habilidades",
                    "Promover a participação ativa dos alunos nas atividades",
                    "Incentivar a aplicação prática dos conhecimentos teóricos",
                    "Desenvolver habilidades cognitivas, sociais e de aprendizagem",
                    "Criar um ambiente de aprendizagem motivador e envolvente"
                ],
                "otherObjective": ""
            },
            "activityPlanning": {
                "characteristics": [
                    "Online", 
                    "Individual", 
                    "Formativa (prática ou revisão)",
                    "Uso de plataformas de aprendizado"
                ],
                "participantsQuantity": "Turma toda",
                "expectedDuration": "30 minutos",
                "location": "Online",
                "otherInfo": "Pode ser usado como atividade pré-aula ou pós-aula."
            },
            "playerProfile": { 
                # Mapeado de 'Explorador' (inválido) para 'Imersivo' e 'Realizador'
                "selectedProfiles": ["Imersivo", "Realizador"] 
            },
            "gameElements": {
                "selectedElements": [
                    "Níveis", 
                    "Sistema de pontuação", 
                    "Feedback claro sobre o desempenho", 
                    "Sistema de classificação e ranking", 
                    "Narrativas envolventes"
                ],
                "otherElement": "",
                "narrativeTitle": "Desafio do Conhecimento",
                "narrativeContent": "Embarque em uma jornada para provar seu domínio sobre os requisitos de software, ajudando a startup DevFast a sair do caos."
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
                "specificRules": "Cada questão tem um tempo limite de 30 segundos. Respostas corretas concedem pontos, incorretas não."
            },
            "gamificationDesign": {
                "theme": "escritorio_startup",
                "progression_path": [
                    {"id": "step_1", "type": "narrative", "isMandatory": True, "content": {}},
                    {"id": "step_2", "type": "content", "isMandatory": True, "content": {}},
                    {"id": "step_3", "type": "quiz", "isMandatory": True, "content": {}}
                ]
            }
        }
    },
    {
        "id": "desafio-debug-hardcore",
        "name": "Operação Caça-Bugs (Prático)",
        "description": "Simulação de crise onde o aluno precisa identificar erros sob pressão.",
        "icon": "🐛",
        
        # --- DADOS DA ATIVIDADE ---
        "data": {
            # --- PRESET PARA A IA ---
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
            "areaKnowledge": "Ciência da Computação",
            
            "currentScenario": {
                "problems": [
                    "Dificuldades em aplicar as teorias aprendidas na prática.",
                    "Dificuldades em lidar com ferramentas de desenvolvimento complexas.",
                    "Dificuldades em trabalhar em equipe e colaborar com colegas.",
                    "Dificuldades em lidar com a pressão e o estresse da grade de estudos intensa.",
                    "Dificuldades em gerenciar o tempo e priorizar tarefas."
                ],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": [
                    "Incentivar a aplicação prática dos conhecimentos teóricos",
                    "Melhorar a colaboração e o trabalho em equipe",
                    "Desenvolver habilidades cognitivas, sociais e de aprendizagem",
                    "Aumentar a motivação e a concentração dos alunos",
                    "Estimular a criatividade e a inovação"
                ],
                "otherObjective": ""
            },
            "activityPlanning": {
                "characteristics": [
                    "Presencial", 
                    "Em grupos", 
                    "Somativa (avaliação)", 
                    "Foco em projetos de software"
                ],
                "participantsQuantity": "Grupos de 3-4 alunos",
                "expectedDuration": "4 horas",
                "location": "Laboratório de Informática",
                "otherInfo": "Requer IDE configurada e acesso aos logs do servidor simulado."
            },
            "playerProfile": { 
                # Mapeado de 'Competidor/Predador' para opções válidas
                "selectedProfiles": ["Competitivo", "Realizador"] 
            },
            "gameElements": { 
                "selectedElements": [
                    "Níveis", 
                    "Pressão de tempo", 
                    "Conquistas digitais para metas alcançadas", 
                    "Cooperação", 
                    "Narrativas envolventes"
                ], 
                "otherElement": "",
                "narrativeTitle": "Protocolo Omega",
                "narrativeContent": "A CyberCity está caindo. Como parte da unidade de elite, você deve analisar o código fonte corrompido e restaurar o sistema antes que o vírus se espalhe."
            },
            "rewardsOffered": {
                "selectedRewards": [
                    "Vantagens para jogos e desafios.", 
                    "Certificados digitais de conclusão.", 
                    "Destaque na apresentação de trabalhos."
                ],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": [
                    "Colaboração efetiva em projetos de grupo.", 
                    "Demonstrar pensamento crítico em desafios.", 
                    "Conclusão de tarefas antes do prazo."
                ],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": [
                    "Seja respeitoso e colaborativo com outros jogadores.", 
                    "Comunique-se com outros jogadores de forma clara e objetiva."
                ],
                "specificRules": "Cada bug crítico corrigido vale 100 pontos. Bugs menores valem 50. O tempo é limitado."
            },
            "gamificationDesign": {
                "theme": "cyberpunk_neon",
                "progression_path": [
                    {"id": "step_intro", "type": "narrative", "isMandatory": True, "content": {}},
                    {"id": "step_concept", "type": "content", "isMandatory": True, "content": {}},
                    {"id": "step_challenge_1", "type": "quiz", "isMandatory": True, "content": {}},
                    {"id": "step_boss", "type": "quiz", "isMandatory": True, "content": {}}
                ]
            }
        }
    },
    {
        "id": "estudo-padroes-projeto",
        "name": "Arquitetura de Software (Avançado)",
        "description": "Aplicação de Design Patterns (Strategy, Observer) em cenários complexos.",
        "icon": "📐",
        
        # --- DADOS DA ATIVIDADE ---
        "data": {
            
            # --- PRESET PARA A IA ---
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
            "areaKnowledge": "Engenharia de Software",
            
            "currentScenario": {
                "problems": [
                    "Dificuldades na compreensão de conceitos complexos de programação.",
                    "Dificuldades em aplicar as teorias aprendidas na prática.",
                    "Dificuldades em trabalhar com prazos apertados em projetos acadêmicos.",
                    "Dificuldades em lidar com ferramentas de desenvolvimento complexas.",
                    "Dificuldades em gerenciar a ansiedade e a sobrecarga de trabalho."
                ],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": [
                    "Incentivar a aplicação prática dos conhecimentos teóricos",
                    "Estimular a criatividade e a inovação",
                    "Aumentar a retenção de conhecimentos e habilidades",
                    "Desenvolver habilidades cognitivas, sociais e de aprendizagem",
                    "Criar um ambiente de aprendizagem motivador e envolvente"
                ],
                "otherObjective": ""
            },
            "activityPlanning": {
                "characteristics": [
                    "Individual", 
                    "Online", 
                    "Somativa (avaliação)", 
                    "Foco em projetos de software"
                ],
                "participantsQuantity": "Individual",
                "expectedDuration": "2 horas",
                "location": "Online ou Presencial",
                "otherInfo": "Foco em qualidade de código e justificativa das escolhas arquiteturais."
            },
            "playerProfile": { 
                # Mapeado de 'Pensador' (inválido) para 'Imersivo' e 'Realizador'
                "selectedProfiles": ["Imersivo", "Realizador"] 
            },
            "gameElements": {
                "selectedElements": [
                    "Sistema de pontuação", 
                    "Feedback claro sobre o desempenho", 
                    "Narrativas envolventes", 
                    "Quebra-cabeça"
                ],
                "otherElement": "",
                "narrativeTitle": "O Legado do Monolito",
                "narrativeContent": "Você encontrou os diários do antigo Arquiteto. Eles descrevem uma estrutura elegante escondida sob camadas de código legado. Sua missão é revelá-la."
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
                "specificRules": "A solução será avaliada pela elegância, redução de acoplamento e corretude do padrão aplicado."
            },
            "gamificationDesign": {
                "theme": "mapa_antigo",
                "progression_path": [
                    {"id": "step_1", "type": "narrative", "isMandatory": True, "content": {}},
                    {"id": "step_2", "type": "content", "isMandatory": True, "content": {}},
                    {"id": "step_3", "type": "quiz", "isMandatory": True, "content": {}}
                ]
            }
        }
    }
]