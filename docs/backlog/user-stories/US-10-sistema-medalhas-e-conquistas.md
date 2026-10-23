---
id: US-10
title: "Sistema de Conquistas e Desbloqueio do Catálogo de 20 Medalhas"
epic: "[[EPIC-06-economia-loja-e-roleta]]"
type: user-story
status: implemented
priority: medium
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[IUnlockMedalUseCase]]", "[[IGamificationRepositoryPort]]"]
classes: ["[[Medal]]", "[[UserUnlockedMedal]]"]
tables: ["[[medal]]", "[[user_unlocked_medal]]", "[[user]]"]
tests: ["[[test_domain_rules.py]]"]
---

# US-10: Sistema de Conquistas e Desbloqueio do Catálogo de 20 Medalhas

- **Épico Vinculado:** [[EPIC-06-economia-loja-e-roleta]]
- **Prioridade (MoSCoW):** `MEDIUM`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Estudante e Professor,  
**Quero** um catálogo oficial de 20 medalhas categorizadas com regras automáticas de concessão,  
**Para que** meus esforços de excelência, colaboração e persistência sejam formalmente reconhecidos.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Concessão da medalha "Inspetor" por 100% de acertos na primeira tentativa
  Dado que o estudante conclui todos os quizzes da atividade com nota máxima na primeira tentativa
  Quando o motor de medalhas avalia os critérios de concessão
  Então a medalha com código "INSPECTOR" é associada ao estudante na tabela "user_unlocked_medal"
  E um bônus de XP e Moedas previsto no catálogo é creditado à sua conta
  E uma notificação visual com a ilustração da medalha é apresentada no frontend
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Exibição da vitrine de medalhas no perfil público
  Dado que o aluno já conquistou 5 medalhas
  Quando outro usuário ou o professor visita seu perfil
  Então as medalhas desbloqueadas são renderizadas em destaque com data da conquista e categoria
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de desbloqueio duplicado de medalha já possuída (Idempotência)
  Dado que o estudante já possui a medalha "Pioneiro"
  Quando o evento disparador ocorre novamente
  Então o backend verifica a restrição UNIQUE(user_id, medal_id)
  E encerra o processamento sem criar duplicata nem conceder pontos em duplicidade
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Disparo simultâneo de múltiplos gatilhos de conquistas
  Dado que a conclusão de uma atividade dispara simultaneamente as regras das medalhas "Explorador" e "Velocista"
  Quando o worker avalia os critérios
  Então ambas as medalhas são concedidas em lote na mesma transação atômica com integridade referencial
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[IUnlockMedalUseCase]]", "[[IGamificationRepositoryPort]]"
- **Classes de Domínio e Entidades:** "[[Medal]]", "[[UserUnlockedMedal]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[medal]]", "[[user_unlocked_medal]]", "[[user]]"
- **Suíte de Testes Automatizados:** "[[test_domain_rules.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
