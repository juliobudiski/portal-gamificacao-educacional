# API de Progresso no Tabuleiro, Resoluções e Roleta

> **Blueprints:** `progress_bp` (`/api/progress`) & `student_bp` (`/api/student`)  
> **Serviços Responsáveis:** `progress_service.py`, `roulette_service.py`, `student_service.py`  
> **Público:** Alunos autenticados (`role === 'aluno'`)  

---

## 1. Execução no Tabuleiro e Progresso da Atividade

### 1.1 Obter Progresso Atual do Aluno na Atividade
- **Método:** `GET`
- **URL:** `/api/progress/<int:activity_id>`
- **Acesso:** Privado (Aluno autenticado)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "activity_id": 10,
      "status": "in_progress",
      "completed_steps": [1, 2],
      "points_earned": 50,
      "total_xp_earned": 120,
      "coins": 35,
      "attempts": 2,
      "last_spin_date": "2026-11-02T10:00:00Z"
    }
    ```

---

### 1.2 Registrar Resolução de Passo (Quiz / Leitura / Narrativa)
- **Método:** `POST`
- **URL:** `/api/progress/<int:activity_id>/step/<int:step_id>`
- **Acesso:** Privado (Aluno)
- **Request Body (JSON):**
  ```json
  {
    "type": "quiz",
    "selected_option": 2,
    "is_correct": true,
    "points": 10,
    "time_spent_seconds": 45
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "message": "Passo concluído com sucesso!",
      "step_id": 2,
      "is_correct": true,
      "awarded_coins": 10,
      "awarded_xp": 25,
      "activity_completed": false,
      "next_step_unlocked": 3
    }
    ```

---

## 2. Roleta Diária da Sorte (`/api/progress/<id>/spin`)

- **Método:** `POST`
- **URL:** `/api/progress/<int:activity_id>/spin`
- **Acesso:** Privado (Aluno autenticado)
- **Segurança (VULN-16):** O cooldown diário é estritamente aplicado no backend com verificação atômica de data (`progress.last_spin_date == today`). Parâmetros client-side não podem burlar o limite.
- **Request Body:** `{}`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "prize": {
        "type": "coins",
        "value": 50,
        "label": "50 Moedas"
      },
      "updated_progress": {
        "coins": 85,
        "last_spin_date": "2026-11-02T16:20:00Z"
      }
    }
    ```
  - `400 Bad Request`: "Você já girou a roleta hoje! Volte amanhã."

---

## 3. Minhas Atividades (`/api/student`)

### 3.1 Listar Atividades Atribuídas ao Aluno
- **Método:** `GET`
- **URL:** `/api/student/activities`
- **Acesso:** Privado (Aluno)
- **Query Params Opcionais:**
  - `status`: `not_started`, `in_progress`, `completed`
- **Responses:**
  - `200 OK`: Array de atividades agrupadas com dados da turma e prazo de expiração.
