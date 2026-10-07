---
name: mid-development
description: >-
  Use this skill when implementing end-to-end features autonomously, creating unit/integration test suites,
  conducting peer code reviews, refactoring localized code, and maintaining API and system documentation.
---

# Habilidades Essenciais do Desenvolvedor Pleno

Este guia e conjunto de habilidades define as práticas recomendadas para implementar funcionalidades com autonomia, garantir testes consistentes e elevar a qualidade da base de código no dia a dia.

---

## 1. Entrega Autônoma de Funcionalidades Ponta a Ponta

1. **Leitura e Decomposição de Tarefas:**
   - Desdobrar requisitos e histórias em subtarefas técnicas claras (alterações de schema/migrações, serviços de domínio, endpoints de API e componentes de UI).
   - Validar contratos de API (payloads JSON, códigos de status HTTP, headers) antes da implementação completa.

2. **Código Idiomático e Padronizado:**
   - Seguir rigorosamente as convenções de nomenclatura, tipagem e guias de estilo da linguagem e framework utilizados.
   - Evitar duplicação acidental aplicando abstrações adequadas (DRY com moderação).

---

## 2. Testes Automatizados Abrangentes e Determinísticos

1. **Cobertura Efetiva:**
   - Construir testes unitários cobrindo caminhos felizes (*happy paths*), fluxos alternativos e condições de contorno (*boundary conditions / edge cases*).
   - Criar testes de integração focados em transações reais com banco de dados e clientes HTTP.

2. **Isolamento e Fixtures:**
   - Utilizar mocks, stubs ou factories para dependências externas lentas ou não determinísticas (serviços de terceiros, relógio do sistema, filas).
   - Garantir que a suíte de testes seja idempotente: a execução repetida nunca deve falhar por dados residuais.

---

## 3. Revisão de Código entre Pares (Peer Code Review)

1. **Checklist Prático de Revisão:**
   - **Clareza:** O código é fácil de ler e expressa sua intenção sem comentários redundantes?
   - **Testabilidade:** Existem testes suficientes cobrindo as novas regras implementadas?
   - **Tratamento de Exceções:** Todos os erros possíveis são capturados e tratados de forma elegante?
   - **Padrão de Branches e Commits:** Mensagens de commit atômicas e convencionais (`feat:`, `fix:`, `refactor:`, `test:`).

2. **Colaboração e Abertura:**
   - Sugerir alternativas de forma humilde e colaborativa.
   - Aprender com feedbacks recebidos de desenvolvedores sêniores e aplicá-los com rapidez.

---

## 4. Refatoração Local e Documentação Viva

1. **Refatoração Cirúrgica:**
   - Simplificar métodos longos, extrair constantes mágicas e desacoplar classes sobrecarregadas ao passar por trechos legados.
   - Garantir que testes automatizados existam antes de iniciar qualquer refatoração.

2. **Documentação Como Código:**
   - Manter especificações OpenAPI / Swagger atualizadas a cada modificação em endpoints.
   - Atualizar manuais de instalação, variáveis de ambiente necessárias e scripts de migração.
