# ADR-007: Arquitetura da Funcionalidade de Exclusão em Massa de Atividades

- **Status:** Aceito
- **Data:** 2025-09-22
- **Categoria:** Backend e Persistência
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

Professores gerenciavam dezenas de atividades antigas ou de teste e precisavam excluí-las repetidamente uma a uma via UI. Disparar múltiplos requests individuais HTTP DELETE sobrecarregava a rede, gerava concorrência de banco e aumentava o risco de estados parciais em falhas de conexão.

---

## 2. Decisão

Projetar um endpoint full-stack unificado `DELETE /api/activities/bulk-delete`. O endpoint recebe um payload JSON `{"activity_ids": [...]}` e executa uma transação atômica que: 1) Valida se o usuário autenticado é o proprietário de todas as atividades listadas; 2) Remove em cascata vínculos, conteúdos e registros filhos; 3) Efetua o commit atômico ou rollback total em caso de exceção.

---

## 3. Consequências

- **Positiva:** Redução de N requisições de rede para 1 única requisição HTTP atômica.
- **Positiva:** Segurança reforçada contra IDOR (Insecure Direct Object Reference) ao verificar posse de cada item em lote.
- **Positiva:** Melhoria perceptível na responsividade do painel do professor.
- **Negativa/Trade-off:** Transações longas se o lote for excessivamente grande (limitado preventivamente a 50 itens por chamada).

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
