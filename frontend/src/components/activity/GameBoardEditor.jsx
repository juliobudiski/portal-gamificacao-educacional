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
        <div className="mt-8 p-6 border border-teal-300 dark:border-teal-800 rounded-lg bg-teal-50 dark:bg-teal-900/20">

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-teal-800 dark:text-teal-200 mb-1">Editor do Tabuleiro</h3>
                    <p className="text-sm text-secondary-text">
                        Construa a jornada. Use a IA para conectar a história, mas lembre-se de <strong>validar o conteúdo</strong>.
                    </p>
                </div>

                {/* Dropdown de Seleção de Tema */}
                <div className="flex items-center gap-2 bg-secondary-bg p-2 rounded-lg border border-border-color shadow-sm">
                    <span className="text-xs font-bold text-gray-500 uppercase">Tema:</span>
                    <select
                        value={currentThemeId}
                        onChange={(e) => handleThemeChange(e.target.value)}
                        className="text-sm bg-transparent font-semibold text-primary-text outline-none cursor-pointer min-w-[140px]"
                    >
                        {Object.values(BOARD_THEMES).map(theme => (
                            <option key={theme.id} value={theme.id}>{theme.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Coluna da Esquerda: Trilha */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="flex items-center text-lg font-semibold text-primary-text dark:text-secondary-text">
                            <FaRoute className="mr-3 text-blue-500" /> Trilha de Progressão
                        </h4>

                        {(gamificationDesign.progression_path?.length > 1) && (
                            <button id="tour-editor-ai-assist"
                                onClick={() => setIsAIModalOpen(true)}
                                className="flex items-center gap-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-md transition-transform hover:scale-105"
                                title="Assistente de Criação Inteligente"
                            >
                                <FaMagic /> Assistente de Conteúdo
                            </button>
                        )}
                    </div>

                    <div className="p-4 bg-secondary-bg/50 dark:bg-primary-bg/30 rounded-lg min-h-[300px]">

                        {/* --- BOTÕES DE ADICIONAR --- */}
                        <div className="flex flex-wrap gap-3 mb-6">
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
                                        className={`relative flex items-center pl-3 pr-4 py-2 text-sm border rounded-lg transition-all shadow-sm group
                                            ${isDisabled
                                                ? 'bg-gray-100 border-gray-200 text-secondary-text cursor-not-allowed opacity-60'
                                                : 'bg-secondary-bg border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-hover-bg-color0 text-gray-700 dark:text-gray-200'
                                            }
                                        `}
                                        title={isDisabled ? "Adicione uma Narrativa antes de incluir um Quiz." : config.name}
                                    >
                                        <img src={config.icon} alt="" className={`w-5 h-5 mr-2 ${isDisabled ? 'grayscale opacity-50' : ''}`} />
                                        <span className="font-medium">{config.name}</span>
                                        {count > 0 && (
                                            <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${isDisabled ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}`}>
                                                {count}
                                            </span>
                                        )}
                                        {!isDisabled && (
                                            <span className="ml-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FaPlus size={10} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* --- LISTA DE PASSOS (TRILHA) --- */}
                        <div className="space-y-3" id="tour-editor-canvas">
                            {(gamificationDesign.progression_path || []).map((step, index) => {
                                // Verifica se é um rascunho da IA
                                const isDraft = step.isDraft === true;
                                const hasContent = step.content && Object.keys(step.content).length > 0;

                                return (
                                    <div
                                        key={step.id}
                                        className={`flex items-center p-3 rounded-md shadow-sm border transition-all group
                                            ${isDraft
                                                ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-700'
                                                : 'bg-secondary-bg dark:bg-primary-bg border-transparent hover:border-blue-300'
                                            }`}
                                    >
                                        <span className="font-bold text-secondary-text mr-3 bg-gray-200 dark:bg-hover-bg-color0 w-6 h-6 flex items-center justify-center rounded-full text-xs">{index + 1}</span>
                                        <img src={elementConfig.path[step.type]?.icon} alt="" className="w-8 h-8 mr-3" />

                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-primary-text text-sm">{elementConfig.path[step.type]?.name}</p>

                                                {/* --- BADGES DE STATUS --- */}
                                                {isDraft ? (
                                                    <span className="flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded font-bold border border-yellow-200 dark:border-yellow-800">
                                                        <FaRobot size={10} /> Rascunho Automático
                                                    </span>
                                                ) : (
                                                    hasContent && (
                                                        <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded font-bold border border-green-200 dark:border-green-800">
                                                            <FaCheckDouble size={10} /> Validado
                                                        </span>
                                                    )
                                                )}
                                            </div>

                                            <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wide mt-1">
                                                <span className={`${step.isMandatory ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {step.isMandatory ? 'Obrigatório' : 'Opcional'}
                                                </span>

                                                {/* Mensagem de ação necessária se for Draft */}
                                                {isDraft && (
                                                    <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1 animate-pulse">
                                                        <FaExclamationTriangle size={10} /> Requer Revisão
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => toggleMandatory(step.id)} className="p-2 hover:bg-gray-200 dark:hover:bg-hover-bg-color0 rounded-lg text-gray-500">
                                                {step.isMandatory ? <FaToggleOn className="text-green-500" /> : <FaToggleOff />}
                                            </button>

                                            {/* Botão de Edição/Validação */}
                                            <button
                                                onClick={() => handleHumanValidation(step)}
                                                className={`p-2 rounded-lg transition-colors ${isDraft
                                                    ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 animate-bounce'
                                                    : 'hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500'
                                                    }`}
                                                title={isDraft ? "Revisar e Validar Conteúdo" : "Editar Conteúdo"}
                                            >
                                                <FaPen />
                                            </button>

                                            <button onClick={() => removePathStep(step.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500" title="Remover">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!gamificationDesign.progression_path || gamificationDesign.progression_path.length === 0) && (
                                <div className="text-center py-10 text-secondary-text border-2 border-dashed border-border-color rounded-lg">
                                    <p>A trilha está vazia.</p>
                                    <p className="text-xs mt-1">Adicione passos acima para começar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Hub */}
                <div>
                    <h4 className="flex items-center text-lg font-semibold mb-4 text-primary-text dark:text-secondary-text">
                        <FaCity className="mr-3 text-yellow-500" /> Hub e Elementos
                    </h4>
                    <div className="p-4 bg-secondary-bg/50 dark:bg-primary-bg/30 rounded-lg">
                        <p className="text-xs text-secondary-text mb-4">Ative os pontos de interesse da vila.</p>
                        <div className="space-y-3">
                            {(gamificationDesign.hub_elements || [])
                                .filter(el => el.type !== 'mission')
                                .map((element) => {
                                    const config = elementConfig.hub[element.type];
                                    if (!config) return null;
                                    return (
                                        <div key={element.id} onClick={() => toggleHubElement(element.type)} className="flex items-center p-3 bg-secondary-bg dark:bg-primary-bg rounded-lg shadow-sm cursor-pointer hover:bg-primary-bg dark:hover:bg-hover-bg-color0 transition-colors">
                                            <img src={config.icon} alt={config.name} className="w-8 h-8 mr-3" />
                                            <span className="flex-grow font-medium text-primary-text text-sm">{config.name}</span>
                                            {element.enabled ? <FaToggleOn className="text-green-500 h-6 w-6" /> : <FaToggleOff className="text-secondary-text h-6 w-6" />}
                                        </div>
                                    );
                                })}
                            {(!gamificationDesign.hub_elements || gamificationDesign.hub_elements.length === 0) && <p className="text-center text-sm text-secondary-text py-4">Nenhum elemento selecionado na Etapa 5.</p>}
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