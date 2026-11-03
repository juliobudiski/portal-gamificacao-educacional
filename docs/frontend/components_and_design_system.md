# Design System, Componentes e Gerenciamento de Estado

> **Status:** Ativo & Atualizado  
> **Escopo:** Catálogo de 62 Componentes, Modais, Temas CSS, Hooks Personalizados e Contextos React  

---

## 1. Sistema de Design e Temas (Dark / Light Mode)

O portal utiliza uma arquitetura baseada em **CSS Custom Properties** definida em [`frontend/src/index.css`](../../frontend/src/index.css) combinada com as classes utilitárias do **TailwindCSS**. Isso permite alternância instantânea entre modo claro e escuro sem repintura destrutiva do DOM.

### 1.1 Variáveis Semânticas do Sistema
| Variável CSS | Modo Escuro (Default) | Modo Claro | Uso na Interface |
| :--- | :--- | :--- | :--- |
| `--color-primary-bg` | `#0f172a` (Slate 900) | `#f8fafc` (Slate 50) | Fundo da janela e containers principais |
| `--color-secondary-bg` | `#1e293b` (Slate 800) | `#ffffff` (Branco) | Fundo de cards, modais e menus |
| `--color-primary-text` | `#f8fafc` (Texto claro) | `#0f172a` (Texto escuro) | Títulos e textos de alto contraste |
| `--color-secondary-text` | `#94a3b8` (Slate 400) | `#64748b` (Slate 500) | Legendas, metadados e instruções |
| `--color-accent-teal` | `#14b8a6` (Teal 500) | `#0d9488` (Teal 600) | Ações primárias, bordas e destaque ativo |
| `--color-accent-yellow` | `#eab308` (Amarelo Ouro) | `#ca8a04` (Amarelo Escuro) | Moedas, troféus e alertas pedagógicos |
| `--color-accent-purple` | `#a855f7` (Roxo Mágico) | `#9333ea` (Roxo Escuro) | Indicadores de nível, XP e magia |

A alternância é governada pelo [`ThemeContext.jsx`](../../frontend/src/context/ThemeContext.jsx) e acionada pelo botão flutuante [`ThemeToggleButton.jsx`](../../frontend/src/components/ThemeToggleButton.jsx).

---

## 2. Catálogo de Modais Reutilizáveis

Os modais são componentes controlados via estado com foco em acessibilidade (fechamento por teclado ESC e backdrop click):

| Componente | Localização | Descrição e Comportamento |
| :--- | :--- | :--- |
| **`AvatarSelectionModal.jsx`** | `src/components/` | Grade para escolha e personalização do avatar do perfil ou do tabuleiro. |
| **`ConfirmationModal.jsx`** | `src/components/` | Modal genérico de confirmação para ações destrutivas (excluir turma, remover rascunho). |
| **`DeleteAccountModal.jsx`** | `src/components/` | Modal de segurança para solicitação de exclusão definitiva de conta (LGPD). |
| **`FeedbackModal.jsx`** | `src/components/` | Caixa de diálogo de avaliação e nota por estrelas ao concluir uma atividade. |
| **`HelpModal.jsx`** | `src/components/` | Modal contextual de FAQ e suporte ao usuário ativado via [`HelpModalContext`](../../frontend/src/context/HelpModalContext.jsx). |
| **`TermsOfUseModal.jsx`** | `src/components/` | Apresentação dos Termos de Uso e Política de Privacidade durante o cadastro. |
| **`MedalDetailModal.jsx`** | `src/components/activity/` | Detalhes de uma medalha conquistada, com critérios pedagógicos de desbloqueio. |
| **`StatsModal.jsx`** | `src/components/activity/` | Visão analítica de estatísticas do aluno dentro da atividade imersiva. |
| **`AIConfigModal.jsx`** | `src/components/activity/` | Painel de ajuste fino dos hiperparâmetros e modelo Gemini no pipeline de geração. |

---

## 3. Feedback Visual e Háptico

- **`ToastNotification.jsx` & `ToastContext.jsx`:** Mensagens flutuantes animadas com temporizador automático de dismiss (3 a 5 segundos) para avisos de sucesso, erro, cópia de link e alertas de rede.
- **`ConfettiContext.jsx`:** Aciona animação de explosão de confetes e partículas na tela quando o estudante atinge marcos importantes (conclusão de 100% do tabuleiro ou conquista de medalhas raras).

---

## 4. Hooks Customizados (`src/hooks/`)

| Hook | Arquivo | Finalidade |
| :--- | :--- | :--- |
| **`useActivityLogic`** | `useActivityLogic.js` | Encapsula a lógica de navegação entre passos, validação de respostas e cálculo de recompensas do tabuleiro. |
| **`useAnalytics`** | `useAnalytics.js` | Envia eventos assíncronos de telemetria científica para a rota `/api/analytics/log`. |
| **`useAssetLoader`** | `useAssetLoader.js` | Pré-carrega imagens e sprites de avatares/cenários na memória do navegador para eliminar *flickering* durante a transição do tabuleiro (ADR-010). |
| **`useAutoSave`** | `useAutoSave.js` | Realiza salvamento automático com debounce de rascunhos de atividades no wizard do professor. |
| **`useAuthOperations`** | `useAuthOperations.js` | Facilita operações de login, logout e renovação de token JWT. |
| **`useDashboardData`** | `useDashboardData.js` | Agrega e gerencia o ciclo de carregamento das métricas dos dashboards. |
| **`useGoogleSignIn`** | `useGoogleSignIn.js` | Lida com o handshake do token de identidade do Google Identity Services. |
| **`useKonamiCode`** | `useKonamiCode.js` | Easter egg para atalhos de depuração em ambiente de desenvolvimento. |
| **`usePasswordManagement`**| `usePasswordManagement.js` | Lógica de validação de requisitos de complexidade de senha. |
| **`useProfileManagement`** | `useProfileManagement.js` | Gerencia atualizações do perfil e preferências de jogo do usuário. |
