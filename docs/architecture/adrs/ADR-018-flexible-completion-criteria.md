# ADR-018: Definição Flexível de Conclusão de Atividade (Nós Obrigatórios vs Opcionais)

- **Status:** Aceito
- **Data:** 2025-11-12
- **Categoria:** Gamificação e Regras de Negócio
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

A validação de conclusão do tabuleiro exigia originalmente que 100% dos nós fossem finalizados. Isso impedia o uso de caminhos pedagógicos ramificados, rotas alternativas para alunos avançados e missões bônus de exploração livre.

---

## 2. Decisão

Introduzir o atributo booleano `is_required` na configuração de cada passo (`step`). O algoritmo de cálculo de progresso considera a atividade pedagogicamente concluída (`is_completed = true`) assim que 100% dos nós obrigatórios forem executados com sucesso. Passos marcados como opcionais concedem moedas e XP adicionais, mas sua não realização não impede o avanço de fase nem a concessão do certificado da atividade.

---

## 3. Consequências

- **Positiva:** Equilíbrio ideal entre rigor pedagógico (currículo essencial) e autonomia do estudante (rotas alternativas).
- **Positiva:** Alinhamento pleno com os princípios da Teoria da Autodeterminação e Design de Jogos.
- **Positiva:** Suporte a alunos com diferentes ritmos de aprendizagem.
- **Negativa/Trade-off:** Frontend precisa sinalizar claramente na UI visual quais nós são mandatórios (estrela dourada) e quais são bônus.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
