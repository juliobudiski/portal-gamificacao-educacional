---
id: US-02
title: "Gestão de Perfil e Coleta Demográfica de Pesquisa (DSR)"
epic: "[[EPIC-01-autenticacao-e-perfis]]"
type: user-story
status: implemented
priority: medium
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[IUpdateUserProfileUseCase]]", "[[IUserRepositoryPort]]"]
classes: ["[[User]]", "[[DemographicDataVO]]"]
tables: ["[[user]]", "[[event_log]]"]
tests: ["[[test_api_contracts_bdd.py]]"]
---

# US-02: Gestão de Perfil e Coleta Demográfica de Pesquisa (DSR)

- **Épico Vinculado:** [[EPIC-01-autenticacao-e-perfis]]
- **Prioridade (MoSCoW):** `MEDIUM`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Estudante e Pesquisador Acadêmico,  
**Quero** preencher meu questionário demográfico e de preferências de jogos no primeiro acesso,  
**Para que** o motor pedagógico calibre recomendações personalizadas e o pesquisador obtenha dados científicos válidos sob a LGPD.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Preenchimento completo do questionário inicial
  Dado que o aluno faz login pela primeira vez e visualiza o formulário de onboarding
  Quando ele preenche faixa etária, gênero, curso e responde ao teste rápido de perfil Hexad
  E submete uma requisição PUT para "/api/users/profile/demographics"
  Então o status retornado deve ser 200 OK
  E o campo "demographic_data" da tabela "user" deve ser atualizado com o JSON validado
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Atualização posterior de avatar e cosméticos equipados
  Dado que o estudante adquiriu uma moldura cosmética na loja
  Quando ele atualiza seu avatar e título ativo no perfil
  Então a resposta retorna o perfil atualizado e a mudança é refletida em tempo real no cabeçalho
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Envio de dados demográficos com tipos inválidos
  Dado que o payload submetido contém uma string em campo que exige valor numérico
  Quando a validação Pydantic é executada no backend
  Então a API deve retornar 422 Unprocessable Entity com a descrição exata do campo inconsistente
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Injeção de payload malicioso com scripts (XSS Injection)
  Dado que o usuário tenta injetar "<script>alert('xss')</script>" no campo de preferências
  Quando o sanitizador de texto `text_sanitizer.py` processa a entrada
  Então o script malicioso é higienizado e transformado em texto plano sem vulnerabilidades no frontend
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[IUpdateUserProfileUseCase]]", "[[IUserRepositoryPort]]"
- **Classes de Domínio e Entidades:** "[[User]]", "[[DemographicDataVO]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[user]]", "[[event_log]]"
- **Suíte de Testes Automatizados:** "[[test_api_contracts_bdd.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
