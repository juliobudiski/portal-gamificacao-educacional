# ADR-004: Separação de Pontuação de Ranking e Moeda da Loja (XP vs Coins)

- **Status:** Aceito
- **Data:** 2025-09-05
- **Categoria:** Gamificação e Regras de Negócio
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

No modelo inicial, existia uma única variável de pontos que acumulava vitórias e era deduzida nas compras da Loja de Recompensas. Isso gerou um conflito pedagógico destrutivo: os alunos hesitavam em explorar a loja, pois gastar moedas reduzia sua pontuação no ranking geral da turma, punindo os estudantes mais participativos.

---

## 2. Decisão

Dividir formalmente a economia em duas grandezas distintas: 1) `total_xp_earned`: Pontos de Experiência vitalícios acumulados que nunca diminuem, determinam o nível acadêmico do aluno e sua posição no ranking geral/turma; 2) `points_earned`: Moeda virtual corrente ('Pontos de Sabedoria'), obtida pelo acerto de avaliações e usada livremente como poder de compra na Loja de Recompensas.

---

## 3. Consequências

- **Positiva:** Resolução do conflito pedagógico: o aluno pode comprar itens cosméticos sem medo de perder sua colocação acadêmica.
- **Positiva:** Alinhamento com a Teoria da Autodeterminação (SDT): senso de competência preservado pelo XP e senso de autonomia estimulado pela economia da loja.
- **Positiva:** Economia transparente com validações server-side de saldo de moedas.
- **Negativa/Trade-off:** Exigência de sincronização atômica em eventos que concedem simultaneamente XP e Moedas (ex: acerto de quiz).

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
