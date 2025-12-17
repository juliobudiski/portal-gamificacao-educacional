import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

const TutorialContext = createContext();

export const TutorialProvider = ({ children }) => {
    const { user, token, updateUserData } = useAuth(); // Pegamos updateUserData para atualizar o user localmente
    const { theme } = useTheme(); // Para detectar Dark/Light mode

    const [run, setRun] = useState(false);
    const [steps, setSteps] = useState([]);
    const [tourKey, setTourKey] = useState(null);
    const [stepIndex, setStepIndex] = useState(0);

    // Configuração de Estilos Dinâmicos (Dark/Light)
    const styles = {
        options: {
            arrowColor: theme === 'dark' ? '#1f2937' : '#fff',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
            overlayColor: 'rgba(0, 0, 0, 0.6)',
            primaryColor: '#6366f1', // Indigo-500 (cor principal do seu tema)
            textColor: theme === 'dark' ? '#f3f4f6' : '#1f2937',
            width: 400,
            zIndex: 10000,
        },
        tooltipContainer: {
            textAlign: 'left'
        },
        buttonNext: {
            backgroundColor: '#6366f1',
        },
        buttonBack: {
            color: theme === 'dark' ? '#9ca3af' : '#4b5563',
        }
    };

    /**
     * Inicia um tutorial.
     * @param {Array} tourSteps - Array de passos importados do tutorialSteps.js
     * @param {String} key - Identificador único (ex: 'student_dashboard_v1')
     * @param {Boolean} force - Se true, inicia mesmo que o usuário já tenha visto (para botão "Ver Tutorial")
     */
    const startTour = useCallback((tourSteps, key, force = false) => {
        // Se não for forçado e o usuário já tiver visto, aborta.
        if (!force && user?.onboarding_status?.[key]) {
            return;
        }

        setSteps(tourSteps);
        setTourKey(key);
        setStepIndex(0);
        setRun(true);
    }, [user]);

    // Lógica ao terminar ou pular o tour
    const handleJoyrideCallback = async (data) => {
        const { status, action, index, type } = data;

        // Atualiza o índice atual
        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
        }

        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);

            // Só salva no banco se o usuário estiver logado e tiver uma chave de tour
            if (user && tourKey) {
                try {
                    // 1. Chamada ao Backend
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/update-onboarding`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ tour_key: tourKey })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // 2. Atualiza o contexto do usuário localmente com o novo token
                        if (data.access_token) {
                            updateUserData({ access_token: data.access_token });
                        }
                    }
                } catch (error) {
                    console.error("Erro ao salvar status do tutorial:", error);
                }
            }
        }
    };

    return (
        <TutorialContext.Provider value={{ startTour }}>
            <Joyride
                steps={steps}
                run={run}
                stepIndex={stepIndex}
                continuous={true}
                showSkipButton={true}
                showProgress={true}
                styles={styles}
                callback={handleJoyrideCallback}
                locale={{
                    back: 'Voltar',
                    close: 'Fechar',
                    last: 'Concluir',
                    next: 'Próximo',
                    skip: 'Pular',
                }}
                floaterProps={{
                    disableAnimation: true, // Melhora performance no React 18/19
                }}
            />
            {children}
        </TutorialContext.Provider>
    );
};

export const useTutorial = () => useContext(TutorialContext);