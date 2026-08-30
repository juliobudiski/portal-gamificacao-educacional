/**
 * Passos do Tutorial (Joyride)
 * 
 * Arquivo de configuração contendo os passos, seletores CSS e textos (tooltips)
 * utilizados pela biblioteca react-joyride para guiar os novos usuários.
 */
export const STUDENT_DASHBOARD_STEPS = [
    {
        target: 'body', // Alvo genérico (centro da tela)
        content: 'Bem-vindo ao seu Dashboard! Vamos dar uma olhada rápida.',
        placement: 'center',
    },
    {
        target: '#tour-classes-section', // O ID que colocamos na Section de turmas
        content: 'Aqui você vê todas as turmas em que está matriculado.',
    },
    {
        target: '#tour-activities-section', // O ID da Section de atividades
        content: 'Suas missões pendentes aparecem aqui. Fique atento aos prazos!',
    },
    {
        target: '#tour-xp-display', // O ID do Card de XP
        content: 'Acompanhe seu nível, XP e conquistas globais aqui.',
    },
    {
        target: '#tour-student-menu', // O ID do botão no App.jsx
        content: 'Use este menu para acessar seu perfil e outras configurações.',
    }
];

// --- TOUR 1: DASHBOARD ---
export const TEACHER_DASHBOARD_STEPS = [
    {
        target: 'body',
        content: 'Olá, Professor(a)! Vamos fazer um tour rápido pela sua central de comando.',
        placement: 'center',
    },
    {
        target: '#tour-dash-classes',
        content: 'Aqui você gerencia suas turmas e vê o progresso geral.',
    },
    {
        target: '#tour-dash-create-btn',
        content: 'O atalho mais rápido para criar uma nova missão gamificada.',
    },
    {
        target: '#tour-dash-bank',
        content: 'Acesse suas atividades salvas e edite-as quando quiser.',
    },
    {
        target: '#tour-dash-performance',
        content: 'Acompanhe métricas detalhadas de acertos e erros dos alunos.',
    },
    {
        target: '#tour-dash-ranking',
        content: 'Veja quais professores estão engajando mais alunos na plataforma.',
    },
    {
        target: '#tour-profile-menu',
        content: 'Aqui ficam os atalhos.',
    },

    {
        target: '#tour-dash-create-btn',
        content: 'Para continuar o tutorial, clique em "Criar Atividade" agora!',
        hideFooter: true,
        spotlightClicks: true,
        placement: 'top',
        disableBeacon: true
    }
];

// --- TOUR 2: SELEÇÃO (Inicia ao abrir a pg de criação) ---
export const ACTIVITY_SELECTION_STEPS = [
    {
        target: 'body',
        content: 'Vamos criar sua primeira atividade gamificada? É mais fácil do que parece.',
        placement: 'center',
        disableBeacon: true
    },
    {
        target: '#tour-start-scratch',
        content: 'Para controle total, comece do zero.',
    },
    {
        target: '#tour-choose-scratch',
        content: 'Ou escolha um modelo pronto. Clique em um template para continuar!',
        hideFooter: true,
        spotlightClicks: true,
        placement: 'top',
        disableBeacon: true
    }
];

// --- TOUR 3: WIZARD - PARTE 1 (Cenário) ---
export const WIZARD_SCENARIO_STEPS = [
    {
        target: '#tour-step-scenario-inputs',
        content: 'Defina o tema e a história base da sua aula aqui.',
        disableBeacon: true
    },
    {
        target: '#tour-next-button',
        content: 'Após preencher, clique aqui para avançar.',
        hideFooter: true,
        spotlightClicks: true,
        placement: 'top',
        disableBeacon: true
    }
];

// --- TOUR 4: WIZARD - PARTE 2 (Dinâmica e Perfis) ---
// Este array deve ser chamado quando o usuário chegar no Step 2 ou 3 do form
export const WIZARD_DYNAMICS_STEPS = [
    {
        target: '#tour-step-dynamics-options',
        content: 'Sua atividade será individual ou em grupo?',
        spotlightClicks: true,
        placement: 'top',
        disableBeacon: true
    },
    {
        target: '#tour-next-button',
        content: 'Após preencher, clique aqui para avançar.',
        hideFooter: true,
        spotlightClicks: true,
        placement: 'top',
        disableBeacon: true
    }
];

export const WIZARD_PROFILES_STEPS = [
    {
        target: '#tour-step-profiles',
        content: 'Estes perfis influenciam como a ferramenta vai sugerir elementos de jogos.',
        disableBeacon: true
    },
    {
        target: '#tour-next-button',
        content: 'Após preencher, clique aqui para avançar.',
        hideFooter: true,
        spotlightClicks: true,
        placement: 'top',
        disableBeacon: true
    }
];

// --- TOUR 5: WIZARD - PARTE 3 (Elementos) ---
export const WIZARD_ELEMENTS_STEPS = [
    {
        target: '#tour-step-elements',
        content: 'Escolha quais mecânicas (moedas, XP) estarão ativas.',
        disableBeacon: true
    },
    {
        target: '#tour-next-button',
        content: 'Após preencher, clique aqui para avançar para o Tabuleiro.',
        hideFooter: true,
        spotlightClicks: true,
        placement: 'top',
        disableBeacon: true
    }
];

// --- TOUR 6: WIZARD - PARTE 4 (Tabuleiro) ---
export const WIZARD_GAMEBOARD_STEPS = [
    {
        target: '#tour-gameboard-intro',
        content: 'Agora vamos para a parte divertida: O Editor de Tabuleiro!',
        disableBeacon: true
    },
    {
        target: '#tour-editor-canvas',
        content: 'Este é seu tabuleiro.',
        disableBeacon: true
    },
    {
        target: '#tour-editor-add-narrative',
        content: 'Adicione trechos de história para contextualizar o aluno.',
        disableBeacon: true
    },
    {
        target: '#tour-editor-add-quiz',
        content: 'Crie desafios (perguntas) que valem nota ou XP.',
        disableBeacon: true
    },
    {
        target: '#tour-editor-add-content',
        content: 'Adicione conteudo em texto dinamico e acesso a algum video.',
        disableBeacon: true
    },
    {
        target: '#tour-editor-ai-assist',
        content: 'Sem ideias? Gere um rascunho!'
    },
];


export const WIZARD_END_STEPS = [
    {
        target: '#tour-final-privacy',
        content: 'Defina se outros professores podem ver e clonar sua atividade.',
        disableBeacon: true
    },
    {
        target: '#tour-final-save',
        content: 'Não esqueça de salvar seu trabalho!',
        hideFooter: true,
        spotlightClicks: true,
        placement: 'top',
        disableBeacon: true
    }
];