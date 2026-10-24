---
id: US-01
title: "Autenticação de Usuários e Recuperação Segura de Senha"
epic: "[[EPIC-01-autenticacao-e-perfis]]"
type: user-story
status: implemented
priority: high
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[IAuthenticateUserUseCase]]", "[[IUserRepositoryPort]]"]
classes: ["[[User]]", "[[AuthService]]", "[[JWTTokenManager]]"]
tables: ["[[user]]"]
tests: ["[[test_api_contracts_bdd.py]]", "[[test_domain_rules.py]]"]
---

# US-01: Autenticação de Usuários e Recuperação Segura de Senha

- **Épico Vinculado:** [[EPIC-01-autenticacao-e-perfis]]
- **Prioridade (MoSCoW):** `HIGH`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Professor ou Estudante,  
**Quero** efetuar login seguro na plataforma com e-mail/senha ou Google OAuth e poder recuperar minha senha,  
**Para que** eu possa acessar minhas turmas, atividades e inventário gamificado com integridade e privacidade.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Login bem-sucedido com credenciais válidas
  Dado que o usuário "julio.aluno@gamifica.edu" está previamente cadastrado e ativo
  Quando ele submete uma requisição POST para "/api/auth/login" com e-mail e senha corretos
  Então a resposta HTTP deve retornar status 200 OK
  E o corpo da resposta deve conter um token JWT assinado válido
  E o payload do usuário deve retornar id, role, total_xp_earned e points_earned
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Autenticação via Google Single Sign-On (OAuth 2.0)
  Dado que o discente clica no botão "Entrar com Google" no frontend
  Quando o provedor Google retorna um token ID com e-mail institucional verificado
  Então o backend deve identificar o usuário ou criar um novo registro com role="student"
  E emitir o JWT de sessão sem exigir senha manual
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de login com senha incorreta
  Dado que o usuário existe na base de dados
  Quando ele submete "/api/auth/login" com uma senha inválida
  Então a resposta HTTP deve ser 401 Unauthorized
  E a mensagem de erro deve ser genérica: "E-mail ou senha incorretos", sem expor vetores de enumeração de contas
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Tentativa de ataque de força bruta com 50 requisições simultâneas
  Dado que um agente malicioso dispara 50 requisições de login em menos de 5 segundos para o mesmo e-mail
  Quando o limitador de taxa (Rate Limiting) intercepta o fluxo
  Então as requisições excedentes devem ser rejeitadas com status 429 Too Many Requests
  E um registro de alerta de segurança deve ser gerado no log sem travar o worker WSGI
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[IAuthenticateUserUseCase]]", "[[IUserRepositoryPort]]"
- **Classes de Domínio e Entidades:** "[[User]]", "[[AuthService]]", "[[JWTTokenManager]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[user]]"
- **Suíte de Testes Automatizados:** "[[test_api_contracts_bdd.py]]", "[[test_domain_rules.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
