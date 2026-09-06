import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    FaPlus, FaTrash, FaPen, FaToggleOn, FaToggleOff,
    FaRoute, FaCity, FaMagic, FaRobot, FaCheckDouble, FaExclamationTriangle
} from 'react-icons/fa';
import { getThemeAssets, BOARD_THEMES, decorationSpawnPoints } from '../../components/activity/GameBoardConfig';
import AIConfigModal from '../activity/AIConfigModal';
import { useTutorial } from '../../context/TutorialContext';
import { useToast } from '../../context/ToastContext';

/**
 * @component GameBoardEditor
 * @description
 * Complex visual editor allowing teachers to construct and modify the gamification progression path and hub elements.
 * 
 * Architectural Decisions:
 * - Controlled Design State: Lifts the `gamificationDesign` state up to the parent via `setActivityData` and `onStructureChange`, acting as a controlled component.
 * - AI Integration Flow: Handles the application of AI-generated content (`handleAIContentApplied`), explicitly marking generated steps as `isDraft` to enforce human-in-the-loop validation.
 * - Context/Memoization: Uses `useMemo` on `getThemeAssets` to prevent expensive recalculations of the asset tree on every render.
 */
function GameBoardEditor({ gamificationDesign = {}, setActivityData, onEditContent, onStructureChange, activityId, fullActivityData }) {

    // TODO: Adicionar 'useMemo' aos imports do React na linha 1. Definindo aqui para evitar crash em tempo de execução.
    const useMemo = React.useMemo;

    // LOG: Renderização do componente com metadados básicos
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
        console.log('// LOG: [GameBoardEditor] Renderizando componente.', { activityId, pathLength: gamificationDesign.progression_path?.length });
    }

    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const { startTour, stopTour } = useTutorial();
    const { showToast } = useToast();

    useEffect(() => {
        // Se o modal abriu, inicia o tour específico da IA
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log(`// LOG: [GameBoardEditor] Estado do modal IA alterado: ${isAIModalOpen ? 'Aberto' : 'Fechado'}`);
        }
        if (isAIModalOpen) {
            // Pequeno delay para garantir que o modal renderizou no DOM

        } else {
            // Se o modal fechou (usuário cancelou ou terminou), paramos o tour da IA
            // Opcional: Você poderia reiniciar o tour principal aqui se quisesse
            stopTour();
        }
    }, [isAIModalOpen, startTour, stopTour]);

    /**
     * @function updateDesign
     * @desc Atualiza uma chave específica no design de gamificação e propaga as mudanças.
     * @param {string} key - A chave do design a ser atualizada (ex: 'progression_path').
     * @param {any} value - O novo valor para a chave.
     */
    const updateDesign = (key, value) => {
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log(`// LOG: [GameBoardEditor] Atualizando design. Key: ${key}`, { valueType: typeof value });
        }
        const newDesign = { ...(gamificationDesign || {}), [key]: value };
        setActivityData(prev => ({ ...prev, gamificationDesign: newDesign }));
        if (['progression_path', 'hub_elements'].includes(key)) onStructureChange(newDesign);
    };

    // --- MANIPULAÇÃO DA TRILHA ---
    /**
     * @function addPathStep
     * @desc Adiciona um novo passo à trilha de progressão.
     * @param {string} type - O tipo de passo a ser adicionado (ex: 'narrative', 'quiz').
     */
    const addPathStep = (type) => {
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log(`// LOG: [GameBoardEditor] Tentando adicionar passo do tipo: ${type}`);
        }
        const currentPath = gamificationDesign.progression_path || [];

        if (type === 'quiz' && currentPath.length === 0) {
            if (import.meta.env.VITE_DEBUG_MODE === 'true') {
                console.warn('// LOG: [GameBoardEditor] Bloqueio: Quiz não pode ser o primeiro passo.');
            }
            showToast("Incoerência Pedagógica: Um Quiz não pode ser o primeiro passo. Adicione uma Narrativa ou Conteúdo antes para preparar o aluno.");
            return;
        }

        // isDraft: false por padrão para passos criados manualmente
        const newStep = { id: `step_${new Date().getTime()}`, type, isMandatory: true, content: {}, isDraft: false };
        const newPath = [...currentPath, newStep];
        updateDesign('progression_path', newPath);
    };

    /**
     * @function removePathStep
     * @desc Remove um passo da trilha de progressão pelo ID.
     * @param {string} stepId - O ID do passo a ser removido.
     */
    const removePathStep = (stepId) => {
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log(`// LOG: [GameBoardEditor] Removendo passo: ${stepId}`);
        }
        const currentPath = gamificationDesign.progression_path || [];
        const indexToRemove = currentPath.findIndex(s => s.id === stepId);

        if (indexToRemove === -1) return;

        if (indexToRemove === 0 && currentPath.length > 1 && currentPath[1].type === 'quiz') {
            // TODO: Substituir showToasts nativos por um sistema de notificação (Toast) mais amigável.
            if (import.meta.env.VITE_DEBUG_MODE === 'true') {
                console.warn('// LOG: [GameBoardEditor] Bloqueio: Remoção impedida pois tornaria um Quiz o primeiro passo.');
            }
            showToast("Ação Bloqueada: Você não pode remover este passo pois o próximo item é um Quiz. O Quiz não pode se tornar o início da trilha.");
            return;
        }

        const newPath = currentPath.filter(step => step.id !== stepId);
        updateDesign('progression_path', newPath);
    };

    /**
     * @function toggleMandatory
     * @desc Alterna o status de obrigatoriedade de um passo.
     * @param {string} stepId - O ID do passo.
     */
    const toggleMandatory = (stepId) => {
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log(`// LOG: [GameBoardEditor] Alternando obrigatoriedade para o passo: ${stepId}`);
        }
        const newPath = (gamificationDesign.progression_path || []).map(step => {
            if (step.id === stepId) return { ...step, isMandatory: !step.isMandatory };
            return step;
        });
        updateDesign('progression_path', newPath);
    };

    // --- LÓGICA DE VALIDAÇÃO HUMANA ---
    // Chamado quando o professor clica em "Editar" (Lápis)
    /**
     * @function handleHumanValidation
     * @desc Marca um passo como validado por humano (remove status de rascunho) e abre o editor.
     * @param {Object} step - O objeto do passo a ser editado.
     */
    const handleHumanValidation = (step) => {
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log(`// LOG: [GameBoardEditor] Validação humana iniciada para o passo: ${step.id}`);
        }
        // Se era um rascunho da IA, agora é considerado "Tocado por Humano"
        if (step.isDraft) {
            const newPath = (gamificationDesign.progression_path || []).map(s => {
                if (s.id === step.id) return { ...s, isDraft: false }; // Remove o selo de rascunho
                return s;
            });
            updateDesign('progression_path', newPath);
        }
        // Abre o editor normalmente
        onEditContent(step);
    };

    // --- CALLBACK DO SUCESSO DA IA ---
    /**
     * @function handleAIContentApplied
     * @desc Aplica o conteúdo gerado pela IA aos passos correspondentes na trilha.
     * @param {Object} contentMap - Mapa de conteúdos gerados, indexado pelo ID do passo.
     */
    const handleAIContentApplied = (contentMap) => {
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log('// LOG: [GameBoardEditor] Conteúdo de IA aplicado.', { itemsCount: Object.keys(contentMap).length });
        }
        const currentPath = gamificationDesign.progression_path || [];

        const newPath = currentPath.map(step => {
            if (contentMap[step.id]) {
                return {
                    ...step,
                    content: contentMap[step.id],
                    isDraft: true // <--- AQUI: Marcamos como Rascunho de IA para exigir revisão
                };
            }
            return step;
        });

        updateDesign('progression_path', newPath);
        showToast("Roteiro gerado! Observe os itens marcados como 'Rascunho Automático' e valide-os clicando no lápis.");
    };

    // --- MANIPULAÇÃO DO HUB ---
    /**
     * @function toggleHubElement
     * @desc Ativa ou desativa um elemento do Hub.
     * @param {string} elementType - O tipo do elemento do Hub.
     */
    const toggleHubElement = (elementType) => {
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log(`// LOG: [GameBoardEditor] Alternando elemento do Hub: ${elementType}`);
        }
        const newHubElements = (gamificationDesign.hub_elements || []).map(element => {
            if (element.type === elementType) return { ...element, enabled: !element.enabled };
            return element;
        });
        updateDesign('hub_elements', newHubElements);
    };

    // 1. Recuperar ou definir tema padrão
    const currentThemeId = gamificationDesign.theme || 'default';

    // 2. Memoizar a configuração de assets baseada no tema atual
    // Isso evita recálculos desnecessários e garante que os ícones atualizem quando o tema mudar
    const assets = useMemo(() => getThemeAssets(currentThemeId), [currentThemeId]);

    // TODO: A variável 'elementConfig' é usada no JSX mas não estava definida. Assumindo que ela se refere aos 'assets'.
    const elementConfig = assets;

    // 3. Função para trocar o tema
    /**
     * @function handleThemeChange
     * @desc Atualiza o tema visual do tabuleiro no design da gamificação.
     * @param {string} newThemeId - O identificador do novo tema selecionado.
     */
    const handleThemeChange = (newThemeId) => {
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log(`// LOG: [GameBoardEditor] Alterando tema do tabuleiro.`, { from: currentThemeId, to: newThemeId });
        }
        updateDesign('theme', newThemeId);
    };

    return (
        <div className="mt-10 bg-secondary-bg/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative">
            {/* Decoração sutil de fundo (Glows) */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-teal/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none"></div>

            <AIConfigModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={handleAIContentApplied}
                activityId={activityId}
                contextData={{
                    title: fullActivityData?.title || "Nova Atividade",
                    description: fullActivityData?.description || "Sem descrição",
                    area_knowledge: fullActivityData?.areaKnowledge || "Geral",
                    player_profile: fullActivityData?.playerProfile?.selectedProfiles?.join(", ") || "Geral",
                    ai_preset: {
                        ...(fullActivityData?.ai_preset || fullActivityData?.gamificationDesign?.ai_preset || {}),
                        narrativeGoal: (fullActivityData?.ai_preset?.narrativeGoal) ||
                            (fullActivityData?.gameElements?.narrativeContent) || ""
                    }
                }}
                structure={gamificationDesign.progression_path || []}
            />

            {/* --- CABEÇALHO COM SELETOR DE TEMA --- */}
            <div className="relative p-6 md:p-8 border-b border-white/10 bg-gradient-to-r from-primary-bg/90 via-secondary-bg/80 to-primary-bg/90 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 z-10">
                <div>
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-teal via-teal-300 to-accent-yellow mb-2 drop-shadow-sm tracking-tight">
                        Editor do Tabuleiro
                    </h3>
                    <p className="text-sm text-secondary-text leading-relaxed max-w-xl font-medium">
                        Construa a jornada. Use a IA para conectar a história, mas lembre-se de <strong className="text-primary-text">validar o conteúdo</strong>.
                    </p>
                </div>

                {/* Dropdown de Seleção de Tema */}
                <div className="flex items-center gap-3 bg-secondary-bg/50 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:border-accent-teal/30 transition-colors">
                    <span className="text-xs font-black text-accent-teal uppercase tracking-widest">Tema:</span>
                    <select
                        value={currentThemeId}
                        onChange={(e) => handleThemeChange(e.target.value)}
                        className="text-sm bg-transparent font-extrabold text-primary-text outline-none cursor-pointer min-w-[140px] focus:ring-0 appearance-none"
                    >
                        {Object.values(BOARD_THEMES).map(theme => (
                            <option key={theme.id} value={theme.id} className="bg-primary-bg text-primary-text">{theme.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="relative p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-12 z-10">
                {/* Coluna da Esquerda: Trilha */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="flex justify-between items-center">
                        <h4 className="flex items-center text-2xl font-black text-primary-text tracking-tight">
                            <FaRoute className="mr-3 text-accent-teal drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] text-2xl" /> Trilha de Progressão
                        </h4>

                        {(gamificationDesign.progression_path?.length > 1) && (
                            <button id="tour-editor-ai-assist"
                                onClick={() => setIsAIModalOpen(true)}
                                className="relative overflow-hidden flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-accent-purple to-purple-600 text-white px-5 py-3 rounded-xl shadow-[0_4px_20px_rgba(157,78,221,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(157,78,221,0.6)] group"
                                title="Assistente de Criação Inteligente"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                <FaMagic className="relative z-10" /> <span className="relative z-10">Assistente de Conteúdo</span>
                            </button>
                        )}
                    </div>

                    <div className="p-6 md:p-8 bg-secondary-bg/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-inner">
                        {/* --- BOTÕES DE ADICIONAR --- */}
                        <div className="flex flex-wrap gap-4 mb-10">
                            {Object.entries(elementConfig.path).map(([type, config]) => {
                                const currentPath = gamificationDesign?.progression_path || [];
                                const count = currentPath.filter(s => s.type === type).length;
                                const isQuizType = type === 'quiz';
                                const isDisabled = isQuizType && currentPath.length === 0;

                                return (
                                    <button
                                        key={type}
                                        id={`tour-editor-add-${type}`}
                                        onClick={() => !isDisabled && addPathStep(type)}
                                        disabled={isDisabled}
                                        className={`relative overflow-hidden flex items-center px-5 py-3 text-sm rounded-2xl transition-all duration-300 shadow-sm group
                                            ${isDisabled
                                                ? 'bg-primary-bg/50 border border-white/5 text-secondary-text cursor-not-allowed opacity-50'
                                                : 'bg-primary-bg/80 border border-white/10 hover:border-accent-teal/50 hover:bg-secondary-bg hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(20,184,166,0.15)] text-primary-text'
                                            }
                                        `}
                                        title={isDisabled ? "Adicione uma Narrativa antes de incluir um Quiz." : config.name}
                                    >
                                        {!isDisabled && <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>}
                                        <img src={config.icon} alt="" className={`relative z-10 w-6 h-6 mr-3 ${isDisabled ? 'grayscale opacity-50' : 'drop-shadow-md group-hover:scale-110 transition-transform'}`} />
                                        <span className="relative z-10 font-bold tracking-wide">{config.name}</span>
                                        {count > 0 && (
                                            <span className={`relative z-10 ml-3 text-xs font-black px-2.5 py-0.5 rounded-lg ${isDisabled ? 'bg-secondary-bg text-secondary-text' : 'bg-accent-teal/20 text-accent-teal shadow-inner'}`}>
                                                {count}
                                            </span>
                                        )}
                                        {!isDisabled && (
                                            <span className="relative z-10 ml-3 text-accent-teal opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 duration-300">
                                                <FaPlus size={14} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* --- LISTA DE PASSOS (TRILHA EM TIMELINE) --- */}
                        <div className="relative pl-8 space-y-10 before:content-[''] before:absolute before:left-[47px] before:top-8 before:bottom-8 before:w-1 before:bg-gradient-to-b before:from-accent-teal before:via-accent-purple/50 before:to-transparent before:rounded-full before:opacity-60" id="tour-editor-canvas">
                            {(gamificationDesign.progression_path || []).map((step, index) => {
                                const isDraft = step.isDraft === true;
                                const hasContent = step.content && Object.keys(step.content).length > 0;

                                return (
                                    <div key={step.id} className="relative flex items-start group">
                                        {/* Número (Timeline Dot) */}
                                        <div className={`absolute -left-8 w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-secondary-bg z-10 transition-all duration-300 shadow-lg group-hover:scale-110
                                            ${isDraft ? 'bg-gradient-to-br from-accent-yellow to-yellow-600 text-gray-900 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-gradient-to-br from-accent-teal to-teal-600 text-gray-900 shadow-[0_0_15px_rgba(20,184,166,0.4)]'}`}
                                        >
                                            <span className="font-black text-base">{index + 1}</span>
                                        </div>

                                        {/* Card do Passo */}
                                        <div className={`ml-12 flex-grow p-6 rounded-3xl border transition-all duration-300 hover:shadow-2xl
                                            ${isDraft
                                                ? 'bg-accent-yellow/5 backdrop-blur-lg border-accent-yellow/30 hover:border-accent-yellow/60 hover:-translate-y-1'
                                                : 'bg-primary-bg/60 backdrop-blur-lg border-white/10 hover:border-accent-teal/50 hover:-translate-y-1'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                                <div className="flex items-center">
                                                    <div className="w-14 h-14 rounded-2xl bg-secondary-bg/80 flex items-center justify-center mr-5 shadow-inner border border-white/5 group-hover:rotate-3 transition-transform">
                                                        <img src={elementConfig.path[step.type]?.icon} alt="" className="w-8 h-8 drop-shadow-md" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-black text-primary-text text-lg tracking-tight mb-1">{elementConfig.path[step.type]?.name}</h5>
                                                        
                                                        {/* --- BADGES E STATUS --- */}
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            {isDraft ? (
                                                                <span className="flex items-center gap-1.5 text-[11px] bg-accent-yellow/20 text-accent-yellow px-2.5 py-1 rounded-md font-black uppercase tracking-widest border border-accent-yellow/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                                                    <FaRobot size={12} className="animate-pulse" /> Rascunho
                                                                </span>
                                                            ) : (
                                                                hasContent && (
                                                                    <span className="flex items-center gap-1.5 text-[11px] bg-success/20 text-success px-2.5 py-1 rounded-md font-black uppercase tracking-widest border border-success/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                                                        <FaCheckDouble size={12} /> Validado
                                                                    </span>
                                                                )
                                                            )}
                                                            <span className={`text-[11px] uppercase font-black tracking-widest ${step.isMandatory ? 'text-success' : 'text-secondary-text'}`}>
                                                                {step.isMandatory ? 'Obrigatório' : 'Opcional'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Ações */}
                                                <div className="flex items-center gap-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                                                    <button onClick={() => toggleMandatory(step.id)} className="p-3 bg-secondary-bg hover:bg-primary-bg rounded-xl text-secondary-text transition-all duration-300 border border-white/5 hover:border-white/20 hover:scale-105 hover:shadow-md" title="Alternar Obrigatoriedade">
                                                        {step.isMandatory ? <FaToggleOn className="text-success text-2xl drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]" /> : <FaToggleOff className="text-2xl" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleHumanValidation(step)}
                                                        className={`p-3 rounded-xl transition-all duration-300 border hover:scale-105 hover:shadow-md
                                                            ${isDraft
                                                            ? 'bg-accent-yellow/20 border-accent-yellow/40 hover:bg-accent-yellow/30 text-accent-yellow shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-pulse'
                                                            : 'bg-accent-teal/10 border-accent-teal/20 hover:bg-accent-teal/20 text-accent-teal'
                                                            }`}
                                                        title={isDraft ? "Revisar e Validar" : "Editar Conteúdo"}
                                                    >
                                                        <FaPen />
                                                    </button>
                                                    <button onClick={() => removePathStep(step.id)} className="p-3 bg-danger/10 hover:bg-danger/20 border border-danger/20 hover:border-danger/40 rounded-xl text-danger transition-all duration-300 hover:scale-105 hover:shadow-md" title="Remover Passo">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {isDraft && (
                                                <div className="mt-4 text-[13px] text-accent-yellow font-bold flex items-center gap-2 bg-accent-yellow/5 p-3 rounded-xl border border-accent-yellow/10">
                                                    <FaExclamationTriangle size={14} /> Clique no lápis para revisar o conteúdo sugerido.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {(!gamificationDesign.progression_path || gamificationDesign.progression_path.length === 0) && (
                                <div className="text-center py-16 bg-primary-bg/30 backdrop-blur-sm border-2 border-dashed border-white/10 rounded-3xl">
                                    <p className="text-primary-text font-black text-xl mb-3 tracking-tight">Sua trilha está vazia.</p>
                                    <p className="text-base text-secondary-text font-medium">Clique nos botões acima para iniciar a jornada.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Hub */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="sticky top-6">
                        <h4 className="flex items-center text-2xl font-black text-primary-text mb-3 tracking-tight">
                            <FaCity className="mr-3 text-accent-yellow drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] text-2xl" /> Elementos do Hub
                        </h4>
                        <p className="text-sm text-secondary-text leading-relaxed font-medium mb-6">
                            Ative pontos de interesse na vila (como Loja ou Ranking) para os jogadores interagirem entre os passos da trilha.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {(gamificationDesign.hub_elements || [])
                                .filter(el => el.type !== 'mission')
                                .map((element) => {
                                    const config = elementConfig.hub[element.type];
                                    if (!config) return null;
                                    return (
                                        <div 
                                            key={element.id} 
                                            onClick={() => toggleHubElement(element.type)} 
                                            className={`relative overflow-hidden flex flex-col items-center justify-center p-6 rounded-3xl border cursor-pointer transition-all duration-500 transform hover:-translate-y-2 text-center group
                                                ${element.enabled 
                                                    ? 'bg-gradient-to-br from-accent-teal/20 to-primary-bg/80 backdrop-blur-xl border-accent-teal/50 shadow-[0_10px_30px_rgba(20,184,166,0.2)]' 
                                                    : 'bg-secondary-bg/50 backdrop-blur-md border-white/5 hover:border-accent-teal/30 hover:shadow-xl'
                                                }`}
                                        >
                                            {element.enabled && <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>}
                                            <div className="relative mb-4">
                                                <img src={config.icon} alt={config.name} className={`w-14 h-14 transition-all duration-500 ${element.enabled ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100'}`} />
                                                {element.enabled && (
                                                    <div className="absolute -top-2 -right-2 bg-gradient-to-br from-success to-green-600 text-white rounded-full p-1 border-2 border-primary-bg shadow-lg animate-bounce-slow">
                                                        <FaToggleOn size={14} />
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`font-black text-[15px] tracking-wide transition-colors duration-300 ${element.enabled ? 'text-accent-teal drop-shadow-sm' : 'text-secondary-text group-hover:text-primary-text'}`}>
                                                {config.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            {(!gamificationDesign.hub_elements || gamificationDesign.hub_elements.length === 0) && (
                                <div className="col-span-1 sm:col-span-2 text-center py-12 text-sm font-bold text-secondary-text border-2 border-dashed border-white/10 rounded-3xl bg-secondary-bg/30 backdrop-blur-sm">
                                    Nenhum elemento extra selecionado na Etapa 5.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

GameBoardEditor.propTypes = {
    gamificationDesign: PropTypes.shape({
        progression_path: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string,
            type: PropTypes.string,
            isMandatory: PropTypes.bool,
            content: PropTypes.object,
            isDraft: PropTypes.bool
        })),
        hub_elements: PropTypes.arrayOf(PropTypes.shape({
            type: PropTypes.string,
            enabled: PropTypes.bool
        }))
    }),
    setActivityData: PropTypes.func.isRequired,
    onEditContent: PropTypes.func.isRequired,
    onStructureChange: PropTypes.func.isRequired,
    activityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    // Validação da estrutura da atividade (activity) e dados completos
    fullActivityData: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
        class_name: PropTypes.string,
        description: PropTypes.string,
        areaKnowledge: PropTypes.string,
        playerProfile: PropTypes.object,
        ai_preset: PropTypes.object,
        gamificationDesign: PropTypes.object,
        gameElements: PropTypes.object
    })
};

export default GameBoardEditor;