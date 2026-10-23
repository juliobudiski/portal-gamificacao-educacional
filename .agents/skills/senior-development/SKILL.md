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

2. **Pilares de Orientação a Objetos (OOP), Arquitetura Hexagonal e Desacoplamento:**
   - **Encapsulamento Estrito:** Proteger o estado interno dos objetos. Atributos devem ser privados/protegidos, manipulados exclusivamente por métodos de negócio que validam regras e invariantes (evitar *Anemic Domain Model* com meros getters e setters).
   - **Polimorfismo & Inversão de Dependência (DIP / Hexagonal):** O domínio declara suas Portas de Saída como interfaces abstratas (ex.: `INotificationPort`, `IRepository[T]`). Os adaptadores concretos implementam essas interfaces e são injetados externamente no construtor.
   - **Composição sobre Herança:** Utilizar herança apenas quando houver relação legítima de tipo e respeito ao Princípio da Substituição de Liskov (LSP). Para reuso de comportamento, preferir composição e delegação.
   - **Alta Coesão e Baixo Acoplamento:** Separar adaptadores de entrada (rotas/controllers HTTP que tratam serialização e status code) dos serviços de domínio e casos de uso (que tratam regras de negócio puras).
   - **Mentoria em POO:** Durante code reviews, orientar os desenvolvedores sobre onde cada responsabilidade deve residir, evitando acoplar lógica de domínio diretamente a anotações de ORM ou bibliotecas de terceiros.

3. **Padrões de Resiliência para Sistemas Distribuídos e APIs:**
   - **Circuit Breaker & Fallback:** Evitar falhas em cascata com estratégias de contingência (ex.: publicar mural mesmo se o servidor de e-mail falhar).
   - **Retry com Exponential Backoff e Jitter:** Evitar o efeito *thundering herd* em retentativas a serviços downstream.
   - **Idempotência:** Garantir que retentativas de operações com efeitos colaterais não dupliquem registros ou transações financeiras/pontuações (usar `UniqueConstraint` e locks otimistas).
   - **Particionamento em Lotes (Chunking):** Processar comunicações em massa via cópia oculta (BCC) em blocos limitados (ex.: $\le 90$ destinatários) para respeitar limites de provedores e privacidade (LGPD).
   - **Bulkheads:** Isolar recursos (pools de conexões, workers, threads de envio assíncrono) para que uma lentidão em um módulo não afete o tempo de resposta do usuário.

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
