---
name: product-data-analytics
description: >-
  Use this skill when designing tracking plans, writing analytical SQL queries, evaluating A/B tests,
  analyzing cohort retention and user funnels, and building actionable product metric dashboards.
---

# Habilidades Essenciais do Analista de Dados de Produto

Este guia e conjunto de habilidades define as técnicas de telemetria, modelagem estatística, testes A/B e geração de insights para decisões baseadas em dados em produtos digitais.

---

## 1. Instrumentação de Telemetria e Plano de Rastreamento (Tracking Plan)

1. **Taxonomia Padronizada de Eventos:**
   - Adotar convenção unificada de nomenclatura (ex.: `objeto_verbo_passado`):
     - `lesson_started`, `quiz_submitted`, `badge_unlocked`, `subscription_cancelled`.
   - Adicionar propriedades de contexto essenciais:
     - Globais: `user_id` (pseudonimizado), `platform` (web/mobile), `app_version`, `timestamp`.
     - Específicas do evento: `score`, `duration_seconds`, `category`, `attempts_count`.

2. **Higiene e Privacidade de Dados:**
   - Nunca trafegar dados pessoais sensíveis (PII: e-mail, nome completo, CPF, senha) nos payloads de eventos analíticos.
   - Auditar o volume de eventos para evitar custos excessivos de ingestão e ruídos analíticos.

---

## 2. Métricas de Produto e Consultas Analíticas Avançadas (SQL)

1. **Métricas Essenciais de Engajamento e Retenção:**
   - **Stickiness:** $\frac{\text{DAU (Daily Active Users)}}{\text{MAU (Monthly Active Users)}}$ (indica frequência e hábito de uso).
   - **Análise de Coortes (Cohort Retention):** Medição de retenção em D1, D7, D14 e D30 após o primeiro evento de ativação para entender o momento exato de evasão de usuários.
   - **Análise de Funil (Funnel Analysis):** Medição da taxa de conversão entre etapas sucessivas de um fluxo (ex.: Cadastro $\rightarrow$ Onboarding $\rightarrow$ Primeira Atividade $\rightarrow$ Atividade Concluída).

2. **Padrões de SQL Analítico:**
   - Utilizar Funções de Janela (*Window Functions*: `ROW_NUMBER()`, `LAG()`, `LEAD()`, `SUM() OVER(PARTITION BY...)`) para calcular tempo entre eventos e jornadas sequenciais.
   - Criar CTEs (*Common Table Expressions*) organizadas para tornar queries complexas legíveis e reutilizáveis.

---

## 3. Desenho e Avaliação Científica de Testes A/B (Experimentação)

1. **Planejamento do Experimento:**
   - **Hipótese:** *"Acreditamos que [mudança na variante B] resultará em [aumento da métrica primária], porque [razão comportamental observada]."*
   - **Métrica Primária:** A métrica que determina o sucesso (ex.: taxa de conclusão de atividade).
   - **Métricas Guardrail (Controle de Danos):** Métricas que não podem ser prejudicadas (ex.: latência da aplicação, taxa de erros, cancelamento de contas).

2. **Rigor Estatístico e Amostragem:**
   - Calcular previamente o tamanho mínimo da amostra considerando nível de significância ($\alpha = 0.05$) e poder estatístico ($1 - \beta = 0.80$).
   - Evitar espiar os dados diariamente e declarar vitória prematura (*peeking problem / p-hacking*). Deixar o teste rodar por ciclos de semana completos para mitigar sazonalidade.

---

## 4. Visualização de Dados e Storytelling com Evidências

1. **Design de Dashboards Acionáveis:**
   - Evitar gráficos de vaidade (ex.: total acumulado de cadastros desde o início dos tempos).
   - Focar em métricas de taxa e proporção que revelem mudanças de comportamento semana a semana ou mês a mês.
   - Apresentar contexto histórico e metas de referência (benchmarks).

2. **Comunicação de Insights:**
   - Estruturar relatórios executivos no formato:
     - **O que os dados mostram:** Fato objetivo observado.
     - **Por que isso importa:** Impacto na jornada do usuário e nos objetivos da empresa.
     - **Recomendação acionável:** O que o time técnico ou de produto deve experimentar ou ajustar em seguida.
