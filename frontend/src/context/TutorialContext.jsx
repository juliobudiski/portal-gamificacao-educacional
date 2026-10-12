import React, { createContext, useContext, useState, useCallback } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

/**
 * TutorialContext
 * 
 * Architectural intent: Centralizes the execution state and logic of the guided tour.
 * Isolates tour progression and backend persistence (onboarding status) from individual 
 * view components, ensuring Low Coupling. View components only need to trigger the tour,
 * without managing its lifecycle.
 */
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

    const isTransitioningRef = React.useRef(false);

    /**
     * Inicia um tutorial de forma controlada.
     * @param {Array} tourSteps - Array de passos importados do tutorialSteps.js
     * @param {String} key - Identificador único (ex: 'student_dashboard_v1')
     * @param {Boolean} force - Se true, inicia mesmo que o usuário já tenha visto (para botão "Ver Tutorial")
     */
    const startTour = useCallback((tourSteps, key, force = false) => {
        // Se não for forçado e o usuário já tiver visto, aborta
        if (!force && user?.onboarding_status?.[key]) {
            return;
        }

        setRun(false);
        setSteps(tourSteps || []);
        setTourKey(key);
        setStepIndex(0);

        // Dispara de forma atômica após o próximo tick para permitir que o DOM monte os seletores
        const timer = setTimeout(() => {
            setRun(true);
        }, 150);

        return () => clearTimeout(timer);
    }, [user?.onboarding_status]);

    // Lógica ao terminar ou pular o tour com tolerância a Chaos Monkey e Nós Ausentes
    const handleJoyrideCallback = async (data) => {
        const { status, action, index, type } = data;

        // Tolerância a Chaos Monkey: Ignora nós não encontrados e avança silenciosamente
        if (type === EVENTS.TARGET_NOT_FOUND) {
            console.warn(`[TutorialContext] Alvo não encontrado no passo ${index}. Avançando para o próximo passo.`);
            setStepIndex(prev => prev + 1);
            return;
        }

        // Atualiza o índice atual com debounce contra rajadas de cliques (rapid-clicking)
        if (type === EVENTS.STEP_AFTER) {
            if (isTransitioningRef.current) return;
            isTransitioningRef.current = true;
            setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
            setTimeout(() => {
                isTransitioningRef.current = false;
            }, 250);
        }

        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);

            // APENAS LIMPA SE NÃO FOR A TRANSIÇÃO DO DASHBOARD PARA A CRIAÇÃO OU SE FOI PULADO
            if (tourKey !== 'teacher_dashboard_v1' || status === STATUS.SKIPPED) {
                sessionStorage.removeItem('TUTORIAL_MODE'); // Limpa a flag global de tour
            }

            // Só salva no banco se o usuário estiver logado e tiver uma chave de tour
            if (user && tourKey && token) {
                try {
                    // Chamada assíncrona não-bloqueante ao Backend
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/update-onboarding`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ tour_key: tourKey })
                    });

                    if (response.ok) {
                        const resData = await response.json();
                        if (resData.access_token) {
                            updateUserData({ access_token: resData.access_token });
                        }
                    }
                } catch (error) {
                    // Resiliência a queda de rede (Chaos Monkey - Offline Drop)
                    console.warn("[TutorialContext] Falha de rede ao persistir status do onboarding (não-bloqueante):", error);
                }
            }
        }
    };
    // 1. Crie a função stopTour
    const stopTour = useCallback(() => {
        setRun(false);
        setStepIndex(0);
        setTourKey(null);
    }, []);

    return (
        <TutorialContext.Provider value={{ startTour, stopTour }}>
            <Joyride
                key={tourKey || 'no-tour'}
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