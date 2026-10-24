# ADR-002: Rastreamento Granular de Progresso por Atividade (ActivityProgress)

- **Status:** Aceito
- **Data:** 2025-08-20
- **Categoria:** Backend e Persistência
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

A arquitetura inicial persistia o progresso do aluno (XP acumulado, nível, pontos e percentual) diretamente na tabela `Enrollment` (matrícula na turma). Essa modelagem monolítica impedia que o professor e o aluno soubessem o desempenho detalhado em cada atividade isolada, inviabilizando múltiplas tentativas e auditoria pedagógica.

---

## 2. Decisão

Criar a entidade relacional `ActivityProgress`, desacoplada de `Enrollment`. Cada registro em `ActivityProgress` vincula unicamente `user_id` e `activity_id`, armazenando métricas específicas da atividade: `completed_steps` (JSONB com a trilha de nós concluídos), `score`, `points_earned`, `total_xp_earned`, `is_completed`, `attempts_count` e timestamps de início e conclusão.

---

## 3. Consequências

- **Positiva:** Permite auditoria granular do progresso do aluno por atividade pedagógica.
- **Positiva:** Possibilita cálculos de retenção, tempo por etapa e suporte a múltiplas tentativas.
- **Positiva:** Fornece a base de dados necessária para o motor de gamificação e geração de relatórios do docente.
- **Negativa/Trade-off:** Exige consultas adicionais com junções (JOIN) entre `Enrollment`, `Activity` e `ActivityProgress` nas telas de visão geral.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
