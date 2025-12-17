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

export const TEACHER_CREATION_INITIAL_STEPS = [
    {
        target: 'body',
        content: 'Vamos criar sua primeira atividade gamificada? É mais fácil do que parece.',
        placement: 'center',
    },
    {
        target: '#tour-start-scratch',
        content: 'Se quiser controle total, comece do zero e personalize cada detalhe.',
    },
    {
        target: '#tour-choose-template',
        content: 'Ou use um modelo pronto (como Caça ao Tesouro) para ganhar tempo.',
    },
    {
        target: '.text-4xl', // Título da página (ou use um ID específico se preferir)
        content: 'Aqui você define o tema da sua aula.',
    },
];

// Este segundo tour só será disparado DEPOIS que o formulário abrir
export const TEACHER_CREATION_FORM_STEPS = [
    {
        target: '#tour-progress-bar',
        content: 'Acompanhe seu progresso aqui em cima.',
        placement: 'bottom',
    },
    {
        target: '#tour-form-container',
        content: 'Preencha os dados da atividade aqui.',
    },
    {
        target: '#tour-next-button',
        content: 'Quando terminar, clique aqui para avançar.',
    }
];