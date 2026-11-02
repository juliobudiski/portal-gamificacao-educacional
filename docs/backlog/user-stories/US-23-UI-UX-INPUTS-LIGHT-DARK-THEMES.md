---
id: US-23
epic: EP-04-UX-UI-ENHANCEMENT
title: "Harmonização Completa de Inputs, Controles e Áreas do Sistema em Modo Claro e Escuro"
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
  - critical-peer-review
---

# User Story: US-23 — Harmonização Completa de Inputs, Controles e Áreas do Sistema em Modo Claro e Escuro

## 1. Descrição (Formato INVEST)
**Como** discente, docente ou administrador do Gamefica.Edu utilizando o sistema em qualquer condição de luminosidade ambiente,  
**Quero** que todos os campos de entrada (`input`, `textarea`, `select`, `checkbox`, `radio`), barras de busca, modais de diálogo, formulários de criação e áreas de navegação apresentem contraste visual ótimo, legibilidade confortável, transições suaves e estados de foco nítidos tanto no Modo Claro (Light Mode) quanto no Modo Escuro (Dark Mode),  
**Para que** a experiência de uso seja profissional, ergonomicamente moderna, acessível segundo as diretrizes WCAG 2.2 AA e livre de qualquer quebra visual de tema.

---

## 2. Critérios de Aceitação BDD (Gherkin 4D)

### 2.1 Caminho Feliz (Happy Path)
#### Cenário 1: Renderização e Contraste dos Inputs no Modo Claro
- **Dado** que a aplicação está operando com o tema claro (`html:not(.dark)`),
- **Quando** o usuário navega por páginas com formulários (ex: Login, Registro, Criação de Turma, Fale Conosco, Edição de Perfil),
- **Então** os campos de entrada exibem fundo claro contrastante (`bg-secondary-bg`), borda nítida (`border-border-color`), texto escuro legível (`text-primary-text`), placeholders suaves (`placeholder:text-secondary-text/60`) e anel de foco ciano translúcido ao receber o cursor (`focus:ring-accent-teal/60`).

#### Cenário 2: Renderização e Contraste dos Inputs no Modo Escuro
- **Dado** que a aplicação está operando com o tema escuro (`html.dark`),
- **Quando** o usuário navega pelos mesmos formulários e campos de entrada,
- **Então** os campos adotam fundo escuro neutro (`dark:bg-primary-bg`), bordas sutis (`dark:border-border-color`), texto claro brilhante (`dark:text-primary-text`) e anel de foco ciano vivo (`dark:focus:ring-accent-teal/70`).

### 2.2 Caminho Alternativo (Alternative Path)
#### Cenário 3: Alternância Dinâmica de Tema sem Reload de Página
- **Dado** que o usuário preencheu parcialmente um formulário (ex: título de turma ou mensagem de contato),
- **Quando** ele aciona o botão flutuante de alternância de tema (`ThemeToggleButton`),
- **Então** o documento transiciona suavemente em 300ms (`transition: background-color 300ms ease, color 300ms ease`), o texto já digitado permanece intacto e o campo adapta imediatamente suas cores e contraste sem piscar ou perder o foco ativo.

#### Cenário 4: Seleção de Texto e Barras de Rolagem Customizadas
- **Dado** que o usuário seleciona um trecho de texto ou rola um painel com overflow,
- **Quando** a interação ocorre em qualquer tema,
- **Então** o texto selecionado utiliza a cor da marca (`::selection` com fundo `var(--color-accent-teal)` e texto branco) e a barra de rolagem (`::-webkit-scrollbar-thumb`) utiliza cores dinâmicas variáveis (`var(--border-color)` para `var(--text-secondary)` no hover), integrando-se organicamente à paleta.

### 2.3 Tratamento de Exceção (Exception)
#### Cenário 5: Erro de Validação de Input com Feedback Acessível
- **Dado** que um campo obrigatório não foi preenchido ou falha na validação de formato,
- **Quando** o formulário é submetido,
- **Então** o campo ou banner exibe destaque semântico de perigo (`border-danger`, `text-danger`, `bg-danger-bg/50`) legível em ambos os modos claro e escuro, preservando a razão de contraste mínima de 4.5:1.

### 2.4 Cenário de Caos e Teste Adversarial (Chaos/Adversarial)
#### Cenário 6: Foco Rápido via Tabulação e Dispositivos com Alto Contraste
- **Dado** que um estudante navega estritamente via teclado (`Tab` / `Shift+Tab`) em um dispositivo configurado com preferência de movimento reduzido,
- **Quando** ele percorre sequencialmente os inputs e botões,
- **Então** a pseudo-classe `:focus-visible` projeta o outline de alta visibilidade (`3px solid #06b6d4`, offset 3px) e as animações são neutralizadas (`0.01ms`), garantindo previsibilidade visual sem desorientação vestibular em ambos os temas.

---

## 3. Matriz de Rastreabilidade Técnica

| Componente / Módulo | Caminho Relativo | Ações Realizadas |
| :--- | :--- | :--- |
| **Estilos Globais** | `frontend/src/index.css` | Regras `@layer base` universais para inputs, checkboxes, scrollbars e text selection. |
| **Criação de Turmas** | `frontend/src/pages/CreateClassPage.jsx` | Eliminação de fundo hardcoded escuro e padronização de inputs e textarea. |
| **Edição de Turmas** | `frontend/src/pages/ClassEditPage.jsx` | Harmonização de bordas e inputs de edição de turma e cadastro de discentes. |
| **Entrada em Turma** | `frontend/src/pages/JoinClassPage.jsx` | Modernização do input de código de inscrição com tokens semânticos. |
| **Fale Conosco** | `frontend/src/pages/ContactPage.jsx` | Remoção de classes fixas cinzas e adoção de tokens canônicos `bg-primary-bg`. |
| **Exclusão de Conta** | `frontend/src/components/DeleteAccountModal.jsx` | Harmonização do modal crítico de senha com feedback de foco danger. |
| **Loja de Recompensas** | `frontend/src/components/activity/StoreTab.jsx` | Atualização do formulário de criação de itens e customização cosmética. |
| **Roteirista Virtual (IA)**| `frontend/src/components/activity/AIConfigModal.jsx` | Remoção de classes sintaticamente incorretas e padronização de selects/textareas. |
| **Minhas Atividades** | `frontend/src/pages/StudentActivityPage.jsx` | Harmonização da barra de busca de atividades com ícones e foco teal. |

