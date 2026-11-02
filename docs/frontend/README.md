# Documentação Técnica e Funcional do Frontend (Portal GamificaEdu)

> **Status:** Ativo & 100% Atualizado  
> **Escopo:** Frontend React (Vite 7, React Router, TailwindCSS, Socket.IO, Framer Motion)  
> **Metodologia:** Clean Architecture, Modular Design, Accessible UI & Role-Based Workflows  

---

## 1. Visão Geral do Sistema e Arquitetura da Interface

O frontend do **Portal GamificaEdu** é uma Single Page Application (SPA) reativa e imersiva construída para apoiar docentes e discentes em experiências gamificadas de aprendizagem. 

A documentação está estruturada em módulos detalhados para cada perfil e subsistema:

```
docs/frontend/
├── README.md                      # Este Índice Geral do Frontend
├── public_and_auth_screens.md     # Telas Públicas, Autenticação, Onboarding e Perfil
├── student_experience.md          # Área do Aluno: Dashboard, Atividades e Cena do Tabuleiro
├── teacher_authoring.md           # Área do Professor: Wizard em 8 Etapas, Gestão de Turmas e Editores
├── admin_console.md               # Console Administrativo, Telemetria e Gestão de Usuários
├── components_and_design_system.md # Design System, Temas, Contextos, Modais e Componentes
└── ui_ux_future_improvements_99.md # Catálogo de 99 Melhorias Estratégicas de UI/UX para o Futuro
```

Consulte também a [Especificação Arquitetural do Frontend](../architecture/frontend_architecture.md).

---

## 2. Mapa Completo de Rotas e Telas (39 Páginas)

| Domínio de Negócio | Total de Telas | Arquivos de Página (`src/pages/`) | Nível de Cobertura Documentada |
| :--- | :---: | :--- | :---: |
| **Público e Autenticação** | 8 | `HomePage`, `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `AboutUsPage`, `ContactPage`, `NotFoundPage` | 100% |
| **Área do Aluno** | 5 | `StudentDashboardPage`, `JoinClassPage`, `StudentActivityPage`, `StudentPerformancePage`, `ActivityPage` | 100% |
| **Área do Professor** | 15 | `TeacherDashboardPage`, `ActivityCreationPage`, `ActivityEditPage`, `ActivityBankPage`, `ClassManagementPage`, `CreateClassPage`, `ClassDetailsPage`, `ClassEditPage`, `AssignActivityToClass`, `StudentPerformancePage`, `TeacherRankingPage`, `QuizEditorPage`, `NarrativeEditorPage`, `LearningContentEditorPage`, `GameBoardTestPage` | 100% |
| **Área Administrativa** | 7 | `AdminPage`, `DashboardOverviewPage`, `UserManagementPage`, `ActivityManagementPage`, `SystemAnalyticsPage`, `LogExplorerPage`, `LocationMapPage`, `ContactMessagesPage` | 100% |
| **Perfil e Compartilhado** | 4 | `UserProfilePage`, `ActivityPage`, `ClassDetailsPage`, `GameBoardTestPage` | 100% |

---

## 3. Guia Rápido dos Módulos Documentados

1. 🌐 **[Telas Públicas e Autenticação](public_and_auth_screens.md):**
   - Fluxos de boas-vindas, estatísticas em tempo real, login social Google OAuth, recuperação de senhas, formulário de contato com WAF e página sobre nós.
2. 🎓 **[Experiência do Aluno](student_experience.md):**
   - Painel do estudante com visualização de XP vitalício e moedas, auto-matrícula em turmas via código, visualizador imersivo do tabuleiro (`GameBoardViewer`), roleta diária de prêmios, loja de cosméticos e chat em tempo real.
3. 🧑‍🏫 **[Autoria e Gestão do Professor](teacher_authoring.md):**
   - Wizard estruturado em 8 etapas com apoio do Motor de Recomendação Contextual (MDC) e IA generativa (Gemini), editores especializados de Quizzes, Narrativas e Markdown, gestão de turmas e relatórios de aproveitamento.
4. ⚙️ **[Console Administrativo e Auditoria](admin_console.md):**
   - Dashboards analíticos, auditoria de eventos de segurança (`EventLog`), mapa geoespacial de conexões via Leaflet, moderação de atividades e respostas a contatos.
5. 🎨 **[Design System, Contextos e Componentes](components_and_design_system.md):**
   - Sistema de cores semânticas com suporte a temas Claro/Escuro (CSS Custom Properties), matriz dos 8 Context Providers React, catálogo de modais e componentes de feedback háptico/visual (Confetti, Toasts).
6. 💡 **[Catálogo de 99 Melhorias de UI/UX para o Futuro](ui_ux_future_improvements_99.md):**
   - Roteiro estratégico de 99 oportunidades em 11 dimensões de usabilidade (Heurísticas de Nielsen, Acessibilidade WCAG 2.2 AA, Mobile e Microinterações).
