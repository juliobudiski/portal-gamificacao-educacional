# Repositório de Custódia e Arquivo Histórico de Pesquisa

Este diretório preserva integralmente os 14 artefatos binários e documentos de pesquisa originais do projeto de Doutorado em Ciência da Computação vinculado ao **Portal GamificaEdu**, garantindo integridade forense, rastreabilidade acadêmica e preservação de patrimônio científico segundo as diretrizes de *Design Science Research* (DSR).

---

## 1. Manifesto de Custódia Criptográfica (SHA-256)

Todos os arquivos listados abaixo estão armazenados de forma imutável em `docs/archive/repositorio_doutorado/`. Os hashes foram gerados via algoritmo SHA-256 e conferidos bit a bit contra os originais de `docs/RepositorioDoutoradoPortal/`.

| # | Nome do Arquivo Original | Tamanho | Formato | Hash Criptográfico SHA-256 |
|---|---|---|---|---|
| 1 | `Brainstorming de Itens para a Loja de Recompensas.docx` | 8.623 bytes | MS Word 2007+ | `5b5e86d5285f9b1c0e947f1ee27daf7e1bb8872cffab9c171e6397822d082289` |
| 2 | `Compilado RPP 02.docx` | 483.716 bytes | MS Word 2007+ | `62c219e7905f751851889c18513d4c182bf6cd2a79e4937b144853b62095dcc3` |
| 3 | `Compilado RPP 03.docx` | 279.088 bytes | MS Word 2007+ | `562cbbd4eadeb4251c6219608a40d3ad0a1c1f21ca9fa48e910490610e936ef7` |
| 4 | `Compilado de Relatorios de Progresso do Projeto 01.docx` | 286.817 bytes | MS Word 2007+ | `9d3043fa8999aca425091cc2f8493556a180611300f516c7b0d46592312ba1f3` |
| 5 | `Documento de Design do Ambiente Gamificado.docx` | 226.918 bytes | MS Word 2007+ | `6c20a8fdf543958d5002a4bf65a4e78747a137ef258594e748fedf9204070943` |
| 6 | `Documento de Requisitos do Portal de Gamificação Educacional.docx` | 20.577 bytes | MS Word 2007+ | `857336737c242a8031fd78b77013fb5a524d4f225ddd2cd7fabec9ecfdc941dc` |
| 7 | `FunilReducaoPortal.png` | 59.443 bytes | Imagem PNG | `8179fd60a114bdb652005effd166c9849857b9143a7a7d4e749827601738f365` |
| 8 | `Registro de Decisoes do Projeto (RDP01).docx` | 228.333 bytes | MS Word 2007+ | `e534a14183939eee47fa97670b24941a3577f5ba2aca12438f7d5f828704e892` |
| 9 | `Relatório de Especificação Funcional.docx` | 229.953 bytes | MS Word 2007+ | `68c222f3b1bc5866cb84102401c881bc5a3c1c9ccc2f99eabc056787207b68b8` |
| 10 | `Sistema de Medalhas e Conquistas.docx` | 7.740.951 bytes | MS Word 2007+ | `f6850adcb5cd2be4dba4c7c0ded1e805863bdda8f8eada1192f150d6478ae636` |
| 11 | `diagramaMatematicaPortal.png` | 112.328 bytes | Imagem PNG | `0e2bf9b2f1fba9529caea0c00f39b98047271852d750d24e2207ae3a8cd1f4a9` |
| 12 | `diagramaPortal.pdf` | 134.530 bytes | PDF Vetorial | `4af110bdec8d7df4b29753947b4386514b1cdee22403f0d1f327e58cd25bd942` |
| 13 | `diagramaProfessorPortal.png` | 37.904 bytes | Imagem PNG | `5d1345e0dd7d017e087ffbe4ba12c5a218b31540c223177483ccb026d34673a2` |
| 14 | `diagrama_classes.pdf` | 41.084 bytes | PDF Vetorial | `7e785192b0fb4177e3556a4ffe8f9f1a0d930ade346a1a65aa7acc09909001c2` |

---

## 2. Mapeamento Bidirecional para a Documentação Viva (`docs/`)

Cada arquivo preservado foi integralmente transcrito, sintetizado e expandido para os documentos vivos em Markdown e diagramas Mermaid navegáveis:

| Arquivo Original Preservado | Finalidade Acadêmica / Técnica | Mapeamento no Acervo Vivo (`docs/`) |
|---|---|---|
| `Registro de Decisoes do Projeto (RDP01).docx` | 23 Decisões de Arquitetura tomadas ao longo da evolução da plataforma | `docs/architecture/adrs/ADR-001` a `ADR-023`<br>`docs/architecture/README.md` |
| `diagrama_classes.pdf` | Esquema relacional de 32 tabelas, chaves e atributos do domínio | `docs/architecture/data_model_erd.md`<br>`docs/architecture/c4_component_hexagonal_backend.md` |
| `Relatório de Especificação Funcional.docx` | Especificação funcional do Motor de Recomendação Contextual (MDC/MUI/SAD) | `docs/architecture/contextual_recommendation_engine.md`<br>`docs/academic/mathematical_model_mui.md` |
| `diagramaPortal.pdf` | Fluxo de processamento em 4 raias (MAC, MUI, Normalização, Auditoria) | `docs/architecture/contextual_recommendation_engine.md` |
| `diagramaMatematicaPortal.png` | Tubo de processamento matemático (Sinergia $S_b$, Risco $P_c$, Veto) | `docs/architecture/contextual_recommendation_engine.md`<br>`docs/academic/mathematical_model_mui.md` |
| `diagramaProfessorPortal.png` | Jornada do Professor (Diagnóstico, XAI, Instanciação e Caderno do Mestre) | `docs/architecture/contextual_recommendation_engine.md`<br>`docs/backlog/user-stories/US-04-motor-recomendacao-contextual-mrc.md` |
| `FunilReducaoPortal.png` | Funil MDA: 104 elementos $\rightarrow$ 28 recomendações $\rightarrow$ 12 módulos de software | `docs/gamification/pedagogical_heuristics_mda.md`<br>`docs/academic/phd_context_and_methodology.md` |
| `Documento de Requisitos do Portal de Gamificação Educacional.docx` | RF001 a RF014, RNFs (WCAG, LGPD, Performance) e expansão V2 de Turmas | `docs/backlog/user-stories/`<br>`docs/backlog/epics/`<br>`docs/backlog/README.md` |
| `Documento de Design do Ambiente Gamificado.docx` | 6 grupos de elementos de gamificação, SDT e mecânicas de tabuleiro | `docs/gamification/pedagogical_heuristics_mda.md`<br>`docs/gamification/game_board_mechanics.md` |
| `Sistema de Medalhas e Conquistas.docx` | 20 medalhas em 4 categorias pedagógicas, ilustrações e metas | `docs/gamification/badges_catalog.md`<br>`docs/backlog/user-stories/US-10-sistema-medalhas-e-conquistas.md` |
| `Brainstorming de Itens para a Loja de Recompensas.docx` | Economia de moedas, cosméticos, utilitários, efeitos de título e roleta | `docs/gamification/reward_store_economy.md`<br>`docs/gamification/points_xp_levels.md` |
| `Compilado de Relatorios de Progresso do Projeto 01.docx` | RPPs 01 a 31: Fundação do backend, orquestração de terminais e rotas REST | `docs/academic/rpp_compilations_synthesis.md` |
| `Compilado RPP 02.docx` | RPPs 32 a 62: Refatoração do Wizard (2.000 linhas), Tabuleiro e Roleta | `docs/academic/rpp_compilations_synthesis.md`<br>`docs/architecture/adrs/ADR-011-container-presentational-wizard.md` |
| `Compilado RPP 03.docx` | RPPs 63 a 80+: Pipeline de IA Gemini, YouTube Grounding e modais | `docs/academic/rpp_compilations_synthesis.md`<br>`docs/architecture/ai_draft_generation_pipeline.md` |

---

## 3. Instruções de Verificação de Integridade

Para revalidar os hashes criptográficos no terminal a qualquer momento:

```bash
# Navegar até a raiz do repositório
cd /home/julio/Documentos/projetos/portal-gamificacao-educacional

# Verificar hashes dos arquivos preservados
sha256sum docs/archive/repositorio_doutorado/*
```
