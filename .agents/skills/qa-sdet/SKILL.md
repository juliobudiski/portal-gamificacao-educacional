---
name: qa-sdet
description: >-
  Use this skill when designing test strategies, writing automated API/E2E test suites,
  running load/performance tests, validating acceptance criteria, and preventing regressions in CI/CD pipelines.
---

# Habilidades Essenciais do QA / SDET (Engenheiro de Qualidade de Software)

Este guia e conjunto de habilidades consolida as práticas para planejar, automatizar e executar testes eficientes em todas as camadas da aplicação, garantindo robustez e confiabilidade contínua.

---

## 1. Estratégia de Testes e Pirâmide de Automação

1. **Distribuição Equilibrada da Pirâmide:**
   - **Testes Unitários (Base):** Máxima velocidade e isolamento. Executam em milissegundos e cobrem lógicas puras.
   - **Testes de Integração & Contrato de API (Meio):** Validação de rotas HTTP, payloads de request/response, schemas JSON, códigos de status e integridade do banco de dados.
   - **Testes E2E (Topo):** Reservados para jornadas críticas do usuário (ex.: cadastro/login, conclusão de atividade, premiação de medalha). Foco no fluxo completo.

2. **Cultura Shift-Left (Prevenção Antecipada):**
   - Participar ativamente do refinamento de requisitos para identificar ambiguidades, cenários de falha e regras incompletas antes do início do desenvolvimento.

---

## 2. Automação Resiliente de APIs e Interfaces (E2E)

1. **Boas Práticas em Automação E2E (Playwright / Cypress):**
   - **Page Object Model (POM):** Separar a lógica de interação com os elementos da tela dos scripts de teste, facilitando manutenções futuras.
   - **Seletores Resilientes:** Priorizar atributos semânticos ou de teste (`data-testid`, `role`, `aria-label`) em vez de seletores CSS frágeis ou classes utilitárias sujeitas a alterações de estilo.
   - **Combate a Flaky Tests:** Evitar esperas arbitrárias (`sleep` fixo). Utilizar *auto-waiting* inteligente em chamadas de rede ou visibilidade de elementos.

2. **Automação de Testes de API:**
   - Validação sistemática de status code, cabeçalhos de segurança (CORS, CSP), conformidade com o schema OpenAPI/JSON Schema e mensagens de erro descritivas para entradas inválidas (400/422).
   - Testes de autorização (verificar se usuários não autorizados recebem 401/403 ao acessar recursos protegidos).

---

## 3. Testes de Performance, Carga e Estresse

1. **Planejamento de Testes de Carga (k6 / Locust):**
   - **Teste de Carga Médio (Load Test):** Validar comportamento do sistema sob volume operacional típico esperado.
   - **Teste de Pico (Spike Test):** Avaliar a resposta do sistema a explosões súbitas de tráfego (ex.: início de aula ou encerramento de prazo de atividade).
   - **Teste de Estresse (Stress Test):** Descobrir o ponto de ruptura e garantir que o sistema degrade de forma graciosa sem corrupção de dados.

2. **Métricas Chave de Avaliação:**
   - Tempos de resposta nos percentis $p95$ e $p99$.
   - Taxa de erro (< 1% em carga nominal).
   - Vazamento de conexões ou consumo descontrolado de memória ao longo do tempo (Endurance/Soak Testing).

---

## 4. Governança de Qualidade no Pipeline de CI/CD

1. **Quality Gates Automatizados:**
   - Bloquear merges de PRs que diminuam a cobertura de código abaixo do limite mínimo acordado ou que quebrem testes de regressão existentes.
2. **Quarentena de Testes Instáveis:**
   - Isolar imediatamente qualquer teste com comportamento intermitente (*flaky*) para investigação, impedindo atrasos e perda de confiança da equipe na esteira de CI.
3. **Relatórios Transparentes:**
   - Geração de relatórios claros de execução de testes (Allure, JUnit XML) com logs de requisição/resposta, capturas de tela e traces de execução em caso de falha.
