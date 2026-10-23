---
name: code-reviewer
description: >-
  Use this skill when conducting rigorous peer code reviews, evaluating Object-Oriented Programming (OOP) design,
  detecting code smells, verifying Clean Code & SOLID principles, and providing actionable pedagogical feedback.
---

# Habilidades Essenciais do Revisor de Código Especializado (Code Reviewer)

Este guia e conjunto de habilidades define os procedimentos analíticos para conduzir revisões de código de alta barra técnica, garantindo a adesão rigorosa aos princípios de Orientação a Objetos, Clean Code, resiliência e boas práticas de engenharia.

---

## 1. Avaliação de POO & Princípios SOLID

1. **Encapsulamento e Integridade de Domínio:**
   - Detectar modelos anêmicos (*Anemic Domain Model*): classes que contêm apenas campos públicos e métodos getters/setters, com regras de negócio espalhadas em controladores.
   - Exigir que a manipulação de estado ocorra por meio de métodos de negócio que protejam invariantes (ex.: `turma.encerrar_periodo()`).
2. **Polimorfismo & Inversão de Dependência (DIP):**
   - Verificar se as classes de serviço dependem de abstrações (interfaces/Portas) e não de implementações concretas de banco de dados ou rede.
   - Checar se as dependências são explicitamente passadas via injeção no construtor.
3. **Princípio da Responsabilidade Única (SRP):**
   - Verificar se classes ou métodos acumulam motivos múltiplos para sofrer modificação (ex.: um controller que faz parsing HTTP, validação de regras de negócio e consultas SQL diretas).
4. **Substituição de Liskov (LSP) e Composição:**
   - Apontar heranças forçadas onde a subclasse altera ou invalida o contrato comportamental da classe base. Recomendar composição e delegação.

---

## 2. Detecção Ativa de Code Smells (Martin Fowler)

1. **God Class / Large Class:** Classes sobrecarregadas com dezenas de métodos e responsabilidades desconexas.
2. **Long Method:** Métodos com mais de 25-30 linhas que realizam mais de uma tarefa lógica.
3. **Feature Envy (Inveja de Recursos):** Métodos que acessam mais dados de outra classe do que da sua própria. Indício claro de que o método deve pertencer à outra classe.
4. **Primitive Obsession:** Uso excessivo de tipos primitivos (`string`, `int`) para conceitos que possuem regras próprias (ex.: CPF, E-mail, Dinheiro, Coordenadas GPS). Recomendar criação de *Value Objects*.
5. **Shotgun Surgery:** Situação onde uma alteração simples exige edições espalhadas em dezenas de arquivos diferentes, indicando alto acoplamento e baixa coesão.

---

## 3. Complexidade Ciclomática e Legibilidade (Clean Code)

1. **Complexidade Ciclomática e Cognitiva:**
   - Identificar aninhamentos excessivos de condicionais (`if/else` triplamente aninhados) e loops complexos. Recomendar cláusulas de guarda (*Guard Clauses*) e extração de métodos.
2. **Nomenclatura Semântica:**
   - Vetar nomes crípticos ou abreviações não padronizadas (`usr`, `chk_dt`, `proc_dat`). Exigir termos expressivos que reflitam a linguagem ubíqua do domínio.
3. **Tratamento Seguro de Exceções:**
   - Bloquear capturas genéricas silenciosas (`catch Exception: pass`). Exigir exceções semânticas de domínio com contexto detalhado em logs.

---

## 4. Padrão Estruturado de Feedback em Code Review

Todo comentário de revisão deve seguir o padrão pedagógico de três etapas:

```markdown
### [Bloqueante | Sugestão]: [Título do Apontamento]

1. **Problema Observado:**
   Descreva de forma factual e objetiva onde está a não-conformidade no código (apontando linhas e símbolos).

2. **Impacto e Justificativa (O "Porquê"):**
   Explique a consequência técnica ou arquitetural (ex.: vazamento de conexões, acoplamento indevido, dificuldade de testes unitários isolados).

3. **Solução Recomendada:**
   Forneça a alternativa recomendada, preferencialmente acompanhada de um exemplo prático ou bloco diff.
```
