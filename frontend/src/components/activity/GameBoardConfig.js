// frontend/src/components/activity/GameBoardConfig.js
// Este arquivo centraliza todas as configurações visuais do tabuleiro para fácil manutenção.

/**
 * @module GameBoardConfig
 * @description
 * Centralized configuration file for the game board's visual assets, themes, and layout coordinates.
 * 
 * Architectural Decisions:
 * - Theme Dictionary: Uses a `BOARD_THEMES` constant to map theme IDs to their respective metadata, simplifying theme switching.
 * - Dynamic Asset Loading: Provides a `getThemeAssets(themeId)` factory function that dynamically resolves image paths based on the active theme.
 * - Coordinate Grid Strategy: Pre-defines a static array of `decorationSpawnPoints` to ensure scattered placement of decorations without complex runtime collision detection.
 */

// 1. Definição dos Temas Disponíveis
export const BOARD_THEMES = {
    default: {
        id: 'default',
        name: 'Vila da Aventura (Padrão)',
        basePath: '/board/default',
        style: 'realistic' // pode ser usado para classes CSS específicas se precisar
    },
    fluxograma: {
        id: 'fluxograma', // O Editor salvará 'fluxograma' no banco
        name: 'Fluxograma (Clean)',
        basePath: '/board/default', // Reusa assets do default para o Editor não quebrar
        style: 'minimalist'
    },
    tibia: {
        id: 'tibia',
        name: 'RPG Clássico (Tibia)',
        basePath: '/board/tibia',
        style: 'pixelated' // útil para aplicar image-rendering: pixelated no CSS
    },
    adventure_time: {
        id: 'adventure_time',
        name: 'Reino da Aventura',
        basePath: '/board/adventure_time',
        style: 'cartoon'
    }
};

/**
 * Retorna a configuração completa dos assets baseada no tema.
 * @param {string} themeId - O ID do tema (default, tibia, etc).
 */
export const getThemeAssets = (themeId = 'default') => {
    // Fallback para default se o tema não existir
    const theme = BOARD_THEMES[themeId] || BOARD_THEMES.default;

    // ATENÇÃO: Se suas pastas são físicas em public/board, o basePath já deve começar com /
    // Ex: '/board/default'
    const path = theme.basePath;

    return {
        // Elementos da trilha
        // OBS: Note o uso de CRASE (backtick) ` ` para permitir a variável ${path}
        path: {
            narrative: { icon: `${path}/narrative_board.webp`, name: 'Narrativa' },
            quiz: { icon: `${path}/quiz_board.webp`, name: 'Quiz' },
            content: { icon: `${path}/content_board.webp`, name: 'Conteúdo' },
        },
        hub: {
            mission: { icon: `${path}/mission_character_board.webp`, name: 'Missão' },
            final_reward: { icon: `${path}/end_board.webp`, name: 'Recompensa Final' },
            roulette: { icon: `${path}/roleta_board.webp`, name: 'Roleta' },
            slot_machine: { icon: `${path}/slotmachine_board.webp`, name: 'Máquina da Sorte' },
            ranking: { icon: `${path}/ranking_board.webp`, name: 'Ranking' },
            badges: { icon: `${path}/badges_board.webp`, name: 'Medalhas' },
            chat: { icon: `${path}/chat_board.webp`, name: 'Chat' },
            store: { icon: `${path}/store_board.webp`, name: 'Loja' },
            avatar_customization: { icon: `${path}/meuestilo_board.webp`, name: 'Meu Estilo' },
            forum: { icon: `${path}/fox_board.webp`, name: 'Fórum' },
        },
        // Decorações
        decorations: [
            { id: 'tree1', src: `${path}/tree_board.webp`, className: 'decoration-tree', weight: 3 },
            { id: 'tree2', src: `${path}/tree_board_2.webp`, className: 'decoration-tree', weight: 3 },
            { id: 'tree3', src: `${path}/tree_board_3.webp`, className: 'decoration-tree', weight: 2 },
            { id: 'tree4', src: `${path}/tree_board_4.webp`, className: 'decoration-tree', weight: 2 },
            { id: 'tree5', src: `${path}/tree_board.webp`, className: 'decoration-tree', weight: 1 },
            { id: 'tree6', src: `${path}/tree_board_3.webp`, className: 'decoration-tree', weight: 1 },
            { id: 'tree7', src: `${path}/tree_board_4.webp`, className: 'decoration-tree', weight: 1 },

            { id: 'rock1', src: `${path}/rock_board.webp`, className: 'decoration-rock', weight: 3 },
            { id: 'rock2', src: `${path}/rock_board_2.webp`, className: 'decoration-rock', weight: 3 },
            { id: 'rock3', src: `${path}/rock_board_3.webp`, className: 'decoration-rock', weight: 2 },
            { id: 'rock4', src: `${path}/rock_board_4.webp`, className: 'decoration-rock', weight: 2 },
            { id: 'rock5', src: `${path}/rock_board.webp`, className: 'decoration-rock', weight: 1 },
        ],
        // Imagens Estruturais
        structural: [
            `${path}/background_board.webp`, // Verifique o nome correto do background
            `${path}/wood_border_hub.webp`,
            `${path}/bg_tile.webp`,
            `${path}/tab_border.webp`
        ]
    };
};

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

// Structural Images para pré-load (Global ou Default)
// Como isso é usado apenas para pré-load, podemos apontar para o default ou fazer dinâmico se necessário
export const boardStructuralImages = [
    '/board/default/background_board.webp',
    '/board/default/wood_border_hub.webp',
    '/board/default/wood_plank_bg.webp',
    '/board/default/tab_border.webp'
];