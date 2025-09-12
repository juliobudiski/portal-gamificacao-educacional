import React from 'react';
import { FaPlus, FaTrash, FaPen, FaToggleOn, FaToggleOff, FaStar, FaRoute, FaCity } from 'react-icons/fa';

// Configuração completa dos elementos do tabuleiro
const elementConfig = {
    path: {
        narrative: { icon: 'narrative_board.png', name: 'Narrativa' },
        quiz: { icon: 'quizz_board.png', name: 'Quiz' },
    },
    hub: {
        roulette: { icon: 'roleta_board.png', name: 'Roleta' },
        slot_machine: { icon: 'slotmachine_board.png', name: 'Caça-níquel' },
        ranking: { icon: 'ranking_board.png', name: 'Ranking' },
        badges: { icon: 'badges_board.png', name: 'Medalhas' },
        chat: { icon: 'chat_board.png', name: 'Chat' },
        store: { icon: 'store_board.png', name: 'Loja' },
        mission: { icon: 'mission_character_board.png', name: 'Missão' },
    }
};

const hasContent = (step) => {
    if (step.content) {
        if (step.content.type === 'quiz') {
            return step.content.questions && step.content.questions.length > 0;
        } else if (step.content.type === 'narrative') {
            return step.content.dialogue && step.content.dialogue.length > 0;
        }
    }
    return false;
};

/**
 * @component GameBoardEditor
 * @param {Object} props
 * @param {Object} props.gamificationDesign - O objeto de design da gamificação.
 * @param {Function} props.setActivityData - Função para atualizar o estado da atividade.
 * @param {Function} props.onEditContent - Função para abrir a página de edição de um passo.
 */
// --- CORREÇÃO APLICADA AQUI ---
// Adicionamos um valor padrão para a prop 'gamificationDesign'.
// Se ela for 'undefined', o componente usará este objeto padrão, evitando o crash.
function GameBoardEditor({ gamificationDesign = { theme: 'vila_da_aventura', progression_path: [], hub_elements: [] }, setActivityData, onEditContent }) {

    const updateDesign = (key, value) => {
        setActivityData(prev => ({
            ...prev,
            gamificationDesign: {
                ...(prev.gamificationDesign || {}),
                [key]: value,
            }
        }));
    };

    const addPathStep = (type) => {
        const newStep = {
            id: `step_${new Date().getTime()}`,
            type: type,
            isMandatory: true,
            config: {},
        };
        const currentPath = gamificationDesign.progression_path || [];
        updateDesign('progression_path', [...currentPath, newStep]);
    };

    const removePathStep = (stepId) => {
        updateDesign('progression_path', gamificationDesign.progression_path.filter(step => step.id !== stepId));
    };
    
    const toggleMandatory = (stepId) => {
        const newPath = gamificationDesign.progression_path.map(step => 
            step.id === stepId ? { ...step, isMandatory: !step.isMandatory } : step
        );
        updateDesign('progression_path', newPath);
    };

    const toggleHubElement = (type) => {
        const currentHubElements = gamificationDesign.hub_elements || [];
        const newHubElements = currentHubElements.map(el =>
            el.type === type ? { ...el, enabled: !el.enabled } : el
        );
        updateDesign('hub_elements', newHubElements);
    };

    return (
        <div className="mt-8 p-6 border border-teal-300 dark:border-teal-800 rounded-lg bg-teal-50 dark:bg-teal-900/20">
            <h3 className="text-xl font-bold text-teal-800 dark:text-teal-200 mb-2">Editor do Tabuleiro da Atividade</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Construa a jornada do aluno e ative os pontos de interesse na vila.</p>

            <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tema Visual do Tabuleiro</label>
                <select 
                    value={gamificationDesign.theme || 'vila_da_aventura'} 
                    onChange={(e) => updateDesign('theme', e.target.value)}
                    className="w-full md:w-1/3 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                >
                    <option value="fluxograma">Fluxograma Simples</option>
                    <option value="vila_da_aventura">Vila da Aventura (Imersivo)</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h4 className="flex items-center text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200"><FaRoute className="mr-3 text-blue-500" /> Trilha de Progressão</h4>
                    <div className="p-4 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Adicione os passos sequenciais da atividade.</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                           {Object.entries(elementConfig.path).map(([type, config]) => (
                                <button key={type} onClick={() => addPathStep(type)} className="flex items-center p-2 text-sm bg-blue-100 dark:bg-blue-900/50 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900">
                                   <img src={`/board/${config.icon}`} alt="" className="w-5 h-5 mr-2" /> Adicionar {config.name}
                                </button>
                           ))}
                        </div>
                        <div className="space-y-3">
                            {(gamificationDesign.progression_path || []).map((step, index) => (
                               <div key={step.id} className="flex items-center p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                    <span className="font-bold text-gray-400 dark:text-gray-500 mr-3">{index + 1}</span>
                                    <img src={`/board/${elementConfig.path[step.type]?.icon}`} alt="" className="w-8 h-8 mr-3" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{elementConfig.path[step.type]?.name}</p>
                                        <p className={`text-xs font-bold ${step.isMandatory ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{step.isMandatory ? 'Obrigatório' : 'Opcional'}</p>
                                    </div>
                                    <button onClick={() => toggleMandatory(step.id)} title={step.isMandatory ? 'Marcar como opcional' : 'Marcar como obrigatório'}>
                                       {step.isMandatory ? <FaToggleOn className="text-green-500 h-5 w-5" /> : <FaToggleOff className="text-gray-400 h-5 w-5" />}
                                    </button>
                                    <button onClick={() => onEditContent(step)} className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" title="Editar conteúdo">
                                        <FaPen className="text-blue-500 h-4 w-4" />
                                    </button>
                                    <button onClick={() => removePathStep(step.id)} className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" title="Remover passo"><FaTrash className="text-red-500 h-4 w-4" /></button>
                                </div>
                            ))}
                            {(!gamificationDesign.progression_path || gamificationDesign.progression_path.length === 0) && <p className="text-center text-sm text-gray-500 py-4">A trilha está vazia.</p>}
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="flex items-center text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200"><FaCity className="mr-3 text-yellow-500" /> Hub da Vila</h4>
                    <div className="p-4 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Ative ou desative os pontos de interesse que foram selecionados nos cards de elementos.</p>
                        <div className="space-y-3">
                            {(gamificationDesign.hub_elements || []).map((element) => {
                                const config = elementConfig.hub[element.type];
                                if (!config) return null; // Segurança
                                return (
                                    <div key={element.id} onClick={() => toggleHubElement(element.type)} className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <img src={`/board/${config.icon}`} alt={config.name} className="w-8 h-8 mr-3" />
                                        <span className="flex-grow font-medium text-gray-800 dark:text-gray-200">{config.name}</span>
                                        {element.enabled ? <FaToggleOn className="text-green-500 h-6 w-6" /> : <FaToggleOff className="text-gray-400 h-6 w-6" />}
                                    </div>
                                );
                            })}
                             {(!gamificationDesign.hub_elements || gamificationDesign.hub_elements.length === 0) && <p className="text-center text-sm text-gray-500 py-4">Nenhum elemento do hub selecionado nos cards.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GameBoardEditor;
