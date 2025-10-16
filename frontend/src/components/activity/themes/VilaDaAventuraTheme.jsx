import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import { elementConfig } from '../GameBoardConfig';
import '../GameBoard.css';

// ========================================================================
// LÓGICA DE CÁLCULO DE LAYOUT (MOVEMOS PARA CÁ)
// ========================================================================
const calculateStepCoordinates = (activity, boardSize) => {
    const path = activity?.gamificationDesign?.progression_path;
    if (!path || !boardSize) return [];

    const coords = [];
    const numberOfSteps = path.length;

    const pathAreaWidth = boardSize.width * 0.7; // Reserva 70% da largura para a trilha

    for (let i = 0; i < numberOfSteps; i++) {
        const row = Math.floor(i / 4);
        const positionInRow = i % 4;
        const y = boardSize.height * (0.15 + (row * 0.25));
        let x;
        if (row % 2 === 0) {
            x = pathAreaWidth * (0.15 + (positionInRow * 0.25));
        } else {
            x = pathAreaWidth * (0.85 - (positionInRow * 0.25));
        }
        coords.push({ x: `${x}px`, y: `${y}px` });
    }

    if (activity.gamificationDesign.finalReward) {
        const lastCoord = coords[coords.length - 1] || { x: `${pathAreaWidth / 2}px`, y: `${boardSize.height * 0.8}px` };
        coords.push({ x: lastCoord.x, y: `${parseFloat(lastCoord.y) + 60}px` });
    }

    return coords;
};

const generateSvgPath = (coordinates) => {
    if (!coordinates || coordinates.length < 2) return "";
    let pathString = `M ${parseFloat(coordinates[0].x)} ${parseFloat(coordinates[0].y)}`;
    for (let i = 1; i < coordinates.length; i++) {
        pathString += ` L ${parseFloat(coordinates[i].x)} ${parseFloat(coordinates[i].y)}`;
    }
    return pathString;
};

// ========================================================================
// COMPONENTE DO TEMA
// ========================================================================
const VilaDaAventuraTheme = ({
    gamificationDesign,
    currentView,
    children,
    getStepStatus,
    onStepClick,
    onHubIconClick,
    onFinalRewardClick,
    finalRewardStatus,
    hubElementsToRender,
    renderedDecorations,
    finalRewardConfig,
    ...props // Pega o resto das props
}) => {

    const boardRef = useRef(null);
    const [boardSize, setBoardSize] = useState(null);

    useLayoutEffect(() => {
        const currentBoardRef = boardRef.current;
        if (currentBoardRef) {
            const observer = new ResizeObserver(entries => {
                const entry = entries[0];
                if (entry) setBoardSize({ width: entry.contentRect.width, height: entry.contentRect.height });
            });
            observer.observe(currentBoardRef);
            return () => observer.unobserve(currentBoardRef);
        }
    }, []);

    const stepCoordinates = useMemo(() => calculateStepCoordinates({ gamificationDesign }, boardSize), [gamificationDesign, boardSize]);
    const svgPath = useMemo(() => generateSvgPath(stepCoordinates), [stepCoordinates]);
    const finalRewardPosition = stepCoordinates[stepCoordinates.length - 1];

    // Se a view não for 'board', renderiza o conteúdo (Quiz, Narrativa, etc.)
    if (currentView !== 'board') {
        return <div className="game-content-area">{children}</div>;
    }

    // Se ainda não medimos o tabuleiro, mostramos um placeholder para ser medido.
    if (!boardSize) {
        return <div className="rpg-map-board" ref={boardRef} style={{ width: '100%', minHeight: '500px' }} />;
    }

    return (
        <div className="rpg-map-board" ref={boardRef}>
            <div className="progress-path-area">
                {renderedDecorations.map(deco => (
                    <img key={deco.id} src={deco.src} alt="Decoração" className={`board-decoration ${deco.className}`} style={deco.style} />
                ))}
                <svg className="path-svg" viewBox={`0 0 ${boardSize.width} ${boardSize.height}`} preserveAspectRatio="xMidYMid meet">
                    <path d={svgPath} className="path-line" />
                </svg>
                {(gamificationDesign.progression_path || []).map((step, index) => {
                    const status = getStepStatus(step);
                    const config = elementConfig.path[step.type];
                    const position = stepCoordinates[index];
                    if (!config || !position) return null;

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
                {gamificationDesign?.finalReward && finalRewardPosition && finalRewardConfig && (
                    <div className="path-node-wrapper" style={{ top: finalRewardPosition.y, left: finalRewardPosition.x }} onClick={() => finalRewardStatus === 'active' && onFinalRewardClick()}>
                        <div className={`path-node path-node--${finalRewardStatus}`}>
                            <img className="path-node-image" src={finalRewardConfig.icon} alt={finalRewardConfig.name} />
                            {finalRewardStatus === 'completed' && <div className="path-node-completed-check">✔</div>}
                        </div>
                        <div className="path-label">{finalRewardConfig.name}</div>
                    </div>
                )}
            </div>
            <div className="hub-village">
                {(hubElementsToRender || []).map(hubElement => {
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
        </div>
    );
};

export default VilaDaAventuraTheme;
