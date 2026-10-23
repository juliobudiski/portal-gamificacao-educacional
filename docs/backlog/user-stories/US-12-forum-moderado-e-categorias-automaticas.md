---
id: US-12
title: "Fórum de Dúvidas Estruturado e Categorias Automáticas (ADR-014)"
epic: "[[EPIC-05-comunicacao-forum-e-chat]]"
type: user-story
status: implemented
priority: medium
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[IManageForumDiscussionUseCase]]", "[[IForumRepositoryPort]]"]
classes: ["[[ForumCategory]]", "[[ForumTopic]]", "[[ForumPost]]"]
tables: ["[[forum_category]]", "[[forum_topic]]", "[[forum_post]]", "[[topic_like]]"]
tests: ["[[test_api_contracts_bdd.py]]"]
---

# US-12: Fórum de Dúvidas Estruturado e Categorias Automáticas (ADR-014)

- **Épico Vinculado:** [[EPIC-05-comunicacao-forum-e-chat]]
- **Prioridade (MoSCoW):** `MEDIUM`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Professor e Estudante,  
**Quero** um fórum assíncrono com categorias pré-configuradas e tópicos organizados por atividade,  
**Para que** eu possa tirar dúvidas conceituais profundas e construir uma base perene de conhecimento na turma.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Primeiro acesso à atividade criando categorias automáticas (ADR-010 V2)
  Dado que uma atividade recém-criada nunca teve seu fórum acessado
  Quando o primeiro usuário abre a aba "Fórum de Dúvidas"
  Então o sistema cria automaticamente as categorias padrão "Dúvidas Gerais" e "Sugestões de Aprendizagem"
  E renderiza a lista de discussões vazia e pronta para uso
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Marcação de melhor resposta pelo professor
  Dado que um tópico contém 3 respostas de estudantes
  Quando o professor da atividade clica em "Marcar como Melhor Resposta" na postagem do aluno
  Então o campo best_answer_id do tópico é atualizado
  E o autor da resposta recebe bônus de XP e pontuação de reputação na comunidade
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de postagem sem conteúdo ou em categoria inexistente
  Dado que o usuário envia uma requisição de postagem com corpo de texto vazio
  Quando o backend valida o modelo
  Então a requisição é rejeitada com 422 Unprocessable Entity exigindo corpo de mensagem válido
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Remoção em cascata da atividade pai (LGPD / Consistência)
  Dado que uma atividade possui 50 tópicos e 200 postagens no fórum
  Quando o professor proprietário executa a exclusão da atividade
  Então a deleção em cascata limpa tópicos, postagens e curtidas de forma transacional sem deixar dados órfãos
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[IManageForumDiscussionUseCase]]", "[[IForumRepositoryPort]]"
- **Classes de Domínio e Entidades:** "[[ForumCategory]]", "[[ForumTopic]]", "[[ForumPost]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[forum_category]]", "[[forum_topic]]", "[[forum_post]]", "[[topic_like]]"
- **Suíte de Testes Automatizados:** "[[test_api_contracts_bdd.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
