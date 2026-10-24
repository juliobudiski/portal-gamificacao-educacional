---
id: US-03
title: "Wizard de Criação de Atividades Gamificadas em 8 Etapas"
epic: "[[EPIC-02-criacao-e-gestao-de-atividades]]"
type: user-story
status: implemented
priority: high
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[ICreateActivityUseCase]]", "[[IActivityRepositoryPort]]"]
classes: ["[[Activity]]", "[[BoardStep]]", "[[ActivityCreationContainer]]"]
tables: ["[[activity]]", "[[quiz_content]]", "[[learning_content]]", "[[narrative_content]]"]
tests: ["[[test_recommendation_and_activity_lifecycle.py]]"]
---

# US-03: Wizard de Criação de Atividades Gamificadas em 8 Etapas

- **Épico Vinculado:** [[EPIC-02-criacao-e-gestao-de-atividades]]
- **Prioridade (MoSCoW):** `HIGH`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Professor Docente,  
**Quero** um assistente estruturado em 8 etapas (Container/Presentational) para projetar minha atividade,  
**Para que** eu possa articular área do conhecimento, objetivos pedagógicos, trilha de passos e mecânicas sem complexidade técnica.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Criação de atividade completa com sucesso
  Dado que o professor autenticado preenche as etapas 1 a 4 com os dados pedagógicos
  E na etapa 5 revisa os elementos recomendados pelo MRC
  E nas etapas 6 e 7 define os passos do tabuleiro e revisa os quizzes
  Quando ele finaliza na etapa 8 submetendo POST "/api/activities"
  Então o status retornado deve ser 201 Created
  E a atividade mestre deve ser persistida com seus nós filhos em transação atômica
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Salvamento em rascunho com finalização posterior
  Dado que o professor precisa interromper o planejamento na etapa 4
  Quando ele clica em "Salvar Rascunho"
  Então a atividade é salva com status is_draft=true para edição futura sem quebras de validação
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de publicação com título em branco ou sem nós
  Dado que o professor tenta submeter a etapa 8 sem definir título ou sem adicionar passos
  Quando a validação do caso de uso intercepta o comando
  Então o sistema retorna 400 Bad Request detalhando que a atividade requer título e ao menos 1 passo obrigatório
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Queda de conexão no momento do commit da atividade e conteúdos
  Dado que a conexão com o Neon PostgreSQL falha durante a inserção dos nós filhos
  Quando o bloco try/except intercepta a falha de persistência
  Então o backend deve disparar db.session.rollback() total
  E retornar 500 com mensagem segura, garantindo que não existam registros órfãos de nós no banco
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[ICreateActivityUseCase]]", "[[IActivityRepositoryPort]]"
- **Classes de Domínio e Entidades:** "[[Activity]]", "[[BoardStep]]", "[[ActivityCreationContainer]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[activity]]", "[[quiz_content]]", "[[learning_content]]", "[[narrative_content]]"
- **Suíte de Testes Automatizados:** "[[test_recommendation_and_activity_lifecycle.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
