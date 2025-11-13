import React from 'react';
import { FaPlus, FaTrash, FaPen, FaToggleOn, FaToggleOff, FaRoute, FaCity } from 'react-icons/fa';
import { elementConfig } from './GameBoardConfig';

function GameBoardEditor({ gamificationDesign = { theme: 'vila_da_aventura', progression_path: [], hub_elements: [] }, setActivityData, onEditContent, onStructureChange }) {

    const updateDesign = (key, value) => {
        const newDesign = { ...(gamificationDesign || {}), [key]: value };
        setActivityData(prev => ({
            ...prev,
            gamificationDesign: newDesign,
        }));
        if (['progression_path', 'hub_elements'].includes(key)) {
            onStructureChange(newDesign);
        }
    };

    const addPathStep = (type) => {
        const newStep = { id: `step_${new Date().getTime()}`, type, isMandatory: true, content: {} };
        const newPath = [...(gamificationDesign.progression_path || []), newStep];
        updateDesign('progression_path', newPath);
    };

    const removePathStep = (stepId) => {
        const newPath = (gamificationDesign.progression_path || []).filter(step => step.id !== stepId);
        updateDesign('progression_path', newPath);
    };

    const toggleMandatory = (stepId) => {
        const newPath = (gamificationDesign.progression_path || []).map(step => {
            if (step.id === stepId) {
                return { ...step, isMandatory: !step.isMandatory };
            }
            return step;
        });
        updateDesign('progression_path', newPath);
    };

    const toggleHubElement = (elementType) => {
        const newHubElements = (gamificationDesign.hub_elements || []).map(element => {
            if (element.type === elementType) {
                return { ...element, enabled: !element.enabled };
            }
            return element;
        });
        updateDesign('hub_elements', newHubElements);
    };

    console.log("--- DEBUG DESIGN ---");
    console.log("Progression Path:", gamificationDesign?.progression_path);

    // Verifique se dentro de cada passo existe a chave 'content' preenchida
    gamificationDesign?.progression_path?.forEach((step, index) => {
        console.log(`Passo ${index + 1} (${step.type}):`, step.content);
    });

    return (
        <div className="mt-8 p-6 border border-teal-300 dark:border-teal-800 rounded-lg bg-teal-50 dark:bg-teal-900/20">
            <h3 className="text-xl font-bold text-teal-800 dark:text-teal-200 mb-2">Editor do Tabuleiro da Atividade</h3>
            <p className="text-sm text-secondary-text dark:text-secondary-text mb-6">Construa a jornada do aluno e ative os pontos de interesse na vila.</p>

            <div className="mb-8">
                <label className="block text-sm font-medium text-secondary-text dark:text-secondary-text mb-2">Tema Visual do Tabuleiro</label>
                <select
                    value={gamificationDesign.theme || 'vila_da_aventura'}
                    onChange={(e) => updateDesign('theme', e.target.value)}
                    className="w-full md:w-1/3 p-2 bg-secondary-bg rounded-md border border-border-color focus:ring-2 focus:ring-teal-500"
                >
                    <option value="vila_da_aventura">Vila da Aventura (Imersivo)</option>
                    <option value="fluxograma">Fluxograma Simples</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h4 className="flex items-center text-lg font-semibold mb-4 text-primary-text dark:text-secondary-text"><FaRoute className="mr-3 text-blue-500" /> Trilha de Progressão</h4>
                    <div className="p-4 bg-secondary-bg/50 dark:bg-primary-bg/30 rounded-lg">
                        <p className="text-xs text-secondary-text dark:text-secondary-text mb-4">Adicione os passos sequenciais da atividade (Quiz, Narrativa, etc.).</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {Object.entries(elementConfig.path).map(([type, config]) => (
                                <button key={type} onClick={() => addPathStep(type)} className="flex items-center p-2 text-sm bg-blue-100 dark:bg-blue-900/50 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900">
                                    <img src={config.icon} alt="" className="w-5 h-5 mr-2" /> Adicionar {config.name}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3">
                            {(gamificationDesign.progression_path || []).map((step, index) => (
                                <div key={step.id} className="flex items-center p-2 bg-secondary-bg dark:bg-primary-bg rounded-md shadow-sm">
                                    <span className="font-bold text-secondary-text dark:text-secondary-text mr-3">{index + 1}</span>
                                    <img src={elementConfig.path[step.type]?.icon} alt="" className="w-8 h-8 mr-3" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-primary-text dark:text-secondary-text">{elementConfig.path[step.type]?.name}</p>
                                        <p className={`text-xs font-bold ${step.isMandatory ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{step.isMandatory ? 'Obrigatório' : 'Opcional'}</p>
                                    </div>
                                    <button onClick={() => toggleMandatory(step.id)} title={step.isMandatory ? 'Marcar como opcional' : 'Marcar como obrigatório'}>
                                        {step.isMandatory ? <FaToggleOn className="text-green-500 h-5 w-5" /> : <FaToggleOff className="text-secondary-text h-5 w-5" />}
                                    </button>
                                    <button onClick={() => onEditContent(step)} className="ml-2 p-1 hover:text-primary-text dark:hover:bg-border-color rounded-full" title="Editar conteúdo">
                                        <FaPen className="text-blue-500 h-4 w-4" />
                                    </button>
                                    <button onClick={() => removePathStep(step.id)} className="ml-2 p-1 hover:text-primary-text dark:hover:bg-border-color rounded-full" title="Remover passo"><FaTrash className="text-red-500 h-4 w-4" /></button>
                                </div>
                            ))}
                            {(!gamificationDesign.progression_path || gamificationDesign.progression_path.length === 0) && <p className="text-center text-sm text-secondary-text py-4">A trilha está vazia.</p>}
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="flex items-center text-lg font-semibold mb-4 text-primary-text dark:text-secondary-text"><FaCity className="mr-3 text-yellow-500" /> Hub e Elementos do Tabuleiro</h4>
                    <div className="p-4 bg-secondary-bg/50 dark:bg-primary-bg/30 rounded-lg">
                        <p className="text-xs text-secondary-text dark:text-secondary-text mb-4">Ative ou desative os pontos de interesse que foram selecionados nos cards de elementos.</p>
                        <div className="space-y-3">
                            {(gamificationDesign.hub_elements || []).map((element) => {
                                const config = elementConfig.hub[element.type];
                                if (!config) return null;
                                return (
                                    <div key={element.id} onClick={() => toggleHubElement(element.type)} className="flex items-center p-3 bg-secondary-bg dark:bg-primary-bg rounded-lg shadow-sm cursor-pointer hover:bg-primary-bg dark:hover:bg-border-color">
                                        <img src={config.icon} alt={config.name} className="w-8 h-8 mr-3" />
                                        <span className="flex-grow font-medium text-primary-text dark:text-secondary-text">{config.name}</span>
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

export default GameBoardEditor;