import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import { elementConfig } from '../GameBoardConfig';
import '../GameBoard.css';
import { useActivity } from '../../../context/ActivityContext';
import GameHUD from '../GameHUD';
import { FaUsers, FaShieldAlt } from 'react-icons/fa'; // Ícones para o indicador de equipe

// --- COMPONENTE DE BADGE (ATUALIZADO) ---
const TeamBadge = ({ teammates }) => {
    // Se não tiver colegas neste passo, não renderiza nada
    if (!teammates || teammates.length === 0) return null;

    const count = teammates.length;
    const isSingle = count === 1;

    // Conteúdo visual: Foto ou Número
    const displayContent = isSingle ? (
        <img
            src={teammates[0].avatar}
            alt={teammates[0].name}
            className="w-full h-full rounded-full object-cover border border-white"
        />
    ) : (
        <span className="text-white text-[10px] font-bold leading-none">+{count}</span>
    );

    return (
        // Z-INDEX ALTO (z-50) para garantir que fique em cima da imagem do nó
        <div className="absolute -top-2 -right-2 z-50 group cursor-help animate-bounce-slow">
            {/* O Badge Visível */}
            <div className={`
                w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white 
                transform transition-transform hover:scale-110
                ${isSingle ? 'bg-gray-200' : 'bg-blue-600'}
            `}>
                {displayContent}
            </div>

            {/* Tooltip (Lista de Nomes) */}
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-gray-900/90 backdrop-blur-sm text-white text-xs py-2 px-3 rounded-lg shadow-xl z-[60] pointer-events-none border border-gray-700">
                <div className="font-bold border-b border-gray-600 mb-1 pb-1 text-accent-yellow flex items-center gap-1">
                    <FaUsers className="text-xs" /> Neste passo:
                </div>
                <ul className="text-left space-y-1">
                    {teammates.map((mate, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                            <img src={mate.avatar} className="w-4 h-4 rounded-full border border-gray-500" alt="" />
                            <span className="text-gray-200">{mate.name}</span>
                        </li>
                    ))}
                </ul>
                {/* Seta do tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/90"></div>
            </div>
        </div>
    );
};

// --- FUNÇÕES DE CURVA E LAYOUT (MANTIDAS IGUAIS) ---
function getCatmullRomPath(points, tension = 0.5) {
    if (!points || points.length < 2) return "";
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

const calculateStepCoordinates = (activity, boardSize) => {
    const design = activity?.gamificationDesign;
    if (!design || !boardSize) return { missionNode: null, pathNodes: [], finalRewardNode: null };

    const allNodesInOrder = [];
    const missionElement = design.hub_elements?.find(el => el.type === 'mission' && el.enabled);
    const finalRewardElement = design.hub_elements?.find(el => el.type === 'final_reward' && el.enabled);
    const path = design.progression_path || [];

    if (missionElement) allNodesInOrder.push({ nodeType: 'mission' });
    path.forEach(() => allNodesInOrder.push({ nodeType: 'path' }));
    if (finalRewardElement) allNodesInOrder.push({ nodeType: 'final_reward' });

    const itemsPerRow = 4;
    const pathAreaWidth = boardSize.width * 0.8;
    const offsetX = boardSize.width * 0.1;
    const offsetY = boardSize.height * 0.25;
    const rowHeight = 130;
    const turnDrop = 40;

    let missionNode = null;
    const pathNodes = [];
    let finalRewardNode = null;

    allNodesInOrder.forEach((node, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const isReversedRow = row % 2 !== 0;
        const effectiveCol = isReversedRow ? (itemsPerRow - 1 - col) : col;
        const x = offsetX + (pathAreaWidth / (itemsPerRow > 1 ? itemsPerRow - 1 : 1)) * effectiveCol;
        const yAdjustment = (col === 0 || col === itemsPerRow - 1) ? turnDrop : 0;
        const y = offsetY + (row * rowHeight) + yAdjustment;
        const calculatedPosition = { x, y };

        if (node.nodeType === 'mission') missionNode = calculatedPosition;
        else if (node.nodeType === 'path' && pathNodes.length < path.length) pathNodes.push(calculatedPosition);
        else if (node.nodeType === 'final_reward') finalRewardNode = calculatedPosition;
    });

    return { missionNode, pathNodes, finalRewardNode };
};

const generateSvgPath = (missionNode, pathNodes, finalRewardNode) => {
    const allPointsRaw = [];
    if (missionNode) allPointsRaw.push(missionNode);
    allPointsRaw.push(...pathNodes);
    if (finalRewardNode) allPointsRaw.push(finalRewardNode);
    if (allPointsRaw.length < 2) return "";
    const verticalOffset = 45;
    const pointsWithOffset = allPointsRaw.map(p => ({ x: p.x, y: p.y + verticalOffset }));
    return getCatmullRomPath(pointsWithOffset);
};

// --- COMPONENTE PRINCIPAL ---
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
        userProgress
    } = useActivity();

    const boardRef = useRef(null);
    const [boardSize, setBoardSize] = useState(null);

    // Observer para redimensionamento
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

    // Hooks de cálculo
    const { missionNode, pathNodes, finalRewardNode } = useMemo(() => calculateStepCoordinates(activity, boardSize), [activity, boardSize]);
    const svgPath = useMemo(() => generateSvgPath(missionNode, pathNodes, finalRewardNode), [missionNode, pathNodes, finalRewardNode]);

    // Altura dinâmica
    const requiredHeight = useMemo(() => {
        if (!boardSize) return 600;
        const allNodes = [missionNode, ...pathNodes, finalRewardNode].filter(Boolean);
        if (allNodes.length === 0) return 300;
        const maxY = Math.max(...allNodes.map(node => node.y));
        return maxY + 45;
    }, [boardSize, missionNode, pathNodes, finalRewardNode]);

    const villageHubElements = hubElementsToRender.filter(el => el.type !== 'mission' && el.type !== 'final_reward');
    const missionConfig = elementConfig.hub.mission;
    const finalRewardConfig = elementConfig.hub.final_reward;

    // --- LOG DE DEBUG PARA EQUIPE ---
    const teammatesPositions = userProgress?.teammates_positions || {};
    const isTeamActivity = activity?.is_team_activity;
    const firstTeammateKey = Object.keys(teammatesPositions)[0];
    const hasTeammates = firstTeammateKey && teammatesPositions[firstTeammateKey].length > 0;

    // TODO: Peça ao backend para enviar "team_name" no userProgress para exibir o nome real da Casa.
    const teamNameDisplay = isTeamActivity ? (hasTeammates ? "Sua Casa" : "Aguardando Colegas...") : null;
    // Log apenas em ambiente de desenvolvimento para verificar os dados
    // ===> LOG DE DEPURAÇÃO PARA O BADGE <===
    if (isTeamActivity) {
        console.log("[DEBUG BADGE] Atividade em Grupo detectada.");
        console.log("[DEBUG BADGE] Dados de Posições (teammatesPositions):", teammatesPositions);
        console.log("[DEBUG BADGE] IDs dos Passos na Trilha:", activity.gamificationDesign.progression_path.map(s => s.id));
    }
    // =======================================

    if (currentView !== 'board') {
        return <div className="game-content-area">{children}</div>;
    }

    if (!boardSize) {
        return <div className="rpg-map-board" ref={boardRef} style={{ width: '100%', minHeight: '600px' }} />;
    }

    return (
        <div className="rpg-map-board" ref={boardRef}>
            {/* Interface de HUD (Pontos, Moedas) */}
            <GameHUD progress={userProgress} />

            <div className="progress-path-area" style={{ height: `${requiredHeight}px` }}>
                {/* Decorações */}
                {renderedDecorations.map(deco => (
                    <img key={deco.id} src={deco.src} alt="Decoração" className={`board-decoration ${deco.className}`} style={deco.style} />
                ))}

                {/* Linha da Trilha */}
                <svg className="path-svg">
                    <path d={svgPath} className="path-line" />
                </svg>

                {/* --- NÓ DA MISSÃO --- */}
                {missionNode && missionConfig && (
                    <div className="path-node-wrapper" style={{ top: `${missionNode.y}px`, left: `${missionNode.x}px` }} onClick={() => handleStepClick({ type: 'mission' })}>
                        {/* ... (Imagem do nó mantida) ... */}
                        <div className={`path-node path-node--active`}>
                            <img className="path-node-image" src={missionConfig.icon} alt={missionConfig.name} />
                        </div>
                        <div className="path-label">{missionConfig.name}</div>

                        {/* VERIFIQUE SE AS CHAVES BATEM COM O QUE VEM DO CONSOLE */}
                        <TeamBadge teammates={teammatesPositions['start'] || teammatesPositions['mission_step_01']} />
                    </div>
                )}

                {/* --- PASSOS DA TRILHA --- */}
                {(activity.gamificationDesign.progression_path || []).map((step, index) => {
                    const status = getStepStatus(step);
                    const config = elementConfig.path[step.type];
                    const position = pathNodes[index];
                    if (!config || !position) return null;

                    const teammatesHere = teammatesPositions[step.id];

                    return (
                        <div key={step.id} className="path-node-wrapper" style={{ top: `${position.y}px`, left: `${position.x}px` }} onClick={() => (status === 'active' || status === 'completed') && handleStepClick(step)}>
                            {/* ... (Imagem do nó mantida) ... */}
                            <div className={`path-node path-node--${status}`}>
                                <img className="path-node-image" src={config.icon} alt={config.name} />
                                {status === 'completed' && <div className="path-node-completed-check">✔</div>}
                            </div>
                            <div className="path-label">{step.content?.title || config.name}</div>

                            {/* O BADGE */}
                            <TeamBadge teammates={teammatesHere} />
                        </div>
                    );
                })}

                {/* --- RECOMPENSA FINAL --- */}
                {finalRewardNode && finalRewardConfig && (
                    <div className="path-node-wrapper" style={{ top: `${finalRewardNode.y}px`, left: `${finalRewardNode.x}px` }} onClick={() => finalRewardStatus === 'active' && handleFinalRewardClick()}>
                        {/* ... (Imagem do nó mantida) ... */}
                        <div className={`path-node path-node--${finalRewardStatus}`}>
                            <img className="path-node-image" src={finalRewardConfig.icon} alt={finalRewardConfig.name} />
                            {finalRewardStatus === 'completed' && <div className="path-node-completed-check">✔</div>}
                        </div>
                        <div className="path-label">{finalRewardConfig.name}</div>

                        {/* BADGE FINAL */}
                        <TeamBadge teammates={teammatesPositions['completed'] || teammatesPositions['final_reward']} />
                    </div>
                )}
            </div>

            {/* Hub Village */}
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