# ADR-023: Definição de Escopo MVP: Foco em Cosméticos e Simplificação de Regras

- **Status:** Aceito
- **Data:** 2026-01-27
- **Categoria:** Gamificação e Regras de Negócio
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

Na fase de consolidação para o lançamento da versão Beta (MVP) do portal, identificou-se que implementar simultaneamente itens utilitários que alteram regras do quiz ('Congelar Tempo', 'Segunda Chance', 'Eliminar Alternativa') e cronjobs de controle de streaks (sequências diárias consecutivas com compensação de fusos horários) agregaria alto risco de falhas críticas de concorrência e atrasaria a validação científica em sala de aula.

---

## 2. Decisão

Realizar um corte disciplinado de escopo para o lançamento da versão MVP (v1.0): 1) Loja: foco exclusivo em itens cosméticos (molduras de avatar, cores de nome no ranking, títulos honoríficos e auras); 2) Itens utilitários e sistema de streaks postergados formalmente para a versão 1.1; 3) Roleta da Sorte: o prêmio de 'Giro Extra' opera como reset imediato da data da sessão (`last_spin_date = None`) sem necessidade de persistência de itens complexos de inventário.

---

## 3. Consequências

- **Positiva:** Lançamento do MVP com estabilidade de produção e zero bugs em transações da loja.
- **Positiva:** Foco concentrado no core loop pedagógico do aluno: Aprender -> Testar -> Ganhar XP/Moedas -> Personalizar Perfil.
- **Positiva:** Redução substancial da superfície de ataque e da complexidade de suporte aos professores.
- **Negativa/Trade-off:** Itens utilitários de power-ups não disponíveis no primeiro semestre de testes.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
