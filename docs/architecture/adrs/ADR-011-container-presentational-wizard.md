# ADR-011: Refatoração da Criação de Atividades no Padrão Container/Presentational

- **Status:** Aceito
- **Data:** 2025-10-10
- **Categoria:** Frontend e UX
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

O arquivo `ActivityCreationPage.jsx` acumulou funcionalidades ao longo dos sprints até atingir quase 2.000 linhas de código contendo simultaneamente lógica de estado do formulário, chamadas de API, recomendações do MRC, geração de rascunhos de IA e renderização visual de 8 etapas distintas. Isso gerava bugs frequentes de re-renderização e tornava qualquer manutenção arriscada.

---

## 2. Decisão

Decompor a página aplicando rigorosamente o padrão 'Container/Presentational'. O componente pai `ActivityCreationContainer` atua exclusivamente como orquestrador de estado e regras de negócio. Cada uma das 8 etapas do assistente foi extraída para um componente apresentacional puro: `Step1DomainKnowledge`, `Step2PedagogicalObjective`, `Step3ClassProfile`, `Step4LogisticsInfrastructure`, `Step5RecommendationReview`, `Step6BoardStructure`, `Step7ContentReview` e `Step8PublishClassAssignment`.

---

## 3. Consequências

- **Positiva:** Redução de arquivos gigantes para módulos coesos e desacoplados de 150 a 300 linhas cada.
- **Positiva:** Eliminação de renderizações desnecessárias e facilidade para testes unitários de componentes.
- **Positiva:** Isolamento claro entre a camada de lógica de recomendação matemática e os formulários de entrada.
- **Negativa/Trade-off:** Necessidade de passar estados e handlers de navegação via props ou contexto compartilhado.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
