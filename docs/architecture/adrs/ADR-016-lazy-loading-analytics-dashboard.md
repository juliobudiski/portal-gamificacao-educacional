# ADR-016: Otimização do Dashboard de Análise com Lazy Loading

- **Status:** Aceito
- **Data:** 2025-10-28
- **Categoria:** Análise de Dados e Métricas
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

O painel analítico do professor (`AnalyticsDashboard.jsx`) tentava carregar simultaneamente todas as métricas: taxas de conclusão, matriz de retenção, mapa de calor de erros de questões e gráfico de dispersão de XP. Em turmas grandes, a página demorava mais de 6 segundos para abrir, disparando dezenas de queries agregadas concorrentes no banco Neon.

---

## 2. Decisão

Refatorar o dashboard adotando carregamento sob demanda (Lazy Loading) por abas. A tela inicial renderiza instantaneamente o resumo executivo leve; gráficos complexos e relatórios de alunos individuais só emitem requisições à API quando a aba correspondente é ativada pelo professor.

---

## 3. Consequências

- **Positiva:** Queda no tempo de carregamento inicial da página de 6s para menos de 300ms.
- **Positiva:** Economia substancial de computação no PostgreSQL Serverless (Neon).
- **Positiva:** Melhoria na usabilidade com skeleton screens informativos por seção.
- **Negativa/Trade-off:** Pequena latência (200-400ms) ao trocar de aba pela primeira vez enquanto os dados específicos são obtidos.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
