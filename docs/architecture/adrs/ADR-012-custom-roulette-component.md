# ADR-012: Construção de Componentes de Jogo Nativos (Roleta em Canvas/CSS)

- **Status:** Aceito
- **Data:** 2025-10-14
- **Categoria:** Frontend e UX
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

A squad tentou integrar bibliotecas npm existentes para a Roleta da Sorte (`react-roulette-wheel` e similares), mas todas apresentaram severos conflitos de dependências com o ambiente React 19 e bundler Vite (erros de ESM/CJS, quebra de referências de DOM e styled-components obsoletos).

---

## 2. Decisão

Construir um componente customizado nativo de Roleta (`DailyRoulette.jsx`) utilizando exclusivamente HTML5 Canvas e CSS Transforms nativas de aceleração por hardware (`requestAnimationFrame`, transform rotate com bezier cúbico). Toda a determinação do prêmio permanece server-side, com a rotação física convergindo para o ângulo retornado pela API.

---

## 3. Consequências

- **Positiva:** Zero dependências externas conflitantes, garantindo total compatibilidade com React 19 e Vite.
- **Positiva:** Controle visual irrestrito sobre cores, tipografia, efeitos de partículas e temas dos setores da roleta.
- **Positiva:** Segurança anti-trapaça: o setor premiado é calculado no backend antes da animação iniciar.
- **Negativa/Trade-off:** Responsabilidade da squad em manter os cálculos trigonométricos de desenho dos arcos no Canvas.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
