import React, { useState, useEffect } from 'react';
import {
    FaPlus, FaTrash, FaPen, FaToggleOn, FaToggleOff,
    FaRoute, FaCity, FaMagic, FaRobot, FaCheckDouble, FaExclamationTriangle
} from 'react-icons/fa';
import { elementConfig } from '../../components/activity/GameBoardConfig';
import AIConfigModal from '../activity/AIConfigModal';
import { WIZARD_IA_STEPS } from '../../data/tutorialSteps';
import { useTutorial } from '../../context/TutorialContext';

function GameBoardEditor({ gamificationDesign = {}, setActivityData, onEditContent, onStructureChange, activityId, fullActivityData }) {

    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const { startTour, stopTour } = useTutorial();
    useEffect(() => {
        // Se o modal abriu, inicia o tour específico da IA
        if (isAIModalOpen) {
            // Pequeno delay para garantir que o modal renderizou no DOM
            setTimeout(() => {
                // startTour aceita (passos, chave_unica, forçar_inicio)
                // Usamos force=true para garantir que rode mesmo se o usuário já viu antes
                startTour(WIZARD_IA_STEPS, 'wizard_ai_modal', true);
            }, 500);
        } else {
            // Se o modal fechou (usuário cancelou ou terminou), paramos o tour da IA
            // Opcional: Você poderia reiniciar o tour principal aqui se quisesse
            stopTour();
        }
    }, [isAIModalOpen, startTour, stopTour]);
    const updateDesign = (key, value) => {
        const newDesign = { ...(gamificationDesign || {}), [key]: value };
        setActivityData(prev => ({ ...prev, gamificationDesign: newDesign }));
        if (['progression_path', 'hub_elements'].includes(key)) onStructureChange(newDesign);
    };

    // --- MANIPULAÇÃO DA TRILHA ---
    const addPathStep = (type) => {
        const currentPath = gamificationDesign.progression_path || [];

        if (type === 'quiz' && currentPath.length === 0) {
            alert("Incoerência Pedagógica: Um Quiz não pode ser o primeiro passo. Adicione uma Narrativa ou Conteúdo antes para preparar o aluno.");
            return;
        }

        // isDraft: false por padrão para passos criados manualmente
        const newStep = { id: `step_${new Date().getTime()}`, type, isMandatory: true, content: {}, isDraft: false };
        const newPath = [...currentPath, newStep];
        updateDesign('progression_path', newPath);
    };

    const removePathStep = (stepId) => {
        const currentPath = gamificationDesign.progression_path || [];
        const indexToRemove = currentPath.findIndex(s => s.id === stepId);

        if (indexToRemove === -1) return;

        if (indexToRemove === 0 && currentPath.length > 1 && currentPath[1].type === 'quiz') {
            alert("Ação Bloqueada: Você não pode remover este passo pois o próximo item é um Quiz. O Quiz não pode se tornar o início da trilha.");
            return;
        }

        const newPath = currentPath.filter(step => step.id !== stepId);
        updateDesign('progression_path', newPath);
    };

    const toggleMandatory = (stepId) => {
        const newPath = (gamificationDesign.progression_path || []).map(step => {
            if (step.id === stepId) return { ...step, isMandatory: !step.isMandatory };
            return step;
        });
        updateDesign('progression_path', newPath);
    };

    // --- LÓGICA DE VALIDAÇÃO HUMANA ---
    // Chamado quando o professor clica em "Editar" (Lápis)
    const handleHumanValidation = (step) => {
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
    const handleAIContentApplied = (contentMap) => {
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
        alert("Roteiro gerado! Observe os itens marcados como 'Rascunho Automático' e valide-os clicando no lápis.");
    };

    // --- MANIPULAÇÃO DO HUB ---
    const toggleHubElement = (elementType) => {
        const newHubElements = (gamificationDesign.hub_elements || []).map(element => {
            if (element.type === elementType) return { ...element, enabled: !element.enabled };
            return element;
        });
        updateDesign('hub_elements', newHubElements);
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

            <h3 className="text-xl font-bold text-teal-800 dark:text-teal-200 mb-2">Editor do Tabuleiro</h3>
            <p className="text-sm text-secondary-text mb-6">Construa a jornada. Use a IA para conectar a história, mas lembre-se de <strong>validar o conteúdo</strong>.</p>

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
                                        // ✅ ADICIONE ESTA LINHA: Gera id="tour-editor-add-narrative", "tour-editor-add-quiz", etc.
                                        id={`tour-editor-add-${type}`}

                                        onClick={() => !isDisabled && addPathStep(type)}
                                        disabled={isDisabled}
                                        className={`relative flex items-center pl-3 pr-4 py-2 text-sm border rounded-lg transition-all shadow-sm group
                    ${isDisabled
                                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                                                : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
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
                                        <span className="font-bold text-secondary-text mr-3 bg-gray-200 dark:bg-gray-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">{index + 1}</span>
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
                                            <button onClick={() => toggleMandatory(step.id)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500">
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
                                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                    <p>A trilha está vazia.</p>
                                    <p className="text-xs mt-1">Adicione passos acima para começar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Hub (Mantida igual) */}
                <div>
                    <h4 className="flex items-center text-lg font-semibold mb-4 text-primary-text dark:text-secondary-text">
                        <FaCity className="mr-3 text-yellow-500" /> Hub e Elementos
                    </h4>
                    <div className="p-4 bg-secondary-bg/50 dark:bg-primary-bg/30 rounded-lg">
                        <p className="text-xs text-secondary-text mb-4">Ative os pontos de interesse da vila.</p>
                        <div className="space-y-3">
                            {(gamificationDesign.hub_elements || []).map((element) => {
                                const config = elementConfig.hub[element.type];
                                if (!config) return null;
                                return (
                                    <div key={element.id} onClick={() => toggleHubElement(element.type)} className="flex items-center p-3 bg-secondary-bg dark:bg-primary-bg rounded-lg shadow-sm cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-colors">
                                        <img src={config.icon} alt={config.name} className="w-8 h-8 mr-3" />
                                        <span className="flex-grow font-medium text-primary-text text-sm">{config.name}</span>
                                        {element.enabled ? <FaToggleOn className="text-green-500 h-6 w-6" /> : <FaToggleOff className="text-gray-400 h-6 w-6" />}
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

export default GameBoardEditor;