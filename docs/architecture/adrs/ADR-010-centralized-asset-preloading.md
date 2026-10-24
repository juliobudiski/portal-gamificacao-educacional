# ADR-010: Centralização do Pré-Carregamento de Assets (useAssetLoader)

- **Status:** Aceito
- **Data:** 2025-10-05
- **Categoria:** Frontend e UX
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

No primeiro acesso ao tabuleiro, as imagens de fundo do mapa, ícones de nós, avatares e efeitos sonoros demoravam a carregar, causando o desagradável fenômeno visual de 'pop-in' de elementos gráficos e quebra de layout durante a interação inicial do estudante.

---

## 2. Decisão

Implementar um hook customizado centralizado `useAssetLoader` na raiz de `ActivityPage.jsx`. O hook varre a lista de assets necessários para a atividade e dispara chamadas assíncronas de pré-carregamento com `Promise.all()`, exibindo um indicador visual de carregamento imersivo (spinner gamificado com dicas pedagógicas) até que 100% dos recursos estejam no cache do browser.

---

## 3. Consequências

- **Positiva:** Experiência de jogo impecável e fluida, sem saltos visuais ou atrasos em efeitos sonoros.
- **Positiva:** Navegação instantânea entre passos do tabuleiro após o carregamento inicial.
- **Positiva:** Tratamento gracioso de falhas de rede com retentativas transparentes.
- **Negativa/Trade-off:** Introdução de um tempo de espera inicial de 500ms a 1500ms no primeiro carregamento da atividade.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
