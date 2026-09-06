import React, { useRef, useLayoutEffect, useState, useMemo } from 'react';
import { useActivity } from '../../../context/ActivityContext';
import { useAuth } from '../../../context/AuthContext';
import GameHUD from '../GameHUD';
import CurrentUserBadge from './CurrentUserBadge';

// 1. IMPORTAR OS ÍCONES "CLEAN"
import {
    FaTrophy, FaGift, FaSyncAlt, FaGem, FaUsers, FaCoins, FaShoppingCart, FaLock,
    FaIdBadge, FaComments, FaPaintBrush, FaBookOpen, FaQuestionCircle, FaStar
} from 'react-icons/fa';

/**
 * @component FlowchartTheme
 * @description
 * A generic, "serious" visual theme for the Gamified Activity Board, rendering progress as an SVG flowchart.
 * 
 * Architectural Decisions:
 * - Mathematical SVG Generation: Uses a Catmull-Rom spline algorithm to draw smooth, curved SVG paths connecting dynamically calculated node coordinates.
 * - Unified Progression Array: Merges Hub elements with the main `progression_path` array via `useMemo` so the entire flow can be rendered in a single pass.
 * - Responsive Observers: Uses `ResizeObserver` to recalculate board width and node coordinates automatically.
 */
// --- CONFIGURAÇÃO VISUAL (Design System Local) ---
const THEME_COLORS = {
    path: {
        bg: "stroke-gray-300 dark:stroke-gray-700",
        fill: "stroke-blue-500 dark:stroke-blue-400", // Cor da "energia" fluindo
    },
    node: {
        locked: {
            fill: "fill-gray-200 dark:fill-gray-800",
            stroke: "stroke-gray-400 dark:stroke-gray-600",
            icon: "text-secondary-text dark:text-gray-600"
        },
        active: {
            fill: "fill-white dark:fill-gray-900",
            stroke: "stroke-blue-500 dark:stroke-blue-400",
            icon: "text-blue-600 dark:text-blue-400"
        },
        completed: {
            fill: "fill-green-100 dark:fill-green-900/30",
            stroke: "stroke-green-500 dark:stroke-green-400",
            icon: "text-green-600 dark:text-green-400"
        },
        mission: { // Especial
            fill: "fill-yellow-100 dark:fill-yellow-900/30",
            stroke: "stroke-yellow-500",
            icon: "text-yellow-600"
        },
        final: { // Especial
            fill: "fill-purple-100 dark:fill-purple-900/30",
            stroke: "stroke-purple-500",
            icon: "text-purple-600"
        }
    }
};

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
        finalRewardStatus,
        assets,
        userProgress
    } = useActivity();
    
    const { user } = useAuth();

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
                content: { title: assets?.hub?.mission?.name || "Missão" },
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
                content: { title: assets?.hub?.final_reward?.name || assets?.path?.final_reward?.name || "Fim" },
                isMandatory: true
            });
        }

        return allNodes;
    }, [gamificationDesign, hubElementsToRender, assets]); // Depende do design E dos elementos do hub
    
    const currentUserStepId = useMemo(() => {
        if (!userProgress || !userProgress.completed_steps) return 'start';
        const completed = userProgress.completed_steps;
        if (completed.length === 0) return 'start';
        const lastCompleted = completed[completed.length - 1];
        
        const pathIds = gamificationDesign?.progression_path?.map(s => s.id) || [];
        if (pathIds.length === 0) return 'start';
        
        if (lastCompleted === pathIds[pathIds.length - 1]) {
             return userProgress.status === 'completed' ? 'final_reward' : lastCompleted;
        }
        
        const currentIndex = pathIds.indexOf(lastCompleted);
        if (currentIndex !== -1 && currentIndex + 1 < pathIds.length) {
             return pathIds[currentIndex + 1];
        }
        return lastCompleted;
    }, [userProgress, gamificationDesign]);
    
    const userAvatar = userProgress?.equipped_activity_avatar_url || user?.profile_picture;

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
        return <div ref={boardRef} className="w-full h-full bg-secondary-bg" style={{ minHeight: '500px' }} />;
    }

    return (
        <div className="flex w-full h-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">

            {/* Coluna 1: O Tabuleiro */}
            <div className="relative flex-grow h-full flex flex-col">
                <GameHUD progress={userProgress} />

                <div className="flex-grow h-full overflow-y-auto overflow-x-hidden custom-scrollbar" ref={boardRef}>
                    {/* Background com Pattern (CSS Grid Dots) */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                    </div>

                    <div className="relative w-full" style={{ height: `${boardHeight}px` }}>
                        {boardWidth > 0 && (
                            <svg width="100%" height="100%" viewBox={`0 0 ${boardWidth} ${boardHeight}`} className="absolute top-0 left-0">
                                <defs>
                                    {/* Sombra suave para os nós */}
                                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.15" />
                                    </filter>
                                    {/* Gradiente para a linha de progresso */}
                                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#8B5CF6" />
                                    </linearGradient>
                                </defs>

                                {/* 1. Linha de Conexão (Fundo - Borda Grossa) */}
                                <path d={svgPath} className={`${THEME_COLORS.path.bg}`} strokeWidth="12" fill="none" strokeLinecap="round" />

                                {/* 2. Linha de Conexão (Frente - Mais fina e colorida) */}
                                {/* Opcional: Usar strokeDasharray para animar o progresso se quiser complexidade extra */}
                                <path d={svgPath} stroke="url(#pathGradient)" strokeWidth="4" fill="none" strokeLinecap="round" strokeOpacity="0.8" />

                                {/* 3. Nós */}
                                {fullPath.map((step, index) => {
                                    const { x, y } = stepCoordinates[index] || { x: 0, y: 0 };

                                    // Determinar Estado
                                    let status = (step.type === 'final_reward') ? finalRewardStatus : getStepStatus(step);
                                    const isLocked = status === 'locked';
                                    const isActive = status === 'active';
                                    const isCompleted = status === 'completed';
                                    
                                    // Determina se este é o passo atual do usuário
                                    const isCurrentUserHere = 
                                        (currentUserStepId === 'start' && step.type === 'mission') ||
                                        (currentUserStepId === step.id);

                                    // Determinar Estilos baseados no tipo e estado
                                    let styles = THEME_COLORS.node.locked;
                                    if (isActive) styles = THEME_COLORS.node.active;
                                    else if (isCompleted) styles = THEME_COLORS.node.completed;

                                    // Override para tipos especiais se ativo/completo
                                    if (!isLocked) {
                                        if (step.type === 'mission') styles = THEME_COLORS.node.mission;
                                        if (step.type === 'final_reward') styles = THEME_COLORS.node.final;
                                    }

                                    const IconComponent = functionalIconMap[step.type] || functionalIconMap.default;

                                    const handleClick = () => {
                                        if (isLocked) return;
                                        step.type === 'final_reward' ? handleFinalRewardClick() : handleStepClick(step);
                                    };

                                    return (
                                        <g
                                            key={step.id}
                                            transform={`translate(${x}, ${y})`}
                                            onClick={handleClick}
                                            style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                                            className="transition-all duration-300"
                                        >
                                            {/* Efeito de "Pulsar" para o nó ativo */}
                                            {isActive && (
                                                <circle cx="0" cy="0" r="45" className="fill-blue-500/20 animate-ping" />
                                            )}

                                            {/* Container do Nó (Card com sombra) */}
                                            <rect
                                                x="-40" y="-40" width="80" height="80" rx="20"
                                                className={`${styles.fill} ${styles.stroke} transition-all duration-300`}
                                                strokeWidth={isActive ? 3 : 2}
                                                filter={isActive || isCompleted ? "url(#shadow)" : ""}
                                            />

                                            {/* Ícone Centralizado */}
                                            <foreignObject x="-25" y="-25" width="50" height="50">
                                                <div className={`w-full h-full flex items-center justify-center text-3xl ${styles.icon}`}>
                                                    {isLocked ? <FaLock className="opacity-50 text-2xl" /> :
                                                        isCompleted && step.type !== 'final_reward' && step.type !== 'mission' ? <FaCheck /> :
                                                            IconComponent}
                                                </div>
                                            </foreignObject>

                                            {/* Badge/Label Flutuante (Opcional - exibe ID ou Ordem) */}
                                            {!isLocked && (
                                                <rect x="-15" y="45" width="30" height="16" rx="8" className="fill-slate-600 dark:fill-slate-700" />
                                            )}
                                            {!isLocked && (
                                                <text x="0" y="56" textAnchor="middle" className="text-[10px] fill-white font-bold pointer-events-none">
                                                    {index + 1}
                                                </text>
                                            )}
                                            
                                            {/* Badge do Usuário Atual (Avatar) */}
                                            {isCurrentUserHere && (
                                                <foreignObject x="-50" y="-100" width="100" height="100">
                                                    <div className="w-full h-full flex justify-center items-end pb-2">
                                                        <CurrentUserBadge avatar={userAvatar} />
                                                    </div>
                                                </foreignObject>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                        )}
                    </div>
                </div>
            </div>

            {/* Coluna 2: Hub Flutuante (Estilo Glass) */}
            <div className="w-20 md:w-64 flex-shrink-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm border-l border-slate-200 dark:border-slate-700 flex flex-col z-10 transition-all duration-300">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="hidden md:block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                        Menu
                    </h4>
                    <div className="md:hidden flex justify-center text-slate-500">
                        <FaSyncAlt /> {/* Ícone simples para mobile */}
                    </div>
                </div>

                <div className="p-3 space-y-3 overflow-y-auto custom-scrollbar">
                    {hubElements.map(element => {
                        const config = assets?.hub[element.type];
                        if (!config) return null;
                        const IconComponent = functionalIconMap[element.type] || functionalIconMap.default;

                        return (
                            <button
                                key={element.id}
                                onClick={() => handleHubIconClick(element.type)}
                                className="group w-full flex items-center p-3 rounded-xl transition-all duration-200 
                                           hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-sm border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                            >
                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl 
                                                text-slate-600 dark:text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    {IconComponent}
                                </div>
                                <span className="hidden md:block ml-3 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {config.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FlowchartTheme;