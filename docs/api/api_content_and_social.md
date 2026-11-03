# API de Editores de Conteúdo, Medalhas, Comunicação Social e Contato

> **Blueprints:** `content_editor_bp`, `medals_bp`, `rankings_bp`, `forum_bp`, `chat_bp`, `contact_bp`  
> **Serviços Responsáveis:** `content_editor_service.py`, `medal_service.py`, `ranking_service.py`, `forum_service.py`, `chat_service.py`, `contact_service.py`  

---

## 1. Editores Especializados de Conteúdo (`/api/content_editor`)

### 1.1 Obter e Atualizar Conteúdo de Quiz
- **Buscar Quiz do Passo:** `GET /api/content_editor/quiz/<int:activity_id>/<int:step_id>`
- **Salvar Perguntas do Quiz:** `POST /api/content_editor/quiz/<int:activity_id>/<int:step_id>`
  - Request Body:
    ```json
    {
      "questions": [
        {
          "question": "Qual princípio SOLID recomenda interfaces pequenas e específicas?",
          "options": ["SRP", "OCP", "ISP", "DIP"],
          "correct_option": 2,
          "explanation": "O Interface Segregation Principle (ISP) orienta que nenhum cliente deve ser forçado a depender de métodos que não usa."
        }
      ]
    }
    ```

---

### 1.2 Obter e Atualizar Roteiro de Narrativa
- **Buscar Narrativa do Passo:** `GET /api/content_editor/narrative/<int:activity_id>/<int:step_id>`
- **Salvar Roteiro:** `POST /api/content_editor/narrative/<int:activity_id>/<int:step_id>`
  - Permite definir a imagem do cenário de fundo e a lista cronológica de diálogos entre personagens.

---

### 1.3 Obter e Atualizar Material de Aprendizagem (Markdown)
- **Buscar Leitura do Passo:** `GET /api/content_editor/learning-content/<int:activity_id>/<int:step_id>`
- **Salvar Texto:** `POST /api/content_editor/learning-content/<int:activity_id>/<int:step_id>`
  - Request Body: `{"markdown_text": "# Conceito de Arquitetura\n\nTexto explicativo com código..."}`

---

## 2. Sistema de Medalhas e Conquistas (`/api/medals`)

### 2.1 Catálogo Oficial de Medalhas
- **Método:** `GET`
- **URL:** `/api/medals`
- **Acesso:** Autenticado
- **Responses:**
  - `200 OK`: Array com as 20 medalhas do catálogo da plataforma, suas categorias (Exploração, Desempenho, Social, Mestria) e ícones.

---

### 2.2 Medalhas Desbloqueadas pelo Usuário
- **Método:** `GET`
- **URL:** `/api/medals/unlocked`
- **Acesso:** Autenticado
- **Responses:**
  - `200 OK`: Lista de medalhas já conquistadas pelo aluno com timestamp de conquista.

---

## 3. Placares de Líderes e Rankings (`/api/rankings`)

### 3.1 Ranking por Turma
- **Método:** `GET`
- **URL:** `/api/rankings/class/<int:class_id>`
- **Acesso:** Privado (Membros da turma)
- **Responses:**
  - `200 OK`: Tabela ordenada de alunos com base no XP acumulado nas atividades da turma.

---

## 4. Fórum e Chat em Tempo Real

### 4.1 Fórum da Atividade (`/api/forum`)
- **Listar Tópicos:** `GET /api/forum/activity/<int:activity_id>?step_id=2`
- **Criar Tópico:** `POST /api/forum/activity/<int:activity_id>`
  - Request Body: `{"step_id": 2, "title": "Dúvida no Quiz de ISP", "content": "Por que a alternativa 2 é correta?"}`
- **Responder Tópico:** `POST /api/forum/topics/<int:topic_id>/posts`

### 4.2 Histórico do Chat da Turma (`/api/chat`)
- **Buscar Mensagens:** `GET /api/chat/class/<int:class_id>?limit=50`
- **Envio de Mensagens:** Realizado em tempo real via canal WebSocket Socket.IO (`send_message`).

---

## 5. Canal de Contato e Ouvidoria (`/api/contact`)

### 5.1 Enviar Mensagem de Contato
- **Método:** `POST`
- **URL:** `/api/contact`
- **Acesso:** Aberto (com autenticação opcional)
- **Request Body (JSON):**
  ```json
  {
    "name": "Professora Helena",
    "email": "helena@escola.edu.br",
    "subject": "Sugestão de Atividade",
    "message": "Gostaria de sugerir novos modelos de tabuleiros..."
  }
  ```
- **Segurança (VULN-17):** Falhas internas de envio ou banco retornam HTTP 500 genérico `{"message": "Erro ao processar mensagem de contato. Tente novamente mais tarde."}` sem vazamento de stack traces ou strings de conexão.
