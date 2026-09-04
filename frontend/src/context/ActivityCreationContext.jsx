// frontend/src/context/ActivityCreationContext.jsx
import React, { createContext, useState, useContext, useCallback } from 'react';
import { useAutoSave } from '../hooks/useAutoSave';
const ActivityCreationContext = createContext();

const initialState = {
    id: null,
    title: '',
    description: '',
    areaKnowledge: '',
    isPublic: true,
    currentScenario: { problems: [], otherProblem: '' },
    desiredScenario: { objectives: [], otherObjective: '' },
    activityPlanning: { characteristics: [], participantsQuantity: '', expectedDuration: '', location: '', otherInfo: '' },
    playerProfile: { selectedProfiles: [] },
    gameElements: { selectedElements: [], otherElement: '', narrativeTitle: '', narrativeContent: '' },
    gamificationDesign: { theme: 'vila_da_aventura', progression_path: [], hub_elements: [] },
    rewardsOffered: { selectedRewards: [], otherReward: '' },
    rewardedActions: { selectedActions: [], otherAction: '' },
    gamificationRules: { generalRules: [], specificRules: '' },
};

export const ActivityCreationProvider = ({ children }) => {
    const [activityData, setActivityData] = useState(initialState);
    const [currentStep, setCurrentStep] = useState(0); // 0 = Seleção Inicial
    const [showInitialSelection, setShowInitialSelection] = useState(true);

    // --- LÓGICA DE AUTOSAVE ---

    // Callback para atualizar só o ID sem causar re-render desnecessário ou loop
    const updateActivityId = useCallback((newId) => {
        setActivityData(prev => {
            // Só atualiza se o ID realmente mudou (de null para número)
            if (prev.id === newId) return prev;
            return { ...prev, id: newId };
        });
    }, []);

    // O hook roda "em background". Monitora activityData e chama o serviço.
    const { saveStatus, lastSavedAt } = useAutoSave(activityData, updateActivityId, 2000);

    // ---------------------------

    // Função para resetar tudo ao iniciar uma nova criação
    const startNewActivity = (template = null) => {
        let newData;
        if (template) {
            let parsedTemplate = template;
            if (typeof template === 'string') {
                try { parsedTemplate = JSON.parse(template); } catch(e) { console.error("Erro parse template", e); }
            }
            // Realiza um deep merge defensivo para evitar propriedades undefined
            newData = {
                ...initialState,
                ...parsedTemplate,
                currentScenario: { ...initialState.currentScenario, ...(parsedTemplate.currentScenario || {}) },
                desiredScenario: { ...initialState.desiredScenario, ...(parsedTemplate.desiredScenario || {}) },
                activityPlanning: { ...initialState.activityPlanning, ...(parsedTemplate.activityPlanning || {}) },
                playerProfile: { ...initialState.playerProfile, ...(parsedTemplate.playerProfile || {}) },
                gameElements: { ...initialState.gameElements, ...(parsedTemplate.gameElements || {}) },
                gamificationDesign: { ...initialState.gamificationDesign, ...(parsedTemplate.gamificationDesign || {}) },
                rewardsOffered: { ...initialState.rewardsOffered, ...(parsedTemplate.rewardsOffered || {}) },
                rewardedActions: { ...initialState.rewardedActions, ...(parsedTemplate.rewardedActions || {}) },
                gamificationRules: { ...initialState.gamificationRules, ...(parsedTemplate.gamificationRules || {}) },
            };
        } else {
            // Em branco: Cópia profunda para prevenir mutação acidental da constante initialState
            newData = JSON.parse(JSON.stringify(initialState));
        }
        setActivityData(newData);
        setCurrentStep(1);
        setShowInitialSelection(false);
    };

    const resetCreation = () => {
        setActivityData(initialState);
        setCurrentStep(0);
        setShowInitialSelection(true);
    }

    // Nova função para carregar um rascunho existente (usaremos na Parte 4)
    const loadDraft = (draftData) => {
        setActivityData(draftData);
        // Podemos definir lógica para pular para a última etapa editada depois
        setCurrentStep(1);
        setShowInitialSelection(false);
    };

    const value = {
        activityData,
        setActivityData,
        currentStep,
        setCurrentStep,
        showInitialSelection,
        setShowInitialSelection,
        startNewActivity,
        resetCreation,
        loadDraft,
        // Exporta status do salvamento para UI (ex: mostrar "Salvando..." no topo)
        autoSaveStatus: saveStatus,
        lastSavedAt
    };

    return (
        <ActivityCreationContext.Provider value={value}>
            {children}
        </ActivityCreationContext.Provider>
    );
};

export const useActivityCreation = () => {
    return useContext(ActivityCreationContext);
};