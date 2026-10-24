# ADR-019: Vinculação do Ganho de Moedas ao Desempenho Acadêmico em Quizzes

- **Status:** Aceito
- **Data:** 2025-11-20
- **Categoria:** Gamificação e Regras de Negócio
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

Com a criação de minijogos (Roleta da Sorte) e da Loja de Cosméticos, era fundamental estabelecer como as moedas virtuais seriam injetadas na economia do jogo para evitar inflação artificial ou desconexão com o objetivo educacional da plataforma.

---

## 2. Decisão

Vincular o ganho de moedas (`points_earned`) diretamente ao desempenho acadêmico comprovado. A cada resposta correta em um quiz curricular, o aluno recebe um montante proporcional de moedas (ex: +10 a +25 moedas por acerto, com bônus de primeira tentativa). Tentativas de respostas aleatórias ou incorretas não concedem moedas, impedindo o acúmulo por força bruta.

---

## 3. Consequências

- **Positiva:** Conexão intrínseca entre esforço intelectual/aprendizagem e poder de compra no ambiente virtual.
- **Positiva:** Incentivo ao estudo sério: o sucesso na loja e na roleta depende da assimilação dos conteúdos das aulas.
- **Positiva:** Economia equilibrada e controlada pelo volume curricular da turma.
- **Negativa/Trade-off:** Alunos com maiores dificuldades de aprendizagem podem acumular moedas mais lentamente, demandando rotas de recuperação pedagógica.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
