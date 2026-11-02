# API de Analytics, Telemetria Científica e Administração

> **Blueprints:** `analytics_bp` (`/api/analytics`), `admin_bp` (`/api/admin`), `log_bp` (`/api/log`)  
> **Serviços Responsáveis:** `analytics_service.py`, `admin_service.py`, `log_service.py`  
> **Público:** Professores e Administradores  

---

## 1. Analytics e Desempenho Discente (`/api/analytics`)

### 1.1 Relatório de Desempenho de Alunos por Turma e Atividade
- **Método:** `GET`
- **URL:** `/api/analytics/professor/performance`
- **Acesso:** Privado (Professor ou Admin)
- **Segurança (VULN-12):** Protegido contra BOLA/IDOR. Professores só acessam turmas sob sua própria docência. Alunos recebem 403 Forbidden.
- **Query Params:**
  - `class_id` (Obrigatório): ID da turma.
  - `activity_id` (Opcional): Filtra por atividade específica.
  - `search` (Opcional): Busca por nome ou e-mail de aluno.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "total_students": 32,
      "completed_count": 28,
      "average_score": 88.5,
      "average_accuracy": 0.85,
      "students": [
        {
          "student_id": 5,
          "name": "Maria Silva",
          "email": "maria@exemplo.com",
          "points": 95,
          "accuracy": 0.92,
          "attempts": 1,
          "status": "completed"
        }
      ]
    }
    ```
  - `403 Forbidden`: "Acesso não autorizado aos dados desta turma."

---

### 1.2 Registro de Telemetria Científica do Cliente
- **Método:** `POST`
- **URL:** `/api/analytics/log` ou `/api/log/event`
- **Acesso:** Autenticado ou Visitante (com IP registrado)
- **Request Body (JSON):**
  ```json
  {
    "section": "game_board",
    "action": "node_click",
    "details": { "activity_id": 10, "step_id": 2, "time_ms": 320 }
  }
  ```
- **Responses:**
  - `200 OK`: Evento persistido na tabela `event_log` para mineração de dados acadêmica.

---

## 2. Console Administrativo (`/api/admin`)

### 2.1 Visão Geral e Indicadores do Sistema
- **Método:** `GET`
- **URL:** `/api/admin/overview`
- **Acesso:** Privado (`role === 'admin'`)
- **Responses:**
  - `200 OK`: Totalizadores de contas, turmas ativas, volume de dados e saúde geral.

---

### 2.2 Gestão de Usuários
- **Listar Usuários:** `GET /api/admin/users?page=1&per_page=20&search=maria`
- **Alterar Perfil / Status:** `PUT /api/admin/users/<int:user_id>`
  - Request Body: `{"role": "professor", "status": "ACTIVE"}`
- **Gerar Código de Acesso Individual de Professor:**
  - `POST /api/admin/teacher-codes`
  - Body: `{"email": "novo_prof@universidade.br"}`

---

### 2.3 Exportação de Logs de Auditoria em Planilha CSV Higienizada
- **Método:** `GET`
- **URL:** `/api/admin/logs/export`
- **Acesso:** Privado (Admin)
- **Segurança (VULN-22):** Aplica sanitização contra Formula Injection / DDE em células iniciadas com `=`, `+`, `-`, `@`, prefixando-as com apóstrofo (`'`).
- **Response:**
  - `200 OK`: Stream do arquivo `text/csv; charset=utf-8` com delimitador `;`.
