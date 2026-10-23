# ADR-015: Sistema de Analytics e Telemetria Centralizado (EventLog)

- **Status:** Aceito
- **Data:** 2025-10-25
- **Categoria:** Análise de Dados e Métricas
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

Para validar as hipóteses científicas da pesquisa de Doutorado (DSR), era indispensável registrar com precisão forense cada clique, tempo de permanência, resposta de quiz, compra de item e interação com a roleta, sem depender de ferramentas invasivas de terceiros que pudessem ferir a LGPD.

---

## 2. Decisão

Implementar um pipeline unificado de telemetria científica interna. No backend, foi criada a tabela `EventLog` vinculada a `user_id` com colunas `event_type`, `payload` (JSONB) e `created_at`. No frontend, foi criado o hook `useAnalytics.js`, que padroniza o disparo assíncrono de eventos sem bloquear as ações de negócio do usuário.

---

## 3. Consequências

- **Positiva:** Coleta forense 100% aderente à LGPD e sob controle exclusivo da infraestrutura do projeto.
- **Positiva:** Base de evidências empíricas pronta para análise quantitativa em teses e artigos acadêmicos.
- **Positiva:** Desacoplamento completo entre o tracking de eventos e as funções de domínio.
- **Negativa/Trade-off:** Volume de escrita constante no banco de dados, demandando índices específicos e políticas de expurgo.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
