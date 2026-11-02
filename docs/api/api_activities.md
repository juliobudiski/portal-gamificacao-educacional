# API de Atividades e Wizard de Criação Pedagógica

> **Blueprint:** `activity_bp` (`/api/activities`)  
> **Serviço Responsável:** `backend/app/services/activity_service.py` & `recommendation_engine.py`  
> **Público:** Professores autenticados (`role === 'professor'`) e Alunos matriculados  

---

## 1. Endpoints de Consulta e Banco de Atividades

### 1.1 Listar Atividades Criadas pelo Professor
- **Método:** `GET`
- **URL:** `/api/activities`
- **Acesso:** Privado (Professor)
- **Responses:**
  - `200 OK`: Array de atividades criadas pelo professor logado.

---

### 1.2 Banco Público de Atividades Compartilhadas
- **Método:** `GET`
- **URL:** `/api/activities/bank`
- **Acesso:** Privado (Professor)
- **Responses:**
  - `200 OK`: Lista de atividades públicas (`is_public = True`) disponíveis para clonagem ou atribuição rápida.

---

### 1.3 Obter Detalhes de uma Atividade Específica
- **Método:** `GET`
- **URL:** `/api/activities/<int:activity_id>`
- **Acesso:** Privado (Professor autor ou Aluno matriculado)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "id": 10,
      "title": "Jornada dos Padrões de Projeto",
      "description": "Atividade gamificada sobre SOLID e GoF",
      "professor_id": 2,
      "is_public": true,
      "gamification_design": {
        "boardTheme": "vila_aventura",
        "steps": [
          { "stepId": 1, "type": "narrative", "title": "O Chamado do Mentor" },
          { "stepId": 2, "type": "quiz", "title": "Desafio do SRP" },
          { "stepId": 3, "type": "content", "title": "Cheat Sheet de Arquitetura" }
        ]
      }
    }
    ```
  - `404 Not Found`: Atividade não encontrada.

---

## 2. Criação, Edição e Ciclo de Vida do Rascunho

### 2.1 Criar Nova Atividade (ou Iniciar Rascunho)
- **Método:** `POST`
- **URL:** `/api/activities`
- **Acesso:** Privado (Professor)
- **Request Body (JSON):**
  ```json
  {
    "title": "Arquitetura Hexagonal na Prática",
    "description": "Construindo portas e adaptadores desacoplados",
    "currentScenario": { "problems": ["Código espaguete", "Falta de testes"] },
    "desiredScenario": { "goals": ["Domínio puro isolado"] },
    "playerProfile": { "achiever": 40, "player": 30, "socialiser": 30 },
    "gameElements": ["tabuleiro", "pontos", "medalhas", "roleta"],
    "gamificationRules": { "maxPoints": 100 },
    "is_draft": true
  }
  ```
- **Responses:**
  - `201 Created`: Retorna atividade persistida com `id` e `is_draft = true`.

---

### 2.2 Atualização / Auto-Save de Rascunho
- **Método:** `PUT`
- **URL:** `/api/activities/<int:activity_id>`
- **Acesso:** Privado (Apenas o Professor autor)
- **Comportamento:** Atualiza os campos do wizard com persistência segura de campos JSONB (`flag_modified`, ADR-006).

---

### 2.3 Promover Rascunho para Atividade Oficial
- **Método:** `POST`
- **URL:** `/api/activities/<int:activity_id>/promote-draft`
- **Acesso:** Privado (Professor autor)
- **Comportamento:** Transforma o rascunho em atividade oficial (`is_draft = False`), sincroniza nós pedagógicos em tabelas relacionais de apoio (`quiz_content`, `narrative_content`, `learning_content`) e disponibiliza para atribuição.

---

### 2.4 Exclusão Individual e em Massa (Bulk Delete)
- **Exclusão Individual:** `DELETE /api/activities/<int:activity_id>`
- **Exclusão em Massa (ADR-007):** `POST /api/activities/bulk-delete`
  - Request Body: `{"activity_ids": [10, 11, 12]}`
  - Operação atômica em transação única com deleção em cascata segura.

---

## 3. Motor de Recomendação Contextual (MDC)

### 3.1 Consultar Recomendações e Riscos Pedagógicos
- **Método:** `POST`
- **URL:** `/api/activities/recommend-elements`
- **Acesso:** Privado (Professor)
- **Request Body (JSON):**
  ```json
  {
    "desiredScenario": { "competencies": ["analise_requisitos", "testes"] },
    "playerProfile": { "achiever": 50, "disruptor": 20 }
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "recommended": ["tabuleiro", "missoes", "medalhas"],
    "neutral": ["leaderboard", "roleta"],
    "not_recommended": ["tempo_limite_estrito"],
    "warnings": [
      "O elemento 'tempo_limite_estrito' apresenta risco de estresse cognitivo para perfis Achievers sob cenários formativos."
    ]
  }
  ```
