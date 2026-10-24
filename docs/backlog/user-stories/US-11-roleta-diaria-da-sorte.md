---
id: US-11
title: "Minijogo da Roleta Diária da Sorte e Regras de Giro Extra (ADR-012/023)"
epic: "[[EPIC-06-economia-loja-e-roleta]]"
type: user-story
status: implemented
priority: medium
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[ISpinRouletteUseCase]]", "[[IGamificationRepositoryPort]]"]
classes: ["[[DailyRoulette]]", "[[RouletteWin]]", "[[User]]"]
tables: ["[[user]]", "[[roulette_win]]"]
tests: ["[[test_api_contracts_bdd.py]]", "[[test_domain_rules.py]]"]
---

# US-11: Minijogo da Roleta Diária da Sorte e Regras de Giro Extra (ADR-012/023)

- **Épico Vinculado:** [[EPIC-06-economia-loja-e-roleta]]
- **Prioridade (MoSCoW):** `MEDIUM`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Estudante,  
**Quero** girar a roleta da sorte uma vez ao dia para ganhar prêmios de XP, moedas ou novo giro,  
**Para que** eu tenha motivação para acessar a plataforma diariamente sem vícios de apostas predatórias.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Giro diário gratuito com premiação em moedas
  Dado que o estudante não girou a roleta na data atual (last_spin_date != hoje)
  Quando ele aciona o botão de giro e envia POST "/api/roulette/spin"
  Então o backend seleciona o setor premiado server-side
  E atualiza last_spin_date para a data atual
  E credita o prêmio correspondente na conta do usuário
  E retorna o ângulo exato de rotação para o Canvas do frontend executar a animação suave
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Prêmio de "Giro Extra" concedido (ADR-004.4 / ADR-023)
  Dado que a roleta para no setor "Giro Extra"
  Quando o backend registra o prêmio
  Então ele reseta imediatamente last_spin_date para nulo ou data anterior
  E permite que o estudante faça um novo giro imediato sem persistir itens complexos de inventário
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de efetuar um segundo giro no mesmo dia
  Dado que o estudante já girou a roleta hoje e não obteve a premiação de giro extra
  Quando ele tenta disparar nova requisição de giro
  Então o backend rejeita o pedido com status 400 Bad Request
  E informa que o giro diário já foi consumido, exibindo o horário do próximo reset
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Tentativa de envio de parâmetros de prêmio pelo cliente (Tampering)
  Dado que o usuário manipula o JavaScript do browser tentando enviar `{"prize": "1000_coins"}`
  Quando a requisição atinge o backend
  Então o servidor descarta qualquer payload de prêmio do cliente
  E sorteia o setor de acordo com as probabilidades probabilísticas oficiais gravadas no código de domínio
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[ISpinRouletteUseCase]]", "[[IGamificationRepositoryPort]]"
- **Classes de Domínio e Entidades:** "[[DailyRoulette]]", "[[RouletteWin]]", "[[User]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[user]]", "[[roulette_win]]"
- **Suíte de Testes Automatizados:** "[[test_api_contracts_bdd.py]]", "[[test_domain_rules.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
