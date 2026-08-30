import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';

import '../GameBoard.css';
import { useActivity } from '../../../context/ActivityContext';
import { useAuth } from '../../../context/AuthContext';
import GameHUD from '../GameHUD';
import CurrentUserBadge from './CurrentUserBadge';
import { FaUsers, FaShieldAlt } from 'react-icons/fa'; // Ícones para o indicador de equipe

// --- COMPONENTE DE BADGE PARA COLEGAS (ALIADOS - AZUL) ---
const TeamBadge = ({ teammates, title = "Sua Equipe:" }) => { // <--- Aceita prop title
    if (!teammates || teammates.length === 0) return null;

    const count = teammates.length;
    const isSingle = count === 1;

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
        <div className="absolute -top-3 -right-3 z-[60] group cursor-help animate-bounce-slow">
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white 
                transform transition-transform hover:scale-110
                bg-blue-600 ring-2 ring-blue-400/50
            `}>
                {displayContent}
            </div>

            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-blue-900/95 backdrop-blur-sm text-white text-xs py-2 px-3 rounded-lg shadow-xl z-[70] pointer-events-none border border-blue-500/30">
                <div className="font-bold border-b border-blue-500/30 mb-1 pb-1 text-blue-200 flex items-center gap-1">
                    <FaUsers className="text-xs" /> {title} {/* <--- Título Dinâmico */}
                </div>
                <ul className="text-left space-y-1">
                    {teammates.map((mate, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                            <img src={mate.avatar} className="w-4 h-4 rounded-full border border-gray-500" alt="" />
                            <span className="text-gray-100">{mate.name}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// --- COMPONENTE DE BADGE PARA RIVAIS (INIMIGOS - VERMELHO) ---
const RivalBadge = ({ rivals }) => {
    if (!rivals || rivals.length === 0) return null;

    // Função para tratar erro de imagem (se o brasão não existir)
    const handleImageError = (e) => {
        e.target.style.display = 'none'; // Esconde a imagem quebrada
        e.target.nextSibling.style.display = 'block'; // Mostra o ícone de fallback
    };

    return (
        <div className="absolute -top-3 -left-3 z-[60] flex flex-col gap-1">
            {rivals.map((team, idx) => (
                <div key={idx} className="group relative">

                    {/* 1. O Círculo (Bolinha Vermelha) */}
                    <div className="w-8 h-8 bg-red-900 rounded-full border-2 border-red-400 flex items-center justify-center shadow-lg cursor-help transition-transform transform hover:scale-110 overflow-hidden">

                        {/* Tenta mostrar a imagem. Se falhar, esconde e mostra o ícone. */}
                        {team.avatar && team.avatar.includes('/') ? (
                            <>
                                <img
                                    src={team.avatar}
                                    alt={team.name}
                                    onError={handleImageError}
                                    className="w-full h-full object-cover"
                                />
                                {/* Ícone de Fallback (invisível por padrão) */}
                                <FaShieldAlt className="text-red-200 text-xs absolute" style={{ display: 'none' }} />
                            </>
                        ) : (
                            <FaShieldAlt className="text-red-200 text-xs" />
                        )}
                    </div>

                    {/* 2. O Balão (Tooltip) - Só aparece no HOVER */}
                    <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[150px] z-[70]">
                        <div className="bg-red-900/95 backdrop-blur-sm text-white text-xs py-2 px-3 rounded-lg shadow-xl border border-red-500/30 text-center">
                            {/* Setinha do balão */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-900 rotate-45 border-r border-b border-red-500/30"></div>

                            <div className="font-bold text-red-100 whitespace-normal">{team.name}</div>
                            <div className="text-[9px] text-red-300 uppercase tracking-wider mt-0.5">Rival</div>
                        </div>
                    </div>

                </div>
            ))}
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
        userProgress,
        assets
    } = useActivity();
    
    const { user } = useAuth();

    // === LÓGICA NOVA: PREPARAR ESTILOS DINÂMICOS ===
    // Mapeamento baseado no array 'structural' do GameBoardConfig.js:
    // [0]: Background Tabuleiro, [1]: Borda Hub, [2]: Background Hub, [3]: Borda Tabuleiro
    const dynamicStyles = useMemo(() => {
        if (!assets?.structural) return {};

        return {
            '--theme-board-bg': `url('${assets.structural[0]}')`,
            '--theme-hub-border': `url('${assets.structural[1]}')`,
            '--theme-hub-bg': `url('${assets.structural[2]}')`,
            '--theme-board-border': `url('${assets.structural[3]}')`
        };
    }, [assets]);

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
    const missionConfig = assets?.hub?.mission;
    const finalRewardConfig = assets?.path?.final_reward || assets?.hub?.final_reward;

    // --- LOG DE DEBUG PARA EQUIPE ---
    const teammatesPositions = userProgress?.teammates_positions || {};
    const rivalsPositions = userProgress?.rivals_positions || {};
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
    // --- BLOCO DE DEBUG (Adicione isto antes do return) ---
    console.group("🔍 DEBUG DO TABULEIRO (VilaDaAventura)");
    console.log("1. É atividade de equipe?", activity?.is_team_activity);
    console.log("2. Dados brutos de userProgress:", userProgress);
    console.log("3. Posições de Colegas (teammates):", userProgress?.teammates_positions);
    console.log("4. Posições de Rivais (rivals):", userProgress?.rivals_positions);
    // Verifica se as chaves batem com os IDs dos passos
    const stepIds = activity?.gamificationDesign?.progression_path?.map(s => s.id) || [];
    
    const currentUserStepId = useMemo(() => {
        if (!userProgress || !userProgress.completed_steps) return 'start';
        const completed = userProgress.completed_steps;
        if (completed.length === 0) return 'start';
        const lastCompleted = completed[completed.length - 1];
        
        if (stepIds.length === 0) return 'start';
        
        if (lastCompleted === stepIds[stepIds.length - 1]) {
             return userProgress.status === 'completed' ? 'final_reward' : lastCompleted;
        }
        
        const currentIndex = stepIds.indexOf(lastCompleted);
        if (currentIndex !== -1 && currentIndex + 1 < stepIds.length) {
             return stepIds[currentIndex + 1];
        }
        return lastCompleted;
    }, [userProgress, stepIds]);
    
    const userAvatar = userProgress?.equipped_activity_avatar_url || user?.profile_picture;

    // Verifica se há alguem na posição 'start' ou 'mission_step_01'
    if (userProgress?.teammates_positions) {
        console.log("-> Colegas no Start?", userProgress.teammates_positions['start']);
        console.log("-> Colegas no 1º Passo?", userProgress.teammates_positions[stepIds[0]]);
    }
    console.groupEnd();

    if (currentView !== 'board') {
        return <div className="game-content-area">{children}</div>;
    }

    if (!boardSize) {
        return <div className="rpg-map-board" ref={boardRef} style={{ width: '100%', minHeight: '600px' }} />;
    }
    const badgeTitle = activity.is_team_activity ? "Sua Equipe:" : "Colegas:";
    return (
        <div className="rpg-map-board" ref={boardRef} style={dynamicStyles}>
            <GameHUD progress={userProgress} />

            <div className="progress-path-area" style={{ height: `${requiredHeight}px` }}>
                {renderedDecorations.map(deco => (
                    <img key={deco.id} src={deco.src} alt="Decoração" className={`board-decoration ${deco.className}`} style={deco.style} />
                ))}

                <svg className="path-svg">
                    <path d={svgPath} className="path-line" />
                </svg>

                {/* --- NÓ DA MISSÃO --- */}
                {missionNode && missionConfig && (
                    <div className="path-node-wrapper" style={{ top: `${missionNode.y}px`, left: `${missionNode.x}px` }}>
                        <div className={`path-node path-node--active cursor-default`}>
                            <img className="path-node-image" src={missionConfig.icon} alt={missionConfig.name} />
                        </div>
                        <div className="path-label">{missionConfig.name}</div>

                        {/* RENDERIZA OS BADGES (O Rival estava faltando aqui!) */}
                        <TeamBadge teammates={teammatesPositions['start'] || teammatesPositions['mission_step_01']} title={badgeTitle} />
                        <RivalBadge rivals={rivalsPositions['start'] || rivalsPositions['mission_step_01']} />
                        {(currentUserStepId === 'start' || currentUserStepId === 'mission_step_01') && <CurrentUserBadge avatar={userAvatar} />}
                    </div>
                )}

                {/* --- PASSOS DA TRILHA --- */}
                {(activity.gamificationDesign.progression_path || []).map((step, index) => {
                    const status = getStepStatus(step);
                    const config = assets?.path[step.type];
                    const position = pathNodes[index];
                    if (!config || !position) return null;

                    const teammatesHere = teammatesPositions[step.id];
                    const rivalsHere = rivalsPositions[step.id];

                    return (
                        <div key={step.id} className="path-node-wrapper" style={{ top: `${position.y}px`, left: `${position.x}px` }} onClick={() => (status === 'active' || status === 'completed') && handleStepClick(step)}>
                            <div className={`path-node path-node--${status}`}>
                                <img className="path-node-image" src={config.icon} alt={config.name} />
                                {status === 'completed' && <div className="path-node-completed-check">✔</div>}
                            </div>
                            <div className="path-label">{step.content?.title || config.name}</div>

                            {/* RENDERIZA OS BADGES (O Rival estava faltando aqui!) */}
                            <TeamBadge teammates={teammatesHere} title={badgeTitle} />
                            <RivalBadge rivals={rivalsHere} />
                            {currentUserStepId === step.id && <CurrentUserBadge avatar={userAvatar} />}
                        </div>
                    );
                })}

                {/* --- RECOMPENSA FINAL --- */}
                {finalRewardNode && finalRewardConfig && (
                    <div className="path-node-wrapper" style={{ top: `${finalRewardNode.y}px`, left: `${finalRewardNode.x}px` }} onClick={() => finalRewardStatus === 'active' && handleFinalRewardClick()}>
                        <div className={`path-node path-node--${finalRewardStatus}`}>
                            <img className="path-node-image" src={finalRewardConfig.icon} alt={finalRewardConfig.name} />
                            {finalRewardStatus === 'completed' && <div className="path-node-completed-check">✔</div>}
                        </div>
                        <div className="path-label">{finalRewardConfig.name}</div>

                        {/* RENDERIZA OS BADGES */}
                        <TeamBadge teammates={teammatesPositions['completed'] || teammatesPositions['final_reward']} title={badgeTitle} />
                        <RivalBadge rivals={rivalsPositions['completed'] || rivalsPositions['final_reward']} />
                        {(currentUserStepId === 'final_reward' || currentUserStepId === 'completed') && <CurrentUserBadge avatar={userAvatar} />}
                    </div>
                )}
            </div>

            {/* Hub Village */}
            <div className="hub-village">
                {villageHubElements.map(hubElement => {
                    if (!hubElement.enabled) return null;
                    const config = assets?.hub[hubElement.type];
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