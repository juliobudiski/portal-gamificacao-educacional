# 📚 Portal de Gamificação Educacional

Bem-vindo ao repositório do **Portal de Gamificação Educacional**, uma plataforma inovadora que utiliza Inteligência Artificial Generativa para criar experiências de aprendizado engajadoras, narrativas dinâmicas, quizzes interativos e tabuleiros de progressão em estilo RPG.

---

## 🎯 Arquitetura do Sistema (Visão Geral)

O sistema é dividido em duas camadas principais: um **Frontend Moderno em React (Vite)** e um **Backend Robusto em Python (Flask)**, utilizando **Socket.IO** para comunicação bidirecional em tempo real durante o processamento de Inteligência Artificial.

A arquitetura foi projetada para ser modular, extensível e pronta para produção (Enterprise Grade), com segurança de alto nível e tolerância a falhas na geração de conteúdo via IA.

### Diagrama Simplificado
1. **Professor/Aluno** interage com o UI (React).
2. Requisições REST/WebSockets chegam ao **Flask**.
3. O serviço de Orquestração interage de forma assíncrona com a **API do Google Gemini**, repassando o progresso para o Frontend em tempo real.
4. Os dados e métricas de desempenho são persistidos usando **SQLAlchemy** no banco relacional.

---

## 🛠️ Tecnologias Utilizadas

### 🌐 Frontend (Client-Side)
- **Framework Core:** React 19 + Vite (Rápido, tipagem leve e moderno).
- **Estilização & Design:** TailwindCSS com fortes influências de *Glassmorphism* para painéis de administração.
- **Roteamento:** React Router DOM (v7).
- **Mecânicas de Gamificação (UI):**
  - `react-roulette-pro` / `winwheel` (Roletas e sorteios).
  - `react-canvas-confetti` (Feedback de sucesso).
- **Apresentação & Tutoriais:** `react-joyride` (Sistema avançado de Onboarding/Tutorial guiado).
- **Mapas e Geofencing (Presença):** `react-leaflet` / `leaflet`.
- **Renderização de Conteúdo IA:** `react-markdown` + `rehype-highlight` (Para cheatsheets e códigos gerados).
- **Data Viz (Métricas):** `recharts` para dashboards de desempenho acadêmico.

### ⚙️ Backend (Server-Side)
- **Framework Core:** Flask 3 (Web Server e Roteamento REST).
- **Comunicação Assíncrona:** Flask-SocketIO + Eventlet (Permite que a IA processe por 2 minutos enviando o progresso para a barra de loading do frontend, sem bloquear a Main Thread).
- **Banco de Dados (ORM):** SQLAlchemy 2 + psycopg2 (Compatibilidade total com PostgreSQL). Migrations via Flask-Migrate (Alembic).
- **Autenticação e Segurança:** 
  - Flask-JWT-Extended (Tokens de acesso para rotas protegidas).
  - Werkzeug (Hashing de senhas).
  - WAF Customizado (Web Application Firewall): Camada anti-XSS via `bleach`, Anti-SQL Injection e Anti-Prompt Injection.
- **Integração de IA:** 
  - `google-generativeai` (API oficial do Google Gemini 2.5 Flash / Flash-Lite).
  - `json_repair`: Motor de resiliência extremo. Se o LLM alucinar a estrutura do JSON (ex: esquecer uma vírgula), a biblioteca corrige antes do sistema quebrar.

---

## 🛡️ Segurança & Resiliência (Enterprise Grade)

O projeto recebeu pesadas refatorações arquiteturais para evitar falhas clássicas no mundo da IA:

1. **Defesa em Profundidade (WAF Interno):** Os módulos de Login, Chat e Fórum interceptam tentativas de Injeção de SQL (`' OR '1'='1`) e Prompt Injections maliciosos (ex: `"Ignore todas as instruções anteriores"`).
2. **Sticky Fallback e Retries na IA:** Se a API do Google sofrer *Rate Limit* (429) ou erro momentâneo, o sistema tem tolerância a falhas. Ele retenta conexões e pode automaticamente rebaixar da família `Flash` para `Flash-Lite` para evitar a tela azul no usuário.
3. **BYOK (Bring Your Own Key):** Sistema preparado para professores adicionarem suas próprias chaves de API em seus perfis, economizando a quota global e permitindo alto tráfego sem bloqueios de *billing*.

---

## 🎮 Mecânicas Principais

1. **Tabuleiros Educacionais:** O professor escolhe tópicos; a IA cria um mapa com vários passos onde o aluno clica e progride.
2. **Narrativas Interativas:** Geração de historinhas baseadas no assunto técnico (ex: "Um hacker invadiu o sistema. Como fechamos a porta 80?").
3. **Quizzes Gerados e Embaralhados Dinamicamente.**
4. **Loja Virtual & Moedas:** O aluno ganha XP/Coins para liberar avatares novos e itens visuais.
5. **Dashboard Analítico:** Professores podem ver quem fez mais quests, quem obteve melhor nota e quem interagiu mais no fórum.

---

## 🚀 Como Rodar Localmente

**Pré-requisitos:** Python 3.10+, Node.js 20+, PostgreSQL (ou SQLite para dev).

### 1. Subindo o Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate no Windows
pip install -r requirements.txt
# Configurar o .env (DATABASE_URL, GOOGLE_API_KEY, JWT_SECRET_KEY, etc)
flask run --port=5000
```
*(Nota: O servidor Socket.io usa eventlet sob o capô, ele roda na mesma porta do Flask).*

### 2. Subindo o Frontend
```bash
cd frontend
npm install
# Configure a URL do backend no src/config.js ou .env
npm run dev
```

---
*Este sistema é construído por um time dedicado a modernizar a educação através da gamificação adaptativa e inteligência computacional.*