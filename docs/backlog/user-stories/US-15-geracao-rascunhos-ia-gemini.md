---
id: US-15
title: "Geração Assistida de Rascunhos Pedagógicos com Fallback Multi-Modelo Gemini"
epic: "[[EPIC-08-orquestracao-de-conteudo-ia]]"
type: user-story
status: implemented
priority: high
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[IAIEnginePort]]", "[[IActivityRepositoryPort]]"]
classes: ["[[AIService]]", "[[AIPromptBuilder]]", "[[GoogleGeminiAIAdapter]]"]
tables: ["[[activity]]", "[[quiz_content]]", "[[learning_content]]"]
tests: ["[[test_ai_draft_pipeline.py]]"]
---

# US-15: Geração Assistida de Rascunhos Pedagógicos com Fallback Multi-Modelo Gemini

- **Épico Vinculado:** [[EPIC-08-orquestracao-de-conteudo-ia]]
- **Prioridade (MoSCoW):** `HIGH`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Professor Docente,  
**Quero** gerar rascunhos automáticos de questões e narrativas via IA com Grounding em vídeos do YouTube,  
**Para que** eu reduza o tempo de preparação de aulas mantendo o rigor conceitual sob meu controle ético.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Geração de quiz via Gemini com Grounding conceitual
  Dado que o professor fornece o tema "Testes Unitários e Mocking" e objetivo "prático"
  Quando ele solicita a geração assistida de um passo de avaliação
  Então o serviço de IA consulta vídeos de referência no YouTube
  E sintetiza uma questão contextualizada com 4 alternativas e justificativa formativa
  E salva o passo com a flag is_draft=true para revisão docente
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Fallback automático transparente por esgotamento de cota (HTTP 429)
  Dado que o modelo primário "gemini-2.5-flash-lite" atinge o limite de requisições por minuto
  Quando a chamada do backend recebe o status 429
  Então a cascata multi-modelo aciona imediatamente o modelo "gemini-2.5-flash"
  E entrega o rascunho estruturado sem interromper o fluxo do professor
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de publicar atividade mantendo nós com flag is_draft=true
  Dado que o professor gerou 3 nós via IA e não revisou o nó 2 (permanece is_draft=true)
  Quando ele tenta publicar a atividade para os alunos na Etapa 8
  Então o sistema bloqueia a publicação com 400 Bad Request
  E exibe o alerta: "O nó 2 ainda é um rascunho. Revise e confirme o conteúdo antes de disponibilizá-lo para a turma." 
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Falha generalizada de conexão com o Google AI Studio (Offline)
  Dado que a API da Google está fora do ar ou sem internet externa
  Quando o professor solicita a criação do rascunho
  Então a cascata de contingência recorre ao "LocalHeuristicSynthesizer"
  E injeta um template canônico válido pré-cadastrado no sistema sem travar a interface
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[IAIEnginePort]]", "[[IActivityRepositoryPort]]"
- **Classes de Domínio e Entidades:** "[[AIService]]", "[[AIPromptBuilder]]", "[[GoogleGeminiAIAdapter]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[activity]]", "[[quiz_content]]", "[[learning_content]]"
- **Suíte de Testes Automatizados:** "[[test_ai_draft_pipeline.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
