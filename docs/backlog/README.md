# Backlog Ágil de Produto: Épicos e Histórias de Usuário (BDD)

Este diretório estrutura o backlog ágil do **Portal GamificaEdu**, composto por **8 Épicos** e **15 Histórias de Usuário** completas, especificadas com **YAML Frontmatter para visualização em Grafo no Obsidian** e critérios de aceite em BDD abrangendo **4 dimensões obrigatórias** (Caminho Feliz, Alternativo, Exceção e Caos).

---

## 1. Catálogo de Épicos

| Épico | Título | Histórias Vinculadas |
|---|---|---|
| [EPIC-01](epics/EPIC-01-autenticacao-e-perfis.md) | Autenticação, Autorização e Perfis Acadêmicos | [US-01-login-e-recuperacao-senha](user-stories/US-01-login-e-recuperacao-senha.md), [US-02-perfil-e-coleta-demografica-pesquisa](user-stories/US-02-perfil-e-coleta-demografica-pesquisa.md) |
| [EPIC-02](epics/EPIC-02-criacao-e-gestao-de-atividades.md) | Criação e Gestão Pedagógica de Atividades | [US-03-wizard-criacao-atividades-8-etapas](user-stories/US-03-wizard-criacao-atividades-8-etapas.md), [US-04-motor-recomendacao-contextual-mrc](user-stories/US-04-motor-recomendacao-contextual-mrc.md) |
| [EPIC-03](epics/EPIC-03-gestao-de-turmas-e-agendamento.md) | Gestão de Turmas, Matrículas e Agendamento | [US-05-gestao-de-turmas-e-codigo-ingresso](user-stories/US-05-gestao-de-turmas-e-codigo-ingresso.md), [US-06-agendamento-e-bloqueio-pos-prazo](user-stories/US-06-agendamento-e-bloqueio-pos-prazo.md) |
| [EPIC-04](epics/EPIC-04-execucao-gamificada-tabuleiro.md) | Execução da Trilha de Aprendizagem em Tabuleiro | [US-07-execucao-tabuleiro-e-conteudo-por-passo](user-stories/US-07-execucao-tabuleiro-e-conteudo-por-passo.md), [US-08-separacao-xp-vitalicio-e-moedas-loja](user-stories/US-08-separacao-xp-vitalicio-e-moedas-loja.md) |
| [EPIC-05](epics/EPIC-05-comunicacao-forum-e-chat.md) | Comunicação Social: Fórum Estruturado e Chat Realtime | [US-12-forum-moderado-e-categorias-automaticas](user-stories/US-12-forum-moderado-e-categorias-automaticas.md), [US-13-chat-da-turma-tempo-real](user-stories/US-13-chat-da-turma-tempo-real.md) |
| [EPIC-06](epics/EPIC-06-economia-loja-e-roleta.md) | Economia Gamificada: Moedas, Loja e Roleta da Sorte | [US-09-catalogo-e-compra-itens-cosmeticos](user-stories/US-09-catalogo-e-compra-itens-cosmeticos.md), [US-10-sistema-medalhas-e-conquistas](user-stories/US-10-sistema-medalhas-e-conquistas.md), [US-11-roleta-diaria-da-sorte](user-stories/US-11-roleta-diaria-da-sorte.md) |
| [EPIC-07](epics/EPIC-07-analytics-e-telemetria.md) | Telemetria Científica e Painéis de Aprendizagem | [US-14-relatorios-desempenho-professor](user-stories/US-14-relatorios-desempenho-professor.md) |
| [EPIC-08](epics/EPIC-08-orquestracao-de-conteudo-ia.md) | Orquestração de Inteligência Artificial e Grounding | [US-15-geracao-rascunhos-ia-gemini](user-stories/US-15-geracao-rascunhos-ia-gemini.md) |

---

## 2. Matriz Geral de Histórias de Usuário (US-01 a US-15)

| ID | Título da História | Épico | Prioridade | Portas Principais | Testes Pytest |
|---|---|---|---|---|---|
| [US-01](user-stories/US-01-login-e-recuperacao-senha.md) | Autenticação de Usuários e Recuperação Segura de Senha | `EPIC-01-autenticacao-e-perfis` | `HIGH` | `IAuthenticateUserUseCase` | `test_api_contracts_bdd.py` |
| [US-02](user-stories/US-02-perfil-e-coleta-demografica-pesquisa.md) | Gestão de Perfil e Coleta Demográfica de Pesquisa (DSR) | `EPIC-01-autenticacao-e-perfis` | `MEDIUM` | `IUpdateUserProfileUseCase` | `test_api_contracts_bdd.py` |
| [US-03](user-stories/US-03-wizard-criacao-atividades-8-etapas.md) | Wizard de Criação de Atividades Gamificadas em 8 Etapas | `EPIC-02-criacao-e-gestao-de-atividades` | `HIGH` | `ICreateActivityUseCase` | `test_recommendation_and_activity_lifecycle.py` |
| [US-04](user-stories/US-04-motor-recomendacao-contextual-mrc.md) | Motor de Recomendação Contextual e Sistema de Apoio à Decisão (MUI/SAD) | `EPIC-02-criacao-e-gestao-de-atividades` | `HIGH` | `IEvaluateContextualRecommendationUseCase` | `test_recommendation_and_activity_lifecycle.py` |
| [US-05](user-stories/US-05-gestao-de-turmas-e-codigo-ingresso.md) | Gestão de Turmas Acadêmicas e Ingresso via Código Único | `EPIC-03-gestao-de-turmas-e-agendamento` | `HIGH` | `IManageClassUseCase` | `test_api_contracts_bdd.py` |
| [US-06](user-stories/US-06-agendamento-e-bloqueio-pos-prazo.md) | Agendamento de Atividades e Bloqueio Estrito Pós-Prazo | `EPIC-03-gestao-de-turmas-e-agendamento` | `HIGH` | `IScheduleActivityUseCase` | `test_recommendation_and_activity_lifecycle.py` |
| [US-07](user-stories/US-07-execucao-tabuleiro-e-conteudo-por-passo.md) | Execução da Trilha no Tabuleiro de Jogo e Conteúdo por Passo | `EPIC-04-execucao-gamificada-tabuleiro` | `HIGH` | `IProcessStudentAnswerUseCase` | `test_domain_rules.py` |
| [US-08](user-stories/US-08-separacao-xp-vitalicio-e-moedas-loja.md) | Separação de Economia: XP Vitalício e Moedas Gastáveis (ADR-004) | `EPIC-04-execucao-gamificada-tabuleiro` | `HIGH` | `IProcessStudentAnswerUseCase` | `test_domain_rules.py` |
| [US-09](user-stories/US-09-catalogo-e-compra-itens-cosmeticos.md) | Catálogo da Loja de Recompensas e Aquisição de Cosméticos | `EPIC-06-economia-loja-e-roleta` | `MEDIUM` | `IPurchaseStoreItemUseCase` | `test_api_contracts_bdd.py` |
| [US-10](user-stories/US-10-sistema-medalhas-e-conquistas.md) | Sistema de Conquistas e Desbloqueio do Catálogo de 20 Medalhas | `EPIC-06-economia-loja-e-roleta` | `MEDIUM` | `IUnlockMedalUseCase` | `test_domain_rules.py` |
| [US-11](user-stories/US-11-roleta-diaria-da-sorte.md) | Minijogo da Roleta Diária da Sorte e Regras de Giro Extra (ADR-012/023) | `EPIC-06-economia-loja-e-roleta` | `MEDIUM` | `ISpinRouletteUseCase` | `test_api_contracts_bdd.py` |
| [US-12](user-stories/US-12-forum-moderado-e-categorias-automaticas.md) | Fórum de Dúvidas Estruturado e Categorias Automáticas (ADR-014) | `EPIC-05-comunicacao-forum-e-chat` | `MEDIUM` | `IManageForumDiscussionUseCase` | `test_api_contracts_bdd.py` |
| [US-13](user-stories/US-13-chat-da-turma-tempo-real.md) | Chat da Turma em Tempo Real via WebSockets (Socket.IO) | `EPIC-05-comunicacao-forum-e-chat` | `MEDIUM` | `ISendChatMessageUseCase` | `test_api_contracts_bdd.py` |
| [US-14](user-stories/US-14-relatorios-desempenho-professor.md) | Painel Analítico de Desempenho e Telemetria Científica (Lazy Loading) | `EPIC-07-analytics-e-telemetria` | `MEDIUM` | `IGetClassAnalyticsUseCase` | `test_api_contracts_bdd.py` |
| [US-15](user-stories/US-15-geracao-rascunhos-ia-gemini.md) | Geração Assistida de Rascunhos Pedagógicos com Fallback Multi-Modelo Gemini | `EPIC-08-orquestracao-de-conteudo-ia` | `HIGH` | `IAIEnginePort` | `test_ai_draft_pipeline.py` |

---

## 3. Padrão de Cobertura Quádrupla BDD
Cada história é rigorosamente testada e auditada contra quatro dimensões de comportamento:
1. **Caminho Feliz (Happy Path):** O fluxo ideal executado com parâmetros válidos e sucesso operacional.
2. **Fluxo Alternativo:** Comportamentos complementares válidos (ex: logins sociais, conclusão flexível, múltiplos giros).
3. **Fluxos de Exceção:** Validações de erro, credenciais inválidas, prazos vencidos e saldo de moedas insuficiente (400, 401, 403, 404, 422).
4. **Teste Destrutivo (Chaos Monkey):** Concorrência massiva, race conditions, injeção de scripts maliciosos, clock skew e tolerância a falhas de rede.

---

## 4. Integração com Obsidian (Graph View)
Todos os arquivos em `docs/backlog/user-stories/` contêm cabeçalhos YAML estruturados e wikilinks (`[[...]]`). Ao abrir este repositório no Obsidian, a funcionalidade **Graph View** exibe a teia interativa conectando requisitos, portas, classes e testes, garantindo **rastreabilidade 100% livre de código órfão**.
