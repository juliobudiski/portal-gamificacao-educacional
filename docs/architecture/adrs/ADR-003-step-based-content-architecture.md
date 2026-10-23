# ADR-003: Arquitetura de Conteúdo por Passo (stepId)

- **Status:** Aceito
- **Data:** 2025-08-28
- **Categoria:** Backend e Persistência
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

O sistema concebido inicialmente assumia uma relação 1:1 entre uma Atividade e seu conteúdo (por exemplo, uma atividade contendo apenas um quiz). Essa restrição tornou-se incompatível com o design do 'Tabuleiro de Jogo' interativo, onde cada atividade é uma jornada composta por múltiplos passos sequenciais ou ramificados (quiz, vídeo instrucional, narrativa imersiva, recompensa).

---

## 2. Decisão

Refatorar o modelo de dados e as rotas de API para suportar uma chave composta lógica baseada em (`activity_id`, `step_id`). Foram criadas/readequadas as entidades `QuizContent`, `NarrativeContent` e `LearningContent`, identificadas pelo par composto. As rotas de leitura e submissão foram padronizadas como `/api/activities/<activity_id>/steps/<step_id>/content` e submissão de respostas com validação por etapa.

---

## 3. Consequências

- **Positiva:** Suporte nativo a tabuleiros com nós heterogêneos (um nó pode ser vídeo, outro quiz, outro história).
- **Positiva:** Modularidade completa: nós podem ser reordenados, adicionados ou removidos sem afetar conteúdos adjacentes.
- **Positiva:** Viabiliza geração e edição cirúrgica de passos individuais pelo assistente de IA.
- **Negativa/Trade-off:** Aumento da complexidade relacional e necessidade de cascata transacional na exclusão da atividade pai.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
