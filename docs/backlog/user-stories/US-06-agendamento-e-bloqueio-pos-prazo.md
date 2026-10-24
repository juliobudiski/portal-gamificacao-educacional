---
id: US-06
title: "Agendamento de Atividades e Bloqueio Estrito Pós-Prazo"
epic: "[[EPIC-03-gestao-de-turmas-e-agendamento]]"
type: user-story
status: implemented
priority: high
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[IScheduleActivityUseCase]]", "[[IActivityRepositoryPort]]"]
classes: ["[[Activity]]", "[[ActivityProgress]]"]
tables: ["[[activity]]", "[[activity_progress]]"]
tests: ["[[test_recommendation_and_activity_lifecycle.py]]"]
---

# US-06: Agendamento de Atividades e Bloqueio Estrito Pós-Prazo

- **Épico Vinculado:** [[EPIC-03-gestao-de-turmas-e-agendamento]]
- **Prioridade (MoSCoW):** `HIGH`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Professor Docente,  
**Quero** definir data/hora de abertura e expiração com bloqueio server-side de submissões,  
**Para que** eu assegure prazos acadêmicos justos e impeça respostas após o encerramento do prazo.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Submissão de resposta dentro do prazo regulamentar
  Dado que a atividade tem prazo de entrega "expires_at" configurado para o dia seguinte
  Quando o aluno submete uma resposta de quiz às 14:00 de hoje
  Então o backend aceita a resposta com status 200 OK e grava o progresso normalmente
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Exibição visual do cronômetro de contagem regressiva
  Dado que a atividade está ativa e com prazo configurado
  Quando o aluno visualiza o cabeçalho do tabuleiro
  Então um relógio com a contagem decrescente do tempo restante é exibido em destaque
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de submissão após a expiração do prazo (Bloqueio Estrito)
  Dado que o relógio do servidor ultrapassou a data "expires_at" da atividade
  Quando o estudante tenta submeter uma resposta para qualquer nó do tabuleiro
  Então o backend deve rejeitar a requisição com status 403 Forbidden
  E a mensagem de erro deve indicar: "Prazo de entrega encerrado. Novas submissões estão bloqueadas." 
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Manipulação de relógio do cliente (Clock Skew / Client Tampering)
  Dado que o estudante atrasa manualmente o relógio do seu computador em 2 horas para contornar o prazo
  Quando ele envia a requisição de resposta HTTP
  Então o backend ignora os headers do cliente e valida estritamente o relógio interno UTC do banco PostgreSQL
  E bloqueia a submissão com 403 Forbidden
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[IScheduleActivityUseCase]]", "[[IActivityRepositoryPort]]"
- **Classes de Domínio e Entidades:** "[[Activity]]", "[[ActivityProgress]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[activity]]", "[[activity_progress]]"
- **Suíte de Testes Automatizados:** "[[test_recommendation_and_activity_lifecycle.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
