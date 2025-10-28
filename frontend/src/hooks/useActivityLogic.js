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


    const fetchWithAuth = useCallback(async (url, options = {}) => {
        const API_BASE = import.meta.env.VITE_API_URL;
        const fullUrl = `${API_BASE}${url}`;
        debugLog(`fetchWithAuth: Iniciando para ${fullUrl}. Método: ${options.method || 'GET'}`);

        if (!token) {
            setError('Autenticação necessária.');
            // Retornamos uma Promise rejeitada para que o 'catch' no chamador funcione
            return Promise.reject(new Error('Autenticação necessária.'));
        }

        // Configura os cabeçalhos, garantindo que o token de autorização sempre exista
        // e que os cabeçalhos passados (como 'Content-Type') sejam mantidos.
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };

        try {
            // A requisição fetch agora usa as 'options' passadas diretamente
            const response = await fetch(fullUrl, {
                ...options,
                headers: headers
            });

            debugLog(`fetchWithAuth: Resposta recebida para ${url}. Status: ${response.status}`);

            // Se a resposta não for OK, trata o erro
            if (!response.ok) {
                // Lê o corpo da resposta como texto para evitar o erro "body consumed"
                const errorText = await response.text();
                // Lança um erro para que seja capturado pelo bloco 'catch' da função que chamou
                throw new Error(errorText || `Erro ${response.status}: ${response.statusText}`);
            }

            // Para respostas de sucesso (como 200 OK ou 201 Created), lê como JSON.
            const data = await response.json();
            debugLog(`fetchWithAuth: Sucesso ao buscar ${url}. Dados:`, data);
            return data;

        } catch (err) {
            debugLog(`fetchWithAuth: Exceção CATCH ao buscar ${url}. Erro:`, err);
            setError(`Falha ao buscar ${url}: ${err.message}`);
            // Propaga o erro para que a função chamadora (ex: updateUserProgress) possa lidar com ele
            throw err;
        }
    }, [token]);


    const fetchLeaderboard = useCallback(async () => {
        debugLog('Buscando dados do leaderboard...');
        try {
            const data = await fetchWithAuth(`/api/progress/${activityId}/leaderboard`);
            if (data) {
                setLeaderboard(data); // <-- CORREÇÃO AQUI (de setLeaderboardData para setLeaderboard)
                debugLog('Dados do leaderboard atualizados no estado.', data);
            }
        } catch (err) {
            console.error('Falha ao buscar dados do leaderboard:', err);
        }
    }, [activityId, fetchWithAuth]);



    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError('');
        debugLog('fetchAllData: Iniciando carregamento de todos os dados');
        try {
            // Buscas em paralelo para mais eficiência
            const promises = [
                fetchWithAuth(`/api/activities/${activityId}`),
                user?.role === 'aluno' ? fetchWithAuth(`/api/progress/${activityId}`) : Promise.resolve(null),
                fetchWithAuth(`/api/progress/${activityId}/leaderboard`),
                fetchWithAuth(`/api/progress/${activityId}/store-items`)
            ];

            // Aguarda todas as buscas terminarem
            const [activityData, progressData, leaderboardData, storeItemsData] = await Promise.all(promises);

            if (!activityData) {
                setError("Atividade não encontrada ou falha ao carregar.");
                return; // Para a execução se a atividade principal falhar
            }

            // Atualiza todos os estados
            setActivity(activityData);
            if (user?.role === 'aluno') setUserProgress(progressData);
            setLeaderboard(leaderboardData || []);
            setStoreItems(storeItemsData || []);

            debugLog('fetchAllData: Todos os dados carregados com sucesso.');

            // *** MUDANÇA CRÍTICA 1: RETORNE OS DADOS BUSCADOS ***
            return { activityData, progressData };

        } catch (err) {
            debugLog(`fetchAllData: Erro ao carregar dados:`, err);
            setError(`Erro ao carregar dados: ${err.message}`);
        } finally {
            setLoading(false);
            debugLog('Carregamento de dados finalizado');
        }
    }, [activityId, user?.role, fetchWithAuth]);
    // ========================================================================
    // NOVA FUNÇÃO PARA ATUALIZAÇÃO DE ESTADO DIRECIONADA
    // ========================================================================
    const handlePurchaseSuccess = useCallback((updatedProgressData) => {
        debugLog('handlePurchaseSuccess: Atualizando o progresso do usuário com novos dados.', updatedProgressData);

        // Atualiza apenas o progresso do usuário, mantendo o resto do estado estável
        setUserProgress(prevProgress => ({
            ...prevProgress,
            ...updatedProgressData
        }));

        // Também é uma boa ideia recarregar a lista de itens da loja,
        // pois futuramente você pode querer desabilitar itens já comprados.
        fetchWithAuth(`/api/progress/${activityId}/store-items`).then(setStoreItems);

    }, [activityId, fetchWithAuth]); // Adicione as dependências

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
            debugLog("Passo concluído. Buscando progresso atualizado e leaderboard...");

            // As duas chamadas podem rodar em paralelo para ser mais rápido
            const [updatedProgress] = await Promise.all([
                fetchWithAuth(`/api/progress/${activityId}`),
                fetchLeaderboard() // <-- ADICIONE A CHAMADA AQUI
            ]);

            if (updatedProgress) {
                setUserProgress(updatedProgress);
                debugLog("Progresso do usuário e leaderboard atualizados com sucesso no estado.", updatedProgress);
            }
        } catch (err) {
            console.error("Erro ao salvar progresso:", err);
        }
    }, [activityId, token, fetchWithAuth, fetchLeaderboard]);

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
        debugLog('Iniciando a coleta da recompensa final...');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/progress/${activityId}/collect-final-reward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                // Se o backend retornar um erro (ex: passos faltando), lança o erro
                throw new Error(data.message || 'Falha ao coletar a recompensa final.');
            }

            debugLog('Recompensa final coletada com sucesso no backend. Atualizando dados...');

            // Após coletar, busca TODOS os dados novamente. Isso irá atualizar o progresso,
            // o status da atividade e as medalhas desbloqueadas.
            await fetchAllData();

            // LOG DE VERIFICAÇÃO: Veja o que está no estado logo após a busca
            debugLog('Estado APÓS fetchAllData:', {
                activity: activity,
                userProgress: userProgress
            });

            // Opcional: Redireciona de volta para o tabuleiro após um pequeno delay
            setTimeout(() => {
                debugLog('Retornando para a visão do tabuleiro.'); // <-- Adicione este log
                handleReturnToBoard();
            }, 1000);

        } catch (error) {
            console.error('Erro detalhado ao coletar recompensa final:', error);
            setError(`Erro ao coletar: ${error.message}`);
            // Re-lança o erro para que o componente 'FinalRewardTab' possa parar o 'loading'
            throw error;
        }
    }, [activityId, token, fetchAllData, handleReturnToBoard]);
    const updateUserProgress = useCallback(async (points, coins) => {
        debugLog(`Enviando atualização de progresso:`, { points, coins });
        try {
            await fetchWithAuth(`/api/progress/${activityId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coins }),
            });
            // Após a atualização, buscamos o progresso novamente para ter os dados mais recentes
            const progressData = await fetchWithAuth(`/api/progress/${activityId}`);
            if (progressData) {
                setUserProgress(progressData);
                debugLog('Progresso do usuário atualizado com sucesso no estado.', progressData);
            }
            await fetchLeaderboard();
        } catch (err) {
            setError(err.message || 'Erro ao carregar dados da atividade.');
            debugLog('fetchAllData: Erro encontrado.', err);
        } finally {
            setLoading(false);
            debugLog('fetchAllData: Busca de dados finalizada.');
        }
    }, [activityId, fetchWithAuth, fetchLeaderboard]);

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
        fetchAllData,
        handlePurchaseSuccess,
        updateUserProgress,
    };
};