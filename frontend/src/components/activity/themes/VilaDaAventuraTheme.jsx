import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import { elementConfig } from '../GameBoardConfig';
import '../GameBoard.css';
import { useActivity } from '../../../context/ActivityContext';
function getCatmullRomPath(points, tension = 0.5) {
    if (!points || points.length < 2) {
        return "";
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    const n = points.length;

    for (let i = 0; i < n - 1; i++) {
        const p0 = i === 0 ? points[i] : points[i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i === n - 2 ? points[i + 1] : points[i + 2];

        const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
        const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
        const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
        const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return path;
}
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
const debugLog = (message, ...optionalParams) => {
    if (DEBUG_MODE) {
        console.debug(`[VilaDaAventuraTheme] ${message}`, ...optionalParams);
    }
};

// ========================================================================
// LÓGICA DE CÁLCULO DE LAYOUT (VERSÃO FINAL COM CURVAS ABERTAS)
// ========================================================================
const calculateStepCoordinates = (activity, boardSize) => {
    const design = activity?.gamificationDesign;
    if (!design || !boardSize) return { missionNode: null, pathNodes: [], finalRewardNode: null };

    // --- PASSO 1: Criar uma lista única com TODOS os nós na ordem correta ---
    const allNodesInOrder = [];
    const missionElement = design.hub_elements?.find(el => el.type === 'mission' && el.enabled);
    const finalRewardElement = design.hub_elements?.find(el => el.type === 'final_reward' && el.enabled);
    const path = design.progression_path || [];

    if (missionElement) allNodesInOrder.push({ nodeType: 'mission' });
    path.forEach(() => allNodesInOrder.push({ nodeType: 'path' }));
    if (finalRewardElement) allNodesInOrder.push({ nodeType: 'final_reward' });

    // --- PASSO 2: Calcular as coordenadas com uma fórmula aprimorada ---
    const itemsPerRow = 4;
    const pathAreaWidth = boardSize.width * 0.8;
    const offsetX = boardSize.width * 0.1;
    const offsetY = boardSize.height * 0.15; // Ajuste inicial do topo
    const rowHeight = 130;

    // AQUI ESTÁ A MÁGICA PARA A CURVA "C": Um empurrãozinho vertical nas pontas
    const turnDrop = 40; // Aumente este valor para uma curva ainda mais aberta

    let missionNode = null;
    const pathNodes = [];
    let finalRewardNode = null;

    allNodesInOrder.forEach((node, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const isReversedRow = row % 2 !== 0;

        const effectiveCol = isReversedRow ? (itemsPerRow - 1 - col) : col;
        const x = offsetX + (pathAreaWidth / (itemsPerRow > 1 ? itemsPerRow - 1 : 1)) * effectiveCol;

        // Adicionamos o "turnDrop" apenas no primeiro e último item de cada fileira
        const yAdjustment = (col === 0 || col === itemsPerRow - 1) ? turnDrop : 0;
        const y = offsetY + (row * rowHeight) + yAdjustment;

        const calculatedPosition = { x, y };

        if (node.nodeType === 'mission') {
            missionNode = calculatedPosition;
        } else if (node.nodeType === 'path' && pathNodes.length < path.length) {
            pathNodes.push(calculatedPosition);
        } else if (node.nodeType === 'final_reward') {
            finalRewardNode = calculatedPosition;
        }
    });

    return { missionNode, pathNodes, finalRewardNode };
};


const generateSvgPath = (missionNode, pathNodes, finalRewardNode) => {
    const allPointsRaw = [];
    if (missionNode) allPointsRaw.push(missionNode);
    allPointsRaw.push(...pathNodes);
    if (finalRewardNode) allPointsRaw.push(finalRewardNode);

    if (allPointsRaw.length < 2) return "";

    // A MÁGICA ACONTECE AQUI:
    // 1. Definimos o quanto a linha passará ABAIXO do centro de cada casa.
    //    Como a casa tem 90px de altura, 45px coloca a linha na borda inferior.
    const verticalOffset = 45;

    // 2. Criamos uma nova lista de pontos já com o deslocamento aplicado.
    const pointsWithOffset = allPointsRaw.map(p => ({ x: p.x, y: p.y + verticalOffset }));

    // 3. Geramos o caminho suave usando a nova função.
    return getCatmullRomPath(pointsWithOffset);
};

const VilaDaAventuraTheme = ({ children }) => {
    const {
        activity,
        currentView,
        getStepStatus,
        handleStepClick,
        handleHubIconClick,
        handleFinalRewardClick,
        finalRewardStatus,
        hubElementsToRender,
        renderedDecorations,
    } = useActivity();

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

    const { missionNode, pathNodes, finalRewardNode } = useMemo(() => calculateStepCoordinates(activity, boardSize), [activity, boardSize]);
    const svgPath = useMemo(() => generateSvgPath(missionNode, pathNodes, finalRewardNode), [missionNode, pathNodes, finalRewardNode]);
    const requiredHeight = useMemo(() => {
        if (!boardSize) return 600; // Altura padrão enquanto carrega

        const allNodes = [missionNode, ...pathNodes, finalRewardNode].filter(Boolean);
        if (allNodes.length === 0) return 300; // Altura mínima se não houver nós

        // Encontra a coordenada Y mais baixa entre todos os nós
        const maxY = Math.max(...allNodes.map(node => node.y));

        // Retorna a posição Y mais baixa + um preenchimento para não cortar o ícone
        // (90px é a altura do ícone, então 45px é a metade)
        return maxY + 45;
    }, [boardSize, missionNode, pathNodes, finalRewardNode]);
    const villageHubElements = hubElementsToRender.filter(el => el.type !== 'mission' && el.type !== 'final_reward');
    const missionConfig = elementConfig.hub.mission;
    const finalRewardConfig = elementConfig.hub.final_reward;


    if (currentView !== 'board') {
        return <div className="game-content-area">{children}</div>;
    }

    if (!boardSize) {
        return <div className="rpg-map-board" ref={boardRef} style={{ width: '100%', minHeight: '600px' }} />;
    }

    return (
        <div className="rpg-map-board" ref={boardRef}>
            <div className="progress-path-area" style={{ height: `${requiredHeight}px` }}>
                {renderedDecorations.map(deco => (
                    <img key={deco.id} src={deco.src} alt="Decoração" className={`board-decoration ${deco.className}`} style={deco.style} />
                ))}

                <svg className="path-svg">
                    <path d={svgPath} className="path-line" />
                </svg>

                {missionNode && missionConfig && (
                    <div className="path-node-wrapper" style={{ top: `${missionNode.y}px`, left: `${missionNode.x}px` }} onClick={() => handleStepClick({ type: 'mission' })}>
                        <div className={`path-node path-node--active`}>
                            <img className="path-node-image" src={missionConfig.icon} alt={missionConfig.name} />
                        </div>
                        <div className="path-label">{missionConfig.name}</div>
                    </div>
                )}

                {(activity.gamificationDesign.progression_path || []).map((step, index) => {
                    const status = getStepStatus(step);
                    const config = elementConfig.path[step.type];
                    const position = pathNodes[index];
                    if (!config || !position) return null;

                    return (
                        <div key={step.id} className="path-node-wrapper" style={{ top: `${position.y}px`, left: `${position.x}px` }} onClick={() => (status === 'active' || status === 'completed') && handleStepClick(step)}>
                            <div className={`path-node path-node--${status}`}>
                                <img className="path-node-image" src={config.icon} alt={config.name} />
                                {status === 'completed' && <div className="path-node-completed-check">✔</div>}
                            </div>
                            <div className="path-label">{step.content?.title || config.name}</div>
                        </div>
                    );
                })}

                {finalRewardNode && finalRewardConfig && (
                    <div className="path-node-wrapper" style={{ top: `${finalRewardNode.y}px`, left: `${finalRewardNode.x}px` }} onClick={() => finalRewardStatus === 'active' && handleFinalRewardClick()}>
                        <div className={`path-node path-node--${finalRewardStatus}`}>
                            <img className="path-node-image" src={finalRewardConfig.icon} alt={finalRewardConfig.name} />
                            {finalRewardStatus === 'completed' && <div className="path-node-completed-check">✔</div>}
                        </div>
                        <div className="path-label">{finalRewardConfig.name}</div>
                    </div>
                )}
            </div>

            <div className="hub-village">
                {villageHubElements.map(hubElement => {
                    if (!hubElement.enabled) return null;
                    const config = elementConfig.hub[hubElement.type];
                    if (!config) return null;
                    return (
                        <div key={hubElement.id} className="hub-building hub-building--animated" title={config.name} onClick={() => handleHubIconClick(hubElement.type)}>
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