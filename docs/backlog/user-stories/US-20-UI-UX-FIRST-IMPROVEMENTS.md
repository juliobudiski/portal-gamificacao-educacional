---
id: US-20
epic: EP-04-UX-UI-ENHANCEMENT
title: "Implementação das Primeiras 20 Melhorias Estratégicas de UI/UX"
status: Concluído
priority: Alta
skills_involved:
  - ux-instructional-design
  - product-owner
  - requirements-engineering
  - senior-development
  - code-reviewer
  - qa-sdet
  - appsec-security
---

# User Story: US-20 — Implementação das Primeiras 20 Melhorias de UI/UX

## 1. Descrição (Formato INVEST)
**Como** aluno ou professor utilizando o Gamefica.Edu em um estudo piloto,  
**Quero** usufruir de interfaces com suporte a ajuda persistente, checklist de introdução, previews informativos de nós, gabarito visual claro em quizzes e acessibilidade nativa,  
**Para que** minha carga cognitiva extrínseca seja minimizada e minha atenção seja integralmente canalizada para o aprendizado e engajamento pedagógico.

---

## 2. Critérios de Aceitação BDD (Gherkin 4D)

### 2.1 Caminho Feliz (Happy Path)
#### Cenário 1: Central de Ajuda Flutuante com Busca (Melhoria 04)
- **Dado** que qualquer usuário (aluno ou professor) está navegando na aplicação,
- **Quando** ele clica no botão flutuante de ajuda no canto inferior direito,
- **Então** um modal suave deve abrir com busca instantânea de dúvidas e botão direto de "Reiniciar Tour".

#### Cenário 2: Checklist Interativo de Boas-Vindas no Dashboard do Aluno (Melhoria 08)
- **Dado** que um estudante acessa o Dashboard do Aluno,
- **Quando** suas missões de introdução (perfil, turma, roleta, atividade) estiverem pendentes,
- **Então** um card colapsável com barra de porcentagem deve guiá-lo com links diretos e feedback de XP.

#### Cenário 3: Tooltip Rico de Prévia ao Pairar o Mouse no Tabuleiro (Melhoria 16)
- **Dado** que o aluno está visualizando o mapa do tabuleiro (Vila da Aventura),
- **Quando** ele posiciona o cursor sobre qualquer nó da trilha,
- **Então** um tooltip flutuante semitransparente exibe o título da etapa, tipo pedagógico, status e pontuação XP.

#### Cenário 4: Revelação Clara de Gabarito e Streak de Acertos (Melhoria 19 e 25)
- **Dado** que o estudante responde a uma pergunta de Quiz,
- **Quando** a submissão é confirmada,
- **Então** a alternativa correta é imediatamente destacada em verde com ícone de check, a errada em vermelho com X, e um banner de fogo (🔥) de acertos consecutivos é exibido no topo.

### 2.2 Caminho Alternativo (Alternative Path)
#### Cenário 5: Efeito Typewriter com Clique para Pular na Narrativa (Melhoria 28)
- **Dado** que o discente entra em um nó de história/storytelling,
- **Quando** o diálogo de um personagem é acionado,
- **Então** o texto aparece progressivamente simulando fala, e um clique na caixa completa o texto instantaneamente.

#### Cenário 6: Acessibilidade WCAG 2.2 AA e Redução de Movimento (Melhoria 64 e 68)
- **Dado** que um usuário navega exclusivamente por teclado (`Tab`/`Shift+Tab`) ou possui sensibilidade vestibular,
- **Quando** os seletores recebem foco ou o SO define `prefers-reduced-motion: reduce`,
- **Então** um anel duplo de foco azul/ciano de 3px é aplicado e as animações são desaceleradas para tempo imperceptível.

### 2.3 Tratamento de Exceção (Exception)
#### Cenário 7: Desconexão Temporária durante Salvamento em Nuvem (Melhoria 43)
- **Dado** que uma oscilação de rede ocorre enquanto o professor edita a atividade,
- **Quando** o auto-save dispara uma requisição sem sucesso,
- **Então** o badge de nuvem no cabeçalho exibe o estado de alerta com ícone vermelho e mensagem clara sem travar a interface.

### 2.4 Cenário de Caos e Teste Adversarial (Chaos / Adversarial)
#### Cenário 8: Concorrência e Sobrecarga de Teclas Rápidas
- **Dado** que o aluno pressiona consecutivamente a barra de espaço ou cliques no Joyride,
- **Quando** múltiplos eventos de avanço de tour competem pelo estado global,
- **Então** o tour preserva a idempotência sem renderizar múltiplos overlays concorrentes no DOM.

---

## 3. Matriz de Rastreabilidade das 20 Oportunidades Entregues

| ID | Melhoria do Catálogo | Componente / Arquivo Afetado | Status |
| :---: | :--- | :--- | :---: |
| **01** | Tour Contextual Dinâmico | `frontend/src/context/TutorialContext.jsx` | Implementado |
| **02** | Barra e Estilos Visuais no Joyride | `frontend/src/context/TutorialContext.jsx` | Implementado |
| **03** | Opção de Pular / Cancelar Granular | `frontend/src/context/TutorialContext.jsx` | Implementado |
| **04** | Central de Ajuda Flutuante com Busca | `frontend/src/components/common/HelpFloatingWidget.jsx` | Implementado |
| **05** | Simulador / Criação Rápida de Atividades | `frontend/src/pages/ActivityBankPage.jsx` | Implementado |
| **06** | Mascote e Humanização do Onboarding | `frontend/src/data/tutorialSteps.js` | Implementado |
| **07** | Modo Replay de Passo no Tutorial | `frontend/src/context/TutorialContext.jsx` | Implementado |
| **08** | Checklist Interativo de Boas-Vindas | `frontend/src/components/dashboard/WelcomeChecklistWidget.jsx` | Implementado |
| **09** | Spotlight Escurecido com Borda Suave | `frontend/src/context/TutorialContext.jsx` | Implementado |
| **10** | Pan/Drag e Zoom no Tabuleiro | `frontend/src/components/activity/themes/` | Em Roadmap |
| **11** | Animação de Deslocamento do Avatar | `frontend/src/components/activity/themes/` | Em Roadmap |
| **12** | Névoa de Guerra / Nós Bloqueados | `frontend/src/components/activity/GameBoard.css` | Implementado |
| **13** | Minimapa de Navegação | `frontend/src/components/activity/` | Em Roadmap |
| **14** | Trilha Sonora e Efeitos Hápticos | `frontend/src/components/activity/` | Em Roadmap |
| **15** | Partículas e Brilho Pulsante no Nó Ativo | `frontend/src/components/activity/GameBoard.css` | Implementado |
| **16** | Prévia do Nó com Tooltip ao Pairar Mouse | `frontend/src/components/activity/themes/VilaDaAventuraTheme.jsx` | Implementado |
| **17** | Caminhos com Bifurcação Visual | `frontend/src/components/activity/themes/FlowchartTheme.jsx` | Implementado |
| **18** | Modo de Exibição Compacto em Lista | `frontend/src/components/activity/GameBoardViewer.jsx` | Em Roadmap |
| **19** | Animação e Revelação de Gabarito | `frontend/src/components/activity/QuizTab.jsx` | Implementado |
| **20** | Timer Visual Não Agressivo | `frontend/src/components/activity/QuizTab.jsx` | Implementado |
| **25** | Feedback de Streak de Acertos (Fogo 🔥) | `frontend/src/components/activity/QuizTab.jsx` | Implementado |
| **28** | Efeito Máquina de Escrever (Typewriter) | `frontend/src/components/activity/NarrativeTab.jsx` | Implementado |
| **43** | Indicador de Salvamento em Nuvem | `frontend/src/pages/ActivityCreation/components/ActivityCreationHeader.jsx` | Implementado |
| **64** | Foco Visível Duplo por Teclado (WCAG) | `frontend/src/index.css` | Implementado |
| **68** | Respeito a `prefers-reduced-motion` | `frontend/src/index.css` | Implementado |

---

## 4. Auditoria de Qualidade e Homologação
- **Testes Backend:** 48/48 aprovados (`pytest backend/tests/ -q`).
- **Testes E2E de Arquitetura e Rastreabilidade:** 27/27 aprovados (`pytest tests/test_e2e_portal_restructuring.py -q`).
- **Build de Produção do Frontend:** Concluído com sucesso via Vite (`dist/` gerado sem erros de compilação ou lint).
