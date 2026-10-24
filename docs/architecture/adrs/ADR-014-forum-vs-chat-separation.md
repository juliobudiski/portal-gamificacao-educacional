# ADR-014: Separação dos Componentes de Fórum e Chat (Assíncrono vs Síncrono)

- **Status:** Aceito
- **Data:** 2025-10-22
- **Categoria:** Comunicação e Redes
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

O brainstorm inicial propôs uma interface unificada onde dúvidas e mensagens instantâneas coexistiam no mesmo painel. Essa mistura gerou sobreposição caótica: dúvidas acadêmicas relevantes eram soterradas por cumprimentos rápidos e bate-papo informal em tempo real.

---

## 2. Decisão

Separar formalmente os subsistemas de comunicação em dois canais com objetivos e tecnologias distintas: 1) Fórum de Dúvidas (`ForumTab.jsx`): ferramenta assíncrona baseada em REST, organizada em categorias predefinidas com tópicos moderados para preservação perene de conhecimento; 2) Chat da Turma (`ChatTab.jsx`): canal síncrono em tempo real operando via WebSockets (Socket.IO) em salas isoladas por atividade para engajamento e trabalho colaborativo.

---

## 3. Consequências

- **Positiva:** Clareza cognitiva para o aluno: dúvidas profundas vão para o Fórum; comunicação rápida vai para o Chat.
- **Positiva:** Preservação da base de conhecimento da turma no Fórum para consultas futuras.
- **Positiva:** Isolamento arquitetural entre a persistência relacional do fórum e o streaming de eventos do WebSocket.
- **Negativa/Trade-off:** Necessidade de manter duas tabelas e rotas distintas de persistência (`ForumTopic/Post` e `ChatMessage`).

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
