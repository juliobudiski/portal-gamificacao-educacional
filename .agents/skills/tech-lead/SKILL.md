---
name: tech-lead
description: >-
  Use this skill when defining technical strategy, driving architectural decision records (ADRs),
  establishing engineering standards/DoD, unblocking complex squad bottlenecks, and leading blameless incident post-mortems.
---

# Habilidades Essenciais do Tech Lead (Líder Técnico)

Este guia e conjunto de habilidades reúne os procedimentos, padrões de governança técnica e práticas de liderança para alinhar engenharia aos objetivos estratégicos do produto.

---

## 1. Alinhamento Estratégico e Tomada de Decisão Arquitetural

1. **Documentação de Decisões Arquiteturais (ADRs):**
   - Registrar decisões críticas utilizando o formato de **ADR (Architecture Decision Record)**:
     - **Título:** [Número - Decisão curta]
     - **Status:** [Proposto | Aprovado | Substituído]
     - **Contexto:** Qual problema enfrentamos e quais restrições existem?
     - **Decisão:** O que escolhemos adotar e por quê?
     - **Consequências:** Quais os trade-offs positivos e negativos assumidos?

2. **Equilíbrio entre Entrega e Sustentabilidade:**
   - Negociar frações de capacidade em cada ciclo de desenvolvimento (ex.: propor a regra prática de 70% features / 20% saúde técnica e dívida técnica / 10% inovação/experimentação).
   - Traduzir jargões técnicos para a linguagem de negócio (ex.: "refatorar queries" $\rightarrow$ "reduzir custo de nuvem em 30% e evitar timeouts para 10.000 alunos simultâneos").

---

## 2. Governança e Definição de Padrões de Engenharia

1. **Definition of Ready (DoR) e Definition of Done (DoD):**
   - **DoR Exigente:** Contrato de API congelado, cenários em BDD/Gherkin (caminho feliz, alternativo, exceção e Chaos Monkey), e isolamento de dependências externas antes de codificar.
   - **DoD Rigoroso:** Testes unitários/integração escritos via TDD e 100% verdes, conformidade com SOLID/OOP (baixo acoplamento, alta coesão), build limpo no frontend e backend, e resiliência transacional comprovada.

2. **Cultura TDD & BDD Estruturada:**
   - Exigir que a squad escreva cenários Gherkin e crie a suíte de testes (Red Phase) antes de implementar regras de negócio concretas.
   - Prever testes destrutivos com Chaos Monkey (concorrência massiva, timeouts em SMTP/redes externas, transições de fuso horário).

3. **Engenharia de Release e Integração Contínua (CI/CD):**
   - Garantir feedback loops rápidos: pipelines de build/test com tempo de execução curto (< 5-10 min).
   - Promover estratégias de deploy com baixo risco: isolamento em branch de feature/staging, Feature Flags / Toggles, e proteção estrita contra deploys não aprovados em produção.

---

## 3. Resolução de Gargalos Técnicos e Desbloqueio da Squad

1. **Atuação como Desbloqueador (Unblocker):**
   - Identificar impedimentos de infraestrutura, dependências externas com outros times ou problemas obscuros de concorrência/infraestrutura antes que atrasem a entrega do sprint.
   - Atuar em pareamento pontual (*pair programming*) com desenvolvedores travados em problemas de alta complexidade.

2. **Gestão de Incidentes Críticos e Post-Mortem Sem Culpa (Blameless Post-Mortem):**
   - Durante incidentes em produção: manter a calma, coordenar comunicação clara e focar primeiramente em restaurar o serviço (*mitigação rápida*), investigando a causa raiz em seguida.
   - Após a resolução: conduzir análise retrospectiva sem buscar culpados pessoais, documentando:
     - Linha do tempo do incidente.
     - Causa raiz estrutural (processual ou técnica).
     - Ações preventivas (*Action Items*) com donos e prazos definidos para evitar recorrência.

---

## 4. Elevação da Maturidade e Clima Técnico da Equipe

1. **Cultura de Mentoria e Feedback:**
   - Estimular a autonomia dos desenvolvedores juniores e plenos, desafiando-os gradualmente com tarefas de maior escopo.
   - Fomentar discussões técnicas abertas onde a melhor ideia prevaleça, independentemente do nível de senioridade de quem propôs.
