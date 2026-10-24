---
id: US-07
title: "Execução da Trilha no Tabuleiro de Jogo e Conteúdo por Passo"
epic: "[[EPIC-04-execucao-gamificada-tabuleiro]]"
type: user-story
status: implemented
priority: high
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[IProcessStudentAnswerUseCase]]", "[[IActivityRepositoryPort]]"]
classes: ["[[ActivityProgress]]", "[[BoardStep]]", "[[QuizContent]]"]
tables: ["[[activity_progress]]", "[[quiz_content]]", "[[student_response]]"]
tests: ["[[test_domain_rules.py]]", "[[test_recommendation_and_activity_lifecycle.py]]"]
---

# US-07: Execução da Trilha no Tabuleiro de Jogo e Conteúdo por Passo

- **Épico Vinculado:** [[EPIC-04-execucao-gamificada-tabuleiro]]
- **Prioridade (MoSCoW):** `HIGH`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Estudante,  
**Quero** avançar por uma trilha visual no tabuleiro respondendo quizzes e assistindo vídeos passo a passo,  
**Para que** eu vivencie uma jornada interativa com feedback imediato e senso claro de conquista.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Conclusão de um nó de quiz com resposta correta
  Dado que o aluno acessa o nó "step_1" do tabuleiro
  Quando ele seleciona a opção correta e submete a resposta
  Então o sistema retorna status 200 OK com is_correct=true
  E adiciona "step_1" à lista completed_steps em "activity_progress"
  E invoca flag_modified garantindo a persistência relacional do JSONB (ADR-006)
  E o nó seguinte "step_2" é desbloqueado no tabuleiro
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Conclusão flexível com nós opcionais (ADR-018)
  Dado que a atividade possui 4 nós obrigatórios e 2 nós opcionais bônus
  Quando o aluno finaliza todos os 4 nós obrigatórios
  Então a atividade é marcada como is_completed=true permitindo a emissão de certificado mesmo sem os nós bônus
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de acessar nó bloqueado sem completar o pré-requisito
  Dado que o nó "step_3" exige a conclusão prévia de "step_2"
  Quando o aluno tenta requisitar o conteúdo de "step_3" diretamente pela API
  Então o backend deve retornar 403 Forbidden indicando que o passo está bloqueado
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Submissões concorrentes para o mesmo passo do tabuleiro
  Dado que o aluno clica no botão "Confirmar Resposta" 5 vezes em menos de 1 segundo
  Quando as requisições chegam ao backend
  Então a primeira submissão processa a resposta e grava o resultado
  E as requisições subsequentes detectam que o passo já foi respondido, retornando 200 sem duplicar XP ou Moedas
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[IProcessStudentAnswerUseCase]]", "[[IActivityRepositoryPort]]"
- **Classes de Domínio e Entidades:** "[[ActivityProgress]]", "[[BoardStep]]", "[[QuizContent]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[activity_progress]]", "[[quiz_content]]", "[[student_response]]"
- **Suíte de Testes Automatizados:** "[[test_domain_rules.py]]", "[[test_recommendation_and_activity_lifecycle.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
