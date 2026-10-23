---
name: requirements-engineering
description: >-
  Use this skill when eliciting, analyzing, scoping, documenting, validating, or prioritizing functional requirements (FR),
  non-functional requirements (NFR), business rules, user stories with BDD acceptance criteria, and traceability matrices.
---

# Habilidades do Engenheiro de Requisitos / Analista de Negócios

Este guia e conjunto de habilidades define os procedimentos analíticos para transformar dores de usuários e objetivos de negócio em requisitos precisos, testáveis e viáveis para engenharia.

---

## 1. Técnicas de Elicitação e Descoberta de Necessidades

1. **Investigação de Problemas Reais:**
   - Aplicar a técnica dos **5 Porquês (5 Whys)** para encontrar a causa raiz em vez de aceitar sintomas ou soluções pré-concebidas pelos stakeholders.
   - Identificar personas, objetivos, fluxos de trabalho e pontos de atrito (pain points).
2. **Separação de Camadas de Requisitos:**
   - **Requisitos de Negócio:** Metas estratégicas e objetivos de alto nível (ex.: "Reduzir taxa de abandono escolar em 15%").
   - **Requisitos de Usuário:** O que o usuário final necessita executar em seu fluxo de trabalho.
   - **Requisitos de Sistema:** Especificações concretas divididas em Funcionais (RF) e Não Funcionais (RNF).

---

## 2. Especificação Estruturada e Critérios de Aceite

1. **User Stories com Padrão INVEST:**
   - **I**ndependent (Independentes)
   - **N**egotiable (Negociáveis)
   - **V**aluable (Agregam valor)
   - **E**stimable (Estimáveis)
   - **S**mall (Pequenas)
   - **T**estable (Testáveis)
   - Formato: *Como [persona], quero [ação/funcionalidade], para que [benefício de negócio].*

2. **Critérios de Aceite em Gherkin / BDD (Quádrupla Cobertura Obrigatória):**
   - Para cada User Story, é obrigatório mapear ao menos 4 dimensões de cenários:
     1. **Caminho Feliz (Happy Path):** O fluxo ideal executado com sucesso.
     2. **Fluxo Alternativo:** Variações válidas de regra de negócio (ex.: toggle, particionamento de lotes).
     3. **Fluxos de Exceção:** Erros de validação (400/422), tokens expirados ou falhas de autorização (401/403).
     4. **Teste Destrutivo (Chaos Monkey):** Concorrência massiva, race conditions, timeout de serviços terceiros (SMTP) ou clock skew.
   ```gherkin
   Cenário: [Nome do Cenário]
     Dado que [contexto inicial / pré-condição]
     E [condição adicional]
     Quando [ação do usuário ou evento do sistema]
     Então [resultado observável esperado]
     E [resultado secundário ou mudança de estado]
   ```

3. **Requisitos Não Funcionais (RNF) Mensuráveis:**
   - Desempenho (tempo de resposta sob carga: ex: p95 < 200ms para 500 req/s).
   - Segurança e Privacidade (autenticação JWT/OAuth2, conformidade LGPD/GDPR, criptografia TLS 1.3).
   - Disponibilidade e Confiabilidade (SLA 99.9%, failover tolerante a falhas).
   - Acessibilidade e Usabilidade (conformidade WCAG 2.1 nível AA).

---

## 3. Priorização e Gestão de Escopo

1. **Framework MoSCoW:**
   - **Must Have (Obrigatório):** Itens sem os quais o sistema não pode operar (violação legal, blocker de fluxo core).
   - **Should Have (Importante):** Itens de alto valor que devem ser incluídos se possível.
   - **Could Have (Desejável):** Melhorias que agregam valor mas não impedem a entrega.
   - **Won't Have (Fora de Escopo por enquanto):** Itens explicitamente descartados para o ciclo atual.

2. **RICE Scoring:**
   - $\text{Score} = \frac{\text{Reach} \times \text{Impact} \times \text{Confidence}}{\text{Effort}}$

---

## 4. Matriz de Rastreabilidade e Grafo de Conhecimento (Obsidian & Mermaid)

1. **Rastreabilidade Bidirecional Ponta a Ponta:**
   - Todo requisito deve rastrear vertical e horizontalmente:
     $$\text{Objetivo de Negócio} \longleftrightarrow \text{User Story (BDD)} \longleftrightarrow \text{Portas / Interfaces} \longleftrightarrow \text{Classes Concretas} \longleftrightarrow \text{Tabelas ORM} \longleftrightarrow \text{Testes (Pytest)}$$

2. **Formatação para Grafo de Requisitos no Obsidian:**
   - As histórias e requisitos devem ser gravados em `docs/backlog/user-stories/US-XX.md` utilizando **YAML Frontmatter** e links bidirecionais (`[[wikilinks]]`):
     ```yaml
     ---
     id: US-XX
     title: Nome da Funcionalidade
     epic: "[[EPIC-XX-nome-do-epico]]"
     type: user-story
     status: draft | ready | in_progress | implemented
     priority: high | medium | low
     tags: [requisito, modulo, regra]
     ports: ["[[IPortaDeEntrada]]"]
     classes: ["[[ServicoDeDominio]]"]
     tables: ["[[tb_entidade]]"]
     tests: ["[[test_funcionalidade_tdd.py]]"]
     ---
     ```
   - Ao abrir o cofre no **Obsidian**, a funcionalidade nativa de Grafo (*Graph View*) exibe uma teia interativa conectando requisitos a classes e testes.

3. **Grafo de Rastreabilidade Universal (Mermaid):**
   - Manter atualizado o arquivo `docs/requirements-matrix/traceability_graph.md` contendo o diagrama Mermaid (`graph TD` / `graph LR`) para que qualquer ferramenta (GitHub, VSCode, IDEs) renderize visualmente a cobertura de requisitos sem depender exclusivamente do Obsidian.

4. **Governança do Backlog Vivo:**
   - Nenhuma funcionalidade pode ser codificada sem que haja um arquivo de User Story correspondente em `docs/backlog/user-stories/` e sem que o grafo seja atualizado.
   - Histórias concluídas e homologadas são marcadas com status `implemented` ou movidas para `docs/backlog/archive/`.
