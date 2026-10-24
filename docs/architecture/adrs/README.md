# Registro de Decisões de Arquitetura (ADRs)

Este catálogo consolida as **23 Decisões de Arquitetura (ADRs)** tomadas no ciclo evolutivo do **Portal GamificaEdu**, abrangendo decisões de backend, dados relacionais, frontend reativo, algoritmos de recomendação contextual e infraestrutura em nuvem.

| ID | Título da Decisão | Categoria | Status | Data |
|---|---|---|---|---|
| [ADR-001](ADR-001-application-factory.md) | Adoção do Padrão Application Factory | Backend e Persistência | `Aceito` | 2025-08-15 |
| [ADR-002](ADR-002-activity-progress-tracking.md) | Rastreamento Granular de Progresso por Atividade (ActivityProgress) | Backend e Persistência | `Aceito` | 2025-08-20 |
| [ADR-003](ADR-003-step-based-content-architecture.md) | Arquitetura de Conteúdo por Passo (stepId) | Backend e Persistência | `Aceito` | 2025-08-28 |
| [ADR-004](ADR-004-xp-and-currency-separation.md) | Separação de Pontuação de Ranking e Moeda da Loja (XP vs Coins) | Gamificação e Regras de Negócio | `Aceito` | 2025-09-05 |
| [ADR-005](ADR-005-backend-driven-effects-and-items.md) | Arquitetura Backend-Driven para Efeitos e Itens Personalizados | Gamificação e Regras de Negócio | `Aceito` | 2025-09-12 |
| [ADR-006](ADR-006-jsonb-mutation-flags.md) | Garantia de Atualização de Campos Complexos JSONB (flag_modified) | Backend e Persistência | `Aceito` | 2025-09-18 |
| [ADR-007](ADR-007-bulk-delete-activities.md) | Arquitetura da Funcionalidade de Exclusão em Massa de Atividades | Backend e Persistência | `Aceito` | 2025-09-22 |
| [ADR-008](ADR-008-immersive-game-board-scene.md) | Abandono de Modais Tradicionais em Favor de Cena Imersiva (ActivityViewOverlay) | Frontend e UX | `Aceito` | 2025-09-28 |
| [ADR-009](ADR-009-game-board-journey.md) | Substituição da Interface de Lista por Tabuleiro de Jogo Visual | Frontend e UX | `Aceito` | 2025-10-02 |
| [ADR-010](ADR-010-centralized-asset-preloading.md) | Centralização do Pré-Carregamento de Assets (useAssetLoader) | Frontend e UX | `Aceito` | 2025-10-05 |
| [ADR-011](ADR-011-container-presentational-wizard.md) | Refatoração da Criação de Atividades no Padrão Container/Presentational | Frontend e UX | `Aceito` | 2025-10-10 |
| [ADR-012](ADR-012-custom-roulette-component.md) | Construção de Componentes de Jogo Nativos (Roleta em Canvas/CSS) | Frontend e UX | `Aceito` | 2025-10-14 |
| [ADR-013](ADR-013-lifting-state-up-realtime.md) | Adoção de Lifting State Up para Atualizações de UI em Tempo Real | Frontend e UX | `Aceito` | 2025-10-18 |
| [ADR-014](ADR-014-forum-vs-chat-separation.md) | Separação dos Componentes de Fórum e Chat (Assíncrono vs Síncrono) | Comunicação e Redes | `Aceito` | 2025-10-22 |
| [ADR-015](ADR-015-centralized-analytics-telemetry.md) | Sistema de Analytics e Telemetria Centralizado (EventLog) | Análise de Dados e Métricas | `Aceito` | 2025-10-25 |
| [ADR-016](ADR-016-lazy-loading-analytics-dashboard.md) | Otimização do Dashboard de Análise com Lazy Loading | Análise de Dados e Métricas | `Aceito` | 2025-10-28 |
| [ADR-017](ADR-017-smart-assignment-master-model.md) | Lógica de Atribuição Inteligente de Atividades (Modelo Mestre) | Gamificação e Regras de Negócio | `Aceito` | 2025-11-04 |
| [ADR-018](ADR-018-flexible-completion-criteria.md) | Definição Flexível de Conclusão de Atividade (Nós Obrigatórios vs Opcionais) | Gamificação e Regras de Negócio | `Aceito` | 2025-11-12 |
| [ADR-019](ADR-019-academic-performance-coin-economy.md) | Vinculação do Ganho de Moedas ao Desempenho Acadêmico em Quizzes | Gamificação e Regras de Negócio | `Aceito` | 2025-11-20 |
| [ADR-020](ADR-020-cloudflare-tunnel-infra.md) | Abandono do Ngrok em Favor do Cloudflare Tunnel | Infraestrutura e Ferramentas | `Aceito` | 2025-11-25 |
| [ADR-021](ADR-021-multi-model-gemini-fallback.md) | Estratégia Multi-Modelo com Fallback de Cotas no Google Gemini | Infraestrutura e Ferramentas | `Aceito` | 2025-12-05 |
| [ADR-022](ADR-022-render-neon-cloud-stack.md) | Stack de Produção Cloud: Vercel, Render e Neon PostgreSQL | Infraestrutura e Ferramentas | `Aceito` | 2026-01-27 |
| [ADR-023](ADR-023-mvp-cosmetics-scope-cut.md) | Definição de Escopo MVP: Foco em Cosméticos e Simplificação de Regras | Gamificação e Regras de Negócio | `Aceito` | 2026-01-27 |

---
## Distribuição por Domínio Técnico
- **Backend e Persistência:** ADR-001, ADR-002, ADR-003, ADR-006, ADR-007
- **Frontend e Experiência do Usuário (UX):** ADR-008, ADR-009, ADR-010, ADR-011, ADR-012, ADR-013
- **Gamificação e Regras de Negócio:** ADR-004, ADR-005, ADR-017, ADR-018, ADR-019, ADR-023
- **Comunicação Social e Redes:** ADR-014
- **Análise de Dados e Telemetria:** ADR-015, ADR-016
- **Infraestrutura, Nuvem e IA:** ADR-020, ADR-021, ADR-022
