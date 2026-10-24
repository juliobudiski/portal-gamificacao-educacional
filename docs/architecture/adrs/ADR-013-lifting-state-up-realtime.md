# ADR-013: Adoção de Lifting State Up para Atualizações de UI em Tempo Real

- **Status:** Aceito
- **Data:** 2025-10-18
- **Categoria:** Frontend e UX
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

Quando o estudante acertava uma pergunta ou girava a roleta, o saldo exibido no cabeçalho e na loja ficava desatualizado até que o usuário recarregasse manualmente a página (`F5`), causando frustração e suporte técnico.

---

## 2. Decisão

Adotar o padrão 'Lifting State Up'. O estado compartilhado de moedas (`points_earned`), XP total (`total_xp_earned`), nível atual e progresso do tabuleiro foi elevado para o componente raiz `ActivityPage.jsx`. Esse estado é alimentado por callbacks passados aos componentes filhos (roleta, quiz, loja), atualizando a UI no exato milissegundo em que a resposta da API retorna com sucesso.

---

## 3. Consequências

- **Positiva:** Atualização visual instantânea e reativa sem qualquer recarregamento de página.
- **Positiva:** Uma única fonte da verdade (Single Source of Truth) para os dados financeiros e acadêmicos do aluno na sessão.
- **Positiva:** Experiência do usuário (UX) com sensação nativa de jogo moderno.
- **Negativa/Trade-off:** Prop drilling de alguns handlers até que o Zustand store global seja acoplado em refatorações maiores.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
