---
name: senior-development
description: >-
  Use this skill when architecting complex software modules, guiding technical design decisions,
  conducting rigorous code reviews, resolving distributed systems issues, managing technical debt, and mentoring developers.
---

# Habilidades Essenciais do Desenvolvedor Sênior

Este guia e conjunto de habilidades consolida as práticas técnicas, de design e de liderança necessárias para desenhar sistemas escaláveis, auditar bases de código e mitigar débitos técnicos de forma sustentável.

---

## 1. Avaliação de Trade-offs e Design de Sistemas Complexos

1. **Equilíbrio Arquitetural (Sem Overengineering):**
   - Aplicar **KISS** (*Keep It Simple, Stupid*) e **YAGNI** (*You Aren't Gonna Need It*).
   - Não adicionar camadas de abstração desnecessárias antes de haver ao menos 2 a 3 implementações concretas ou uma clara necessidade de isolamento.
   - Pesar custos de latência, complexidade operacional, consistência de dados (ACID vs. Eventual Consistency) e custo de infraestrutura.

2. **Padrões de Resiliência para Sistemas Distribuídos e APIs:**
   - **Circuit Breaker:** Evitar falhas em cascata interrompendo temporariamente requisições a serviços instáveis.
   - **Retry com Exponential Backoff e Jitter:** Evitar o efeito *thundering herd* em retentativas a serviços downstream.
   - **Idempotência:** Garantir que retentativas de operações com efeitos colaterais não dupliquem registros ou transações financeiras/pontuações.
   - **Bulkheads:** Isolar recursos (pools de conexões, workers) para que uma lentidão em um módulo não derrube toda a aplicação.

---

## 2. Padrões de Revisão de Código (Code Review de Alta Barra)

1. **Critérios de Análise Crítica:**
   - **Corretude e Concorrência:** Detecção de race conditions, deadlocks, transações abertas desnecessariamente e vazamento de conexões.
   - **Complexidade Ciclomática e Legibilidade:** O código é compreensível para outro engenheiro em 6 meses? Funções longas, condicionais aninhadas profundas e dependências ocultas devem ser apontadas.
   - **Segurança (OWASP Top 10):** Sanitização de dados, proteção contra SQL Injection, XSS, CSRF, quebra de autorização em nível de objeto (BOLA/IDOR).
   - **Performance e Consumo de Recursos:** Consultas N+1 em ORMs, indexação de colunas em banco, carregamento desnecessário de dados em memória.

2. **Comunicação Construtiva e Mentoria:**
   - Explicar o **"porquê"** da sugestão, nunca apenas o "o que fazer".
   - Diferenciar requisitos bloqueantes (*Blockers*) de sugestões de melhoria (*Nits / Non-blocking*).

---

## 3. Gestão e Remediação de Débito Técnico

1. **Classificação do Débito (Matriz de Martin Fowler):**
   - Deliberado vs. Inadvertido | Prudente vs. Imprudente.
2. **Estratégia do Estrangulamento (Strangler Fig Pattern):**
   - Substituição gradual e segura de componentes legados críticos por novas implementações modulares, sem a necessidade de reescritas completas arriscadas ("Big Bang").
3. **Mapeamento de Pontos Críticos (Hotspots):**
   - Cruzar frequência de commits e complexidade ciclomática para identificar os arquivos com maior risco de bugs.

---

## 4. Observabilidade e Engenharia de Diagnóstico

1. **Os Três Pilares da Observabilidade:**
   - **Métricas:** Taxas de erro (4xx/5xx), latência (p50, p95, p99), uso de CPU/RAM, tamanho de filas.
   - **Logs Estruturados:** Logs JSON com correlação de request ID / trace ID para rastreamento de ponta a ponta.
   - **Tracing Distribuído:** Identificação visual de gargalos em chamadas de microsserviços ou queries de banco de dados lentas.
