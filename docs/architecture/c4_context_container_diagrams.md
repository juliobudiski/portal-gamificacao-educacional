# Diagramas C4: Contexto e Contêineres (Níveis 1 e 2)

Este documento descreve a visão arquitetural do **Portal GamificaEdu** nos Níveis 1 (Contexto do Sistema) e 2 (Contêineres) do modelo C4, utilizando sintaxe visual Mermaid.

---

## 1. Nível 1: Diagrama de Contexto do Sistema

O Diagrama de Contexto posiciona o **Portal GamificaEdu** no centro do ecossistema, mapeando os usuários humanos (Personas) e os serviços externos integrados via nuvem e APIs.

```mermaid
graph TD
    %% Personas
    Professor["👨‍🏫 Docente / Professor<br><i>Cria turmas, projeta atividades gamificadas no Wizard, revisa rascunhos de IA e analisa métricas</i>"]
    Aluno["👩‍🎓 Discente / Aluno<br><i>Navega pelo tabuleiro, responde quizzes, ganha XP/moedas, gira a roleta e personaliza perfil</i>"]
    Pesquisador["🔬 Pesquisador Acadêmico<br><i>Extrai telemetria científica (EventLog) para validação empírica de DSR</i>"]

    %% Sistema Central
    GamificaEdu["🎮 <b>Portal GamificaEdu</b><br><i>Ambiente Gamificado e Sistema de Apoio à Decisão Pedagógica (SAD/MDC)</i>"]

    %% Sistemas Externos
    GeminiAPI["🤖 Google Gemini AI Studio<br><i>Geração de rascunhos de roteiros pedagógicos e quizzes (Multi-Model Fallback)</i>"]
    YouTubeAPI["📹 YouTube Data API<br><i>Grounding conceitual de videoaulas para fundamentar roteiros</i>"]
    GoogleAuth["🔑 Google OAuth 2.0<br><i>Autenticação federada e Single Sign-On (SSO) de docentes e discentes</i>"]
    NeonCloud["🐘 Neon Serverless PostgreSQL<br><i>Persistência relacional distribuída na região AWS sa-east-1</i>"]
    Cloudflare["🛡️ Cloudflare Network<br><i>Borda de segurança, proteção DDoS e túnel TLS ponta a ponta</i>"]

    %% Conexões
    Professor -->|Gerencia turmas, configura tabuleiro e audita recomendações [HTTPS]| GamificaEdu
    Aluno -->|Executa missões, conversa em tempo real e interage na loja [HTTPS/WSS]| GamificaEdu
    Pesquisador -->|Consulta logs anonimizados e relatórios de eficácia pedagógica [HTTPS]| GamificaEdu

    GamificaEdu -->|Requisições de inferência pedagógica [REST JSON]| GeminiAPI
    GamificaEdu -->|Busca de vídeos didáticos para embasamento [REST JSON]| YouTubeAPI
    GamificaEdu -->|Validação de identidade e emissão de tokens [OAuth 2.0]| GoogleAuth
    GamificaEdu -->|Pool de conexões e queries SQL relacionais [TCP/SSL]| NeonCloud
    Cloudflare -->|Roteamento seguro e proxy reverso de borda| GamificaEdu
```

---

## 2. Nível 2: Diagrama de Contêineres

O Diagrama de Contêineres detalha as unidades de software executáveis, os protocolos de comunicação e os armazenamentos de dados que compõem a solução técnica.

```mermaid
graph TB
    subgraph Cliente ["Camada de Apresentação (Browser)"]
        SPA["💻 <b>Single Page Application (SPA)</b><br><i>React 19 + Vite + TailwindCSS</i><br>Interface reativa, Tabuleiro Canvas, Roleta nativa, Zustand store e hooks customizados"]
    end

    subgraph NuvemEdge ["Camada de Borda e CDN"]
        VercelCDN["⚡ <b>Vercel Edge Network</b><br>Hospedagem de assets estáticos, HTML, JS, CSS e cache global distribuído"]
        CFTunnel["🛡️ <b>Cloudflare Edge / Tunnel</b><br>Terminação TLS 1.3, roteamento estável e proteção contra ataques de negação de serviço"]
    end

    subgraph ServidorBackend ["Camada de Aplicação (Render Web Service)"]
        Gunicorn["🚀 <b>Gunicorn WSGI / Gevent Worker</b><br>Gerenciador de processos Python de alta concorrência"]
        FlaskCore["⚙️ <b>Backend Core Flask</b><br><i>Python 3.12 + Hexagonal Architecture</i><br>Blueprints REST, regras de negócio, decodificação JWT e serialização de dados"]
        SocketServer["⚡ <b>Flask-SocketIO Engine</b><br>Gerenciador de conexões WebSocket persistentes para Chat e eventos instantâneos"]
        EngineMDC["📐 <b>Motor de Recomendação (MDC/MUI)</b><br>Cálculo determinístico de sinergias pedagógicas (SWEBOK, Bloom, Hexad)"]
        AIService["🧠 <b>Pipeline de IA Multi-Modelo</b><br>Orquestrador com fallback de cotas (Gemini 2.5 Flash Lite -> 2.5 Flash -> Heurístico)"]
    end

    subgraph Persistencia ["Camada de Persistência e Dados"]
        PostgresDB["🐘 <b>Neon Serverless PostgreSQL (sa-east-1)</b><br>32 tabelas relacionais normalizadas, campos JSONB e índices de telemetria"]
        LocalFileStorage["📁 <b>Local/Cloud Object Storage</b><br>Imagens de avatares, fundos de tabuleiro e certificados PDF exportáveis"]
    end

    %% Relacionamentos do Frontend
    SPA -->|Download de bundles estáticos [HTTPS]| VercelCDN
    SPA -->|Chamadas de API REST autenticadas [JSON / HTTPS]| CFTunnel
    SPA -->|Comunicação bidirecional contínua [WebSocket / WSS]| CFTunnel

    CFTunnel -->|Encaminhamento de tráfego seguro| Gunicorn
    Gunicorn --> FlaskCore
    Gunicorn --> SocketServer

    %% Componentes Internos do Backend
    FlaskCore --> EngineMDC
    FlaskCore --> AIService
    FlaskCore -->|Consultas e transações ACID via SQLAlchemy| PostgresDB
    SocketServer -->|Salas isoladas por turma e atividade| PostgresDB
    FlaskCore -->|Leitura e escrita de mídias| LocalFileStorage
```

---

## 3. Relação de Tecnologias e Protocolos

| Contêiner | Tecnologia Principal | Papel Arquitetural | Protocolos Utilizados |
|---|---|---|---|
| **Frontend SPA** | React 19, Vite, TailwindCSS, Zustand | Renderização reativa de tabuleiros, roleta, wizards de criação e dashboards | HTTPS, WSS, Web Storage |
| **CDN & Edge** | Vercel Edge + Cloudflare | Distribuição de assets de baixa latência e proxy reverso blindado | HTTP/2, HTTP/3, TLS 1.3 |
| **Backend Web Service** | Flask 3, Python 3.12, Gunicorn, Gevent | Execução da lógica de negócio, portas e adaptadores hexagonais | WSGI, TCP/IP, JSON |
| **Realtime Engine** | Flask-SocketIO, python-socketio | Gerenciamento de eventos síncronos de chat e notificações da turma | WebSocket (RFC 6455) |
| **Banco de Dados Relacional** | Neon PostgreSQL Serverless | Persistência transacional com suporte a JSONB e réplicas de leitura | PostgreSQL Wire (TCP 5432) |
| **Serviço de IA** | Google GenAI SDK | Assistente pedagógico para geração de quizzes e roteiros contextuais | HTTPS REST (Google Cloud) |

---

## 4. Referências Cruzadas
- **ADR-001:** Padrão Application Factory no Flask (`docs/architecture/adrs/ADR-001-application-factory.md`)
- **ADR-022:** Stack de Produção Cloud (`docs/architecture/adrs/ADR-022-render-neon-cloud-stack.md`)
- **Nível 3 do C4:** Arquitetura Hexagonal do Backend (`docs/architecture/c4_component_hexagonal_backend.md`)
- **Modelo de Dados:** Dicionário e ERD (`docs/architecture/data_model_erd.md`)
