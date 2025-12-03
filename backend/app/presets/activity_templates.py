# backend/app/presets/activity_templates.py

PREDEFINED_TEMPLATES = [
    {
        "id": "quiz-requisitos",
        "name": "Quiz de Requisitos (Iniciante)",
        "description": "Revisão rápida sobre Requisitos Funcionais e Não Funcionais.",
        "icon": "🧠",
        # --- PRESET PARA A IA (Configura o Modal Automaticamente) ---
        "ai_preset": {
            "teachingFocus": "Diferença entre Requisitos Funcionais e Não Funcionais",
            "targetAudience": "Iniciante",
            "tone": "corporativo",
            "personality": "Socrático",
            "narrativeGoal": "A startup 'DevFast' está perdendo clientes porque o software trava (não funcional) e não tem botão de login (funcional). A equipe precisa classificar os problemas.",
            "charactersList": [
                {"role": "Product Owner Ana", "type": "Mentor"},
                {"role": "Estagiário Dev", "type": "Aluno"}
            ]
        },
        # --- DADOS DA ATIVIDADE (Preenchem o Wizard) ---
        "data": {
            "title": "Fundamentos de Requisitos",
            "description": "Avalie seu conhecimento sobre especificações de software com este quiz interativo.",
            "areaKnowledge": "Engenharia de Software",
            
            "currentScenario": {
                "problems": ["Dificuldades na compreensão de conceitos complexos de programação.", "Dificuldades em aplicar as teorias aprendidas na prática."],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": ["Aumentar a retenção de conhecimentos e habilidades", "Promover a participação ativa dos alunos"],
                "otherObjective": ""
            },
            "activityPlanning": {
                "characteristics": ["Online", "Individual", "Formativa (atividade de prática ou revisão)"],
                "participantsQuantity": "Turma toda",
                "expectedDuration": "30 minutos",
                "location": "Online",
                "otherInfo": "Pode ser usado como atividade pré-aula ou pós-aula."
            },
            "playerProfile": { 
                "selectedProfiles": ["Explorador", "Realizador"] 
            },
            "gameElements": {
                "selectedElements": ["Níveis", "Sistema de pontuação", "Feedback claro sobre o desempenho", "Sistema de classificação e ranking", "Narrativas envolventes"],
                "otherElement": "",
                "narrativeTitle": "Desafio do Conhecimento",
                "narrativeContent": "Embarque em uma jornada para provar seu domínio sobre os requisitos de software, ajudando a startup DevFast a sair do caos."
            },
            "rewardsOffered": {
                "selectedRewards": ["Pontos de bônus para a participação na aula.", "Conquistas digitais para metas alcançadas."],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": ["Responder corretamente a perguntas de revisão", "Atingir uma pontuação elevada"],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": ["Respeite as regras do jogo e as decisões do professor.", "Busque sempre aprender com os erros."],
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
        # --- DADOS DA ATIVIDADE ---
        "data": {
            "title": "Operação Debug: Protocolo Omega",
            "description": "Identifique e corrija falhas críticas no sistema de defesa da cidade.",
            "areaKnowledge": "Programação e Testes",
            
            "currentScenario": {
                "problems": ["Dificuldades em aplicar as teorias aprendidas na prática.", "Dificuldades em lidar com ferramentas complexas."],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": ["Incentivar a aplicação prática dos conhecimentos", "Desenvolver habilidades de resolução de problemas sob pressão"],
                "otherObjective": ""
            },
            "activityPlanning": {
                "characteristics": ["Presencial", "Em grupos", "Somativa (avaliação)", "Foco em projetos"],
                "participantsQuantity": "Grupos de 3-4 alunos",
                "expectedDuration": "4 horas",
                "location": "Laboratório de Informática",
                "otherInfo": "Requer IDE configurada e acesso aos logs do servidor simulado."
            },
            "playerProfile": { 
                "selectedProfiles": ["Competidor", "Predador"] 
            },
            # AQUI ESTAVA O PROBLEMA: Adicionei gameElements completo
            "gameElements": { 
                "selectedElements": ["Níveis", "Pressão de tempo", "Conquistas digitais para metas alcançadas", "Cooperação", "Narrativas envolventes"], 
                "otherElement": "",
                "narrativeTitle": "Protocolo Omega",
                "narrativeContent": "A CyberCity está caindo. Como parte da unidade de elite, você deve analisar o código fonte corrompido e restaurar o sistema antes que o vírus se espalhe."
            },
            "rewardsOffered": {
                "selectedRewards": ["Vantagens para jogos e desafios.", "Certificados digitais.", "Destaque na apresentação."],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": ["Colaboração com outros alunos", "Demonstrar pensamento crítico", "Corrigir bugs críticos"],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": ["Seja colaborativo com sua equipe.", "Comunique-se de forma clara."],
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
        # --- DADOS DA ATIVIDADE ---
        "data": {
            "title": "O Enigma do Monolito",
            "description": "Refatore o sistema legado aplicando padrões de projeto adequados.",
            "areaKnowledge": "Arquitetura de Software",
            
            "currentScenario": {
                "problems": ["Dificuldades na compreensão de conceitos abstratos.", "Código espaguete difícil de manter."],
                "otherProblem": ""
            },
            "desiredScenario": {
                "objectives": ["Incentivar a aplicação de boas práticas", "Estimular a refatoração e limpeza de código"],
                "otherObjective": ""
            },
            "activityPlanning": {
                "characteristics": ["Individual", "Online", "Somativa (avaliação)"],
                "participantsQuantity": "Individual",
                "expectedDuration": "2 horas",
                "location": "Online ou Presencial",
                "otherInfo": "Foco em qualidade de código e justificativa das escolhas arquiteturais."
            },
            "playerProfile": { 
                "selectedProfiles": ["Pensador", "Realizador"] 
            },
            "gameElements": {
                "selectedElements": ["Sistema de pontuação", "Feedback claro sobre o desempenho", "Narrativas envolventes", "Quebra-cabeça"],
                "otherElement": "",
                "narrativeTitle": "O Legado do Monolito",
                "narrativeContent": "Você encontrou os diários do antigo Arquiteto. Eles descrevem uma estrutura elegante escondida sob camadas de código legado. Sua missão é revelá-la."
            },
            "rewardsOffered": {
                "selectedRewards": ["Pontos de bônus.", "Reconhecimento público como 'Arquiteto Sênior'."],
                "otherReward": ""
            },
            "rewardedActions": {
                "selectedActions": ["Apresentar uma solução elegante", "Justificar corretamente o uso do padrão"],
                "otherAction": ""
            },
            "gamificationRules": {
                "generalRules": ["Não quebre a funcionalidade existente (testes regressivos).", "Justifique cada alteração."],
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