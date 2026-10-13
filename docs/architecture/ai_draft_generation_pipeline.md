# Arquitetura do Pipeline de Geração de Rascunhos por IA (Narrativa, Quiz e Conteúdo)

## 1. Visão Geral Executiva

O subsistema de Geração de Rascunhos por Inteligência Artificial do **Portal Gamificação Educacional** permite que professores elaborem rapidamente atividades pedagógicas gamificadas. O usuário define o contexto pedagógico e os objetivos de aprendizagem, e o sistema orquestra modelos LLM Google Gemini para redigir rascunhos estruturados de:
1. **Roteiros Narrativos com Diálogos:** Histórias imersivas com cenários e falas entre personagens (mentores, alunos ou guias).
2. **Quizzes Gamificados:** Questões com alternativas, gabarito, pontuação e recompensas em moedas virtuais.
3. **Conteúdo Educacional de Apoio:** Textos em Markdown, referências de vídeo e links de estudo direcionados.

Este documento consolida a arquitetura ponta a ponta, os protocolos de rede em tempo real, as estratégias de persistência relacional, a máquina de estados e as correções arquiteturais aprovadas nas [10 Reuniões da Squad Técnica](squad_meetings_ai_pipeline_review.md).

---

## 2. Diagrama de Arquitetura e Fluxo de Dados Ponta a Ponta

```mermaid
sequenceDiagram
    autonumber
    actor Professor as Professor (Frontend React)
    participant Modal as AIConfigModal
    participant API as API Gateway (Flask REST / JWT)
    participant WS as Socket.IO Hub (Namespace '/')
    participant Worker as Background Task (Eventlet Greenlet)
    participant Gemini as Google Gemini LLM (SDK google-genai)
    participant Service as ActivityService & DB

    Professor->>Modal: Configura tema, tom, objetivos e clica "Gerar Conteúdo com IA"
    Modal->>WS: socket.emit("join", "user_ai_<id>")
    Modal->>API: POST /api/content_editor/orchestrate (Bearer JWT)
    API->>API: Valida Token + detect_prompt_injection(inputs)
    API->>API: Recupera chave BYOK do professor (se configurada)
    API->>Worker: socketio.start_background_task(orchestrate_worker, room_id)
    API-->>Modal: 202 Accepted { "message": "Iniciado", "room_id": "user_ai_<id>" }

    loop Geração sequencial com memória contínua
        Worker->>WS: socketio.emit("ai_progress", {percent, message, room_id}, room=room_id)
        WS-->>Modal: Atualiza progresso visual (10% a 99%)
        Worker->>Gemini: generate_content(prompt com System Instruction)
        Gemini-->>Worker: Resposta JSON / Markdown
        Worker->>Worker: Validação estrutural de integridade (_validate_content_integrity)
    end

    Worker->>WS: socketio.emit("ai_complete", {result: final_map, room_id}, room=room_id)
    WS-->>Modal: Recebe final_map com roteiros de cada passo
    Modal->>Modal: Injeta conteúdos na trilha do tabuleiro (isDraft: true)
    
    opt Professor revisa e salva no tabuleiro
        Professor->>Modal: Revisa nó e clica Salvar
        Modal->>Modal: Marca isDraft = false no nó revisado
        Modal->>API: PUT /api/activities/<id> (payload com gamificationDesign)
        API->>Service: sync_progression_path_contents(activity_id, path, purge_orphans=True)
        Service->>Service: Upsert em QuizContent, NarrativeContent, LearningContent
        Service->>Service: Purga registros de nós excluídos
        Service-->>Professor: 200 OK (Atividade consistente)
    end
```

---

## 3. Principais Falhas Diagnosticadas e Soluções Arquiteturais

### 3.1 Falha de Persistência Desacoplada (JSONB vs. Tabelas Relacionais)
- **Problema:** Quando o professor salvava a atividade após a IA gerar o roteiro (`contentMap`), o backend gravava o array de passos apenas no campo JSONB `Activity.gamification_design`, mas **não sincronizava as tabelas normalizadas filhas**:
  - `QuizContent` (`quiz_content`)
  - `NarrativeContent` (`narrative_content`)
  - `LearningContent` (`learning_content`)
  Como consequência, ao carregar a atividade para execução ou consultas relacionais, os conteúdos gerados pareciam vazios ou inexistentes.
- **Correção Arquitetural:**
  Implementada a função modular e idempotente `sync_progression_path_contents(activity_id, progression_path, purge_orphans=True)` em `backend/app/services/activity_service.py`.
  A sincronização foi integrada no fluxo de:
  - `create_activity` (criação ou promoção do rascunho)
  - `update_activity` (atualização padrão via wizard ou tabuleiro)
  - `update_activity_structure` (salvamento de nós e arestas do tabuleiro)
  - `save_autosave` (salvamento em background a cada alteração)

### 3.2 Isolamento de Salas WebSocket (`room_id`)
- **Problema:** Em `backend/app/services/ai_service.py`, emissões de progresso intermediário (`ai_progress`), erro (`ai_error`) e conclusão (`ai_complete`) emitiam broadcasts globais ou sem roteamento explícito de `room`, enquanto o cliente esperava escutar apenas a sala privada `user_ai_<user_id>`. Além disso, no frontend (`frontend/src/components/activity/AIConfigModal.jsx`), checagens estritas de identificador bloqueavam o recebimento caso houvesse discrepâncias.
- **Correção Arquitetural:**
  - Garantido que todas as emissões do backend (`ai_progress`, `ai_complete`, `ai_error`) passem expressamente o parâmetro `room=room_id`.
  - No frontend, os event listeners de socket agora possuem validação flexível de conformidade de sala e timeout adaptativo.

### 3.3 Ciclo de Vida e Validação Humana (`isDraft`)
- **Problema:** Os passos gerados automaticamente pela IA recebem a flag `isDraft: true` para indicar que necessitam de revisão humana antes da publicação oficial. Porém, ao abrir o editor no frontend e salvar o passo revisado, a flag `isDraft` não era limpa para `false`, impedindo o professor de finalizar o Wizard (aviso na Etapa 6).
- **Correção Arquitetural:**
  - Em `frontend/src/pages/ActivityCreationPage.jsx`, o método `handleSaveContentLocally` agora marca explicitamente `isDraft: false` no passo editado pelo professor, permitindo que a validação de prontidão pedagógica seja satisfeita.

### 3.4 Desacoplamento de Logs de Auditoria e Transação de Banco
- **Problema:** O método `_log_system_event` chamava `db.session.commit()` ou `db.session.rollback()` independentemente da transação de negócio e tentava acessar o objeto `request` fora de requisições HTTP, quebrando testes ou fluxos de execução desacoplados.
- **Correção Arquitetural:**
  - Em `backend/app/utils/logging.py`, adicionada verificação segura via `has_request_context()` com fallbacks inteligentes (`"127.0.0.1"`, `"system_service"`).
  - Removido rollback destrutivo na sessão ativa, mantendo o controle transacional na camada de serviço.

---

## 4. Dicionário de Protocolos e Mensagens

### 4.1 Endpoints HTTP REST
| Rota | Método | Autenticação | Descrição |
| :--- | :--- | :--- | :--- |
| `/api/content_editor/orchestrate` | `POST` | Bearer JWT (Professor) | Inicia tarefa em background para gerar rascunhos com IA e retorna `room_id`. |
| `/api/content_editor/activity/<id>/step/<step_id>/content` | `GET` | Bearer JWT (Autor) | Recupera o conteúdo relacional persistido de um nó da trilha. |
| `/api/content_editor/activity/<id>/step/<step_id>/content` | `POST` | Bearer JWT (Autor) | Salva alterações granulares em um nó específico da trilha. |
| `/api/activities/<id>` | `PUT` | Bearer JWT (Autor) | Salva a atividade completa e sincroniza todas as entidades relacionais filhas. |

### 4.2 Eventos WebSocket (Socket.IO)
| Evento | Origem | Destino | Payload | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `join` | Frontend | Backend | `"user_ai_<id>"` | Conecta o cliente à sua sala isolada de geração. |
| `ai_progress` | Backend | Frontend | `{ "percent": int, "message": str, "room_id": str }` | Atualização contínua do progresso (10% a 99%). |
| `ai_complete` | Backend | Frontend | `{ "result": { "<stepId>": {...} }, "room_id": str }` | Entrega de todos os rascunhos gerados com sucesso. |
| `ai_error` | Backend | Frontend | `{ "message": str, "room_id": str }` | Notificação imediata de falha estrutural ou esgotamento de quota. |

---

## 5. Estratégia de Fallback de Modelos de IA (BYOK e Tiering)

O serviço `AIService` adota failover automático em cascata:
1. **Chave BYOK do Professor (se configurada):** Usa a cota pessoal do docente, reduzindo custos centrais e eliminando esperas.
2. **Modelo Primário:** `gemini-2.5-flash-lite` (baixa latência, alta vazão e baixo custo, priorizado para quizzes).
3. **Modelo de Raciocínio:** `gemini-2.5-flash` (maior capacidade narrativa e pedagógica para histórias e conceitos).
4. **Modelo de Contingência:** `gemini-flash-latest` e `gemini-3.6-flash` (acionados em caso de esgotamento de taxa - HTTP 429).
5. **Fallback Sintético Heurístico:** Se todos os modelos externos falharem (ou ausência total de rede), o sistema sintetiza rascunhos locais coerentes para não interromper o planejamento pedagógico.

---

## 6. Cobertura de Testes Automatizados

A integridade do pipeline é validada de forma hermética pela suíte `backend/tests/test_ai_draft_pipeline.py`:
- `test_sync_progression_path_contents_creates_relational_entities`: Valida criação automática de `QuizContent`, `NarrativeContent` e `LearningContent`.
- `test_sync_progression_path_is_idempotent_and_updates_in_place`: Valida que reedições atualizam registros existentes sem duplicações.
- `test_sync_progression_path_purges_orphans_when_step_is_removed`: Valida que nós deletados do tabuleiro têm seus registros órfãos eliminados do banco.
- `test_update_activity_synchronizes_new_ai_generated_contents`: Valida persistência ponta a ponta via `update_activity`.
- `test_ai_service_validation_integrity`: Valida o validador sintático e semântico dos esquemas retornados pela IA.
- `test_orchestrate_route_accepts_valid_payload_and_creates_room`: Valida o endpoint HTTP assíncrono de orquestração.
- `test_orchestrate_route_blocks_prompt_injection`: Valida a proteção do WAF contra injeções de prompt maliciosas.

---

## 7. Registros de Reunião da Squad
Para acessar as deliberações de cada uma das 10 reuniões técnicas da squad, consulte:
- [Ata das 10 Reuniões Técnicas da Squad](squad_meetings_ai_pipeline_review.md)
