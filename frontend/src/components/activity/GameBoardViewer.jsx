// frontend/src/components/activity/GameBoardViewer.jsx
import React from 'react';

// Importa apenas a configuração de ícones, pois é o que ele precisa para renderizar os nomes e imagens dos passos.
import { elementConfig } from './GameBoardConfig';
import useAssetLoader from '../../hooks/useAssetLoader';

// --- TELA DE CARREGAMENTO (SUB-COMPONENTE) ---
const LoadingScreen = ({ progress, etr }) => (
    <div style={{
        width: '100%',
        height: '500px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'var(--font-family-main)'
    }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Carregando o mundo da atividade...</div>
        <div style={{ width: '80%', backgroundColor: '#2d3748', borderRadius: '8px', overflow: 'hidden', border: '1px solid #4a5568' }}>
            <div style={{
                width: `${progress}%`,
                height: '20px',
                backgroundColor: 'var(--color-active-glow)',
                transition: 'width 0.3s ease-in-out',
                borderRadius: '8px'
            }}></div>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>{progress}%</div>
        {etr && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#a0aec0' }}>
                {etr}
            </div>
        )}
    </div>
);



const GameBoardStyles = `
    /* === Variáveis de Tema === */
    :root {
        --font-family-main: 'Inter', sans-serif;
        --color-active-glow: #facc15; /* Amarelo dourado */
        --color-completed-glow: #4ade80; /* Verde claro */
        --color-path-stroke: #854d0e; /* Cor da borda do caminho */
        --color-path-fill: #a16207; /* Cor do preenchimento do caminho */
    }

    /* === Animações Globais === */
    @keyframes pulse-glow-shape {
        0%, 100% {
            filter: drop-shadow(0 0 6px var(--color-active-glow));
            transform: scale(1);
        }
        50% {
            filter: drop-shadow(0 0 14px var(--color-active-glow));
            transform: scale(1.05);
        }
    }
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
    }

    /* === Container Principal do Mapa === */
    .rpg-map-board {
        width: 100%;
        max-width: 900px;
        margin: auto;
        padding: 1rem;
        font-family: var(--font-family-main);
        background-image: url('/board/background_board.png');
        background-size: cover;
        background-position: center;
        border-radius: 2rem;
        border: 10px solid;
        border-image: url('/board/wood_border.png') 30 stretch;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.5);
        position: relative;
        display: flex;
        flex-direction: column;
    }

    /* === Área da Trilha de Progressão === */
    .progress-path-area {
        position: relative;
        width: 100%;
        height: 500px; /* Altura fixa para o SVG e posicionamento absoluto */
        margin-bottom: 1rem;
    }
    
    /* SVG para desenhar o caminho */
    .path-svg {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: 1; /* O caminho fica no fundo */
        overflow: visible;
    }

    /* Estilo da linha do caminho */
    .path-line {
        fill: none;
        stroke: var(--color-path-fill);
        stroke-width: 12;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(2px 3px 2px rgba(0,0,0,0.4));
    }

    /* Wrapper para cada passo, para posicionamento absoluto */
    .path-node-wrapper {
        position: absolute;
        text-align: center;
        transition: transform 0.3s ease;
        z-index: 5; /* Os nós ficam na frente do caminho */
        width: 110px;
        transform: translate(-50%, -50%); /* Centraliza o wrapper no ponto exato */
    }
    .path-node-wrapper:hover {
        transform: translate(-50%, -50%) scale(1.1);
        z-index: 10;
    }

    /* O elemento clicável que contém a imagem da casa/ícone */
    .path-node {
        width: 90px;
        height: 90px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
    }

    /* A imagem da casinha */
    .path-node-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        transition: transform 0.3s ease, filter 0.3s ease;
        filter: drop-shadow(4px 6px 5px rgba(0,0,0,0.4));
    }
    
    /* === CORREÇÃO DO BRILHO === */
    /* A animação é aplicada diretamente na imagem */
    .path-node--active .path-node-image {
        animation: pulse-glow-shape 2.5s infinite ease-in-out, float 3s infinite ease-in-out;
    }
    
    .path-node--locked {
        cursor: not-allowed;
    }
    .path-node--locked .path-node-image {
        filter: grayscale(1) opacity(0.6);
    }
    
    .path-node--completed .path-node-image::after {
        content: '✔';
        position: absolute;
        bottom: 10px; right: 10px;
        width: 24px; height: 24px;
        background-color: var(--color-completed-glow);
        color: #14532d;
        font-weight: bold;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        z-index: 15;
    }

    /* Rótulo do passo */
    .path-label {
        font-size: 0.8rem;
        font-weight: 700;
        color: white;
        margin-top: -5px;
        background-color: rgba(0, 0, 0, 0.7);
        padding: 2px 10px;
        border-radius: 12px;
        display: inline-block;
        text-shadow: 1px 1px 1px black;
    }

    /* === Hub da Vila (sem alterações significativas) === */
    /* === Hub da Vila - LAYOUT GRID COM CONTROLE DE LINHAS === */
    .hub-village {
        padding: 1.5rem;
        background-image: url('/board/cobblestone_bg.png');
        border-radius: 1rem;
        border-top: 6px solid #4a2c2a;
        box-shadow: inset 0 5px 15px rgba(0,0,0,0.4);
        
        /* MUDANÇA PRINCIPAL: Grid em vez de flex */
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
        gap: 1rem;
        justify-items: center;
        align-items: center;
        
        position: relative;
        z-index: 10;
        max-width: 100%;
        margin: 0 auto;
    }

    /* Para garantir no máximo 4 colunas em telas grandes */
    @media (min-width: 768px) {
        .hub-village {
            grid-template-columns: repeat(4, 1fr);
            gap: 1.2rem;
        }
    }

    /* Em telas pequenas, máximo 3 colunas */
    @media (max-width: 767px) {
        .hub-village {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.8rem;
            padding: 1rem;
        }
    }

    /* Em telas muito pequenas, 2 colunas */
    @media (max-width: 480px) {
        .hub-village {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.6rem;
        }
    }

    /* Ajustes nos elementos do hub */
    .hub-building {
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s ease;
        width: 100%;
        max-width: 90px; /* Limite máximo de tamanho */
    }

    .hub-building:hover {
        transform: scale(1.15) translateY(-5px);
    }

    .hub-building img {
        width: 65px; /* Reduzido um pouco para caber melhor */
        height: 65px;
        object-fit: contain;
        filter: drop-shadow(3px 5px 4px rgba(0,0,0,0.3));
    }

    .hub-label {
        font-size: 0.7rem; /* Um pouco menor */
        font-weight: 600;
        color: white;
        margin-top: 0.25rem;
        background-color: rgba(0,0,0,0.5);
        padding: 2px 6px;
        border-radius: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 90px;
    }

    .board-decoration {
        position: absolute;
        z-index: 2;
        pointer-events: none;
        filter: drop-shadow(2px 3px 2px rgba(0,0,0,0.3));
        transition: transform 0.3s ease;
        animation: float 8s ease-in-out infinite;
    }

    /* Árvores */
    .decoration-tree { width: 80px; }
    .decoration-tree--small { width: 50px; }
    .decoration-tree--normal { width: 80px; }
    .decoration-tree--large { width: 100px; }

    /* Rochas */
    .decoration-rock { width: 60px; }
    .decoration-rock--small { width: 35px; }
    .decoration-rock--normal { width: 60px; }
    .decoration-rock--large { width: 75px; }

    /* Efeito sutil ao passar o mouse */
    .board-decoration:hover {
        transform: scale(1.05);
        z-index: 3;
    }

    .board-decoration:nth-child(odd) { animation-delay: 0.5s; }
    .board-decoration:nth-child(3n) { animation-delay: 1.2s; }
    .board-decoration:nth-child(4n) { animation-delay: 2s; }
`;



function GameBoardViewer({ onHubIconClick, gamificationDesign, studentProgress, onStepClick, userRole, renderedDecorations, generateStepCoordinates }) {    
    // A lógica de progresso, coordenadas e SVG permanece aqui.
    const completedStepsSet = userRole === 'aluno' ? new Set(studentProgress?.completed_steps || []) : new Set();
    
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

    const stepCoordinates = generateStepCoordinates(gamificationDesign.progression_path?.length || 0);


    const generateSvgPath = () => {
        const pathPoints = stepCoordinates;
        if (pathPoints.length < 2) return '';
        
        const boardWidth = 900;
        const boardHeight = 500;
        const absolutePoints = pathPoints.map(p => ({
            x: parseFloat(p.x) / 100 * boardWidth,
            y: parseFloat(p.y) / 100 * boardHeight,
        }));

        let pathString = `M ${absolutePoints[0].x} ${absolutePoints[0].y}`;
        for (let i = 1; i < absolutePoints.length; i++) {
            pathString += ` L ${absolutePoints[i].x} ${absolutePoints[i].y}`;
        }
        return pathString;
    };

    // O return agora é direto, sem tela de carregamento.
    return (
        <>
            <style>{GameBoardStyles}</style>
            <div className="rpg-map-board">
                <div className="progress-path-area">
                    {/* Renderiza as decorações calculadas pelo pai */}
                    {renderedDecorations.map(deco => (
                        <img 
                            key={deco.id} 
                            src={deco.src} 
                            alt="Decoração do tabuleiro" 
                            className={`board-decoration ${deco.className}`} 
                            style={deco.style} 
                        />
                    ))}
                    <svg className="path-svg" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid meet">
                        <path d={generateSvgPath()} className="path-line" />
                    </svg>
                    {(gamificationDesign.progression_path || []).map((step, index) => {
                        const status = getStepStatus(step);
                        const config = elementConfig.path[step.type];
                        if (!config) return null;
                        const position = stepCoordinates[index % stepCoordinates.length];
                        return (
                            <div key={step.id} className="path-node-wrapper" style={{ top: position.y, left: position.x }} onClick={() => status === 'active' && onStepClick(step)}>
                                <div className={`path-node path-node--${status}`}>
                                    <img className="path-node-image" src={config.icon} alt={config.name} />
                                    {status === 'completed' && <div className="path-node--completed"></div>}
                                </div>
                                <div className="path-label">{step.content?.title || config.name}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="hub-village">
                    {(gamificationDesign.hub_elements || []).map(hubElement => {
                        if (!hubElement.enabled) return null;
                        const config = elementConfig.hub[hubElement.type];
                        if (!config) return null;
                        return (
                            <div 
                            key={hubElement.id} 
                            className="hub-building" 
                            title={config.name}
                            onClick={() => onHubIconClick(hubElement.type)}
                            >
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

