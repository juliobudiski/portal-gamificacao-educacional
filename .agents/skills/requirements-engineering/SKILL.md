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

2. **Critérios de Aceite em Gherkin / BDD:**
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

## 4. Matriz de Rastreabilidade e Análise de Impacto

1. **Mapeamento de Ponta a Ponta:**
   - Cada RF/RNF deve rastrear para:
     `Objetivo de Negócio` $\rightarrow$ `User Story` $\rightarrow$ `Critério de Aceite BDD` $\rightarrow$ `Caso de Teste Técnico`.
2. **Análise de Impacto em Mudanças de Escopo:**
   - Ao propor ou receber alteração de requisitos, avaliar custos em cascata: componentes afetados, risco de quebra, migrações de dados e esforço de re-teste.
