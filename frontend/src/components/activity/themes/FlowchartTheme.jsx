import React, { useRef, useLayoutEffect, useState, useMemo } from 'react';
import { useActivity } from '../../../context/ActivityContext';
import { elementConfig } from '../GameBoardConfig'; // Usamos apenas para os NOMES

// 1. IMPORTAR OS ÍCONES "CLEAN"
import {
    FaTrophy, FaGift, FaSyncAlt, FaGem, FaUsers, FaCoins, FaShoppingCart,
    FaIdBadge, FaComments, FaPaintBrush, FaBookOpen, FaQuestionCircle, FaStar
} from 'react-icons/fa';

// --- FUNÇÕES AUXILIARES (Sem alteração) ---

const getNodeStyle = (type) => {
    switch (type) {
        case 'mission':
            return { shape: 'rect', className: 'fill-yellow-500 stroke-yellow-700 dark:fill-yellow-600 dark:stroke-yellow-800' };
        case 'narrative':
            return { shape: 'rect', className: 'fill-blue-500 stroke-blue-700 dark:fill-blue-700 dark:stroke-blue-900' };
        case 'quiz':
            return { shape: 'circle', className: 'fill-green-500 stroke-green-700 dark:fill-green-600 dark:stroke-green-800' };
        case 'final_reward':
            return { shape: 'rect', className: 'fill-purple-500 stroke-purple-700 dark:fill-purple-600 dark:stroke-purple-800' };
        default:
            return { shape: 'rect', className: 'fill-gray-500 stroke-gray-700' };
    }
};

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

const calculateFlowchartLayout = (path, boardWidth) => {
    if (!boardWidth || !path || path.length === 0) {
        return { coordinates: [], requiredHeight: 300 };
    }
    const coordinates = [];
    const padding = { x: 100, y: 80 };
    const ySpacing = 120; // Espaçamento vertical FIXO

    path.forEach((step, index) => {
        const y = padding.y + (ySpacing * index);
        const x = (index % 2 === 0) ? padding.x : boardWidth - padding.x;
        coordinates.push({ x, y });
    });

    const lastY = coordinates.length > 0 ? coordinates[coordinates.length - 1].y : padding.y;
    const requiredHeight = lastY + padding.y;

    return { coordinates, requiredHeight };
};

const generateSvgPath = (coordinates) => {
    if (coordinates.length < 2) return "";
    return getCatmullRomPath(coordinates);
};

// 2. MAPA LOCAL DE ÍCONES FUNCIONAIS
const functionalIconMap = {
    mission: <FaBookOpen />,
    final_reward: <FaTrophy />,
    narrative: <FaBookOpen />,
    quiz: <FaQuestionCircle />,
    roulette: <FaSyncAlt />,
    slot_machine: <FaGem />,
    ranking: <FaTrophy />,
    badges: <FaIdBadge />,
    chat: <FaComments />,
    store: <FaShoppingCart />,
    avatar_customization: <FaPaintBrush />,
    forum: <FaUsers />,
    default: <FaStar />
};

// --- COMPONENTE PRINCIPAL ---

const FlowchartTheme = ({ children }) => {

    const {
        activity,
        currentView,
        getStepStatus,
        handleStepClick,
        hubElementsToRender,
        handleHubIconClick,
        handleFinalRewardClick,
        finalRewardStatus
    } = useActivity();

    const boardRef = useRef(null);
    const [boardWidth, setBoardWidth] = useState(0);
    const [boardHeight, setBoardHeight] = useState(300);

    useLayoutEffect(() => {
        const currentBoardRef = boardRef.current;
        if (currentBoardRef) {
            const observer = new ResizeObserver(entries => {
                const entry = entries[0];
                if (entry) setBoardWidth(entry.contentRect.width);
            });
            observer.observe(currentBoardRef);
            return () => observer.unobserve(currentBoardRef);
        }
    }, []);

    const gamificationDesign = activity?.gamificationDesign;
    const fullPath = useMemo(() => {
        const path = gamificationDesign?.progression_path || [];
        const hub = hubElementsToRender || []; // Vem do useActivity

        const missionElement = hub.find(el => el.type === 'mission' && el.enabled);
        const finalRewardElement = hub.find(el => el.type === 'final_reward' && el.enabled);

        const allNodes = [];

        // Adiciona "Missão" (Início) se existir
        if (missionElement) {
            allNodes.push({
                id: missionElement.id,
                type: 'mission',
                // Pega o nome do config global
                content: { title: elementConfig.hub.mission.name },
                isMandatory: true
            });
        }

        // Adiciona a trilha principal (Quiz/Narrativa)
        allNodes.push(...path);

        // Adiciona "Recompensa Final" se existir
        if (finalRewardElement) {
            allNodes.push({
                id: finalRewardElement.id,
                type: 'final_reward',
                content: { title: elementConfig.hub.final_reward.name },
                isMandatory: true
            });
        }

        return allNodes;
    }, [gamificationDesign, hubElementsToRender]); // Depende do design E dos elementos do hub


    // 3. Hooks de Cálculo (agora usam fullPath)
    const { coordinates: stepCoordinates, requiredHeight } = useMemo(
        () => calculateFlowchartLayout(fullPath, boardWidth), // <-- USA fullPath
        [fullPath, boardWidth]
    );
    const svgPath = useMemo(() => generateSvgPath(stepCoordinates), [stepCoordinates]);

    useLayoutEffect(() => {
        if (requiredHeight > boardHeight) setBoardHeight(requiredHeight);
    }, [requiredHeight, boardHeight]);

    const hubElements = useMemo(() =>
        (hubElementsToRender || []).filter(
            el => el.type !== 'mission' && el.type !== 'final_reward' && el.enabled
        ), [hubElementsToRender]);

    if (currentView !== 'board') {
        return <div className="game-content-area-flowchart p-4">{children}</div>;
    }

    if (!gamificationDesign || boardWidth === 0) {
        return <div ref={boardRef} className="w-full h-full bg-white dark:bg-gray-800" style={{ minHeight: '500px' }} />;
    }

    return (
        <div className="flex w-full h-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>

            {/* Coluna 1: O Fluxograma */}
            <div className="flex-grow h-full p-4 overflow-auto" ref={boardRef}>
                <div className="relative w-full" style={{ height: `${boardHeight}px` }}>
                    {(boardWidth > 0) && (
                        <svg width="100%" height="100%" viewBox={`0 0 ${boardWidth} ${boardHeight}`} className="absolute top-0 left-0">
                            {/* Linha */}
                            <path d={svgPath} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="3" fill="none" />

                            {/* Nós (Itera sobre fullPath) */}
                            {fullPath.map((step, index) => {
                                const position = stepCoordinates[index];
                                if (!position) return null;

                                const { x, y } = position;

                                // Pega o status (diferente para recompensa final)
                                const status = (step.type === 'final_reward')
                                    ? finalRewardStatus
                                    : getStepStatus(step);

                                const isClickable = status === 'active' || status === 'completed';
                                const opacity = (status === 'locked') ? 0.4 : 1;

                                const { shape, className } = getNodeStyle(step.type);
                                const IconComponent = functionalIconMap[step.type] || functionalIconMap.default;

                                // Define o click handler correto
                                const handleClick = () => {
                                    if (!isClickable) return;
                                    if (step.type === 'final_reward') {
                                        handleFinalRewardClick();
                                    } else {
                                        handleStepClick(step);
                                    }
                                };

                                return (
                                    <g
                                        key={step.id}
                                        transform={`translate(${x}, ${y})`}
                                        onClick={handleClick}
                                        style={{ cursor: isClickable ? 'pointer' : 'default', opacity }}
                                        className="transition-opacity"
                                    >
                                        {shape === 'circle' ? (
                                            <circle cx="0" cy="0" r="30" className={`${className} ${isClickable ? 'hover:brightness-110' : ''} transition-all`} />
                                        ) : (
                                            <rect x="-45" y="-22.5" width="90" height="45" rx="8" className={`${className} ${isClickable ? 'hover:brightness-110' : ''} transition-all`} />
                                        )}

                                        <foreignObject x="-20" y="-20" width="40" height="40">
                                            <div className="w-full h-full flex items-center justify-center text-white text-2xl">
                                                {IconComponent}
                                            </div>
                                        </foreignObject>
                                    </g>
                                );
                            })}
                        </svg>
                    )}
                </div>
            </div>

            {/* Coluna 2: O Hub (sem alteração) */}
            <div className="w-56 flex-shrink-0 bg-gray-100 dark:bg-gray-900 border-l border-gray-300 dark:border-gray-600 p-4 space-y-3 overflow-y-auto">
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 text-center border-b border-gray-300 dark:border-gray-700 pb-2">
                    Hub da Atividade
                </h4>
                {hubElements.map(element => {
                    const config = elementConfig.hub[element.type];
                    if (!config) return null;

                    const IconComponent = functionalIconMap[element.type] || functionalIconMap.default;

                    return (
                        <button
                            key={element.id}
                            onClick={() => handleHubIconClick(element.type)}
                            className="w-full flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left"
                        >
                            <div className="w-8 h-8 mr-3 flex items-center justify-center text-lg text-accent-teal dark:text-accent-teal">
                                {IconComponent}
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{config.name}</span>
                        </button>
                    );
                })}
                {hubElements.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center italic pt-4">
                        Nenhum elemento de hub ativo.
                    </p>
                )}
            </div>
        </div>
    );
};

export default FlowchartTheme;