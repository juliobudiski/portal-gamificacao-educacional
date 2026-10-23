# ADR-008: Abandono de Modais Tradicionais em Favor de Cena Imersiva (ActivityViewOverlay)

- **Status:** Aceito
- **Data:** 2025-09-28
- **Categoria:** Frontend e UX
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

Acessar recursos da atividade (Loja, Placar, Chat, Fórum) navegava o aluno para fora do tabuleiro ou abria modais rígidos que cobriam 100% da viewport, quebrando o senso de presença e imersão espacial dentro do jogo.

---

## 2. Decisão

Substituir telas isoladas pelo padrão 'Overlay Modal' via componente `ActivityViewOverlay`. O tabuleiro permanece renderizado ao fundo com desfoque gaussiano suave (`backdrop-blur-md`) e redução de brilho, mantendo o jogador 'ancorado em contexto' enquanto interage com a loja ou o fórum em uma lâmina translúcida central.

---

## 3. Consequências

- **Positiva:** Preservação contínua da imersão espacial e do senso de progressão no mapa.
- **Positiva:** Transições fluidas com CSS e Tailwind sem re-montagem custosa do tabuleiro.
- **Positiva:** Feedback imediato quando uma recompensa é adquirida na loja ou um quiz é respondido.
- **Negativa/Trade-off:** Exige cuidado com z-index e gerenciamento de foco para acessibilidade (WCAG).

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
