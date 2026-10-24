# Arquitetura de Software e Design Técnico

Bem-vindo à documentação arquitetural do **Portal GamificaEdu**. Este repositório consolida as especificações de alto e baixo nível, as 23 Decisões de Arquitetura (ADRs), os modelos de dados e a fundamentação dos algoritmos de apoio à decisão pedagógica.

---

## 1. Mapa de Navegação da Arquitetura

```
docs/architecture/
├── README.md                            # Este sumário geral
├── adrs/                                # Catálogo formal de 23 ADRs
│   ├── README.md                        # Índice mestre das 23 decisões
│   ├── ADR-001-application-factory.md  # ... até ADR-023
│   └── ...
├── c4_context_container_diagrams.md     # C4 Nível 1 (Contexto) e Nível 2 (Contêineres)
├── c4_component_hexagonal_backend.md    # C4 Nível 3 (Arquitetura Hexagonal: Portas & Adaptadores)
├── data_model_erd.md                    # Dicionário de Dados e Diagrama ERD (32 tabelas normalizadas)
├── contextual_recommendation_engine.md  # Motor de Recomendação Contextual (MDC/MUI/SAD)
├── ai_multi_model_fallback.md           # Cascata Multi-Modelo Gemini com tolerância a falhas
├── ai_draft_generation_pipeline.md      # Pipeline de orquestração de rascunhos de IA e WebSockets
└── squad_meetings_ai_pipeline_review.md # Atas técnicas das 10 reuniões de revisão da squad
```

---

## 2. Destaques Arquiteturais

### 2.1 Padrão Hexagonal (Ports & Adapters)
- **Domínio Puro (`backend/app/domain`):** Zero acoplamento com Flask ou ORMs externos.
- **Portas Inbound & Outbound (`backend/app/ports`):** Interfaces abstratas para Casos de Uso e Repositórios.
- **Adaptadores (`backend/app/adapters`):** Implementações concretas REST, Socket.IO, Neon PostgreSQL e Google Gemini AI.

### 2.2 As 23 Decisões de Arquitetura (ADRs)
Consulte o [Catálogo Completo de ADRs](adrs/README.md), abrangendo:
- Adoção de Application Factory (ADR-001) e Rastreamento granular `ActivityProgress` (ADR-002).
- Conteúdo por passo com chave composta `(activity_id, step_id)` (ADR-003).
- Separação estrita entre XP vitalício de ranking e moedas gastáveis da loja (ADR-004).
- Mecânica de Roleta nativa em Canvas/CSS sem dependências externas conflitantes (ADR-012).
- Resiliência multi-modelo Gemini com fallback de cotas (ADR-021).
- Stack de nuvem escalável com Vercel, Render e Neon PostgreSQL em São Paulo (ADR-022).

### 2.3 Motor de Recomendação Contextual (MDC/MUI)
O motor atua como um Sistema de Apoio à Decisão (SAD) pedagógica fundamentado em evidências do SWEBOK e Teoria da Autodeterminação:
- Dedução algébrica de Sinergia $S_b$, Risco $P_c$ e Moduladores contextuais $\mu$ e $\lambda$.
- Resolução de conflitos comportamentais e prevenção do *Dark Side* de Gamificação com **Gatilho de Veto Pedagógico**.
- Normalização relativa $[-50, +50]$ e clusterização visual no Wizard em 3 grupos (Recomendados, Neutros, Não Recomendados).

### 2.4 Modelo de Dados (32 Tabelas)
Estruturado em 5 domínios fundamentais no [Diagrama ERD](data_model_erd.md):
1. Usuários, Turmas e Matrículas (`user`, `class`, `enrollment`, `team`).
2. Atividades e Conteúdo por Passo (`activity`, `quiz_content`, `learning_content`, `narrative_content`, `activity_progress`, `student_response`).
3. Gamificação e Economia Virtual (`medal`, `user_unlocked_medal`, `store_item`, `purchase`, `roulette_win`).
4. Comunicação Social (`forum_category`, `forum_topic`, `forum_post`, `chat_message`).
5. Telemetria Científica (`event_log`, `contact_messages`).
