import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { elementConfig, decorationConfig, decorationSpawnPoints, boardStructuralImages } from '../components/activity/GameBoardConfig';
import useAssetLoader from './useAssetLoader';

const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
const debugLog = (message, ...optionalParams) => {
    if (DEBUG_MODE) {
        console.debug(`[ActivityLogic] ${message}`, ...optionalParams);
    }
};

export const useActivityLogic = (activityId) => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    debugLog('Hook useActivityLogic INICIALIZADO para activityId:', activityId);
    debugLog('Estado inicial do useAuth():', { user, token: token ? '[TOKEN_EXISTS]' : null });

    const [activity, setActivity] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [storeItems, setStoreItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentView, setCurrentView] = useState('board');
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [activeStepContent, setActiveStepContent] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const fetchWithAuth = useCallback(async (url) => {
        debugLog(`fetchWithAuth: Iniciando para ${url}. Token atual: ${token ? '[TOKEN_EXISTS]' : null}`); // Log do token recebido
        if (!token) {
            debugLog(`fetchWithAuth: CANCELADO - Token ausente para ${url}`);
            setError('Autenticação necessária.');
            return null;
        }
        try {
            const API_BASE = import.meta.env.VITE_API_URL;
            const fullUrl = `${API_BASE}${url}`; // Log da URL completa
            debugLog(`fetchWithAuth: Tentando fetch em ${fullUrl}`);
            const response = await fetch(fullUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // --- LOG DETALHADO DA RESPOSTA ---
            debugLog(`fetchWithAuth: Resposta recebida para ${url}. Status: ${response.status}`);

            if (!response.ok) {
                let errorData = null;
                try {
                    errorData = await response.json(); // Tenta ler o corpo do erro como JSON
                } catch (jsonError) {
                    errorData = await response.text(); // Se não for JSON, lê como texto
                    debugLog(`fetchWithAuth: Corpo do erro (não JSON) para ${url}:`, errorData);
                }
                // Log mais específico do erro
                debugLog(`fetchWithAuth: Erro ${response.status} ao buscar ${url}. Dados do erro:`, errorData);
                setError(prev => `${prev}\nFalha ao buscar ${url}: ${errorData?.message || response.statusText || 'Erro desconhecido'}`);
                // --- LOG ANTES DE RETORNAR NULL (ERRO) ---
                debugLog(`fetchWithAuth: Retornando NULL devido a erro ${response.status} para ${url}.`);
                return null; // Retorna null em caso de erro
            }

            const data = await response.json();
            debugLog(`fetchWithAuth: Sucesso ao buscar ${url}. Dados:`, data);
            return data;

        } catch (err) {
            // --- LOG DETALHADO DA EXCEÇÃO ---
            debugLog(`fetchWithAuth: Exceção CATCH ao buscar ${url}. Erro:`, err);
            setError(prev => `${prev}\nExceção ao buscar ${url}: ${err.message}`);
            // --- LOG ANTES DE RETORNAR NULL (EXCEÇÃO) ---
            debugLog(`fetchWithAuth: Retornando NULL devido a exceção CATCH para ${url}.`);
            return null; // Retorna null em caso de exceção
        }
    }, [token]); // Mantenha apenas 'token' como dependência

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError('');
        debugLog('fetchAllData: Iniciando carregamento de todos os dados');
        try {
            const activityData = await fetchWithAuth(`/api/activities/${activityId}`);
            if (!activityData) {
                // Se a atividade não for encontrada, definimos o erro e paramos
                debugLog('fetchAllData: Atividade não encontrada ou falha ao carregar.');

                setError(prev => prev || "Atividade não encontrada ou falha ao carregar.");
                return;
            };
            setActivity(activityData);
            debugLog('Atividade carregada:', activityData);

            const fetchPromises = [];
            if (user?.role === 'aluno') {
                fetchPromises.push(fetchWithAuth(`/api/progress/${activityId}`).then(setUserProgress));
            } else if (user?.role === 'professor') {
                fetchPromises.push(fetchWithAuth(`/api/progress/${activityId}/analytics`).then(setAnalytics));
            }
            fetchPromises.push(
                fetchWithAuth(`/api/progress/${activityId}/leaderboard`).then(setLeaderboard),
                fetchWithAuth(`/api/progress/${activityId}/store-items`).then(setStoreItems)
            );
            await Promise.all(fetchPromises);
            debugLog('fetchAllData: Todos os dados carregados com sucesso.');
        } catch (err) {
            debugLog(`fetchAllData: Erro ao carregar dados:`, err);
            setError(`Erro ao carregar dados: ${err.message}`);
        } finally {
            setLoading(false);
            debugLog('Carregamento de dados finalizado');
        }
    }, [activityId, user?.role, fetchWithAuth]);

    useEffect(() => {
        debugLog('useEffect principal (para buscar dados) DISPARADO.');
        // Verifica SE user existe, SE tem role E SE o token existe
        if (user?.role && token) {
            debugLog('User.role e Token VÁLIDOS. Chamando fetchAllData.');
            fetchAllData();
        } else if (!user) {
            debugLog('useEffect: Aguardando objeto User...');
        } else if (!token) {
            debugLog('useEffect: User existe, mas aguardando Token...');
        } else if (!user.role) {
            debugLog('useEffect: User e Token existem, mas user.role é inválido.', user);
        }

    }, [user, token, activityId, fetchAllData]);

    const completeStep = useCallback(async (completedStepId) => {
        debugLog(`Completando passo: ${completedStepId}`);
        setUserProgress(prev => ({
            ...prev,
            completed_steps: Array.from(new Set([...(prev?.completed_steps || []), completedStepId]))
        }));
        setCurrentView('board');
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/progress/${activityId}/complete-step`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ step_id: completedStepId })
            });
            debugLog("Passo concluído. Buscando progresso atualizado (pontos, moedas, etc)...");
            const updatedProgress = await fetchWithAuth(`/api/progress/${activityId}`);
            if (updatedProgress) {
                setUserProgress(updatedProgress);
                debugLog("Progresso do usuário atualizado com sucesso no estado.", updatedProgress);
            }
        } catch (err) {
            console.error("Erro ao salvar progresso:", err);
        }
    }, [activityId, token, debugLog]);

    const finalState = { activity, userProgress, loading, error /* adicione outros estados relevantes */ };
    debugLog('Estado final do hook antes do return:', finalState);


    //========================================================================
    // DADOS DERIVADOS E MEMOIZADOS (useMemo)
    //========================================================================
    const completedStepsSet = useMemo(() => new Set(userProgress?.completed_steps || []), [userProgress]);

    const activeStepId = useMemo(() => {
        if (user.role !== 'aluno' || !activity?.gamificationDesign?.progression_path) return null;
        return activity.gamificationDesign.progression_path.find(step => !completedStepsSet.has(step.id))?.id || null;
    }, [user.role, activity, completedStepsSet]);

    const finalRewardStatus = useMemo(() => {
        if (!activity || !userProgress) return 'locked';
        if (userProgress.status === 'completed' || userProgress.completed_steps?.includes('final_reward')) return 'completed';
        const allStepsCompleted = activity.gamificationDesign.progression_path.every(step => completedStepsSet.has(step.id));
        return allStepsCompleted ? 'active' : 'locked';
    }, [activity, userProgress, completedStepsSet]);

    const allImageUrls = useMemo(() => {
        if (!activity) return [];
        const urls = new Set(boardStructuralImages);
        Object.values(elementConfig.path).forEach(p => urls.add(p.icon));
        Object.values(elementConfig.hub).forEach(h => urls.add(h.icon));
        decorationConfig.forEach(d => urls.add(d.src));
        return Array.from(urls);
    }, [activity]);

    const stepCoordinates = useMemo(() => {
        const path = activity?.gamificationDesign?.progression_path;
        if (!path) return [];
        const coords = [];
        const numSteps = path.length + (activity.gamificationDesign.finalReward ? 1 : 0);
        for (let i = 0; i < numSteps; i++) {
            const row = Math.floor(i / 4);
            const posInRow = i % 4;
            const y = 15 + (row * 30);
            let x;
            if (row % 2 === 0) {
                x = 15 + (posInRow * ((70 - 2 * 15) / 3));
            } else {
                x = (70 - 15) - (posInRow * ((70 - 2 * 15) / (4 - 1)));
            }
            coords.push({ x: `${x}%`, y: `${y}%` });
        }
        return coords;
    }, [activity?.gamificationDesign]);

    const shuffleArray = useCallback((array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }, []);

    const renderedDecorations = useMemo(() => {
        if (!activity?.gamificationDesign?.progression_path) return [];
        const occupiedPositions = new Set(stepCoordinates.map(coord => `${coord.x}-${coord.y}`));
        const availablePoints = decorationSpawnPoints.filter(point => !occupiedPositions.has(`${point.x}-${point.y}`));
        const shuffledPoints = shuffleArray(availablePoints);
        return shuffledPoints.slice(0, 20).map((point, index) => {
            const randomDecoration = decorationConfig[Math.floor(Math.random() * decorationConfig.length)];
            return { ...randomDecoration, style: { left: point.x, top: point.y }, id: `decoration-${index}` };
        });
    }, [activity, stepCoordinates, shuffleArray]);

    const { loadingProgress: assetsProgress, isLoaded: assetsAreLoaded, etr: estimatedTimeRemaining } = useAssetLoader(allImageUrls);


    //========================================================================
    // MANIPULADORES DE EVENTOS (HANDLERS)
    //========================================================================
    const getStepStatus = useCallback((step) => {
        if (user.role === 'professor') return 'active';
        if (completedStepsSet.has(step.id)) return 'completed';
        return step.id === activeStepId ? 'active' : 'locked';
    }, [user.role, completedStepsSet, activeStepId]);

    const handleStepClick = useCallback((step) => {
        if (step.type === 'mission') {
            setCurrentView('mission');
            setActiveStepContent(null);
            return;
        }

        if (step.content) {
            setActiveStepContent({ ...step.content, step_id: step.id });
            setCurrentView(step.type);
        } else {
            alert("Conteúdo não disponível.");
        }
    }, []);

    const handleHubIconClick = useCallback((view) => setCurrentView(view), []);
    const handleReturnToBoard = useCallback(() => setCurrentView('board'), []);
    const handleFinalRewardClick = useCallback(() => setCurrentView('final_reward'), []);
    const handleShowStats = useCallback(() => setShowStatsModal(true), []);
    const handleCloseStats = useCallback(() => setShowStatsModal(false), []);
    const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

    const handleAvatarChange = useCallback((newAvatarUrl) => {
        setUserProgress(prev => ({ ...prev, equipped_activity_avatar_url: newAvatarUrl }));
    }, []);

    const handleCollectFinalReward = useCallback(async () => {
        await fetchAllData();
        handleReturnToBoard();
    }, [fetchAllData, handleReturnToBoard]);

    const handleStudentClick = useCallback((student) => console.log('Clicked student:', student), []);
    const handleOpenQuizEditor = useCallback(() => navigate(`/professor/activity/${activityId}/quiz/edit`), [navigate, activityId]);
    const handleOpenNarrativeEditor = useCallback(() => navigate(`/professor/activity/${activityId}/narrative/edit`), [navigate, activityId]);
    const hubElementsToRender = activity?.gamificationDesign?.hub_elements || [];
    const finalRewardConfig = activity?.gamificationDesign?.finalReward ? elementConfig.path.final_reward : null;

    debugLog('DADOS CALCULADOS ANTES DE RETORNAR', {
        hubElementsToRender,
        finalRewardConfig,
        finalRewardStatus,
        activeStepContent,
    });
    //========================================================================
    // RETORNO DO HOOK
    //========================================================================
    return {
        // Estados de controle
        loading: loading || (activity && !assetsAreLoaded),
        error,
        currentView,
        showStatsModal,
        isSidebarOpen,
        assetsProgress,
        estimatedTimeRemaining,

        hubElementsToRender: activity?.gamificationDesign?.hub_elements || [],
        finalRewardConfig: activity?.gamificationDesign?.finalReward ? elementConfig.path.final_reward : null,

        // Dados
        user,
        activity,
        userProgress,
        analytics,
        leaderboard,
        storeItems,
        activeStepContent,
        renderedDecorations,
        stepCoordinates,
        finalRewardStatus,

        // Funções e Handlers
        getStepStatus,
        handleStepClick,
        handleHubIconClick,
        handleReturnToBoard,
        handleFinalRewardClick,
        handleShowStats,
        handleCloseStats,
        toggleSidebar,
        handleAvatarChange,
        handleCollectFinalReward,
        handleStudentClick,
        handleOpenQuizEditor,
        handleOpenNarrativeEditor,
        completeStep,
        fetchAllData
    };
};