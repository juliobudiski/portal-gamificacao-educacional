---
name: technical-writing
description: >-
  Use this skill when designing, writing, structuring, or maintaining software documentation,
  C4 model architecture documents (Context, Containers, Components), API specifications,
  user/developer onboarding guides, and Obsidian knowledge bases.
---

# Habilidades Essenciais do Engenheiro de Documentação Técnica (Technical Writer)

Este guia e conjunto de habilidades consolida os padrões, metodologias e formatos para projetar, redigir e manter a documentação viva de software em alto e baixo nível, garantindo clareza, rastreabilidade e facilidade de manutenção para equipes e alunos.

---

## 1. Documentação de Arquitetura de Software (C4 Model & Visão Macro)

1. **Os Níveis do C4 Model:**
   - **Nível 1 — Diagrama de Contexto do Sistema:** Mostra o sistema como uma caixa-preta no centro, cercado pelos usuários (personas) e pelos sistemas externos integrados (gateways, SMTP, APIs de terceiros).
   - **Nível 2 — Diagrama de Contêineres:** Detalha os blocos executáveis de alto nível que compõem a solução (Single Page Application React, API Backend Flask, Banco de Dados Relacional, Cache Redis).
   - **Nível 3 — Diagrama de Componentes:** Mostra a estrutura interna de um contêiner específico (ex.: divisão em Portas, Serviços de Domínio e Adaptadores dentro do backend).
   - **Nível 4 — Diagrama de Código:** Diagramas de classes UML focados em módulos de alta complexidade.

2. **Padrão Visual com Mermaid:**
   - Todo diagrama arquitetural deve ser expresso em blocos `mermaid` (`graph TD` ou `graph LR`), garantindo renderização universal no GitHub, no VSCode e no Obsidian.

---

## 2. Documentação de Baixo Nível e Design de Software (POO)

1. **Diagramas de Classes e Mapeamento de Domínio:**
   - Documentar as entidades de domínio, objetos de valor (*Value Objects*), atributos essenciais e métodos de negócio.
   - Indicar relacionamentos de associação, herança e realização de interfaces (Portas).
2. **Mapeamento de Arquitetura Hexagonal (Ports & Adapters):**
   - Especificar formalmente a tabela de interfaces:
     $$\text{Caso de Uso} \longleftrightarrow \text{Inbound Port} \longleftrightarrow \text{Classe de Domínio} \longleftrightarrow \text{Outbound Port} \longleftrightarrow \text{Adaptador Concreto}$$
3. **Diagramas de Sequência para Fluxos Críticos:**
   - Detalhar a ordem temporal de troca de mensagens entre o Ator, o Adaptador de Entrada, a Porta do Caso de Uso, o Repositório e o Banco de Dados.
4. **Dicionário de Dados e Diagrama ER:**
   - Mapear cada tabela do banco de dados: nomes de colunas, tipos primitivos, chaves primárias/estrangeiras, restrições (`NOT NULL`, `UNIQUE`) e índices criados para performance.

---

## 3. Gestão de Backlog Ágil e Documentação no Obsidian

1. **Padronização de Notas com YAML Frontmatter:**
   - Toda história de usuário ou requisito deve conter metadados estruturados para o motor de grafos do Obsidian:
     ```yaml
     ---
     id: US-XX
     title: "Título Conciso"
     epic: "[[EPIC-XX-nome]]"
     type: user-story
     status: ready | in_progress | implemented
     priority: high | medium | low
     tags: [requisito, modulo]
     ports: ["[[IPorta]]"]
     classes: ["[[ClasseDominio]]"]
     tables: ["[[tb_tabela]]"]
     tests: ["[[test_arquivo.py]]"]
     ---
     ```
2. **Uso Disciplinado de Wikilinks (`[[...]]`):**
   - Criar links bidirecionais conectando conceitos relacionados. Isso viabiliza o uso do **Graph View** no Obsidian como ferramenta de navegação do sistema.
3. **Especificação de Critérios BDD em 4 Dimensões:**
   - Estruturar os cenários Gherkin com clareza gramatical e sem jargões técnicos excessivos nos passos `Dado`, `Quando` e `Então`.

---

## 4. Manuais de API, Guias de Onboarding e Usabilidade

1. **Especificação OpenAPI / Swagger:**
   - Documentar endpoints REST: verbos HTTP, parâmetros de rota, query parameters, payloads JSON com exemplos e todos os possíveis códigos de retorno (200, 201, 400, 401, 403, 404, 422, 500).
2. **Guias de Início Rápido (Quickstart / README):**
   - Redigir passos reproduzíveis para clonar, instalar dependências (`pip`, `npm`), rodar migrações de banco e executar a suíte de testes.
3. **Tom de Voz e Clareza Pedagógica:**
   - Manter linguagem precisa, inclusiva e acessível para desenvolvedores e estudantes de qualquer nível de senioridade.
