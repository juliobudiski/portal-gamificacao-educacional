---
id: US-04
title: "Motor de Recomendação Contextual e Sistema de Apoio à Decisão (MUI/SAD)"
epic: "[[EPIC-02-criacao-e-gestao-de-atividades]]"
type: user-story
status: implemented
priority: high
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[IEvaluateContextualRecommendationUseCase]]", "[[IRecommendationDatasetPort]]"]
classes: ["[[ContextualRecommendationEngine]]", "[[ContextVector]]"]
tables: ["[[activity]]"]
tests: ["[[test_recommendation_and_activity_lifecycle.py]]", "[[test_domain_rules.py]]"]
---

# US-04: Motor de Recomendação Contextual e Sistema de Apoio à Decisão (MUI/SAD)

- **Épico Vinculado:** [[EPIC-02-criacao-e-gestao-de-atividades]]
- **Prioridade (MoSCoW):** `HIGH`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Professor Docente,  
**Quero** recomendações contextualizadas de elementos de jogo com justificativas pedagógicas claras (XAI),  
**Para que** eu evite aplicar mecânicas nocivas (Dark Side) e maximize o engajamento saudável da turma.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Avaliação de compatibilidade de mecânicas com perfil cooperativo
  Dado que o professor seleciona perfil="social" e objetivo="colaborativo" no diagnóstico
  Quando o motor processa o vetor de contexto via POST "/api/recommendations/evaluate"
  Então os elementos "Cooperação" e "Fórum de Discussão" devem figurar no cluster "recommended" com score >= 25
  E "Sistema de classificação e ranking" deve ser vetado e alocado no cluster "not_recommended" com score negativo
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Ambiente desplugado ativando Veto Logístico
  Dado que o professor marca a característica "Presencial sem Tecnologia (Desplugado)"
  Quando o motor roda o cálculo
  Então elementos digitais (Chat, Fórum, Conquistas Digitais) são cravados com score -50.0 e razão "VETADO: Requer tecnologia" 
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Submissão de vetor de contexto vazio
  Dado que a requisição de recomendação é enviada sem perfil nem objetivo
  Quando o motor valida a entrada
  Então o sistema adota fallbacks canônicos neutros (mu=1.0, lambda=1.0) sem lançar exceções não tratadas
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Conflito extremo entre múltiplos perfis opostos (Min-Max Pessimista)
  Dado que a turma possui simultaneamente alunos competitivos e com marcadores severos de ansiedade
  Quando a agregação Min-Max avalia o risco
  Então o valor de risco máximo (lambda=5.0) e benefício mínimo (mu=0.1) prevalecem
  E o ranking competitivo é vetado para proteger os estudantes vulneráveis
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[IEvaluateContextualRecommendationUseCase]]", "[[IRecommendationDatasetPort]]"
- **Classes de Domínio e Entidades:** "[[ContextualRecommendationEngine]]", "[[ContextVector]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[activity]]"
- **Suíte de Testes Automatizados:** "[[test_recommendation_and_activity_lifecycle.py]]", "[[test_domain_rules.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
