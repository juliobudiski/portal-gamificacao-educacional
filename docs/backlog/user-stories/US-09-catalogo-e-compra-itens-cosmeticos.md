---
id: US-09
title: "Catálogo da Loja de Recompensas e Aquisição de Cosméticos"
epic: "[[EPIC-06-economia-loja-e-roleta]]"
type: user-story
status: implemented
priority: medium
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[IPurchaseStoreItemUseCase]]", "[[IGamificationRepositoryPort]]"]
classes: ["[[StoreItem]]", "[[Purchase]]", "[[User]]"]
tables: ["[[store_item]]", "[[purchase]]", "[[user]]"]
tests: ["[[test_api_contracts_bdd.py]]", "[[test_domain_rules.py]]"]
---

# US-09: Catálogo da Loja de Recompensas e Aquisição de Cosméticos

- **Épico Vinculado:** [[EPIC-06-economia-loja-e-roleta]]
- **Prioridade (MoSCoW):** `MEDIUM`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Estudante,  
**Quero** consultar a loja de cosméticos e adquirir molduras, cores de nome e títulos honoríficos com minhas moedas,  
**Para que** eu personalize meu avatar e expresse minha identidade no ambiente gamificado.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Compra bem-sucedida de moldura cosmética
  Dado que o estudante possui 200 moedas e a moldura "Ouro Arcana" custa 150 moedas
  Quando ele requisita POST "/api/store/purchase" com item_id correspondente
  Então a API retorna status 201 Created
  E o saldo do usuário passa a ser 50 moedas
  E um registro em "purchase" é criado com is_equipped=false
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Compra de item de efeito temporário (Topo por um Dia - 24h)
  Dado que o estudante compra o efeito especial "Topo por um Dia"
  Quando o backend processa a compra
  Então o registro em "purchase" é salvo com "expires_at = now() + 24 hours"
  E a API do ranking borra nomes concorrentes para aquele usuário até que a data expire (ADR-005)
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de compra com saldo de moedas insuficiente
  Dado que o estudante possui apenas 30 moedas e tenta comprar um item de 100 moedas
  Quando a requisição de compra é processada
  Então o backend rejeita a transação com status 400 Bad Request
  E a mensagem de erro informa "Saldo de moedas insuficiente" sem deduzir fundos
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Tentativa de compra em lote simultânea do mesmo item raro
  Dado que o estudante dispara duas requisições idênticas no mesmo milissegundo com saldo suficiente para apenas uma
  Quando o banco executa as transações com isolamento serializável ou row locking
  Então a primeira requisição consome o saldo e efetua a compra
  E a segunda requisição é abortada por saldo insuficiente, prevenindo duplicidade de débitos e saldo negativo
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[IPurchaseStoreItemUseCase]]", "[[IGamificationRepositoryPort]]"
- **Classes de Domínio e Entidades:** "[[StoreItem]]", "[[Purchase]]", "[[User]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[store_item]]", "[[purchase]]", "[[user]]"
- **Suíte de Testes Automatizados:** "[[test_api_contracts_bdd.py]]", "[[test_domain_rules.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
