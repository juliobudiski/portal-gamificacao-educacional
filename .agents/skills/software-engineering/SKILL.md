---
name: software-engineering
description: >-
  Use this skill when designing, building, refactoring, testing, or maintaining robust software systems,
  applying design patterns (SOLID, GoF), Clean Architecture, error handling best practices, and automated testing strategies.
---

# Habilidades Essenciais do Engenheiro de Software Geral

Este guia e conjunto de habilidades estabelece os procedimentos e padrões operacionais para projetar, construir, testar e manter soluções de software com alto nível de maturidade e confiabilidade.

---

## 1. Padrões Arquiteturais e Design Limpo (Clean Architecture & SOLID)

1. **Separação de Camadas e Responsabilidades:**
   - **Domínio (Domain):** Entidades, regras de negócio centrais, objetos de valor (Value Objects), invariantes. Não depende de frameworks externos ou bancos de dados.
   - **Aplicação (Application / Use Cases):** Orquestração das regras de negócio, interfaces/ports de repositórios e serviços externos, casos de uso específicos da aplicação.
   - **Infraestrutura (Infrastructure / Adapters):** Implementações concretas de bancos de dados (ORMs, SQL), clientes HTTP, filas, envio de e-mails, cache (Redis).
   - **Interfaces / Apresentação (Interface / Web / CLI):** Controladores de API (REST/GraphQL), rotas, DTOs de entrada e saída, serialização e interfaces gráficas.

2. **Princípios SOLID:**
   - **S (Single Responsibility):** Uma classe ou módulo deve ter um único motivo para mudar.
   - **O (Open/Closed):** Aberto para extensão, fechado para modificação. Favorecer polimorfismo e interfaces.
   - **L (Liskov Substitution):** Subtipos devem ser substituíveis por seus tipos base sem alterar o comportamento esperado.
   - **I (Interface Segregation):** Muitas interfaces específicas são melhores que uma interface genérica inflada.
   - **D (Dependency Inversion):** Módulos de alto nível não devem depender de módulos de baixo nível; ambos devem depender de abstrações.

---

## 2. Estratégia de Testes Automatizados (Pirâmide de Testes)

- **Testes Unitários:**
  - Foco em funções puras, cálculos de domínio, validações e transformações de dados.
  - Devem ser rápidos (< 1s), determinísticos e isolados (sem I/O real).
- **Testes de Integração:**
  - Validação de integrações reais (banco de dados, endpoints de API HTTP, mensageria).
  - Testar transações de banco, rollbacks e serialização de DTOs.
- **Testes Ponta a Ponta (E2E):**
  - Simulam a jornada crítica do usuário final (login -> fluxo principal -> verificação de resultado).

---

## 3. Robustez, Observabilidade e Tratamento de Erros

1. **Tratamento de Exceções Semântico:**
   - Criar exceções customizadas de domínio (`EntityNotFoundException`, `BusinessRuleViolationException`).
   - Evitar capturar exceções genéricas (`catch Exception`) sem re-lançar ou registrar contexto suficiente.
2. **Logging Estruturado e Contextual:**
   - Registrar eventos significativos com nível correto (`DEBUG`, `INFO`, `WARNING`, `ERROR`).
   - Nunca expor credenciais, senhas, tokens ou dados sensíveis (PII) nos logs.
3. **Idempotência e Concorrência:**
   - Implementar chaves de idempotência em endpoints de mutação sensíveis.
   - Usar controle de concorrência (optimistic/pessimistic locking) em recursos concorridos.

---

## 4. Refatoração Segura e Manutenibilidade

1. **Regra do Escoteiro (Boy Scout Rule):** Sempre deixe o código um pouco mais limpo do que quando você o encontrou.
2. **Preservação de Comportamento:** Antes de refatorar, garanta cobertura de testes adequada nos caminhos críticos.
3. **Passos Curtos e Verificáveis:** Faça pequenas alterações incrementais seguidas da execução dos testes.
