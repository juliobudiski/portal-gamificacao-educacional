// frontend/src/components/activity/GameBoardViewer.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';

// Importa apenas a configuração de ícones, pois é o que ele precisa para renderizar os nomes e imagens dos passos.
import { elementConfig } from './GameBoardConfig';
import useAssetLoader from '../../hooks/useAssetLoader';
import './GameBoard.css';
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





function GameBoardViewer({ onFinalRewardClick, onHubIconClick, gamificationDesign, studentProgress, onStepClick, userRole, renderedDecorations, stepCoordinates, currentView, children }) {
    // A lógica de progresso, coordenadas e SVG permanece aqui.
    const completedStepsSet = userRole === 'aluno' ? new Set(studentProgress?.completed_steps || []) : new Set();
    const boardRef = useRef(null); // Cria uma referência para a div do tabuleiro
    const [boardSize, setBoardSize] = useState({ width: 900, height: 500 }); // Estado para guardar o tamanho

    useEffect(() => {
        const boardElement = boardRef.current;
        if (!boardElement) return;

        // O ResizeObserver é a forma moderna e eficiente de observar mudanças de tamanho
        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                setBoardSize({ width, height });
            }
        });

        observer.observe(boardElement);

        // Limpeza: para de observar quando o componente é desmontado
        return () => observer.unobserve(boardElement);
    }, []); // O array vazio [] garante que isso só rode uma vez
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




    const generateSvgPath = () => {
        const pathPoints = stepCoordinates;
        if (pathPoints.length < 2) return '';

        // Substitui os valores fixos pelos valores do nosso estado
        const boardWidth = boardSize.width;
        const boardHeight = boardSize.height;

        // Se o tabuleiro ainda não tiver tamanho, não desenha nada para evitar erros
        if (boardWidth === 0 || boardHeight === 0) return '';

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

    const activityStatus = studentProgress?.status;

    const allStepsCompleted = userRole === 'aluno' &&
        gamificationDesign.progression_path?.length > 0 &&
        gamificationDesign.progression_path.every(step => completedStepsSet.has(step.id));

    // O status do baú final depende diretamente da variável acima
    let finalRewardStatus;
    if (activityStatus === 'completed') {
        finalRewardStatus = 'completed'; // Se a atividade JÁ está completa, mostra o check
    } else if (allStepsCompleted) {
        finalRewardStatus = 'active'; // Se todos os passos estão feitos, mas a recompensa não foi coletada, fica ativa
    } else {
        finalRewardStatus = 'locked'; // Senão, fica bloqueada
    }
    const finalRewardConfig = elementConfig.path.final_reward;
    const lastStepPosition = stepCoordinates.length > 0 ? stepCoordinates[stepCoordinates.length - 1] : { x: '50%', y: '80%' };
    // Calcula uma posição ligeiramente deslocada para o baú
    const finalRewardPosition = stepCoordinates.length > gamificationDesign.progression_path.length
        ? stepCoordinates[stepCoordinates.length - 1]
        : { x: '50%', y: '90%' };

    const hubElementsToRender = useMemo(() => {
        // Começa com os elementos que vêm do banco de dados
        const baseElements = gamificationDesign.hub_elements || [];
        // Cria uma cópia para podermos modificá-la
        let finalElements = [...baseElements];

        // --- INÍCIO DA VERSÃO MELHORADA ---
        // Lista de ícones que devem aparecer por padrão
        const defaultIcons = [
            { type: 'avatar_customization', roles: ['aluno', 'professor'] },
            { type: 'forum', roles: ['aluno', 'professor'] }
            // No futuro, pode adicionar mais ícones padrão aqui
        ];

        defaultIcons.forEach(icon => {
            const alreadyExists = finalElements.some(el => el.type === icon.type);
            const roleIsAllowed = !icon.roles || icon.roles.includes(userRole);

            // Adiciona o ícone se ele não existir e o papel do utilizador for permitido
            if (roleIsAllowed && !alreadyExists) {
                finalElements.push({ id: `hub_${icon.type}`, type: icon.type, enabled: true });
            }
        });
        // --- FIM DA VERSÃO MELHORADA ---

        return finalElements;
    }, [gamificationDesign.hub_elements, userRole]);

    // O return agora é direto, sem tela de carregamento.
    return (
        // A moldura principal do tabuleiro agora envolve a lógica de troca
        <div className="rpg-map-board">
            {/* Se a view for 'board', mostra o mapa. Senão, mostra o conteúdo da ação. */}
            {currentView === 'board' ? (
                <>
                    {/* Conteúdo original do tabuleiro (mapa, trilha, hub) */}
                    <div className="progress-path-area" ref={boardRef}>
                        {renderedDecorations.map(deco => (
                            <img key={deco.id} src={deco.src} alt="Decoração" className={`board-decoration ${deco.className}`} style={deco.style} />
                        ))}
                        <svg className="path-svg" viewBox={`0 0 ${boardSize.width} ${boardSize.height}`} preserveAspectRatio="none">
                            <path d={generateSvgPath()} className="path-line" />
                        </svg>
                        {(gamificationDesign.progression_path || []).map((step, index) => {
                            const status = getStepStatus(step);
                            const config = elementConfig.path[step.type];
                            if (!config) return null;
                            const position = stepCoordinates[index % stepCoordinates.length];
                            return (
                                <div key={step.id} className="path-node-wrapper" style={{ top: position.y, left: position.x }} onClick={() => (status === 'active' || status === 'completed') && onStepClick(step)}>
                                    <div className={`path-node path-node--${status}`}>
                                        <img className="path-node-image" src={config.icon} alt={config.name} />
                                        {status === 'completed' && <div className="path-node-completed-check">✔</div>}
                                    </div>
                                    <div className="path-label">{step.content?.title || config.name}</div>
                                </div>
                            );
                        })}
                        {/* --- RENDERIZAÇÃO DA CASA DE RECOMPENSA FINAL --- */}
                        {gamificationDesign?.finalReward && (
                            <div
                                className="path-node-wrapper"
                                style={{ top: finalRewardPosition.y, left: finalRewardPosition.x }}
                                // Adiciona a verificação para não ser clicável quando 'completed'
                                onClick={() => finalRewardStatus === 'active' && onFinalRewardClick()}
                            >
                                <div className={`path-node path-node--${finalRewardStatus}`}>
                                    <img className="path-node-image" src={finalRewardConfig.icon} alt={finalRewardConfig.name} />
                                    {/* Adicionamos um 'check' visual aqui, similar aos outros passos */}
                                    {finalRewardStatus === 'completed' && <div className="path-node-completed-check">✔</div>}
                                </div>
                                <div className="path-label">{finalRewardConfig.name}</div>
                            </div>
                        )}
                        {/* --- FIM DA RENDERIZAÇÃO DA CASA FINAL --- */}
                    </div>
                    <div className="hub-village">
                        {hubElementsToRender.map(hubElement => {
                            if (!hubElement.enabled) return null;
                            const config = elementConfig.hub[hubElement.type];
                            if (!config) return null;
                            return (
                                <div key={hubElement.id} className="hub-building hub-building--animated" title={config.name} onClick={() => onHubIconClick(hubElement.type)}>
                                    <img src={config.icon} alt={config.name} />
                                    <div className="hub-label">{config.name}</div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                // Área que renderiza o conteúdo da ação (Quiz, Loja, etc.)
                <div className="game-content-area">
                    {children}
                </div>
            )}
        </div>
    );
}

export default GameBoardViewer;

