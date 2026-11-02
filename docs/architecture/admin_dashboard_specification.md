# Especificação Técnica e Auditoria do Painel Administrativo & Telemetria

> **Documento:** `docs/architecture/admin_dashboard_specification.md`  
> **Status:** Aprovado / Em Implementação  
> **Escopo:** Módulo de Administração, Telemetria, Onboarding e Mecanismos de Feedback

---

## 1. Visão Geral do Painel do Administrador

O módulo administrativo (`/admin`) do **Gamefica.Edu** fornece aos gestores e pesquisadores a visão consolidada de adesão, utilização de recursos pedagógicos, saúde do sistema e engajamento da gamificação.

### Arquitetura de Componentes
O painel administrativo é particionado em visões especializadas:
1. **`DashboardOverviewPage.jsx`**: KPIs operacionais em tempo real, crescimento temporal de contas, feed de auditoria de eventos e status de atividades no pipeline do aluno.
2. **`SystemAnalyticsPage.jsx`**: Análise aprofundada de funil, perfil de usuários (professores vs alunos), tempos médios de sessão e engajamento com trilhas.
3. **`UserManagementPage.jsx`**: Listagem, ativação/desativação e auditoria de papéis (`aluno`, `professor`, `admin`).
4. **`ClassManagementPage.jsx`**: Supervisão de turmas, códigos de acesso e alocação de discentes.
5. **`ActivityManagementPage.jsx`**: Curadoria de modelos públicos de tabuleiros pedagógicos e templates.

---

## 2. Auditoria Antagônica Multi-Perspectiva

Seguindo as diretrizes de **Revisão Antagônica ("Reviewer 2")** com as skills de `critical-peer-review`, `ux-instructional-design`, `empirical-research-se` e `tech-lead`:

### 2.1. Tutoriais e Tours Guiados (`react-joyride`)
- **Situação Atual:**
  - Implementado em `TutorialContext.jsx` e `frontend/src/data/tutorialSteps.js`.
  - Disparado automaticamente na primeira sessão do usuário e salvo no backend via endpoint `/api/auth/user/update-onboarding`.
- **Apontamentos Críticos Antagônicos:**
  1. *Falta de Controle Explícito:* Se o usuário pular o tutorial acidentalmente por distração motora ou fechamento de popup, não havia um botão persistente e visível de "Reiniciar Tour" nas telas centrais.
  2. *Dessincronização em Telas Dinâmicas:* Quando elementos do DOM demoram para renderizar devido a requisições de API assíncronas, o Joyride pode emitir `TARGET_NOT_FOUND` e avançar prematuramente. O debounce e skip gracioso implementados atenuam, mas exigem que passos tenham target de fallback.
- **Plano de Remediação:**
  - Garantir que todos os dashboards exponham o gatilho `startTour(steps, key, true)` em botões de ajuda / interrogação na barra superior.

### 2.2. Questionário de Feedback do Professor & Gatilhos
- **Situação Atual:**
  - Modal `FeedbackModal.jsx` com 3 perguntas genéricas (intuitividade, gamificação, texto livre).
  - Gatilho: `activity_count >= 1` (dispara assim que o professor cria uma atividade).
- **Apontamentos Críticos Antagônicos:**
  1. *Invasão Prematura de Fluxo:* Disparar o modal no exato instante em que o professor cria a atividade (antes mesmo de atribuí-la a uma turma ou observar alunos jogando) distorce a avaliação, pois o docente ainda não vivenciou o ciclo pedagógico completo.
  2. *Fragilidade Psicométrica:* 3 perguntas ad-hoc sem fundamentação teórica limitam a validade de construto para uma tese de Doutorado. Deve-se contemplar dimensões do **TAM (Technology Acceptance Model)**: Utilidade Percebida (PU) e Facilidade de Uso Percebida (PEOU).
- **Plano de Remediação:**
  - Refinar a verificação no backend (`analytics_service.py`): o professor torna-se elegível após criar pelo menos 1 atividade E ter pelo menos 1 turma cadastrada.
  - No frontend, permitir o botão "Lembrar mais tarde" (adiamento temporário sem queimar o convite).

### 2.3. Questionário de Feedback do Aluno (Atividade vs Sistema)
- **Situação Atual:**
  - Feedback da Atividade: escala de 1 a 5 estrelas em `ActivityRating`.
  - Feedback do Sistema: 3 perguntas em `FeedbackModal.jsx` disparado quando `log_count >= 5`.
- **Apontamentos Críticos Antagônicos:**
  1. *Gatilho Arbitrário:* Um aluno acumula 5 logs em menos de 10 segundos apenas navegando na home e no perfil. Perguntar a opinião do sistema sem que o aluno tenha completado sequer uma etapa gera respostas vazias ("ruído amostral").
  2. *Dupla Dimensão do Feedback:* O aluno precisa avaliar:
     - **Micro-nível (A Atividade):** Dificuldade da tarefa, clareza do conteúdo do professor (imediatamente ao concluir o tabuleiro).
     - **Macro-nível (A Plataforma):** Motivação por recompensas gamificadas, diversão e ausência de bugs (após concluir pelo menos 1 tabuleiro).
- **Plano de Remediação:**
  - Ajustar o gatilho do aluno em `analytics_service.py` para exigir que o aluno possua ao menos 1 registro em `StudentProgress` com status `completed` (ou `score > 0`), garantindo vivência concreta.

### 2.4. Telemetria e Logs de Eventos
- **Situação Atual:**
  - Tabela `EventLog` registra `user_id`, `action`, `section`, `details` (JSON), `ip_address` e `timestamp`.
  - Hook `useAnalytics` dispara eventos nas transições de rotas e cliques importantes.
- **Apontamentos Críticos Antagônicos:**
  1. *Heterogeneidade de Payload:* Falta garantia de campos canônicos no campo `details`. Para viabilizar análise estatística em Python/R posteriormente, todo evento deve conter `session_id`, `viewport`, e quando aplicável, `activity_id` e `duration_seconds`.
  2. *Fail-Open Resiliente:* O serviço de telemetria já opera em modo não-bloqueante (`api.interceptors` silencia falhas de telemetria), o que é correto para não travar a experiência do usuário.

---

## 3. Melhorias Imediatas Implementadas no Painel Admin

1. **Refatoração do `DashboardOverviewPage.jsx`:**
   - Remoção de `fetch()` manuais com interpolação de `import.meta.env.VITE_API_URL`.
   - Utilização do cliente `api` Axios centralizado com tratamento correto de cabeçalhos de autenticação Bearer e interceptores de erro.
   - Refinamento visual com feedbacks de estado vazio (`empty-state`) e cards semânticos.
2. **Atualização da Regra de Elegibilidade (`analytics_service.py`):**
   - Aluno só recebe convite de avaliação de sistema após ter completado ao menos 1 atividade pedagógica.
   - Tratamento de idempotência e mitigação de spam de modal.
