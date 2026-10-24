---
id: US-08
title: "Separação de Economia: XP Vitalício e Moedas Gastáveis (ADR-004)"
epic: "[[EPIC-04-execucao-gamificada-tabuleiro]]"
type: user-story
status: implemented
priority: high
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[IProcessStudentAnswerUseCase]]", "[[IGamificationRepositoryPort]]"]
classes: ["[[User]]", "[[StudentWallet]]", "[[GamificationRewardCalculator]]"]
tables: ["[[user]]", "[[activity_progress]]"]
tests: ["[[test_domain_rules.py]]"]
---

# US-08: Separação de Economia: XP Vitalício e Moedas Gastáveis (ADR-004)

- **Épico Vinculado:** [[EPIC-04-execucao-gamificada-tabuleiro]]
- **Prioridade (MoSCoW):** `HIGH`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Estudante e Professor,  
**Quero** que meus Pontos de Experiência (XP) vitalícios nunca diminuam ao comprar itens na loja,  
**Para que** meu desempenho acadêmico e posição no ranking sejam justos e desvinculados do meu consumo virtual.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Acerto de questão concedendo XP e Moedas simultaneamente
  Dado que o estudante possui total_xp_earned=500 e points_earned=100
  Quando ele acerta uma questão que concede 50 XP e 20 Moedas
  Então o backend atualiza o usuário em transação atômica
  E o saldo passa a ser total_xp_earned=550 e points_earned=120
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Compra na loja deduzindo apenas moedas
  Dado que o estudante possui total_xp_earned=550 e points_earned=120
  Quando ele compra um título cosmético que custa 80 moedas
  Então seu saldo de moedas passa a ser points_earned=40
  E seu total_xp_earned permanece rigorosamente em 550, preservando sua colocação no ranking
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de manipulação de saldo via payload adulterado
  Dado que um usuário envia uma requisição simulada tentando incrementar points_earned diretamente
  Quando a rota de validação de progresso é acionada
  Então o backend ignora parâmetros de valores fornecidos pelo cliente e calcula os ganhos exclusivamente server-side
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Verificação de consistência matemática em falha de transação
  Dado que o acerto do quiz deve creditar moedas e XP
  Quando ocorre uma desconexão com o banco logo após debitar moedas
  Então a transação sofre rollback total, garantindo que o saldo final permaneça consistente sem perdas ou duplicações
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[IProcessStudentAnswerUseCase]]", "[[IGamificationRepositoryPort]]"
- **Classes de Domínio e Entidades:** "[[User]]", "[[StudentWallet]]", "[[GamificationRewardCalculator]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[user]]", "[[activity_progress]]"
- **Suíte de Testes Automatizados:** "[[test_domain_rules.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
