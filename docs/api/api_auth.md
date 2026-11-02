# API de Autenticação, Usuários e Rotas Públicas

> **Blueprint:** `auth_bp` (`/api/auth`) & Rotas Raiz (`/api/public`, `/api/health`)  
> **Serviço Responsável:** `backend/app/services/auth_service.py`  

---

## 1. Endpoints de Autenticação (`/api/auth`)

### 1.1 Registrar Novo Usuário
- **Método:** `POST`
- **URL:** `/api/auth/register`
- **Acesso:** Público
- **Segurança (VULN-02):** Apenas papéis `aluno` e `professor` são permitidos. Qualquer outro valor é rebaixado automaticamente para `aluno`. Professores devem fornecer código de acesso válido.
- **Request Body (JSON):**
  ```json
  {
    "name": "João da Silva",
    "email": "joao@exemplo.com",
    "password": "SenhaSegura123!",
    "role": "aluno",
    "accessCode": ""
  }
  ```
- **Responses:**
  - `201 Created`: Usuário registrado com sucesso. Retorna objeto do usuário e token JWT.
  - `400 Bad Request`: Dados obrigatórios faltando ou bloqueio pelo WAF de segurança.
  - `403 Forbidden`: Código de acesso institucional inválido para professor.
  - `409 Conflict`: E-mail já existente.

---

### 1.2 Login Tradicional (E-mail e Senha)
- **Método:** `POST`
- **URL:** `/api/auth/login`
- **Acesso:** Público
- **Request Body (JSON):**
  ```json
  {
    "email": "joao@exemplo.com",
    "password": "SenhaSegura123!"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "access_token": "eyJhbGciOi...",
      "user": {
        "id": 1,
        "name": "João Da Silva",
        "email": "joao@exemplo.com",
        "role": "aluno",
        "profile_picture": "/avatars/default_avatar.webp",
        "global_xp": 150
      }
    }
    ```
  - `401 Unauthorized`: Credenciais incorretas ou conta suspensa.

---

### 1.3 Login Social com Google OAuth
- **Método:** `POST`
- **URL:** `/api/auth/google-login`
- **Acesso:** Público
- **Request Body (JSON):**
  ```json
  {
    "token": "<google_id_token>"
  }
  ```
- **Responses:**
  - `200 OK`: Retorna token JWT da aplicação e dados de perfil unificados.
  - `400 Bad Request`: Token Google inválido ou expirado.

---

### 1.4 Dados do Usuário Autenticado
- **Método:** `GET`
- **URL:** `/api/auth/user`
- **Acesso:** Autenticado (`Bearer Token`)
- **Responses:**
  - `200 OK`: Retorna detalhes completos do usuário conectado, incluindo moedas, XP e turmas.

---

### 1.5 Atualização de Perfil e Dados Demográficos (DSR)
- **Método:** `PUT`
- **URL:** `/api/auth/user`
- **Acesso:** Autenticado
- **Request Body (JSON):**
  ```json
  {
    "name": "João da Silva Sauro",
    "age": 21,
    "gender": "Masculino",
    "institution_name": "Universidade Estadual",
    "discipline": "Engenharia de Software",
    "game_preferences": "Conquistas e Exploração",
    "learning_preferences": "Visual e Prático",
    "profile_picture": "/avatars/avatar_special.webp"
  }
  ```
- **Responses:**
  - `200 OK`: Perfil atualizado com sucesso.

---

### 1.6 Atualização do Status de Onboarding / Tutoriais
- **Método:** `POST`
- **URL:** `/api/auth/user/update-onboarding`
- **Acesso:** Autenticado
- **Request Body (JSON):**
  ```json
  {
    "tutorial_key": "student_dashboard_v1",
    "completed": true
  }
  ```
- **Responses:**
  - `200 OK`: Status de onboarding atualizado no campo JSONB do usuário.

---

### 1.7 Solicitação e Redefinição de Senha
- **Solicitar Redefinição:** `POST /api/auth/forgot-password` (envia e-mail com token).
- **Redefinir com Token:** `POST /api/auth/reset-password` (valida token e grava nova senha hash com bcrypt).

---

## 2. Rotas Públicas e Operacionais

### 2.1 Estatísticas Públicas da Home
- **Método:** `GET`
- **URL:** `/api/public/stats`
- **Acesso:** Público
- **Response `200 OK`:**
  ```json
  {
    "users": 150,
    "professors": 12,
    "students": 138,
    "activities": 45,
    "classes": 8,
    "total_visits": 3420
  }
  ```

### 2.2 Registro de Hit / Visita
- **Método:** `POST`
- **URL:** `/api/public/hit`
- **Acesso:** Público (incrementa atomicamente o contador `total_visits`).

### 2.3 Health Check SRE / Conectividade
- **Método:** `GET`
- **URL:** `/api/health`
- **Acesso:** Público
- **Response `200 OK` (ou `503 Service Unavailable`):**
  ```json
  {
    "status": "UP",
    "database": {
      "status": "CONNECTED",
      "latency_ms": 1.45
    },
    "circuit_breakers": {
      "gemini_api": "CLOSED",
      "email_sender": "CLOSED"
    }
  }
  ```
