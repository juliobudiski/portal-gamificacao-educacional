---
id: US-24
title: "US-24: Suíte E2E Reutilizável de Elementos de Gamificação e Pipeline de Rascunhos de IA"
status: Done
priority: High
epic: EP-04-GAMIFICATION-AND-AI
created_at: 2026-11-02
tags:
  - testing
  - e2e
  - gamification
  - dual-perspective
  - ai-drafts
---

# US-24: Suíte E2E Reutilizável de Elementos de Gamificação e Pipeline de Rascunhos de IA

## 1. Visão Geral e Declaração da Estória (INVEST)

- **Como** Professor e Aluno do portal Gamefica.Edu,
- **Quero** que todas as fases da criação de atividades, sincronização de rascunhos de IA (Narrativa, Conteúdo de Leitura e Quiz) e uso de mecânicas de gamificação (Quizzes, Roleta, Loja de Cosméticos, Fórum, Chat, Leaderboard e Medalhas) sejam verificadas por uma suíte automatizada reproduzível e hermética,
- **Para que** novas versões do portal garantam estabilidade, confiabilidade, integridade referencial e conformidade de segurança (RBAC, moderação anti-abuso e idempotência transacional) sem necessidade de testes manuais exaustivos.

---

## 2. Critérios de Aceitação BDD 4D (Gherkin)

### Cenário 1: Happy Path — Criação, Sincronização de Rascunhos e Publicação (Professor)
- **Dado** que um professor autenticado envia um payload de atividade com trilha pedagógica (`progression_path`) contendo passos de narrativa, conteúdo de leitura e quiz,
- **Quando** o endpoint `POST /api/activities` processa o rascunho com sucesso e a rotina `sync_progression_path_contents` é executada,
- **Então** entidades relacionais dedicadas (`NarrativeContent`, `LearningContent`, `QuizContent`) são criadas e vinculadas à atividade,
- **E** a publicação via `POST /api/activities/{id}/publish` transiciona o estado para `is_draft = False`.

### Cenário 2: Caminho Alternativo — Matrícula do Aluno e Resolução de Quiz com Recompensas
- **Dado** que uma turma ativa possui um código de inscrição único (`enrollment_code`),
- **Quando** um aluno autenticado submete `POST /api/classes/join` e resolve uma questão do quiz via `POST /api/activities/{id}/submit_answer`,
- **Então** o progresso do aluno (`ActivityProgress`) registra acúmulo de pontos, moedas e avaliação do motor de medalhas (`MedalService`),
- **E** a consulta em `GET /api/medals/my-unlocked` reflete as conquistas elegíveis.

### Cenário 3: Casos de Borda e Interação com Elementos de Jogo (Roleta, Loja, Fórum, Chat, Leaderboard)
- **Dado** que o aluno possui moedas ganhas e histórico ativo na atividade,
- **Quando** o aluno gira a roleta diária (`POST /api/progress/{id}/spin`), adquire um item da loja (`POST /api/progress/{id}/purchase`), interage no fórum criando tópico e curtindo resposta (`POST /api/forum/...`), e troca mensagens no chat com sanitização anti-spam,
- **Então** o saldo de moedas é deduzido corretamente, o professor consegue eleger a melhor resposta (`PUT /api/forum/topics/{id}/best-answer`),
- **E** o quadro de líderes (`GET /api/progress/{id}/leaderboard`) exibe os dados enriquecidos com títulos e efeitos cosméticos.

### Cenário 4: Cenário Destrutivo / Anti-Abuso (Chaos Monkey & Security)
- **Dado** que um usuário tenta enviar mensagem maliciosa com termos ofensivos ou denúncias consecutivas no chat,
- **Quando** o método `ChatService.process_message` e o endpoint `POST /api/chat/messages/{id}/report` são acionados,
- **Então** os filtros de segurança interceptam o payload malicioso, a contagem de denúncias é incrementada de forma atômica e mensagens que atingem o limiar de moderação são censuradas automaticamente sem degradar a estabilidade do sistema.

---

## 3. Artefatos de Implementação e Verificação

| Componente | Arquivo de Teste / Implementação | Cobertura |
| :--- | :--- | :--- |
| **Suíte Dual-Perspective** | `backend/tests/test_game_elements_perspectives.py` | 2 testes de integração completos (Professor e Aluno). |
| **Sincronização de Rascunhos** | `backend/app/services/activity_service.py` | `sync_progression_path_contents`, `log_activity_event_service`. |
| **Fórum Service** | `backend/app/services/forum_service.py` | `set_best_answer_service`, moderação de conteúdo. |
| **Medalhas / Cross-DB** | `backend/app/services/medal_service.py` | Estratégia Fênix compatível com SQLite JSON e PostgreSQL JSONB. |

