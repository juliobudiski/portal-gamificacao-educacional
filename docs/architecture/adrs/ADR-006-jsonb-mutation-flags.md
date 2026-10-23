# ADR-006: Garantia de Atualização de Campos Complexos JSONB (flag_modified)

- **Status:** Aceito
- **Data:** 2025-09-18
- **Categoria:** Backend e Persistência
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

O campo `completed_steps` na tabela `ActivityProgress` armazena uma lista de IDs de passos finalizados em formato JSON/JSONB. Durante os testes de execução do tabuleiro, observou-se que adições de novos passos à lista (`progress.completed_steps.append(step_id)`) eram ignoradas pelo SQLAlchemy no momento do `db.session.commit()`, pois o ORM monitora instâncias de objetos e não detecta mutações in-place dentro de coleções Python em colunas JSONB.

---

## 2. Decisão

Tornar mandatória a invocação de `sqlalchemy.orm.attributes.flag_modified(progress, "completed_steps")` sempre que a lista de passos for alterada no backend antes do commit.

---

## 3. Consequências

- **Positiva:** Garantia absoluta de persistência dos passos completados sem perdas de progresso do aluno.
- **Positiva:** Solução limpa e canônica suportada pelo SQLAlchemy para campos JSON/JSONB.
- **Negativa/Trade-off:** Requer disciplina dos desenvolvedores para nunca omitir a chamada de `flag_modified` em endpoints de progresso.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
