# API de Turmas, Matrículas e Atribuições

> **Blueprint:** `class_bp` (`/api/classes`)  
> **Serviço Responsável:** `backend/app/services/class_service.py`  
> **Público:** Professores e Alunos  

---

## 1. Endpoints do Professor

### 1.1 Listar Turmas do Professor
- **Método:** `GET`
- **URL:** `/api/classes`
- **Acesso:** Privado (Professor)
- **Responses:**
  - `200 OK`: Lista de turmas criadas pelo professor, com contagem de alunos matriculados e código de matrícula.

---

### 1.2 Criar Nova Turma
- **Método:** `POST`
- **URL:** `/api/classes`
- **Acesso:** Privado (Professor)
- **Request Body (JSON):**
  ```json
  {
    "name": "Engenharia de Software 2026/1",
    "description": "Turma do período matutino"
  }
  ```
- **Responses:**
  - `201 Created`:
    ```json
    {
      "message": "Turma criada com sucesso!",
      "class": {
        "id": 5,
        "name": "Engenharia de Software 2026/1",
        "description": "Turma do período matutino",
        "enrollment_code": "ENG-2026-A1",
        "professor_id": 2
      }
    }
    ```
  - `403 Forbidden`: Se solicitado por aluno.

---

### 1.3 Obter Detalhes da Turma e Lista de Alunos
- **Método:** `GET`
- **URL:** `/api/classes/<int:class_id>`
- **Acesso:** Privado (Professor regente ou Aluno matriculado)
- **Responses:**
  - `200 OK`: Retorna informações da turma, lista de alunos inscritos (`enrollments`), atividades atribuídas e progresso médio.

---

### 1.4 Atribuir Atividade a uma Turma
- **Método:** `POST`
- **URL:** `/api/classes/<int:class_id>/activities/<int:activity_id>/assign`
- **Acesso:** Privado (Professor dono da turma e da atividade)
- **Request Body (JSON):**
  ```json
  {
    "available_from": "2026-11-01T08:00:00Z",
    "expires_at": "2026-11-15T23:59:59Z"
  }
  ```
- **Responses:**
  - `200 OK`: Atividade vinculada à turma e disponível para os estudantes matriculados.

---

## 2. Endpoints do Aluno

### 2.1 Auto-Matrícula em Turma via Código
- **Método:** `POST`
- **URL:** `/api/classes/join`
- **Acesso:** Privado (Aluno)
- **Request Body (JSON):**
  ```json
  {
    "enrollment_code": "ENG-2026-A1"
  }
  ```
- **Responses:**
  - `201 Created`: Matrícula efetuada com sucesso.
  - `400 Bad Request`: Código não fornecido.
  - `404 Not Found`: Turma com este código não existe.
  - `409 Conflict`: Aluno já se encontra matriculado nesta turma.

---

### 2.2 Listar Turmas em que o Aluno está Matriculado
- **Método:** `GET`
- **URL:** `/api/classes/student/my-classes`
- **Acesso:** Privado (Aluno)
- **Responses:**
  - `200 OK`: Array de turmas contendo nome da disciplina, nome do professor e status das atividades associadas.
