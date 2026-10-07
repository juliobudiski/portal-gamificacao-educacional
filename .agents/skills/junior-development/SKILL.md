---
name: junior-development
description: >-
  Use this skill when implementing scoped bug fixes, delimited tasks, writing unit test suites,
  following code standards and linters, and preparing concise pull requests for review.
---

# Habilidades Essenciais do Desenvolvedor Júnior

Este guia e conjunto de habilidades estabelece os procedimentos para executar tarefas com escopo delimitado de forma segura, com código limpo, cobertura de testes e forte disciplina de boas práticas.

---

## 1. Implementação Disciplinada de Escopo Delimitado

1. **Entendimento Claro do Problema:**
   - Reproduzir o comportamento esperado ou o bug em ambiente de desenvolvimento antes de alterar qualquer linha de código.
   - Não misturar correções de bug com refatorações amplas ou mudanças cosméticas em arquivos não relacionados.

2. **Código Limpo e Convenções:**
   - **Nomes Significativos:** Usar variáveis, métodos e classes com nomes claros e descritivos em vez de abreviações ambíguas.
   - **Formatação e Linters:** Rodar linters e formatadores (ex.: ESLint, Prettier, Black, Flake8) antes de submeter alterações.
   - **Princípio da Menor Surpresa:** Escrever código que faça exatamente o que o nome sugere, sem efeitos colaterais inesperados.

---

## 2. Escrita Eficaz de Testes Unitários

1. **Padrão AAA (Arrange, Act, Assert):**
   - **Arrange (Preparar):** Configurar os dados e o estado necessário para o teste.
   - **Act (Agir):** Invocar o método ou função que está sendo testada.
   - **Assert (Garantir):** Verificar se o resultado ou efeito é exatamente o esperado.

2. **Prevenção de Regressão (Bug Fix Workflow):**
   - Criar um teste unitário que falhe comprovando a existência do bug.
   - Aplicar a correção mínima necessária no código.
   - Executar o teste novamente e confirmar que passou (verde), além de rodar os testes existentes para garantir que nada foi quebrado.

---

## 3. Preparação de Pull Requests e Revisão de Código

1. **Pull Requests Focados e Pequenos:**
   - Manter PRs pequenos (preferencialmente < 200 linhas de código alteradas). PRs menores são revisados mais rapidamente e têm menos probabilidade de conter bugs ocultos.
   - Seguir o padrão de commits semânticos:
     - `fix: corrige cálculo incorreto de pontos de atividade`
     - `test: adiciona testes unitários para o módulo de pontuação`
     - `docs: atualiza instruções de setup no README`

2. **Descrição Clara:**
   - Descrever:
     - O que foi alterado.
     - O motivo da alteração.
     - Passo a passo claro para outro desenvolvedor testar localmente.

3. **Recepção Positiva de Feedbacks:**
   - Tratar feedbacks de code review como oportunidades de aprendizado e aprimoramento técnico.
   - Responder aos comentários com clareza e aplicar as correções sugeridas prontamente.

---

## 4. Apoio Operacional e Ambiente de Desenvolvimento

1. **Saúde do Ambiente Local:**
   - Manter as instruções de instalação (`npm install`, `pip install -r requirements.txt`, migrações de banco) funcionais e reportar qualquer discrepância na documentação.
2. **Triagem Básica de Logs:**
   - Identificar a origem de exceções por meio do *stack trace* e saber isolar se o problema ocorre no frontend, na API ou no banco de dados.
