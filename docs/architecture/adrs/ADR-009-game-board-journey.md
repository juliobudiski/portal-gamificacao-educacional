# ADR-009: Substituição da Interface de Lista por Tabuleiro de Jogo Visual

- **Status:** Aceito
- **Data:** 2025-10-02
- **Categoria:** Frontend e UX
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

A interface de atividades do aluno era originalmente uma lista vertical estática de cards textuais. Essa abordagem tradicional de LMS (Learning Management System) resultava em baixa motivação intrínseca e não transmitia a metáfora de uma jornada gamificada de aprendizagem.

---

## 2. Decisão

Substituir completamente a lista de cards por um componente visual de Tabuleiro de Jogo interativo (`BoardCanvas` / `BoardStepNode`). O tabuleiro organiza os passos pedagógicos como nós sobre uma trilha gráfica com estados visuais claros: nó bloqueado (cadeado), nó liberado (brilhante), nó concluído (medalha/check dourado) e nó atual em destaque pulsante.

---

## 3. Consequências

- **Positiva:** Aumento drástico do engajamento estudantil e clareza imediata sobre a próxima meta pedagógica.
- **Positiva:** Reforço da Teoria do Flow de Csikszentmihalyi ao visualizar a trilha de desafios passo a passo.
- **Positiva:** Compatibilidade com ramificações de nós opcionais e obrigatórios.
- **Negativa/Trade-off:** Necessidade de lidar com responsividade em telas mobile via scroll horizontal ou layout adaptável em zigue-zague.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
