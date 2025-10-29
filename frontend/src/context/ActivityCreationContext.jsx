// frontend/src/context/ActivityCreationContext.jsx
import React, { createContext, useState, useContext } from 'react';

const ActivityCreationContext = createContext();

const initialState = {
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

    // Função para resetar tudo ao iniciar uma nova criação
    const startNewActivity = (template = null) => {
        setActivityData(template || initialState);
        setCurrentStep(1);
        setShowInitialSelection(false);
    };

    const resetCreation = () => {
        setActivityData(initialState);
        setCurrentStep(0);
        setShowInitialSelection(true);
    }

    const value = {
        activityData,
        setActivityData,
        currentStep,
        setCurrentStep,
        showInitialSelection,
        setShowInitialSelection,
        startNewActivity,
        resetCreation
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