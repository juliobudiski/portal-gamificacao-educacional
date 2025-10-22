// frontend/src/components/activity/GameBoardConfig.js
// Este arquivo centraliza todas as configurações visuais do tabuleiro para fácil manutenção.

// 1. Configuração dos ÍCONES para os passos da trilha e elementos do hub
export const elementConfig = {
    path: {
        // 'mission' e 'final_reward' foram removidos daqui
        narrative: { icon: '/board/narrative_board.webp', name: 'Narrativa' },
        quiz: { icon: '/board/quiz_board.webp', name: 'Quiz' },
    },
    hub: {
        // Adicionados aqui para serem tratados como elementos do hub/tabuleiro
        mission: { icon: '/board/mission_character_board.webp', name: 'Missão' },
        final_reward: { icon: '/board/end_board.webp', name: 'Recompensa Final' },
        roulette: { icon: '/board/roleta_board.webp', name: 'Roleta' },
        slot_machine: { icon: '/board/slotmachine_board.webp', name: 'Caça-níquel' },
        ranking: { icon: '/board/ranking_board.webp', name: 'Ranking' },
        badges: { icon: '/board/badges_board.webp', name: 'Medalhas' },
        chat: { icon: '/board/chat_board.webp', name: 'Chat' },
        store: { icon: '/board/store_board.webp', name: 'Loja' },
        avatar_customization: { icon: '/board/meuestilo_board.webp', name: 'Meu Estilo' },
        forum: { icon: '/board/fox_board.webp', name: 'Fórum' },
    }
};

// 2. Lista de todas as DECORAÇÕES disponíveis para o mapa
export const decorationConfig = [
    // Árvores (agora com mais variedade)
    { id: 'tree1', src: '/board/tree_board.webp', className: 'decoration-tree', weight: 3 },
    { id: 'tree2', src: '/board/tree_board_2.webp', className: 'decoration-tree', weight: 3 },
    { id: 'tree3', src: '/board/tree_board_3.webp', className: 'decoration-tree', weight: 2 },
    { id: 'tree4', src: '/board/tree_board_4.webp', className: 'decoration-tree', weight: 2 },
    { id: 'tree5', src: '/board/tree_board_5.webp', className: 'decoration-tree', weight: 1 },
    { id: 'tree6', src: '/board/tree_board_6.webp', className: 'decoration-tree', weight: 1 },
    { id: 'tree7', src: '/board/tree_board_7.webp', className: 'decoration-tree', weight: 1 },

    // Rochas (expandida)
    { id: 'rock1', src: '/board/rock_board.webp', className: 'decoration-rock', weight: 3 },
    { id: 'rock2', src: '/board/rock_board_2.webp', className: 'decoration-rock', weight: 3 },
    { id: 'rock3', src: '/board/rock_board_3.webp', className: 'decoration-rock', weight: 2 },
    { id: 'rock4', src: '/board/rock_board_4.webp', className: 'decoration-rock', weight: 2 },
    { id: 'rock5', src: '/board/rock_board_5.webp', className: 'decoration-rock', weight: 1 },
];

// PONTOS DE APARIÇÃO OTIMIZADOS - Evitando a área inferior do hub
// 3. Grade de PONTOS DE APARIÇÃO possíveis para as decorações
export const decorationSpawnPoints = [
    // Área superior - muitas decorações
    { x: '3%', y: '3%', size: 'large' }, { x: '8%', y: '7%', size: 'normal' },
    { x: '12%', y: '4%', size: 'small' }, { x: '17%', y: '2%', size: 'small' },
    { x: '22%', y: '6%', size: 'normal' }, { x: '28%', y: '3%', size: 'small' },
    { x: '35%', y: '5%', size: 'small' }, { x: '42%', y: '2%', size: 'normal' },
    { x: '50%', y: '4%', size: 'small' }, { x: '58%', y: '6%', size: 'small' },
    { x: '65%', y: '3%', size: 'normal' }, { x: '72%', y: '5%', size: 'small' },
    { x: '78%', y: '2%', size: 'small' }, { x: '85%', y: '6%', size: 'normal' },
    { x: '92%', y: '4%', size: 'small' }, { x: '96%', y: '8%', size: 'large' },

    // Laterais esquerdas - denso
    { x: '2%', y: '15%', size: 'normal' }, { x: '4%', y: '25%', size: 'small' },
    { x: '1%', y: '35%', size: 'large' }, { x: '3%', y: '45%', size: 'normal' },
    { x: '5%', y: '55%', size: 'small' }, { x: '2%', y: '65%', size: 'normal' },
    { x: '4%', y: '75%', size: 'small' }, { x: '1%', y: '85%', size: 'large' },

    // Laterais direitas - denso
    { x: '92%', y: '20%', size: 'normal' },
    { x: '88%', y: '30%', size: 'small' },
    { x: '91%', y: '40%', size: 'large' },
    { x: '86%', y: '50%', size: 'normal' },
    { x: '90%', y: '60%', size: 'small' },
    { x: '87%', y: '70%', size: 'normal' },
    { x: '90%', y: '80%', size: 'small' },
    { x: '89%', y: '90%', size: 'large' },

    // Área central superior - poucas e pequenas
    { x: '25%', y: '20%', size: 'small' }, { x: '35%', y: '18%', size: 'small' },
    { x: '45%', y: '22%', size: 'small' }, { x: '55%', y: '19%', size: 'small' },
    { x: '65%', y: '21%', size: 'small' }, { x: '75%', y: '17%', size: 'small' },

    // Área central intermediária - muito espaçadas
    { x: '30%', y: '40%', size: 'small' }, { x: '50%', y: '45%', size: 'small' },
    { x: '70%', y: '42%', size: 'small' }, { x: '40%', y: '55%', size: 'small' },
    { x: '60%', y: '52%', size: 'small' },

    // Área inferior (acima do hub) - pequenas e discretas
    { x: '20%', y: '65%', size: 'small' }, { x: '30%', y: '68%', size: 'small' },
    { x: '40%', y: '72%', size: 'small' }, { x: '50%', y: '75%', size: 'small' },
    { x: '60%', y: '70%', size: 'small' }, { x: '70%', y: '73%', size: 'small' },
    { x: '80%', y: '67%', size: 'small' },

    // Cantos inferiores - agrupamentos naturais
    { x: '8%', y: '88%', size: 'normal' }, { x: '12%', y: '92%', size: 'small' },
    { x: '5%', y: '95%', size: 'large' }, { x: '15%', y: '96%', size: 'small' },
    { x: '88%', y: '90%', size: 'normal' }, { x: '92%', y: '94%', size: 'small' },
    { x: '85%', y: '97%', size: 'large' }, { x: '95%', y: '92%', size: 'small' }
];

// 4. Todas as IMAGENS ESTRUTURAIS fixas do tabuleiro
export const boardStructuralImages = [
    '/board/background_board.webp',
    '/board/wood_border_hub.webp',
    '/board/wood_plank_bg.webp',
    '/board/tab_border.webp'
];