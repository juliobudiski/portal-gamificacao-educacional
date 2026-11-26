---
id: US-26
title: "Central de Documentação Docente e FAQ Interativo Estilo Overleaf Learn"
epic: "[[EPIC-02-criacao-e-gestao-de-atividades]]"
type: user-story
status: implemented
priority: high
tags: [requisito, agile, bdd, docs-as-code, diataxis, ux-docente, lgpd]
ports: ["[[ITeacherKnowledgeSearchPort]]", "[[ILogTelemetryPort]]"]
classes: ["[[TeacherDocsSearchEngine]]", "[[TeacherDocsPage]]", "[[DocsSearchModal]]", "[[LogService]]"]
tables: ["[[event_log]]"]
tests: ["[[test_teacher_docs_engine.test.js]]", "[[test_teacher_docs_telemetry_bdd.py]]"]
---

# US-26: Central de Documentação Docente e FAQ Interativo Estilo Overleaf Learn

- **Épico Vinculado:** [[EPIC-02-criacao-e-gestao-de-atividades]]
- **Requisitos Associados:** `RF-16`, `RNF-01`, `RNF-09`, `RNF-11`
- **Decisão Arquitetural:** [[ADR-024-docs-as-code-teacher-knowledge-hub]]
- **Prioridade (MoSCoW):** `HIGH`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Professor ou Pesquisador Docente autenticado na plataforma GamificaEdu,  
**Quero** acessar uma Central de Documentação e FAQ estruturada no estilo *Overleaf Learn* (com árvore de tópicos Diátaxis, sumário âncora lateral, busca instantânea `Ctrl+K` e atalhos contextuais nos passos do Wizard),  
**Para que** eu aprenda de forma autônoma a criar trilhas gamificadas, interpretar vetos pedagógicos do Motor MDC/Hexad, orquestrar rascunhos na IA Gemini e gerenciar turmas sem sair do portal nem perder rascunhos em edição.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Navegação estruturada por guias Diátaxis, sumário âncora e FAQ docente
  Dado que o usuário está autenticado com perfil "professor" ou "admin"
  Quando ele acessa "/professor/documentacao" pelo menu Professor, Card do Dashboard ou HelpFloatingWidget
  Então a plataforma exibe o layout em 3 colunas (Árvore de Módulos, Leitor Rico de Artigo e Sumário "Nesta Página")
  E ao alternar para a visão de FAQ ou clicar em uma dúvida relacionada, exibe a resposta fundamentada nas regras do portal
  E ao votar em "Este guia ajudou? (Sim/Não)", registra o evento analítico na tabela event_log via POST "/api/log/event" com status 201
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Busca instantânea sem acentos via Command Palette (Ctrl+K) e Deep-Linking seguro a partir do Wizard
  Dado que o professor pressiona "Ctrl+K" ou clica em "Ler na Documentação Completa" dentro do HelpModal de um passo do Wizard
  Quando ele pesquisa termos sem acentuação como "roleta moeda" ou "veto dark side"
  Então o motor TeacherDocsSearchEngine retorna artigos e FAQs ranqueados por relevância em menos de 16ms destacando trechos correspondentes
  E quando acionado de dentro do Wizard ("/professor/criar-atividade"), abre o capítulo exato em nova aba preservando o estado do rascunho atual
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Bloqueio RBAC para alunos/visitantes e fallback resiliente para slugs inexistentes
  Dado que um estudante ("role=aluno") ou visitante não autenticado tenta acessar "/professor/documentacao" ou enviar telemetria sem token
  Quando o guard PrivateRoute ou o endpoint POST "/api/log/event" intercepta a requisição
  Então visitantes/alunos são redirecionados com segurança sem exposição das heurísticas exclusivas do professor (401 na API sem JWT)
  E caso um professor acesse um slug de artigo obsoleto ou inexistente, a página exibe estado amigável de recuperação com sugestão do guia inicial sem quebrar a árvore React
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Resistência a payloads maliciosos (XSS/ReDoS), sanitização de PII na busca e queda da API de telemetria
  Dado que o professor insere cadeias extremas com caracteres especiais RegEx, tags "<script>" ou dados sensíveis (e-mail/CPF) no campo de busca
  E o endpoint "/api/log/event" sofre indisponibilidade temporária
  Quando o TeacherDocsSearchEngine processa a consulta e o hook de telemetria tenta registrar a pesquisa
  Então a busca local executa em tempo linear sem falhas de ReDoS ou execução de scripts
  E qualquer padrão de e-mail ou CPF é mascarado ("[EMAIL_REDACTED]" / "[NUM_REDACTED]") antes do envio analítico (LGPD)
  E a falha de rede da telemetria é absorvida silenciosamente sem interromper a leitura do professor
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas / Contratos:** "[[ITeacherKnowledgeSearchPort]]", "[[ILogTelemetryPort]]"
- **Módulos de Domínio e Componentes:**
  - `frontend/src/domain/teacherDocs/teacherDocsCatalog.js`
  - `frontend/src/domain/teacherDocs/TeacherDocsSearchEngine.js`
  - `frontend/src/components/docs/DocsSearchModal.jsx`
  - `frontend/src/pages/TeacherDocsPage.jsx`
  - Integrações: `frontend/src/App.jsx`, `frontend/src/components/Header.jsx`, `frontend/src/pages/TeacherDashboardPage.jsx`, `frontend/src/components/common/HelpFloatingWidget.jsx`, `frontend/src/components/HelpModal.jsx`
- **Tabelas Relacionais (PostgreSQL / SQLite):** "[[event_log]]"
- **Suítes de Testes Automatizados:**
  - `frontend/src/domain/teacherDocs/test_teacher_docs_engine.test.js`
  - `backend/tests/test_teacher_docs_telemetry_bdd.py`

---

## 4. Referências Cruzadas
- **Especificação de Requisitos:** [[docs/requirements/SRS.md]] (`RF-16`, `RNF-11`)
- **Matriz de Rastreabilidade:** [[docs/requirements/RTM.md]]
- **Decisão de Arquitetura:** [[docs/architecture/adrs/ADR-024-docs-as-code-teacher-knowledge-hub.md]]
- **Documentação Frontend Docente:** [[docs/frontend/teacher_authoring.md]]
