import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaTrash, FaPen, FaToggleOn, FaToggleOff, FaRoute, FaCity, FaMagic } from 'react-icons/fa';
import { elementConfig } from '../../components/activity/GameBoardConfig'; // Ajuste o caminho conforme sua estrutura
import { useParams } from 'react-router-dom';
import AIConfigModal from '../activity/AIConfigModal'; // <--- Importamos o novo modal

function GameBoardEditor({ gamificationDesign = {}, setActivityData, onEditContent, onStructureChange, activityId, fullActivityData }) {

    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    const updateDesign = (key, value) => {
        const newDesign = { ...(gamificationDesign || {}), [key]: value };
        setActivityData(prev => ({ ...prev, gamificationDesign: newDesign }));
        if (['progression_path', 'hub_elements'].includes(key)) onStructureChange(newDesign);
    };

    // --- MANIPULAÇÃO DA TRILHA ---
    const addPathStep = (type) => {
        const currentPath = gamificationDesign.progression_path || [];

        // --- REGRA DE NEGÓCIO: Quiz não pode ser o primeiro ---
        // Se o tipo for 'quiz' E a trilha estiver vazia, bloqueamos.
        // Nota: Ajuste 'quiz' para a chave exata usada no seu elementConfig (ex: 'challenge', 'battle', etc)
        if (type === 'quiz' && currentPath.length === 0) {
            alert("Incoerência Pedagógica: Um Quiz não pode ser o primeiro passo. Adicione uma Narrativa ou Conteúdo antes para preparar o aluno.");
            return;
        }

        const newStep = { id: `step_${new Date().getTime()}`, type, isMandatory: true, content: {} };
        const newPath = [...currentPath, newStep]; // Usando currentPath que já definimos acima
        updateDesign('progression_path', newPath);
    };

    const removePathStep = (stepId) => {
        const currentPath = gamificationDesign.progression_path || [];
        const indexToRemove = currentPath.findIndex(s => s.id === stepId);

        if (indexToRemove === -1) return;

        // --- REGRA DE NEGÓCIO: Proteção de Integridade ---
        // Se estamos removendo o PRIMEIRO item (index 0)
        // E existe um SEGUNDO item (index 1)
        // E esse segundo item é um QUIZ
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

    // --- MANIPULAÇÃO DO HUB ---
    const toggleHubElement = (elementType) => {
        const newHubElements = (gamificationDesign.hub_elements || []).map(element => {
            if (element.type === elementType) return { ...element, enabled: !element.enabled };
            return element;
        });
        updateDesign('hub_elements', newHubElements);
    };

    // --- CALLBACK DO SUCESSO DA IA ---
    // Esta função é chamada pelo AIConfigModal quando o backend devolve o JSON completo
    const handleAIContentApplied = (contentMap) => {
        const currentPath = gamificationDesign.progression_path || [];

        const newPath = currentPath.map(step => {
            // Se o ID do passo estiver no mapa retornado pela IA, atualizamos o conteúdo
            if (contentMap[step.id]) {
                return {
                    ...step,
                    content: contentMap[step.id]
                };
            }
            return step;
        });

        updateDesign('progression_path', newPath);
        alert("Roteiro aplicado com sucesso! Clique nos lápis para ver os detalhes de cada passo.");
    };

    return (
        <div className="mt-8 p-6 border border-teal-300 dark:border-teal-800 rounded-lg bg-teal-50 dark:bg-teal-900/20">

            {/* --- COMPONENTE DO MODAL --- */}
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

                    // Criamos um preset fundindo o AI_PRESET oficial com o CONTEÚDO LEGADO do template
                    ai_preset: {
                        ...(fullActivityData?.ai_preset || fullActivityData?.gamificationDesign?.ai_preset || {}),

                        // Se o preset não tiver objetivo narrativo, tentamos pegar do gameElements (legado do template)
                        narrativeGoal: (fullActivityData?.ai_preset?.narrativeGoal) ||
                            (fullActivityData?.gameElements?.narrativeContent) ||
                            ""
                    }
                }}
                structure={gamificationDesign.progression_path || []}
            />

            <h3 className="text-xl font-bold text-teal-800 dark:text-teal-200 mb-2">Editor do Tabuleiro</h3>
            <p className="text-sm text-secondary-text mb-6">Construa a jornada. Use a IA para conectar a história entre os passos.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Coluna da Esquerda: Trilha */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="flex items-center text-lg font-semibold text-primary-text dark:text-secondary-text">
                            <FaRoute className="mr-3 text-blue-500" /> Trilha de Progressão
                        </h4>

                        {/* Botão para abrir o Modal de IA */}
                        {(gamificationDesign.progression_path?.length > 1) && (
                            <button
                                onClick={() => setIsAIModalOpen(true)}
                                className="flex items-center gap-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-md transition-transform hover:scale-105"
                                title="Gerar roteiro conectado para todos os passos"
                            >
                                <FaMagic /> Preencher Trilha com IA
                            </button>
                        )}
                    </div>

                    <div className="p-4 bg-secondary-bg/50 dark:bg-primary-bg/30 rounded-lg min-h-[300px]">

                        {/* --- BOTÕES DE ADICIONAR COM CONTADORES --- */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {Object.entries(elementConfig.path).map(([type, config]) => {
                                const currentPath = gamificationDesign?.progression_path || [];
                                const count = currentPath.filter(s => s.type === type).length;

                                // Verifica se o botão deve ser desabilitado
                                const isQuizType = type === 'quiz'; // Ajuste conforme sua chave real
                                const isDisabled = isQuizType && currentPath.length === 0;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => !isDisabled && addPathStep(type)} // Previne clique
                                        disabled={isDisabled} // Atributo HTML
                                        // Estilização condicional para estado disabled
                                        className={`relative flex items-center pl-3 pr-4 py-2 text-sm border rounded-lg transition-all shadow-sm group
                ${isDisabled
                                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                                                : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                                            }
            `}
                                        // Tooltip explicativo
                                        title={isDisabled ? "Adicione uma Narrativa antes de incluir um Quiz." : config.name}
                                    >
                                        <img
                                            src={config.icon}
                                            alt=""
                                            className={`w-5 h-5 mr-2 ${isDisabled ? 'grayscale opacity-50' : ''}`}
                                        />
                                        <span className="font-medium">{config.name}</span>

                                        {/* Badge do Contador */}
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

                        {/* Lista de Passos */}
                        <div className="space-y-3">
                            {(gamificationDesign.progression_path || []).map((step, index) => (
                                <div key={step.id} className="flex items-center p-3 bg-secondary-bg dark:bg-primary-bg rounded-md shadow-sm border border-transparent hover:border-blue-300 transition-all group">
                                    <span className="font-bold text-secondary-text mr-3 bg-gray-200 dark:bg-gray-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">{index + 1}</span>
                                    <img src={elementConfig.path[step.type]?.icon} alt="" className="w-8 h-8 mr-3" />

                                    <div className="flex-grow">
                                        <p className="font-semibold text-primary-text text-sm">{elementConfig.path[step.type]?.name}</p>
                                        <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wide mt-1">
                                            <span className={`${step.isMandatory ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {step.isMandatory ? 'Obrigatório' : 'Opcional'}
                                            </span>
                                            {/* Indicador de Conteúdo Preenchido */}
                                            {step.content && Object.keys(step.content).length > 0 && (
                                                <span className="text-purple-500 flex items-center gap-1">
                                                    • Conteúdo OK
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleMandatory(step.id)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                                            {step.isMandatory ? <FaToggleOn className="text-green-500" /> : <FaToggleOff />}
                                        </button>
                                        <button onClick={() => onEditContent(step)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-500" title="Editar Conteúdo">
                                            <FaPen />
                                        </button>
                                        <button onClick={() => removePathStep(step.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500" title="Remover">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!gamificationDesign.progression_path || gamificationDesign.progression_path.length === 0) && (
                                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                    <p>A trilha está vazia.</p>
                                    <p className="text-xs mt-1">Adicione passos acima para começar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Hub (Sem alterações lógicas) */}
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