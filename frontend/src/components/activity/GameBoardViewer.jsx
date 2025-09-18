import React from 'react';

// Os estilos foram completamente reescritos para corresponder ao novo design do prompt.
const GameBoardStyles = `
    /* === Variáveis de Tema (Fácil de Customizar) === */
    :root {
        --font-family-main: 'Inter', sans-serif;
        --color-path: #a16207; /* Marrom da trilha */
        --color-hub-bg: rgba(0, 0, 0, 0.2); /* Fundo do Hub */
        --color-hub-border: #4a2c2a;
        --color-active-glow: #facc15; /* Amarelo dourado */
        --color-completed-glow: #4ade80; /* Verde claro */
        --color-locked-text: #9ca3af;
    }

    /* === Animações Globais === */
    @keyframes pulse-glow {
        0%, 100% {
            box-shadow: 0 0 15px 3px var(--color-active-glow);
            transform: scale(1);
        }
        50% {
            box-shadow: 0 0 25px 8px var(--color-active-glow);
            transform: scale(1.05);
        }
    }
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
    }

    /* === Container Principal do Mapa === */
    .rpg-map-board {
        width: 100%;
        max-width: 900px;
        margin: auto;
        padding: 2rem 1rem;
        font-family: var(--font-family-main);
        background-image: url('/board/background_board.png');
        background-size: cover;
        background-position: center;
        border-radius: 2rem;
        border: 10px solid;
        border-image: url('/board/wood_border.png') 30 stretch; /* Borda de madeira texturizada */
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.5);
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    /* === Área da Trilha de Progressão === */
    .progress-path-area {
        position: relative;
        flex-grow: 1;
        min-height: 400px; /* Altura mínima para a trilha */
    }

    /* O caminho sinuoso (usando um SVG de fundo) */
    .progress-path-area::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background-image: url('/board/winding_path.svg'); /* Crie um SVG de caminho sinuoso */
        background-repeat: no-repeat;
        background-position: center top;
        background-size: contain;
        opacity: 0.6;
    }

    /* Wrapper para cada passo, para posicionamento absoluto */
    .path-node-wrapper {
        position: absolute;
        text-align: center;
        transition: transform 0.3s ease;
    }
    .path-node-wrapper:hover {
        transform: scale(1.05);
        z-index: 10;
    }

    /* O pedestal/base de cada passo */
    .path-node {
        width: 100px;
        height: 100px;
        background-image: url('/board/stone_plinth.png'); /* Imagem do pedestal */
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        filter: drop-shadow(4px 6px 5px rgba(0,0,0,0.4));
    }
    .path-node img {
        width: 60px;
        height: 60px;
        object-fit: contain;
        transition: transform 0.3s ease;
    }

    /* Rótulo do passo */
    .path-label {
        font-size: 0.8rem;
        font-weight: 700;
        color: white;
        margin-top: -10px;
        background-color: rgba(0, 0, 0, 0.6);
        padding: 2px 10px;
        border-radius: 12px;
        display: inline-block;
    }

    /* === Estilos de Estado dos Passos === */
    .path-node--active {
        animation: pulse-glow 2.5s infinite ease-in-out;
        cursor: pointer;
    }
    .path-node--active img {
        animation: float 3s infinite ease-in-out;
    }

    .path-node--completed::after {
        content: '✔';
        position: absolute;
        top: 5px; right: 5px;
        width: 28px; height: 28px;
        background-color: var(--color-completed-glow);
        color: #14532d;
        font-weight: bold;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .path-node--locked {
        filter: grayscale(1) opacity(0.5) drop-shadow(2px 2px 2px rgba(0,0,0,0.2));
        cursor: not-allowed;
    }

    /* === Hub da Vila === */
    .hub-village {
        grid-area: hub;
        padding: 1.5rem 1rem;
        margin-top: 2rem;
        background-image: url('/board/cobblestone_bg.png'); /* Textura de paralelepípedo */
        border-radius: 1rem;
        border-top: 6px solid var(--color-hub-border);
        box-shadow: inset 0 5px 15px rgba(0,0,0,0.4);
        display: flex;
        justify-content: center;
        align-items: flex-end;
        gap: 1.5rem;
        flex-wrap: wrap;
    }

    /* Edifício/Marco do Hub */
    .hub-building {
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s ease;
    }
    .hub-building:hover {
        transform: translateY(-10px);
    }
    .hub-building img {
        width: 70px;
        height: 70px;
        object-fit: contain;
        filter: drop-shadow(3px 5px 4px rgba(0,0,0,0.3));
    }
    .hub-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
        margin-top: 0.25rem;
        background-color: rgba(0,0,0,0.5);
        padding: 2px 8px;
        border-radius: 8px;
    }
`;

// Mapeamento dos ícones para fácil acesso
const elementConfig = {
    path: {
        narrative: { icon: '/board/narrative_board.png', name: 'Narrativa' },
        quiz: { icon: '/board/quiz_board.png', name: 'Quiz' },
    },
    hub: {
        roulette: { icon: '/board/roleta_board.png', name: 'Roleta' },
        slot_machine: { icon: '/board/slotmachine_board.png', name: 'Caça-níquel' },
        ranking: { icon: '/board/ranking_board.png', name: 'Ranking' },
        badges: { icon: '/board/badges_board.png', name: 'Medalhas' },
        chat: { icon: '/board/chat_board.png', name: 'Chat' },
        store: { icon: '/board/store_board.png', name: 'Loja' },
        mission: { icon: '/board/mission_character_board.png', name: 'Missão' },
    }
};

function GameBoardViewer({ gamificationDesign, studentProgress, onStepClick, userRole }) { 
    const completedStepsSet = userRole === 'aluno' 
        ? new Set(studentProgress?.completed_steps || []) 
        : new Set();
    
    let activeStepId = null;
    if (userRole === 'aluno' && gamificationDesign.progression_path) {
        for (const step of gamificationDesign.progression_path) {
            if (!completedStepsSet.has(step.id)) {
                activeStepId = step.id;
                break;
            }
        }
    }

    const getStepStatus = (step) => {
        if (userRole === 'professor') return 'active'; 
        if (completedStepsSet.has(step.id)) return 'completed';
        if (step.id === activeStepId) return 'active';
        return 'locked';
    };

    // Função para posicionar os passos na tela de forma sinuosa
    const getStepPosition = (index, totalSteps) => {
        const positions = [ // Posições pré-definidas para até ~8 passos
            { top: '10%', left: '20%' }, { top: '25%', left: '60%' },
            { top: '45%', left: '30%' }, { top: '60%', left: '70%' },
            { top: '75%', left: '40%' }, { top: '5%', left: '80%' },
            { top: '35%', left: '5%' },  { top: '80%', left: '15%' },
        ];
        return positions[index % positions.length]; // Usa módulo para evitar erro se tiver mais passos
    };

    return (
        <>
            <style>{GameBoardStyles}</style>
            
            <div className="rpg-map-board">
                {/* --- Área da Trilha de Progressão Dinâmica --- */}
                <div className="progress-path-area">
                    {(gamificationDesign.progression_path || []).map((step, index, arr) => {
                        const status = getStepStatus(step);
                        const config = elementConfig.path[step.type];
                        if (!config) return null;

                        return (
                            <div
                                key={step.id}
                                className="path-node-wrapper"
                                style={getStepPosition(index, arr.length)}
                                onClick={() => status === 'active' && onStepClick(step)}
                            >
                                <div className={`path-node path-node--${status}`}>
                                    <img src={config.icon} alt={config.name} />
                                </div>
                                <div className="path-label">
                                    {step.content?.title || config.name}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- Hub da Vila Dinâmico --- */}
                <div className="hub-village">
                    {(gamificationDesign.hub_elements || []).map(hubElement => {
                        if (!hubElement.enabled) return null;
                        const config = elementConfig.hub[hubElement.type];
                        if (!config) return null;

                        return (
                            <div key={hubElement.id} className="hub-building" title={config.name}>
                                <img src={config.icon} alt={config.name} />
                                <div className="hub-label">{config.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

export default GameBoardViewer;
