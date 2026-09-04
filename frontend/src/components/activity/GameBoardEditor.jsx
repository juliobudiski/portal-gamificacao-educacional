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
 * @desc Componente responsável pela edição visual do tabuleiro de gamificação, permitindo gerenciar a trilha de progressão e elementos do Hub.
 * @param {Object} props - As propriedades recebidas pelo componente.
 * @returns {JSX.Element} O elemento JSX do editor do tabuleiro.
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
        <div className="mt-10 bg-secondary-bg/80 backdrop-blur-xl border border-border-color rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-300">
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
            <div className="p-6 md:p-8 border-b border-border-color bg-gradient-to-r from-secondary-bg to-primary-bg/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow mb-2">
                        Editor do Tabuleiro
                    </h3>
                    <p className="text-sm text-secondary-text leading-relaxed max-w-xl">
                        Construa a jornada. Use a IA para conectar a história, mas lembre-se de <strong>validar o conteúdo</strong>.
                    </p>
                </div>

                {/* Dropdown de Seleção de Tema */}
                <div className="flex items-center gap-3 bg-primary-bg/80 px-4 py-2.5 rounded-xl border border-border-color shadow-inner">
                    <span className="text-xs font-bold text-secondary-text uppercase tracking-wider">Tema:</span>
                    <select
                        value={currentThemeId}
                        onChange={(e) => handleThemeChange(e.target.value)}
                        className="text-sm bg-transparent font-extrabold text-primary-text outline-none cursor-pointer min-w-[140px] focus:ring-0"
                    >
                        {Object.values(BOARD_THEMES).map(theme => (
                            <option key={theme.id} value={theme.id}>{theme.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Coluna da Esquerda: Trilha */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="flex justify-between items-center">
                        <h4 className="flex items-center text-xl font-bold text-primary-text">
                            <FaRoute className="mr-3 text-accent-teal text-2xl" /> Trilha de Progressão
                        </h4>

                        {(gamificationDesign.progression_path?.length > 1) && (
                            <button id="tour-editor-ai-assist"
                                onClick={() => setIsAIModalOpen(true)}
                                className="flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-accent-purple to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(157,78,221,0.4)] transition-transform hover:-translate-y-0.5"
                                title="Assistente de Criação Inteligente"
                            >
                                <FaMagic /> Assistente de Conteúdo
                            </button>
                        )}
                    </div>

                    <div className="p-5 bg-primary-bg/50 rounded-2xl border border-border-color shadow-inner">
                        {/* --- BOTÕES DE ADICIONAR --- */}
                        <div className="flex flex-wrap gap-3 mb-8">
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
                                        className={`relative flex items-center px-4 py-2.5 text-sm border rounded-xl transition-all shadow-sm group
                                            ${isDisabled
                                                ? 'bg-secondary-bg/50 border-border-color/50 text-secondary-text cursor-not-allowed opacity-50'
                                                : 'bg-secondary-bg border-border-color hover:border-accent-teal/50 hover:bg-hover-bg-color hover:-translate-y-0.5 hover:shadow-md text-primary-text'
                                            }
                                        `}
                                        title={isDisabled ? "Adicione uma Narrativa antes de incluir um Quiz." : config.name}
                                    >
                                        <img src={config.icon} alt="" className={`w-5 h-5 mr-2 ${isDisabled ? 'grayscale opacity-50' : ''}`} />
                                        <span className="font-bold tracking-wide">{config.name}</span>
                                        {count > 0 && (
                                            <span className={`ml-3 text-xs font-extrabold px-2 py-0.5 rounded-lg ${isDisabled ? 'bg-primary-bg text-secondary-text' : 'bg-accent-teal/20 text-accent-teal'}`}>
                                                {count}
                                            </span>
                                        )}
                                        {!isDisabled && (
                                            <span className="ml-2 text-accent-teal opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FaPlus size={12} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* --- LISTA DE PASSOS (TRILHA EM TIMELINE) --- */}
                        <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[43px] before:top-6 before:bottom-6 before:w-0.5 before:bg-border-color" id="tour-editor-canvas">
                            {(gamificationDesign.progression_path || []).map((step, index) => {
                                const isDraft = step.isDraft === true;
                                const hasContent = step.content && Object.keys(step.content).length > 0;

                                return (
                                    <div key={step.id} className="relative flex items-start group">
                                        {/* Número (Timeline Dot) */}
                                        <div className={`absolute -left-6 w-10 h-10 rounded-xl flex items-center justify-center border-4 border-primary-bg z-10 transition-colors shadow-sm
                                            ${isDraft ? 'bg-accent-yellow text-gray-900' : 'bg-accent-teal text-gray-900'}`}
                                        >
                                            <span className="font-extrabold text-sm">{index + 1}</span>
                                        </div>

                                        {/* Card do Passo */}
                                        <div className={`ml-10 flex-grow p-5 rounded-2xl border transition-all hover:shadow-lg
                                            ${isDraft
                                                ? 'bg-accent-yellow/5 border-accent-yellow/30 hover:border-accent-yellow/60'
                                                : 'bg-secondary-bg border-border-color hover:border-accent-teal/50'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center">
                                                    <div className="w-12 h-12 rounded-xl bg-primary-bg flex items-center justify-center mr-4 shadow-inner border border-border-color">
                                                        <img src={elementConfig.path[step.type]?.icon} alt="" className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-extrabold text-primary-text text-base mb-1">{elementConfig.path[step.type]?.name}</h5>
                                                        
                                                        {/* --- BADGES E STATUS --- */}
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                            {isDraft ? (
                                                                <span className="flex items-center gap-1 text-[10px] bg-accent-yellow/20 text-accent-yellow px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                                                                    <FaRobot size={10} /> Rascunho
                                                                </span>
                                                            ) : (
                                                                hasContent && (
                                                                    <span className="flex items-center gap-1 text-[10px] bg-success/20 text-success px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                                                                        <FaCheckDouble size={10} /> Validado
                                                                    </span>
                                                                )
                                                            )}
                                                            <span className={`text-[10px] uppercase font-bold tracking-wider ${step.isMandatory ? 'text-success' : 'text-accent-yellow'}`}>
                                                                {step.isMandatory ? 'Obrigatório' : 'Opcional'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Ações */}
                                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => toggleMandatory(step.id)} className="p-2.5 bg-primary-bg hover:bg-hover-bg-color rounded-xl text-secondary-text transition-colors border border-transparent hover:border-border-color" title="Alternar Obrigatoriedade">
                                                        {step.isMandatory ? <FaToggleOn className="text-success text-xl" /> : <FaToggleOff className="text-xl" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleHumanValidation(step)}
                                                        className={`p-2.5 rounded-xl transition-all border
                                                            ${isDraft
                                                            ? 'bg-accent-yellow/20 border-accent-yellow/40 hover:bg-accent-yellow/30 text-accent-yellow animate-pulse'
                                                            : 'bg-accent-teal/10 border-accent-teal/20 hover:bg-accent-teal/20 text-accent-teal'
                                                            }`}
                                                        title={isDraft ? "Revisar e Validar" : "Editar Conteúdo"}
                                                    >
                                                        <FaPen />
                                                    </button>
                                                    <button onClick={() => removePathStep(step.id)} className="p-2.5 bg-danger/10 hover:bg-danger/20 border border-danger/20 hover:border-danger/40 rounded-xl text-danger transition-colors" title="Remover Passo">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {isDraft && (
                                                <div className="mt-3 text-xs text-accent-yellow font-medium flex items-center gap-1">
                                                    <FaExclamationTriangle size={12} /> Clique no lápis para revisar o conteúdo sugerido.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {(!gamificationDesign.progression_path || gamificationDesign.progression_path.length === 0) && (
                                <div className="text-center py-12 bg-secondary-bg border-2 border-dashed border-border-color rounded-2xl">
                                    <p className="text-secondary-text font-bold text-lg mb-2">Sua trilha está vazia.</p>
                                    <p className="text-sm text-secondary-text/70">Clique nos botões acima para iniciar a jornada.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Hub */}
                <div className="lg:col-span-5 space-y-6">
                    <h4 className="flex items-center text-xl font-bold text-primary-text mb-2">
                        <FaCity className="mr-3 text-accent-yellow text-2xl" /> Elementos do Hub
                    </h4>
                    <p className="text-sm text-secondary-text leading-relaxed">
                        Ative pontos de interesse na vila (como Loja ou Ranking) para os jogadores interagirem entre os passos da trilha.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        {(gamificationDesign.hub_elements || [])
                            .filter(el => el.type !== 'mission')
                            .map((element) => {
                                const config = elementConfig.hub[element.type];
                                if (!config) return null;
                                return (
                                    <div 
                                        key={element.id} 
                                        onClick={() => toggleHubElement(element.type)} 
                                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-center
                                            ${element.enabled 
                                                ? 'bg-gradient-to-br from-accent-teal/10 to-primary-bg border-accent-teal/50 shadow-[0_4px_20px_rgba(20,184,166,0.15)]' 
                                                : 'bg-primary-bg border-border-color hover:border-accent-teal/30 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="relative mb-3">
                                            <img src={config.icon} alt={config.name} className={`w-12 h-12 transition-all ${element.enabled ? 'scale-110 drop-shadow-md' : 'opacity-70 grayscale'}`} />
                                            {element.enabled && (
                                                <div className="absolute -top-1 -right-1 bg-success text-white rounded-full p-0.5 border-2 border-primary-bg">
                                                    <FaToggleOn size={12} />
                                                </div>
                                            )}
                                        </div>
                                        <span className={`font-extrabold text-sm ${element.enabled ? 'text-accent-teal' : 'text-secondary-text'}`}>
                                            {config.name}
                                        </span>
                                    </div>
                                );
                            })}
                        {(!gamificationDesign.hub_elements || gamificationDesign.hub_elements.length === 0) && (
                            <div className="col-span-1 sm:col-span-2 text-center py-8 text-sm text-secondary-text border border-dashed border-border-color rounded-2xl bg-primary-bg/50">
                                Nenhum elemento extra selecionado na Etapa 5.
                            </div>
                        )}
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