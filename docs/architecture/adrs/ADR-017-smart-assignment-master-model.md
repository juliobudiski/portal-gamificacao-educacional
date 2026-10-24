# ADR-017: Lógica de Atribuição Inteligente de Atividades (Modelo Mestre)

- **Status:** Aceito
- **Data:** 2025-11-04
- **Categoria:** Gamificação e Regras de Negócio
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

Quando o docente atribuía uma atividade criada para uma turma, o sistema original duplicava cegamente todos os registros no banco de dados. Isso poluía a biblioteca do professor com dezenas de clones idênticos e dificultava a aplicação de correções no enunciado original.

---

## 2. Decisão

Implementar a lógica de 'Modelo Mestre'. Toda atividade criada sem turma funciona como modelo mestre. Ao ser atribuída pela primeira vez a uma turma, o vínculo é direto (`class_id` preenchido). Caso o professor decida atribuir a mesma atividade a uma segunda turma, aí sim uma cópia independente é gerada, mantendo o histórico de notas e respostas de cada turma perfeitamente estanque.

---

## 3. Consequências

- **Positiva:** Biblioteca do professor limpa e organizada, sem atividades duplicadas desnecessárias.
- **Positiva:** Economia de espaço e consistência no banco de dados.
- **Positiva:** Isolamento garantido de dados de avaliações entre turmas distintas.
- **Negativa/Trade-off:** Requer regras adicionais de verificação no backend antes de permitir a edição de uma atividade já iniciada por alunos.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
