---
id: US-25
title: "US-25: Evidência, Ergonomia Visual e Conteúdo Contextual do Botão de Ajuda do Passo a Passo"
epic: EPIC-03
status: Concluído
priority: Alta
tags:
  - ux-ui
  - accessibility
  - help-system
  - pedagogical-guidance
---

# US-25: Evidência, Ergonomia Visual e Conteúdo Contextual do Botão de Ajuda do Passo a Passo

## 1. Descrição & Valor de Negócio
Como **Professor ou Designer Instrucional** utilizando o assistente de criação de atividades gamificadas,
Quero ter **botões de ajuda contextuais imediatamente visíveis, autoexplicativos e acessíveis em cada etapa do fluxo**,
Para que **eu compreenda as diretrizes pedagógicas, fundamentações teóricas (HEXAD, Bartle, Sweller, Dicheva) e exemplos práticos sem esforço de busca visual ou desorientação na interface**.

---

## 2. Critérios de Aceitação BDD (Gherkin)

### Cenário 1: Caminho Feliz (Happy Path) — Acionamento do Guia Visual no Passo a Passo
- **Dado** que o professor está navegando em qualquer um dos 9 passos do assistente de criação (ex.: Passo 1 - Cenário ou Passo 3 - Logística),
- **Quando** ele visualiza o cabeçalho do passo ou o header global do wizard,
- **Então** o componente `StepHelpButton` exibe badge explícito ("Guia do Passo", "Ajuda", micro-pulsação de affordance),
- **E** ao clicar no botão, o `HelpModal` é disparado exibindo título contextual, recomendações pedagógicas e referências bibliográficas.

### Cenário 2: Caminho Alternativo (Alternative Path) — Acesso Rápido pelo Header Global
- **Dado** que o professor está preenchendo campos no formulário e visualiza o topo da página,
- **Quando** clica no botão "Guia do Passo X" presente no `ActivityCreationHeader`,
- **Então** o modal de ajuda correspondente ao passo atualmente ativo abre diretamente, sem exigir rolagem para o bloco específico do passo.

### Cenário 3: Cenário de Exceção e Borda (Exception & Fallback Handling)
- **Dado** que uma chave de ajuda inexistente ou indefinida é requisitada ao `HelpModalContext`,
- **Quando** o método `openHelp` é acionado,
- **Então** o sistema emite um log defensivo no console sem quebrar a renderização da árvore React,
- **E** fecha suavemente mantendo a integridade da navegação do professor.

### Cenário 4: Cenário Destrutivo / Anti-Regressão (Chaos Monkey & Keyboard Navigation)
- **Dado** que o usuário interage via teclado com o leitor de tela ou pressiona a tecla `Escape` repetidamente,
- **Quando** o modal de ajuda está aberto e o foco transiciona entre o botão de fechar e a área de rolagem,
- **Então** o scroll do body é liberado pontualmente, o modal se fecha com rollback seguro de foco e a integridade da aplicação é preservada.

---

## 3. Rastreabilidade & Mapeamento de Mudanças
- **Componente Unificado:** `frontend/src/components/common/StepHelpButton.jsx`.
- **Conteúdo Pedagógico Ampliado:** `frontend/src/data/helpContent.jsx` (adição de `planejamento_atividade` para o Passo 3).
- **Integração nos 9 Passos:** `Step1_Activity.jsx` até `Step9_Activity.jsx`.
- **Header Global do Wizard:** `frontend/src/pages/ActivityCreation/components/ActivityCreationHeader.jsx`.
- **Desacoplamento de Modais Duplicados:** `frontend/src/pages/ActivityCreationPage.jsx`.
