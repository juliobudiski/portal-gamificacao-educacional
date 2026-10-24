# ADR-005: Arquitetura Backend-Driven para Efeitos e Itens Personalizados

- **Status:** Aceito
- **Data:** 2025-09-12
- **Categoria:** Gamificação e Regras de Negócio
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

A loja de recompensas introduziu itens cosméticos complexos, como molduras de avatar, títulos personalizáveis e efeitos temporários (ex: 'Topo por um Dia', que borra nomes concorrentes no placar por 24 horas). Delegar a validação e controle de expiração desses efeitos ao frontend gerava vulnerabilidades de integridade e inconsistências de fuso horário.

---

## 2. Decisão

Adotar uma arquitetura estritamente Backend-Driven para itens e efeitos. A API de Ranking e de Perfil no backend é a única autoridade responsável por verificar itens comprados na tabela `Purchase`, checar se o efeito expirou (`expires_at < now()`) e injetar a lista de estilos/efeitos ativos na resposta JSON. Para títulos personalizados, o texto customizado é validado e gravado no backend.

---

## 3. Consequências

- **Positiva:** Segurança total contra manipulação client-side e replay de privilégios cosméticos.
- **Positiva:** Frontend atua como camada puramente visual, consumindo flags e renderizando classes CSS dinâmicas.
- **Positiva:** Adição de novos cosméticos sem necessidade de alterar as regras de autorização.
- **Negativa/Trade-off:** Sobrecarga nas queries de ranking, mitigada por índices em `Purchase (user_id, item_id, expires_at)`.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
