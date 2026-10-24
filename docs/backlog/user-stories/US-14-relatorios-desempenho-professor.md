---
id: US-14
title: "Painel Analítico de Desempenho e Telemetria Científica (Lazy Loading)"
epic: "[[EPIC-07-analytics-e-telemetria]]"
type: user-story
status: implemented
priority: medium
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[IGetClassAnalyticsUseCase]]", "[[ITelemetryEventLoggerPort]]"]
classes: ["[[AnalyticsService]]", "[[EventLog]]"]
tables: ["[[event_log]]", "[[activity_progress]]", "[[student_response]]"]
tests: ["[[test_api_contracts_bdd.py]]"]
---

# US-14: Painel Analítico de Desempenho e Telemetria Científica (Lazy Loading)

- **Épico Vinculado:** [[EPIC-07-analytics-e-telemetria]]
- **Prioridade (MoSCoW):** `MEDIUM`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Professor e Pesquisador,  
**Quero** um painel com carregamento sob demanda para visualizar taxa de conclusão, erros comuns e telemetria,  
**Para que** eu intervenha pedagogicamente onde os alunos mais erram e audite o impacto do design gamificado.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Consulta das taxas de conclusão da atividade com Lazy Loading (ADR-016)
  Dado que o docente acessa a página de Análise da Turma
  Quando ele clica na aba "Desempenho por Passo"
  Então o frontend dispara a requisição específica para a API analítica
  E recebe o mapa de calor com a porcentagem de acertos em cada nó do tabuleiro
  E renderiza gráficos informativos com latência inferior a 500ms
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Exportação de log científico para análise estatística (DSR)
  Dado que o pesquisador acadêmico necessita de dados para artigo científico
  Quando ele requisita a exportação anonimizada de dados de "event_log"
  Então o backend entrega um conjunto estruturado com IDs mascarados e métricas temporais em conformidade com a LGPD
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de acesso ao painel de análise por um estudante (Anti-IDOR)
  Dado que um aluno autenticado tenta acessar o endpoint de relatórios do professor
  Quando a rota valida o papel do token JWT
  Então o acesso é sumariamente bloqueado com status 403 Forbidden
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Consulta analítica pesada em turma com 500 estudantes
  Dado que uma turma de grande porte possui milhares de respostas registradas
  Quando o docente solicita o relatório analítico agregado
  Então a consulta SQL utiliza índices compostos e agregações eficientes no Neon PostgreSQL
  E retorna em menos de 1 segundo sem travar a thread de atendimento de requisições gerais
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[IGetClassAnalyticsUseCase]]", "[[ITelemetryEventLoggerPort]]"
- **Classes de Domínio e Entidades:** "[[AnalyticsService]]", "[[EventLog]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[event_log]]", "[[activity_progress]]", "[[student_response]]"
- **Suíte de Testes Automatizados:** "[[test_api_contracts_bdd.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
