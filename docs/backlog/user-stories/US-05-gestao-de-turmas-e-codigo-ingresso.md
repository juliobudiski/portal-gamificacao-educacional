---
id: US-05
title: "Gestão de Turmas Acadêmicas e Ingresso via Código Único"
epic: "[[EPIC-03-gestao-de-turmas-e-agendamento]]"
type: user-story
status: implemented
priority: high
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[IManageClassUseCase]]", "[[IEnrollmentPort]]"]
classes: ["[[Class]]", "[[Enrollment]]", "[[Team]]"]
tables: ["[[class]]", "[[enrollment]]", "[[team]]"]
tests: ["[[test_api_contracts_bdd.py]]"]
---

# US-05: Gestão de Turmas Acadêmicas e Ingresso via Código Único

- **Épico Vinculado:** [[EPIC-03-gestao-de-turmas-e-agendamento]]
- **Prioridade (MoSCoW):** `HIGH`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Professor e Estudante,  
**Quero** criar turmas gerando código alfanumérico único para que meus alunos se matriculem autonomamente,  
**Para que** eu organize turmas sem necessidade de cadastros manuais massivos de e-mails.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Criação de turma e matrícula de estudante
  Dado que o docente cria a turma "Engenharia de Software 2026/1"
  E o sistema gera o código único "ENG2026"
  Quando um aluno submete POST "/api/classes/join" com o código "ENG2026"
  Então a resposta deve retornar 200 OK
  E um registro em "enrollment" deve ser criado vinculando o aluno à turma
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Matrícula de um mesmo aluno em múltiplas turmas
  Dado que o aluno já pertence à turma "ENG2026"
  Quando ele ingressa na turma "TESTE2026" via outro código válido
  Então ele passa a ter acesso a ambas as turmas e suas respectivas atividades no dashboard
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de ingresso com código de turma inexistente
  Dado que o aluno digita o código incorreto "CODIGO_FALSO"
  Quando o backend pesquisa o código
  Então a resposta deve retornar status 404 Not Found com a mensagem "Turma não encontrada" 
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Tentativa de matrícula duplicada na mesma turma (Race Condition)
  Dado que um discente clica repetidamente no botão "Ingressar" disparando 3 requisições simultâneas
  Quando a primeira requisição cria o registro em "enrollment"
  Então as requisições subsequentes devem ser capturadas pela restrição UNIQUE(user_id, class_id)
  E retornar 409 Conflict de forma idempotente sem duplicar o vínculo
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[IManageClassUseCase]]", "[[IEnrollmentPort]]"
- **Classes de Domínio e Entidades:** "[[Class]]", "[[Enrollment]]", "[[Team]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[class]]", "[[enrollment]]", "[[team]]"
- **Suíte de Testes Automatizados:** "[[test_api_contracts_bdd.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
