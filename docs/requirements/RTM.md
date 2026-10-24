# Matriz de Rastreabilidade de Requisitos (RTM) — GamificaEdu
**Projeto:** Portal de Gamificação Educacional (GamificaEdu)  
**Norma de Governança:** ISO/IEC/IEEE 29148:2018  
**Tipo:** Rastreabilidade Bidirecional Ponta a Ponta (Forward & Backward)  
**Status da Baseline:** Homologada / Cobertura 100% no CI/CD  

---

## 1. Visão Geral e Princípios de Rastreabilidade

A **Matriz de Rastreabilidade de Requisitos (Requirements Traceability Matrix - RTM)** estabelece o vínculo formal, auditável e bidirecional entre todas as camadas do ciclo de vida do software:

```
[SRS (RF/RNF)]  <──>  [Épicos & User Stories BDD]  <──>  [ADRs & Arquitetura]  <──>  [Código Fonte BE/FE]  <──>  [Testes Automatizados CI]
```

### Critérios de Status:
- `VERIFIED`: Implementado no código e coberto por testes automatizados executados com sucesso no CI.
- `IMPLEMENTED`: Implementado no código de produção; aguardando ampliação de cenários de teste automatizados.
- `PLANNED`: Especificado no backlog para iterações futuras.

---

## 2. Matriz de Rastreabilidade de Requisitos Funcionais (RF)

| ID | Requisito Funcional | Épico | User Story (BDD) | Rotas Backend (`routes/`) | Serviços de Domínio (`services/`) | Interface Frontend (`src/`) | Suíte de Testes (CI) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Autenticação e Sessão JWT/OAuth | `EPIC-01` | `US-01` | `auth.py` | `auth_service.py` | `pages/Login.jsx`, `pages/Register.jsx` | `test_api_contracts_bdd.py` | `VERIFIED` |
| **RF-02** | Perfil do Usuário e Metadados LGPD | `EPIC-01` | `US-02` | `auth.py`, `admin.py` | `user_service.py`, `student_service.py` | `pages/Profile.jsx`, `components/DemographicModal.jsx` | `test_api_contracts_bdd.py` | `VERIFIED` |
| **RF-03** | Wizard de Criação em 8 Etapas | `EPIC-02` | `US-03` | `activities.py`, `content_editor.py` | `activity_service.py`, `content_editor_service.py` | `pages/TeacherWizard.jsx`, `components/wizard/` | `test_recommendation_and_activity_lifecycle.py` | `VERIFIED` |
| **RF-04** | Motor de Recomendação Contextual (MDC) | `EPIC-02` | `US-04` | `activities.py` | `recommendation_engine.py` | `components/wizard/StepRecommendation.jsx` | `test_recommendation_and_activity_lifecycle.py` | `VERIFIED` |
| **RF-05** | Gestão de Turmas e Código de Ingresso | `EPIC-03` | `US-05` | `classes.py` | `class_service.py` | `pages/Classes.jsx`, `components/JoinClassModal.jsx` | `test_api_contracts_bdd.py` | `VERIFIED` |
| **RF-06** | Agendamento e Bloqueio Pós-Prazo | `EPIC-03` | `US-06` | `activities.py`, `classes.py` | `activity_service.py` | `components/ActivityCard.jsx`, `pages/Board.jsx` | `test_domain_rules.py` | `VERIFIED` |
| **RF-07** | Trilha Gamificada no Tabuleiro | `EPIC-04` | `US-07` | `progress.py`, `progress_recent.py` | `progress_service.py` | `pages/GameBoard.jsx`, `components/board/` | `test_domain_rules.py` | `VERIFIED` |
| **RF-08** | Economia Dupla (XP vs Moedas) | `EPIC-06` | `US-08` | `student.py`, `progress.py` | `student_service.py`, `progress_service.py` | `components/Navbar.jsx`, `pages/Store.jsx` | `test_domain_rules.py` | `VERIFIED` |
| **RF-09** | Loja de Cosméticos Backend-Driven | `EPIC-06` | `US-09` | `forum_cosmetics.py` | `student_service.py` | `pages/Store.jsx`, `components/store/` | `test_domain_rules.py` | `VERIFIED` |
| **RF-10** | Concessão de Medalhas Automáticas | `EPIC-06` | `US-10` | `medals.py` | `medal_service.py` | `pages/Medals.jsx`, `components/MedalCard.jsx` | `test_domain_rules.py` | `VERIFIED` |
| **RF-11** | Roleta Diária da Sorte com Cooldown | `EPIC-06` | `US-11` | `student.py` | `roulette_service.py` | `components/RouletteModal.jsx` | `test_domain_rules.py` | `VERIFIED` |
| **RF-12** | Fórum Moderado por Atividade | `EPIC-05` | `US-12` | `forum.py` | `forum_service.py` | `pages/Forum.jsx`, `components/forum/` | `test_api_contracts_bdd.py` | `VERIFIED` |
| **RF-13** | Chat da Turma em Tempo Real | `EPIC-05` | `US-13` | `chat.py` | `chat_service.py` | `components/ChatDrawer.jsx` | `test_api_contracts_bdd.py` | `VERIFIED` |
| **RF-14** | Analytics e Telemetria Docente | `EPIC-07` | `US-14` | `analytics.py`, `rankings.py`, `log.py` | `analytics_service.py`, `ranking_service.py`, `log_service.py` | `pages/TeacherAnalytics.jsx`, `components/Rankings.jsx` | `test_ranking_anonymization.py` | `VERIFIED` |
| **RF-15** | Rascunhos de Atividades com IA Gemini | `EPIC-08` | `US-15` | `content_editor.py` | `ai_service.py`, `ai_prompt_builder.py` | `components/ai/AIDraftGeneratorModal.jsx` | `test_ai_draft_pipeline.py`, `test_resilience_sre.py` | `VERIFIED` |

---

## 3. Matriz de Rastreabilidade de Requisitos Não-Funcionais (RNF)

| ID | Categoria | Decisão Arquitetural (ADR) | Mecanismo de Implementação | Mapeamento no Código | Validação / Gate de CI/CD | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RNF-01** | Segurança da Informação | `ADR-001`, `ADR-013` | JWT assinado com HMAC-SHA256 (32 bytes), hash de senhas e filtros de injeção | `backend/app/utils/auth_utils.py` | `test_api_contracts_bdd.py` + GitHub CI | `VERIFIED` |
| **RNF-02** | Isolamento em VPS Compartilhado | `ADR-020`, `ADR-022` | Execução sob rede Docker isolada e usuário sem privilégios | `docker-compose.yml`, `docs/security/AUDIT_SECURITY_REPORT.md` | Inspeção estática de portas e redes | `VERIFIED` |
| **RNF-03** | Desempenho e Baixa Latência | `ADR-016` | Lazy loading no frontend e queries otimizadas no PostgreSQL | `frontend/src/App.jsx`, `backend/app/routes/analytics.py` | `npm run build` + Pytest Hermético | `VERIFIED` |
| **RNF-04** | Concorrência e Tempo Real | `ADR-013`, `ADR-014` | Flask-SocketIO com eventos em salas dedicadas por turma | `backend/app/routes/chat.py`, `backend/app/__init__.py` | Testes de contratos e conexões síncronas | `VERIFIED` |
| **RNF-05** | Integridade Transacional (ACID) | `ADR-004`, `ADR-006` | Transações atômicas `db.session.commit()`, `flag_modified` em JSONB | `backend/app/services/student_service.py` | `test_domain_rules.py` | `VERIFIED` |
| **RNF-06** | Tolerância a Falhas & SRE | `ADR-021` | Circuit breaker e cascata multi-modelo (`flash-lite` -> `flash` -> `pro`) com timeout de 45s | `backend/app/services/ai_service.py` | `test_resilience_sre.py` (100% de passagem) | `VERIFIED` |
| **RNF-07** | Privacidade e LGPD | `ADR-015` | Anonimização determinística de ranking estudantil (`Aluno #XXXX`) | `backend/app/services/ranking_service.py` | `test_ranking_anonymization.py` | `VERIFIED` |
| **RNF-08** | Manutenibilidade & Arquitetura Limpa | `ADR-001` | Padrão Application Factory e Separação em Camadas (Hexagonal) | `backend/app/__init__.py`, `backend/app/domain/` | Testes herméticos isolados da infra | `VERIFIED` |
| **RNF-09** | Usabilidade e Acessibilidade | `ADR-008`, `ADR-011` | Interface com semântica acessível, feedback imediato e contraste WCAG | `frontend/src/styles/`, `frontend/src/components/` | ESLint estático no CI frontend | `VERIFIED` |
| **RNF-10** | Testabilidade e CI/CD | `ADR-018` | Pipeline GitHub Actions com Branch Protection e pre-push hook | `.github/workflows/ci.yml`, `.git/hooks/pre-push` | 43 testes automatizados passando no CI | `VERIFIED` |

---

## 4. Mapeamento Bidirecional: Suíte de Testes Automatizados vs Requisitos

Todos os 43 testes herméticos que compõem o Quality Gate do CI/CD estão associados a seus respectivos requisitos:

| Arquivo de Teste (`backend/tests/`) | Qtd Testes | Requisitos Cobertos | Cenários Verificados |
| :--- | :--- | :--- | :--- |
| **`test_api_contracts_bdd.py`** | 10 | RF-01, RF-02, RF-05, RF-12, RF-13, RNF-01 | Contratos BDD: Login válido/inválido, RBAC de professor vs aluno, matrícula via código, fórum e mensageria. |
| **`test_domain_rules.py`** | 12 | RF-06, RF-07, RF-08, RF-09, RF-10, RF-11, RNF-05 | Regras de Domínio: Separação estrita de XP vitalício e moedas, compras de cosméticos, catálogo de medalhas e cooldown da roleta. |
| **`test_recommendation_and_activity_lifecycle.py`** | 8 | RF-03, RF-04, RF-06 | Ciclo de vida da atividade: Wizard em 8 etapas, cálculo de sinergias pedagógicas do MDC e persistência JSONB. |
| **`test_ranking_anonymization.py`** | 4 | RF-14, RNF-07 | LGPD e Privacidade: Anonimização e mascaramento consistente de nomes em rankings públicos de alunos. |
| **`test_ai_draft_pipeline.py`** | 5 | RF-15, RNF-01, RNF-06 | Pipeline de IA: Validação de prompts contra injeção, geração de passos/quizzes e sincronização de rascunhos. |
| **`test_resilience_sre.py`** | 4 | RF-15, RNF-06 | Engenharia de Confiabilidade: Timeout de 45s, cascata sequencial de modelos Gemini e tolerância a falhas. |

---

## 5. Rastreabilidade de Regras de Negócio Globais

| Regra de Negócio | Descrição | Requisitos Associados | Mapeamento no Código | Evidência de Validação |
| :--- | :--- | :--- | :--- | :--- |
| **RN-01** | Princípio da Não-Degradação de XP | RF-08, RNF-05 | `student_service.py:award_xp()` | `test_domain_rules.py::test_xp_never_decreases` |
| **RN-02** | Não-Negatividade de Moedas | RF-08, RF-09, RNF-05 | `student_service.py:deduct_coins()` | `test_domain_rules.py::test_insufficient_coins_rejected` |
| **RN-03** | Veto Pedagógico do MDC/MUI | RF-04 | `recommendation_engine.py:evaluate()` | `test_recommendation_and_activity_lifecycle.py` |
| **RN-04** | Janela de Cooldown da Roleta (24h) | RF-11 | `roulette_service.py:spin()` | `test_domain_rules.py::test_roulette_cooldown_enforced` |
| **RN-05** | Anonimização de Ranking Estudantil | RF-14, RNF-07 | `ranking_service.py:get_leaderboard()` | `test_ranking_anonymization.py::test_anonymized_display` |

---

## 6. Procedimento de Manutenção da Matriz

1. **Inclusão de Novos Requisitos:** Antes de qualquer alteração no código, deve ser atribuído um novo identificador sequencial (`RF-XX` ou `RNF-XX`) no `SRS.md` e espelhado na tabela desta matriz.
2. **Impact Analysis (Análise de Impacto):** Antes de modificar uma rota, serviço ou tabela, o desenvolvedor deve consultar a RTM para identificar todas as User Stories e suítes de teste impactadas.
3. **Auditoria no CI/CD:** A integridade da rastreabilidade é inspecionada nos Quality Gates para impedir débitos técnicos de especificação.
