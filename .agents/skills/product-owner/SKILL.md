---
name: product-owner
description: >-
  Use this skill when defining product vision, managing and prioritizing the product backlog,
  formulating user stories with business acceptance criteria, managing stakeholder expectations, and measuring outcome metrics.
---

# Habilidades Essenciais do Product Owner (PO)

Este guia e conjunto de habilidades reúne os métodos e práticas para governar a estratégia de produto, priorizar o backlog com foco em impacto e assegurar valor contínuo para o usuário final.

---

## 1. Visão de Produto, OKRs e Roadmaps Orientados a Resultados

1. **Definição da Visão de Produto (Product Vision):**
   - **Para:** [público-alvo / persona]
   - **Que:** [necessidade ou dor principal]
   - **O produto:** [nome do produto / módulo]
   - **É um:** [categoria do produto]
   - **Que:** [benefício-chave / proposta de valor única]
   - **Diferente de:** [alternativas do mercado ou soluções manuais atuais]
   - **Nosso produto:** [diferencial competitivo marcante]

2. **Roadmaps Baseados em Resultados (Outcome-based vs. Feature-based):**
   - Estruturar o roadmap em horizontes temporais (*Now, Next, Later*), com foco nas metas e problemas a resolver, e não em listas estáticas de funcionalidades.
   - Conectar cada iniciativa do roadmap diretamente a **OKRs (Objectives and Key Results)** mensuráveis (ex.: "Aumentar a retenção semanal de alunos em 20%").

---

## 2. Gestão e Refinamento do Backlog do Produto (Padrão DEEP)

- **D**etailed appropriately: Itens próximos do topo possuem alto nível de detalhe; itens futuros permanecem em alto nível (épicos).
- **E**stimated: Todos os itens no topo possuem estimativa de tamanho/complexidade validada pelo time técnico.
- **E**mergent: O backlog é um artefato vivo, que se adapta dinamicamente com base em dados de uso e feedbacks.
- **P**rioritized: Os itens mais urgentes e de maior valor estão sempre no topo.

### Frameworks de Priorização Recomendados:
1. **WSJF (Weighted Shortest Job First):**
   $$\text{WSJF} = \frac{\text{Custo do Atraso (Cost of Delay)}}{\text{Tamanho / Duração do Trabalho}}$$
   - $\text{Cost of Delay} = \text{Valor de Negócio/Usuário} + \text{Urgência Temporal} + \text{Redução de Risco / Oportunidade habilitada}$.
2. **Matriz de Valor vs. Esforço (Quick Wins vs. Big Bets):**
   - Priorizar *Quick Wins* (Alto Valor, Baixo Esforço).
   - Planejar cuidadosamente *Big Bets* (Alto Valor, Alto Esforço).
   - Descartar ou postergar itens de Baixo Valor.

---

## 3. Elaboração de Histórias de Usuário, BDD e Critérios de Aceitação

1. **Critérios de Aceitação em 4 Dimensões (Gherkin BDD):**
   - **Caminho Feliz (Happy Path):** Sucesso padrão com entrega do valor pretendido.
   - **Fluxos Alternativos:** Decisões do usuário que desviam do fluxo principal sem gerar falha.
   - **Fluxos de Exceção:** Respostas claras e elegantes para erros previstos (falha de rede, timeout, payload incorreto).
   - **Comportamentos Destrutivos e Chaos Monkey:** Resiliência contra payload massivo, desconexão súbita de serviços externos e concorrência elevada.

2. **Definição de Preparado (Definition of Ready - DoR):**
   - [ ] Declaração de valor clara e persona definida (`Como... Quero... Para...`).
   - [ ] Cenários BDD estruturados nas 4 dimensões (Caminho Feliz, Alternativo, Exceção, Caos).
   - [ ] Dependências e integrações externas mapeadas (com estratégias de fallback).
   - [ ] Requisitos Não-Funcionais (RNFs) de Usabilidade e Desempenho definidos e mensuráveis.
   - [ ] Estimativa e viabilidade acordadas com o time de engenharia.

3. **Definição de Feito (Definition of Done - DoD):**
   - [ ] Código implementado com TDD (100% de testes unitários e de integração passando).
   - [ ] Pelo menos 5 RNFs de Usabilidade validados (feedback visual imediato, acessibilidade WCAG, contraste, mensagens de erro humanizadas, responsividade).
   - [ ] Pelo menos 5 RNFs de Desempenho validados (latência de API p95 < 250ms, queries indexadas, chunking em disparos em massa, payload enxuto, zero memory leak).
   - [ ] Testes de caos executados com sucesso (serviço não entra em crash quando dependência externa cai).
   - [ ] Alterações isoladas em feature branch, sem deploy não-autorizado em produção.


---

## 4. Gestão de Stakeholders e Experimentação Rápida

1. **A Arte de Dizer "Não":**
   - Proteger a capacidade da equipe recusando solicitações que não se alinhem aos OKRs vigentes ou que apresentem ROI incerto.
   - Justificar negativas com dados de engajamento, capacidade técnica e custo de oportunidade.

2. **Ciclo de Hipótese e MVP (Lean Product):**
   - Construir a menor versão possível de uma ideia (*Minimum Viable Product*) para validar premissas de adoção com usuários reais antes de escalar o desenvolvimento.
   - Definir métricas de sucesso (*validation criteria*) antes de colocar qualquer experimento no ar.
