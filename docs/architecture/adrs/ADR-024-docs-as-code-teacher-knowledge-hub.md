# ADR-024: Arquitetura Docs-as-Code e Índice Invertido Client-Side para a Central de Conhecimento Docente

- **Status:** Aceito
- **Data:** 2026-11-25
- **Categoria:** Frontend, UX e Gestão do Conhecimento
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Requisitos Vinculados:** `RF-16`, `RNF-01`, `RNF-03`, `RNF-07`, `RNF-11`, `US-26`

---

## 1. Contexto e Forças

Os docentes usuários do Portal GamificaEdu lidam com conceitos avançados de engenharia pedagógica — incluindo o Wizard de criação em múltiplas etapas, a taxonomia Hexad de jogadores, o Motor de Recomendação Contextual (MDC/MUI) com vetos contra o *Dark Side* da gamificação, a orquestração assistida por IA generativa (Google Gemini) e a economia dupla (XP Vitalício vs. Moedas).

Anteriormente, o suporte ao professor estava fragmentado entre um widget flutuante compacto (`HelpFloatingWidget.jsx` com 8 perguntas curtas) e modais pontuais presos às etapas individuais do Wizard (`HelpModal.jsx`). Faltava uma **Central de Documentação e FAQ contínua, pesquisável e didática**, inspirada em portais de referência como o *Overleaf Learn*.

Foram avaliadas duas alternativas arquiteturais para persistência e busca dessa base de conhecimento:
1. **Opção A — CMS Relacional Backend-Driven:** Criar tabelas `doc_categories`, `doc_articles` e `doc_faqs` no PostgreSQL (Neon), endpoints CRUD de administração e busca `ILIKE` / Full-Text Search via rede.
2. **Opção B — Docs-as-Code Estruturado Versionado + Índice Invertido OO Local + Telemetria `EventLog`:** Manter o catálogo documental fortemente estruturado e versionado junto ao código-fonte (`frontend/src/domain/teacherDocs/`), processado por um motor de busca orientado a objetos em memória (`TeacherDocsSearchEngine`), isolado via *code-splitting* (`React.lazy`) e acoplado ao pipeline assíncrono existente `POST /api/log/event` (`ADR-015`) para registrar buscas, leituras e votos de utilidade (`👍/👎`).

---

## 2. Decisão

Adotamos a **Opção B (Docs-as-Code Estruturado + Índice Invertido Client-Side + Telemetria via `EventLog`)**, organizada sob os 4 pilares do framework **Diátaxis** (*Tutorials, How-To Guides, Explanation, Reference & FAQ*) e restrita por RBAC (`allowedRoles={['professor', 'admin']}`).

Principais pilares técnicos da decisão:
1. **Sincronia Semântica com Releases (*Zero Documentation Drift*):** Como a documentação descreve regras determinísticas do software (etapas do Wizard, vetos do MDC, limites de IA), versioná-la no mesmo commit/PR da feature garante paridade atômica entre comportamento e manual.
2. **Busca Instantânea Determinística (`< 5ms`) Livre de ReDoS:** A classe `TeacherDocsSearchEngine` normaliza acentuação (`NFD`), tokeniza consultas sem `RegExp` dinâmico vulnerável e pondera títulos, tags, perguntas de FAQ e seções.
3. **Proteção de Rascunhos em Edição:** Os modais contextuais do Wizard (`HelpModal.jsx`) recebem *deep-links* mapeados (`WIZARD_HELP_TO_DOCS_MAP`) que abrem o capítulo correspondente em nova aba quando o docente está editando uma atividade, evitando perda de estado local.
4. **Minimização de Dados LGPD na Telemetria:** Consultas pesquisadas passam por um sanitizador determinístico (`sanitizeSearchQueryForTelemetry`) que mascara potenciais e-mails ou identificadores numéricos antes do envio ao `EventLog`.

---

## 3. Consequências

- **Positiva:** Zero migrações de banco de dados, zero latência de rede na navegação/pesquisa entre guias e funcionamento contínuo mesmo sob conexões instáveis em escolas/universidades.
- **Positiva:** Nenhum impacto no tamanho do bundle inicial de visitantes ou estudantes graças ao carregamento tardio (`React.lazy`) exclusivo da rota `/professor/documentacao`.
- **Positiva:** Coleta empírica imediata de quais tópicos geram mais dúvidas (*zero-hit searches* e avaliações de utilidade) diretamente na tabela `EventLog` já homologada.
- **Negativa/Trade-off:** Atualizações textuais nos artigos exigem commit e deploy padrão do frontend na Vercel (mitigado pelo pipeline CI/CD automatizado de deploy contínuo em minutos).

---

## 4. Conformidade e Rastreabilidade

- **Requisitos e Backlog:** [[docs/requirements/SRS.md]], [[docs/backlog/user-stories/US-26-central-documentacao-e-faq-professor.md]]
- **Matriz RTM:** [[docs/requirements/RTM.md]]
- **Documentação Técnica Relacionada:** [[docs/architecture/adrs/ADR-015-centralized-analytics-telemetry.md]], [[docs/frontend/teacher_authoring.md]]
