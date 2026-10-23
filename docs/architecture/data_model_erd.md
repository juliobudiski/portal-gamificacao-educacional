# Modelo de Dados Relacional e Diagrama Entidade-Relacionamento (ERD)

Este documento apresenta a especificação formal do banco de dados relacional do **Portal GamificaEdu**, modelado em 32 tabelas normalizadas hospedadas no **Neon Serverless PostgreSQL (AWS sa-east-1)**, com diagramação Mermaid e dicionário de dados completo.

---

## 1. Diagrama Entidade-Relacionamento (Mermaid ERD)

O diagrama abaixo sintetiza as principais entidades do ecossistema e seus vínculos relacionais com integridade referencial:

```mermaid
erDiagram
    %% Núcleo de Usuários e Turmas
    USER ||--o{ ENROLLMENT : "participa"
    USER ||--o{ ACTIVITY : "cria (docente)"
    USER ||--o{ ACTIVITY_PROGRESS : "executa"
    USER ||--o{ EVENT_LOG : "gera telemetria"
    USER ||--o{ PURCHASE : "compra"
    USER ||--o{ USER_UNLOCKED_MEDAL : "conquista"
    USER ||--o{ USER_UNLOCKED_TITLE : "desbloqueia"
    USER ||--o{ ROULETTE_WIN : "ganha giro"
    CLASS ||--o{ ENROLLMENT : "matricula"
    CLASS ||--o{ ACTIVITY : "vincula turma"
    TEAM ||--o{ ENROLLMENT : "agrupa alunos"

    %% Núcleo de Atividades e Conteúdo por Passo
    ACTIVITY ||--o{ ACTIVITY_PROGRESS : "possui progresso"
    ACTIVITY ||--o{ LEARNING_CONTENT : "possui nós didáticos"
    ACTIVITY ||--o{ QUIZ_CONTENT : "possui questões"
    ACTIVITY ||--o{ NARRATIVE_CONTENT : "possui história"
    ACTIVITY ||--o{ ACTIVITY_RATING : "avaliação por estrelas"
    ACTIVITY ||--o{ ACTIVITY_REVISION : "histórico de versões"
    ACTIVITY ||--o{ ACTIVITY_TAG : "categoriza"
    TAG ||--o{ ACTIVITY_TAG : "rotula"

    %% Núcleo de Execução e Avaliação
    ACTIVITY_PROGRESS ||--o{ STUDENT_RESPONSE : "registra respostas"
    STUDENT_RESPONSE ||--o{ MANUAL_FEEDBACK : "recebe feedback"

    %% Núcleo de Gamificação e Economia
    MEDAL ||--o{ USER_UNLOCKED_MEDAL : "concede"
    STORE_ITEM ||--o{ PURCHASE : "item adquirido"
    TITLE ||--o{ USER_UNLOCKED_TITLE : "título conquistado"

    %% Núcleo de Comunicação e Fórum
    FORUM_CATEGORY ||--o{ FORUM_TOPIC : "organiza tópicos"
    FORUM_TOPIC ||--o{ FORUM_POST : "contém postagens"
    FORUM_TOPIC ||--o{ TOPIC_LIKE : "curtidas"
    FORUM_POST ||--o{ POST_LIKE : "curtidas no post"
    CONVERSATION ||--o{ CHAT_MESSAGE : "troca mensagens"
    CHAT_MESSAGE ||--o{ MESSAGE_REPORT : "moderação/denúncia"

    %% Definições de atributos essenciais
    USER {
        int id PK
        string email UK
        string name
        string role "teacher | student | admin"
        string password_hash
        int total_xp_earned "XP vitalício acumulado"
        int points_earned "Moedas gastáveis na loja"
        int level "Nível acadêmico atual"
        string avatar_url
        jsonb demographic_data "Metadados DSR"
        timestamp last_spin_date "Controle diário da roleta"
    }

    CLASS {
        int id PK
        string name
        string code UK "Código de acesso da turma"
        text description
        int teacher_id FK
        timestamp created_at
    }

    ENROLLMENT {
        int id PK
        int user_id FK
        int class_id FK
        int team_id FK
        timestamp enrolled_at
    }

    ACTIVITY {
        int id PK
        string title
        text description
        string area_knowledge "SWEBOK Knowledge Area"
        int teacher_id FK
        int class_id FK "Null se for modelo mestre"
        jsonb board_settings "Configuração da trilha visual"
        boolean is_draft
        timestamp expires_at "Data/hora limite de entrega"
        timestamp created_at
    }

    ACTIVITY_PROGRESS {
        int id PK
        int user_id FK
        int activity_id FK
        jsonb completed_steps "IDs dos passos finalizados"
        int current_step_id
        int score "Pontuação total obtida"
        int points_earned "Moedas ganhas nesta atividade"
        int xp_earned "XP ganho nesta atividade"
        boolean is_completed
        int attempts_count
        timestamp completed_at
    }

    QUIZ_CONTENT {
        int id PK
        int activity_id FK
        string step_id "ID único do nó no tabuleiro"
        text question_text
        jsonb options "Lista de alternativas"
        string correct_option_id
        int points_reward "Moedas por acerto"
        int xp_reward "XP por acerto"
    }

    LEARNING_CONTENT {
        int id PK
        int activity_id FK
        string step_id "ID único do nó no tabuleiro"
        string title
        text content_html
        string media_url "Link YouTube ou imagem"
    }

    MEDAL {
        int id PK
        string code UK
        string name
        text description
        string category "Conclusao | Colaboracao | Habilidade | Especial"
        string icon_url
        int xp_reward
        int coins_reward
    }

    STORE_ITEM {
        int id PK
        string name
        string item_type "avatar | frame | title | aura | effect"
        int price_coins
        jsonb item_metadata
        boolean is_active
    }

    PURCHASE {
        int id PK
        int user_id FK
        int store_item_id FK
        int price_paid
        timestamp purchased_at
        timestamp expires_at "Null se permanente"
        boolean is_equipped
    }

    EVENT_LOG {
        int id PK
        int user_id FK
        string event_type "clique, quiz_answer, store_view"
        jsonb payload "Metadados analíticos"
        string ip_address
        timestamp created_at
    }
```

---

## 2. Dicionário de Dados por Domínio

### 2.1 Domínio 1: Usuários, Acesso e Turmas

1. **`user` (Usuários do Sistema)**
   - `id` (INTEGER, PK, Auto-increment)
   - `email` (VARCHAR(120), UNIQUE, NOT NULL, Indexado)
   - `name` (VARCHAR(150), NOT NULL)
   - `password_hash` (VARCHAR(255), NOT NULL)
   - `role` (VARCHAR(20), NOT NULL, Default: `'student'`) — Papéis: `student`, `teacher`, `admin`.
   - `total_xp_earned` (INTEGER, Default: 0) — XP vitalício acumulado para ranking geral.
   - `points_earned` (INTEGER, Default: 0) — Moedas virtuais gastáveis na loja.
   - `level` (INTEGER, Default: 1) — Nível do aluno calculado via progressão matemática.
   - `avatar_url` (VARCHAR(255), Nullable) — URL do avatar ativo.
   - `equipped_frame_id` (INTEGER, Nullable) — Moldura cosmética ativa.
   - `equipped_title_id` (INTEGER, Nullable) — Título honorífico ativo.
   - `equipped_name_color` (VARCHAR(50), Nullable) — Estilo CSS de cor do nome.
   - `demographic_data` (JSONB, Nullable) — Respostas do perfil demográfico de pesquisa (idade, curso, estilo de jogador).
   - `last_spin_date` (DATE, Nullable) — Data do último giro na roleta diária da sorte.
   - `created_at` (TIMESTAMP, Default: `now()`)

2. **`class` (Turmas Acadêmicas)**
   - `id` (INTEGER, PK)
   - `name` (VARCHAR(150), NOT NULL)
   - `code` (VARCHAR(20), UNIQUE, NOT NULL, Indexado) — Código de matrícula fornecido pelo docente.
   - `description` (TEXT, Nullable)
   - `teacher_id` (INTEGER, FK -> `user.id`, NOT NULL)
   - `created_at` (TIMESTAMP, Default: `now()`)

3. **`enrollment` (Matrícula e Vínculo)**
   - `id` (INTEGER, PK)
   - `user_id` (INTEGER, FK -> `user.id`, NOT NULL)
   - `class_id` (INTEGER, FK -> `class.id`, NOT NULL)
   - `team_id` (INTEGER, FK -> `team.id`, Nullable)
   - `enrolled_at` (TIMESTAMP, Default: `now()`)
   - *Restrição:* `UNIQUE(user_id, class_id)`

4. **`team` (Equipes de Trabalho na Turma)**
   - `id` (INTEGER, PK)
   - `class_id` (INTEGER, FK -> `class.id`, NOT NULL)
   - `name` (VARCHAR(100), NOT NULL)
   - `created_at` (TIMESTAMP, Default: `now()`)

5. **`teacher_access_codes` (Códigos de Acesso para Novos Professores)**
   - `id` (INTEGER, PK)
   - `code` (VARCHAR(50), UNIQUE, NOT NULL)
   - `is_used` (BOOLEAN, Default: `false`)
   - `used_by_id` (INTEGER, FK -> `user.id`, Nullable)
   - `created_at` (TIMESTAMP)

---

### 2.2 Domínio 2: Atividades, Conteúdo por Passo e Avaliação

6. **`activity` (Atividades Gamificadas)**
   - `id` (INTEGER, PK)
   - `title` (VARCHAR(200), NOT NULL)
   - `description` (TEXT, Nullable)
   - `area_knowledge` (VARCHAR(100), NOT NULL) — Área SWEBOK.
   - `teacher_id` (INTEGER, FK -> `user.id`, NOT NULL)
   - `class_id` (INTEGER, FK -> `class.id`, Nullable) — Nulo quando atua como "Modelo Mestre" (ADR-017).
   - `board_settings` (JSONB, Nullable) — Nós, conexões, trilha e coordenadas no Canvas.
   - `gamification_elements` (JSONB, Nullable) — Mecânicas ativadas (roleta, ranking, loja).
   - `is_draft` (BOOLEAN, Default: `true`) — Estado de rascunho de IA antes da publicação.
   - `is_team_activity` (BOOLEAN, Default: `false`)
   - `available_from` (TIMESTAMP, Nullable)
   - `expires_at` (TIMESTAMP, Nullable) — Data de bloqueio automático pós-prazo.
   - `created_at` (TIMESTAMP, Default: `now()`)

7. **`activity_progress` (Progresso Granular do Estudante - ADR-002)**
   - `id` (INTEGER, PK)
   - `user_id` (INTEGER, FK -> `user.id`, NOT NULL)
   - `activity_id` (INTEGER, FK -> `activity.id`, NOT NULL)
   - `completed_steps` (JSONB, Default: `'[]'`) — Lista de step_ids concluídos com sucesso (ADR-006).
   - `current_step_id` (VARCHAR(50), Nullable)
   - `score` (INTEGER, Default: 0)
   - `points_earned` (INTEGER, Default: 0) — Moedas acumuladas na atividade.
   - `xp_earned` (INTEGER, Default: 0) — XP ganho na atividade.
   - `is_completed` (BOOLEAN, Default: `false`)
   - `attempts_count` (INTEGER, Default: 1)
   - `started_at` (TIMESTAMP, Default: `now()`)
   - `completed_at` (TIMESTAMP, Nullable)
   - *Restrição:* `UNIQUE(user_id, activity_id)`

8. **`quiz_content` (Conteúdo de Questões por Passo - ADR-003)**
   - `id` (INTEGER, PK)
   - `activity_id` (INTEGER, FK -> `activity.id`, NOT NULL)
   - `step_id` (VARCHAR(50), NOT NULL)
   - `question_text` (TEXT, NOT NULL)
   - `options` (JSONB, NOT NULL) — Alternativas de resposta.
   - `correct_option_id` (VARCHAR(50), NOT NULL)
   - `explanation` (TEXT, Nullable) — Feedback pedagógico formativo.
   - `points_reward` (INTEGER, Default: 20)
   - `xp_reward` (INTEGER, Default: 50)
   - *Restrição:* `UNIQUE(activity_id, step_id)`

9. **`learning_content` (Material Didático e Instrucional)**
   - `id` (INTEGER, PK)
   - `activity_id` (INTEGER, FK -> `activity.id`, NOT NULL)
   - `step_id` (VARCHAR(50), NOT NULL)
   - `title` (VARCHAR(200), NOT NULL)
   - `content_html` (TEXT, NOT NULL)
   - `media_url` (VARCHAR(255), Nullable) — Vídeo do YouTube grounded ou diagrama.
   - *Restrição:* `UNIQUE(activity_id, step_id)`

10. **`narrative_content` (Histórias e Storytelling do Tabuleiro)**
    - `id` (INTEGER, PK)
    - `activity_id` (INTEGER, FK -> `activity.id`, NOT NULL)
    - `step_id` (VARCHAR(50), NOT NULL)
    - `title` (VARCHAR(200), NOT NULL)
    - `body` (TEXT, NOT NULL)
    - `character_name` (VARCHAR(100), Nullable)
    - *Restrição:* `UNIQUE(activity_id, step_id)`

11. **`student_response` (Registro de Respostas dos Alunos)**
    - `id` (INTEGER, PK)
    - `user_id` (INTEGER, FK -> `user.id`, NOT NULL)
    - `activity_id` (INTEGER, FK -> `activity.id`, NOT NULL)
    - `step_id` (VARCHAR(50), NOT NULL)
    - `selected_option_id` (VARCHAR(50), Nullable)
    - `text_response` (TEXT, Nullable)
    - `is_correct` (BOOLEAN, NOT NULL)
    - `response_time_seconds` (INTEGER, Nullable)
    - `submitted_at` (TIMESTAMP, Default: `now()`)

12. **`manual_feedback` (Avaliações Manuais do Docente)**
    - `id` (INTEGER, PK)
    - `response_id` (INTEGER, FK -> `student_response.id`, NOT NULL)
    - `given_by_id` (INTEGER, FK -> `user.id`, NOT NULL)
    - `feedback_text` (TEXT, NOT NULL)
    - `grade_adjustment` (INTEGER, Default: 0)
    - `created_at` (TIMESTAMP, Default: `now()`)

13. **`activity_revision` (Histórico e Versionamento de Atividades)**
    - `id` (INTEGER, PK)
    - `activity_id` (INTEGER, FK -> `activity.id`, NOT NULL)
    - `revision_data` (JSONB, NOT NULL)
    - `revised_by_id` (INTEGER, FK -> `user.id`, NOT NULL)
    - `created_at` (TIMESTAMP, Default: `now()`)

14. **`tag` & `activity_tag` (Taxonomia e Metadados)**
    - `tag`: `id`, `name` (VARCHAR(50), UNIQUE)
    - `activity_tag`: `activity_id`, `tag_id` (Chave Primária Composta)

15. **`activity_rating` (Avaliação da Atividade pelo Aluno)**
    - `id` (INTEGER, PK)
    - `activity_id` (INTEGER, FK -> `activity.id`, NOT NULL)
    - `user_id` (INTEGER, FK -> `user.id`, NOT NULL)
    - `score` (INTEGER, 1 a 5 estrelas)
    - `comment` (TEXT, Nullable)
    - `created_at` (TIMESTAMP)

---

### 2.3 Domínio 3: Gamificação e Economia Virtual

16. **`medal` (Catálogo Oficial de Medalhas - 20 Conquistas)**
    - `id` (INTEGER, PK)
    - `code` (VARCHAR(50), UNIQUE, NOT NULL)
    - `name` (VARCHAR(100), NOT NULL)
    - `description` (VARCHAR(255), NOT NULL)
    - `category` (VARCHAR(50), NOT NULL)
    - `image_url` (VARCHAR(255), NOT NULL)
    - `xp_reward` (INTEGER, Default: 100)
    - `coins_reward` (INTEGER, Default: 50)

17. **`user_unlocked_medal` (Conquistas dos Alunos)**
    - `id` (INTEGER, PK)
    - `user_id` (INTEGER, FK -> `user.id`, NOT NULL)
    - `medal_id` (INTEGER, FK -> `medal.id`, NOT NULL)
    - `unlocked_at` (TIMESTAMP, Default: `now()`)
    - *Restrição:* `UNIQUE(user_id, medal_id)`

18. **`store_item` (Itens da Loja de Recompensas)**
    - `id` (INTEGER, PK)
    - `name` (VARCHAR(100), NOT NULL)
    - `item_type` (VARCHAR(50), NOT NULL) — `avatar`, `frame`, `title`, `aura`, `effect`.
    - `description` (TEXT, Nullable)
    - `price_coins` (INTEGER, NOT NULL)
    - `asset_url` (VARCHAR(255), Nullable)
    - `metadata_json` (JSONB, Nullable)
    - `is_active` (BOOLEAN, Default: `true`)

19. **`purchase` (Transações e Itens do Inventário - ADR-005)**
    - `id` (INTEGER, PK)
    - `user_id` (INTEGER, FK -> `user.id`, NOT NULL)
    - `item_id` (INTEGER, FK -> `store_item.id`, NOT NULL)
    - `price_paid` (INTEGER, NOT NULL)
    - `is_consumed` (BOOLEAN, Default: `false`)
    - `is_equipped` (BOOLEAN, Default: `false`)
    - `custom_text` (VARCHAR(100), Nullable) — Texto customizado em títulos.
    - `purchased_at` (TIMESTAMP, Default: `now()`)
    - `expires_at` (TIMESTAMP, Nullable) — Expiração de efeitos temporários (ex: 24h).

20. **`title` & `user_unlocked_title` (Títulos de Prestígio)**
    - `title`: `id`, `name`, `rarity`, `description`.
    - `user_unlocked_title`: `id`, `user_id`, `title_id`, `unlocked_at`.

21. **`roulette_win` (Auditoria da Roleta Diária da Sorte)**
    - `id` (INTEGER, PK)
    - `user_id` (INTEGER, FK -> `user.id`, NOT NULL)
    - `prize_type` (VARCHAR(50), NOT NULL) — `xp`, `coins`, `extra_spin`.
    - `prize_value` (INTEGER, NOT NULL)
    - `won_at` (TIMESTAMP, Default: `now()`)

22. **`slot_win` (Auditoria do Caça-Níqueis Pedagógico)**
    - `id` (INTEGER, PK)
    - `user_id`, `prize_type`, `prize_value`, `won_at`.

---

### 2.4 Domínio 4: Comunicação Social e Moderação

23. **`forum_category` (Categorias Automáticas do Fórum - ADR-014)**
    - `id` (INTEGER, PK)
    - `activity_id` (INTEGER, FK -> `activity.id`, NOT NULL)
    - `name` (VARCHAR(100), NOT NULL) — Ex: "Dúvidas Gerais", "Sugestões".
    - `description` (TEXT, Nullable)

24. **`forum_topic` (Tópicos de Discussão)**
    - `id` (INTEGER, PK)
    - `activity_id` (INTEGER, FK -> `activity.id`, NOT NULL)
    - `category_id` (INTEGER, FK -> `forum_category.id`, NOT NULL)
    - `author_id` (INTEGER, FK -> `user.id`, NOT NULL)
    - `title` (VARCHAR(200), NOT NULL)
    - `body` (TEXT, NOT NULL)
    - `is_pinned` (BOOLEAN, Default: `false`)
    - `is_locked` (BOOLEAN, Default: `false`)
    - `best_answer_id` (INTEGER, Nullable)
    - `created_at` (TIMESTAMP, Default: `now()`)

25. **`forum_post` (Respostas e Comentários do Fórum)**
    - `id` (INTEGER, PK)
    - `topic_id` (INTEGER, FK -> `forum_topic.id`, NOT NULL)
    - `author_id` (INTEGER, FK -> `user.id`, NOT NULL)
    - `body` (TEXT, NOT NULL)
    - `created_at` (TIMESTAMP, Default: `now()`)

26. **`topic_like` & `post_like` (Votação e Endosso)**
    - `topic_like`: `id`, `topic_id`, `user_id`, `created_at`.
    - `post_like`: `id`, `post_id`, `user_id`, `created_at`.

27. **`conversation` & `conversation_participants` (Canais de Chat)**
    - `conversation`: `id`, `activity_id`, `is_group`, `created_at`.
    - `conversation_participants`: `conversation_id`, `user_id` (Chave Composta).

28. **`chat_message` (Mensagens em Tempo Real via Socket.IO)**
    - `id` (INTEGER, PK)
    - `conversation_id` (INTEGER, FK -> `conversation.id`, NOT NULL)
    - `sender_id` (INTEGER, FK -> `user.id`, NOT NULL)
    - `content` (TEXT, NOT NULL)
    - `created_at` (TIMESTAMP, Default: `now()`)

29. **`message_report` (Moderação e Denúncias)**
    - `id` (INTEGER, PK)
    - `message_id` (INTEGER, FK -> `chat_message.id`, NOT NULL)
    - `reported_by_id` (INTEGER, FK -> `user.id`, NOT NULL)
    - `reason` (TEXT, NOT NULL)
    - `status` (VARCHAR(50), Default: `'pending'`)
    - `created_at` (TIMESTAMP, Default: `now()`)

---

### 2.5 Domínio 5: Telemetria Científica e Governança

30. **`event_log` (Telemetria Forense de Pesquisa - ADR-015)**
    - `id` (INTEGER, PK)
    - `user_id` (INTEGER, FK -> `user.id`, Nullable)
    - `event_type` (VARCHAR(100), NOT NULL, Indexado)
    - `payload` (JSONB, NOT NULL)
    - `ip_address` (VARCHAR(50), Nullable)
    - `user_agent` (TEXT, Nullable)
    - `created_at` (TIMESTAMP, Default: `now()`, Indexado)

31. **`contact_messages` (Formulário Institucional de Contato)**
    - `id` (INTEGER, PK)
    - `user_id` (INTEGER, FK -> `user.id`, Nullable)
    - `name` (VARCHAR(100), NOT NULL)
    - `email` (VARCHAR(120), NOT NULL)
    - `subject` (VARCHAR(150), NOT NULL)
    - `message` (TEXT, NOT NULL)
    - `is_read` (BOOLEAN, Default: `false`)
    - `created_at` (TIMESTAMP, Default: `now()`)

32. **`system_feedback` & `system_stat` (Métricas de Saúde Operacional)**
    - `system_feedback`: `id`, `user_id`, `feedback_type`, `message`, `created_at`.
    - `system_stat`: `id`, `metric_name`, `metric_value`, `recorded_at`.

---

## 3. Conformidade com LGPD e Políticas de Deleção em Cascata

Conforme especificado na migração `0e50bf2990ea_lgpd_cascade_deletes.py`:
- A exclusão de um estudante (`User`) dispara deleção em cascata (`CASCADE`) de suas matrículas, respostas, compras e mensagens de chat pessoais, ou anonimização de suas postagens no fórum (`SET NULL` em `author_id` mantendo o fio de discussão intacto).
- Os registros de `EventLog` têm dados identificáveis (IP, User-Agent) higienizados ou desvinculados de `user_id` caso o titular solicite exclusão com base no Art. 18 da LGPD.
