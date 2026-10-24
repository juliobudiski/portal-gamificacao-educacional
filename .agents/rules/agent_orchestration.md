---
trigger: always_on
description: Regras de orquestração colaborativa entre subagentes para engenharia de software, POO, TDD e arquitetura hexagonal.
---

# Regras de Orquestração Colaborativa entre Subagentes (Squad de Engenharia & POO)

Estas regras regulam a interação autônoma e colaborativa entre os subagentes especializados durante a concepção, especificação, desenvolvimento, teste e documentação de software.

---

## 1. Princípios Operacionais Inegociáveis

1. **Restrição de Ambiente Local:**
   - Toda e qualquer alteração de código, migração ou criação de artefatos deve ser restrita ao ambiente local e a branches de desenvolvimento (`feature/*`).
   - É terminantemente vedado realizar pushes diretos para a branch `main` ou invocar scripts/webhooks de deploy em produção.

2. **Cultura Shift-Left e Segurança por Padrão (Security by Default):**
   - Nenhuma nova rota de escrita ou mutação de estado de entidades pode ser implementada sem validação de autorização server-side (Anti-IDOR) e sanitização estrita de entrada.
   - Segredos de aplicação, chaves de API, senhas e tokens nunca devem ser expostos em texto claro em tokens JWT, logs ou respostas de APIs de clientes.

3. **TDD Rigoroso (Test-Driven Development):**
   - Antes de qualquer código de produção ser alterado, o subagente `qa-sdet` ou `senior-development` deve criar ou atualizar a suíte de testes com cenários reprodutores na fase vermelha (Red Phase).

4. **Rito Mandatório de Documentação Viva e Backlog:**
   - **Regra de Ouro Inegociável:** Nenhuma nova funcionalidade (*feature*), correção de bug (*bugfix*), resolução de dívida técnica ou alteração estrutural em qualquer parte do sistema pode ser considerada concluída sem que a documentação correspondente seja criada ou sincronizada na pasta `docs/backlog/` (com critérios de aceite em BDD).
   - O subagente responsável (`technical-writing` ou desenvolvedor executor) deve obrigatoriamente atualizar a Matriz e o Grafo de Rastreabilidade (`docs/requirements-matrix/traceability_graph.md`) conectando:
     $$\text{Requisito} \longleftrightarrow \text{Porta / Caso de Uso} \longleftrightarrow \text{Classe de Domínio} \longleftrightarrow \text{Tabela ORM} \longleftrightarrow \text{Testes Automatizados}$$
   - A conformidade deve ser validada por script automatizado (`python3 scripts/audit_rtm.py`) assegurando índice de 100% de rastreabilidade direta sem código órfão.

---

## 2. Princípios de Arquitetura Orientada a Objetos e Hexagonal (Ports & Adapters)

Para garantir desacoplamento, testabilidade e expressividade no design orientado a objetos:

1. **Domínio Puro (Domain Core):**
   - Entidades e Objetos de Valor (*Value Objects*) encapsulam regras de negócio e mantêm invariantes válidas.
   - O domínio não deve ter dependências de frameworks web (Flask, FastAPI, Spring, Express) nem de bibliotecas de persistência/ORM.
2. **Portas (Ports / Interfaces Abstratas):**
   - **Inbound Ports (Driving):** Interfaces que declaram os Casos de Uso (*Use Cases*) ou Serviços da aplicação.
   - **Outbound Ports (Driven):** Interfaces que declaram as dependências externas que o domínio necessita (ex.: `UserRepositoryPort`, `NotificationServicePort`).
3. **Adaptadores (Adapters / Classes Concretas):**
   - **Inbound Adapters:** Controladores HTTP REST, CLI, Webhooks que traduzem dados externos e invocam Inbound Ports.
   - **Outbound Adapters:** Repositórios concretos (ex.: SQLAlchemy, bancos SQL), adaptadores de envio de e-mail, clientes HTTP terceiros.
4. **Inversão de Dependência (DIP):**
   - Módulos de alto nível (domínio e casos de uso) nunca dependem de adaptadores concretos. As dependências são sempre injetadas via construtor (*Dependency Injection*).

---

## 3. Protocolo de Investigação Técnica e Auditoria

Sempre que a tarefa envolver auditoria, diagnóstico de segurança, análise de concorrência ou investigação de anomalias:

1. **Ativação do Subagente `appsec-security`:**
   - Mapear a superfície de ataque utilizando o framework **STRIDE**.
   - Analisar fluxo de entrada e dados não confiáveis contra o **OWASP Top 10**.
   - Identificar ausência de validações server-side, replay de tokens e vazamento de dados sensíveis.

2. **Pareamento com `qa-sdet` para Prova de Conceito Hermética:**
   - Formular testes unitários e de integração locais comprovando o vetor de risco, sem afetar dados persistidos de produção.

3. **Pareamento com `tech-lead` para Plano de Mitigação:**
   - Estruturar as recomendações defensivas em três horizontes:
     - **Curto Prazo:** Hotfixes e validações de borda urgentes.
     - **Médio Prazo:** Refatorações de arquitetura e modelos de domínio.
     - **Longo Prazo:** Mudanças estruturais de infraestrutura ou hardware attestation.

---

## 4. Protocolo de Desenvolvimento e Handoff entre Subagentes

A colaboração entre subagentes segue um fluxo disciplinado com contratos explícitos de passagem de bastão (*handoff*):

1. **Handoff 1: Concepção & Valor de Negócio (`product-owner` $\rightarrow$ `requirements-engineering` & `technical-writing`):**
   - O `product-owner` define a proposta de valor, público-alvo e prioridade (MoSCoW / RICE).
   - O `requirements-engineering` detalha a User Story com critérios BDD em 4 dimensões (Caminho Feliz, Alternativo, Exceção e Caos).
   - O `technical-writing` formata a história em `docs/backlog/user-stories/` com YAML Frontmatter para o Obsidian e atualiza o Grafo de Rastreabilidade inicial.

2. **Handoff 2: Quality Gate DoR & Arquitetura (`requirements-engineering` $\rightarrow$ `tech-lead` & `appsec-security`):**
   - **Definition of Ready (DoR):** Requisitos claros, contratos de API / interfaces de Portas congeladas, sem violação de privacidade (LGPD).
   - O `tech-lead` registra Architecture Decision Records (ADRs) caso haja trade-offs de design e o `technical-writing` documenta os diagramas C4/Mermaid preliminares.

3. **Handoff 3: TDD Red Phase (`tech-lead` $\rightarrow$ `qa-sdet`):**
   - O `qa-sdet` cria a suíte de testes automatizados (`test_*.py`) correspondente aos cenários BDD antes da implementação do código de produção.
   - Execução do teste comprovando falha controlada (Red Phase).

4. **Handoff 4: TDD Green Phase (`qa-sdet` $\rightarrow$ `senior-development` / `mid-development`):**
   - Implementação focada em passar os testes, respeitando princípios SOLID, encapsulamento e arquitetura hexagonal (Ports & Adapters).
   - Testes passando 100% no ambiente local (Green Phase).

5. **Handoff 5: Revisão Rigorosa de Código (`senior-development` $\rightarrow$ `code-reviewer`):**
   - O `code-reviewer` audita o PR verificando adesão a POO/SOLID, ausência de *code smells* (God Class, Feature Envy, Primitive Obsession), complexidade ciclomática e clean code.
   - Apontamentos bloqueantes devem ser corrigidos pelos desenvolvedores antes do avanço.

6. **Handoff 6: Auditoria de Qualidade e RTM (`code-reviewer` $\rightarrow$ `quality-auditor`):**
   - O `quality-auditor` valida a integridade da suíte de testes, checa a completude da Matriz de Rastreabilidade (RTM - sem requisitos órfãos nem código fantasma) e certifica formalmente o atendimento a todos os itens do **Definition of Done (DoD)**.

7. **Handoff 7: Quality Gate DoD & Fechamento (`quality-auditor` $\rightarrow$ `tech-lead`):**
   - **Definition of Done (DoD) Certificado:**
     - [ ] 100% dos testes unitários e de integração verdes.
     - [ ] Zero regressões em testes pré-existentes.
     - [ ] Conformidade com Clean Architecture e SOLID certificada pelo `code-reviewer`.
     - [ ] Documentação de User Story atualizada em `docs/backlog/` e Grafo de Rastreabilidade sincronizado pelo `technical-writing`.
     - [ ] Laudo de qualidade emitido pelo `quality-auditor`.

