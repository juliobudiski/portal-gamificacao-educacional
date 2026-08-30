import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getThemeAssets, decorationSpawnPoints, boardStructuralImages } from '../components/activity/GameBoardConfig';
import useAssetLoader from './useAssetLoader';
import { useToast } from '../context/ToastContext';

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
    const { showToast } = useToast();
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
    const [medalManifest, setMedalManifest] = useState([]);

    const assets = useMemo(() => {
        // Se a atividade ainda não carregou ou não tem tema, usa 'default'
        const themeId = activity?.gamificationDesign?.theme || 'default';
        return getThemeAssets(themeId);
    }, [activity?.gamificationDesign?.theme]);

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
            // Só define o erro global se NÃO tivermos pedido para suprimir
            if (!options.suppressGlobalError) {
                setError(`Falha ao buscar ${url}: ${err.message}`);
            }
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
                fetchWithAuth(`/api/progress/${activityId}/store-items`),
                fetchWithAuth(`/api/medals`)
            ];

            // Aguarda todas as buscas terminarem
            const [activityData, progressData, leaderboardData, storeItemsData, medalManifestData] = await Promise.all(promises);

            if (!activityData) {
                setError("Atividade não encontrada ou falha ao carregar.");
                return; // Para a execução se a atividade principal falhar
            }

            // Atualiza todos os estados
            setActivity(activityData);
            if (user?.role === 'aluno') setUserProgress(progressData);
            setLeaderboard(leaderboardData || []);
            setStoreItems(storeItemsData || []);
            setMedalManifest(medalManifestData || []);

            debugLog('fetchAllData: Todos os dados carregados com sucesso.');


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

        // 1. Atualiza a interface (volta para o tabuleiro) IMEDIATAMENTE
        setCurrentView('board');

        // 2. BYPASS PARA PROFESSORES:
        // Se não for aluno, não tentamos salvar no backend nem buscar progresso atualizado.
        // Apenas encerramos a função aqui.
        if (user?.role !== 'aluno') {
            debugLog("Modo Visualização (Professor/Admin): Fechando passo sem salvar progresso.");
            return;
        }

        // 3. FLUXO NORMAL PARA ALUNOS
        setUserProgress(prev => ({
            ...prev,
            completed_steps: Array.from(new Set([...(prev?.completed_steps || []), completedStepId]))
        }));

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
                fetchLeaderboard()
            ]);

            if (updatedProgress) {
                setUserProgress(updatedProgress);
                debugLog("Progresso do usuário e leaderboard atualizados com sucesso no estado.", updatedProgress);
            }
        } catch (err) {
            console.error("Erro ao salvar progresso:", err);
        }
    }, [activityId, token, fetchWithAuth, fetchLeaderboard, user?.role]);

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

    const criticalImageUrls = useMemo(() => {
        if (!activity) return [];

        const urls = new Set();

        // 1. Imagens Estruturais do Board (Fundo, bordas)
        if (assets.structural && Array.isArray(assets.structural)) {
            assets.structural.forEach(url => urls.add(url));
        }

        // CORREÇÃO 3: Usar 'assets' em vez de 'elementConfig'
        Object.values(assets.path).forEach(p => urls.add(p.icon));
        Object.values(assets.hub).forEach(h => urls.add(h.icon));

        // 4. Avatares básicos (Pode haver um avatar default necessário para o HUD)
        // Se o avatar padrão for usado no HUD antes do progresso carregar, ele é CRÍTICO.
        urls.add('/avatars/default_avatar.webp');

        // URLs Fixas Críticas Adicionais (Roleta/Slot/HUD)
        urls.add('/board/roleta_board.webp');
        urls.add('/board/slotmachine_board.webp');

        return Array.from(urls);
    }, [activity, assets]);

    // Manifesto manual dos fundos de tabs e outros assets públicos
    const TAB_BACKGROUND_ASSETS = [
        '/assets/slot-background.webp',
        '/assets/quiz-background.webp',
        '/assets/store-background.webp',
        '/assets/roulette-wallpaper.webp',
        '/assets/mission-background.webp',
        '/assets/store-background2.webp',
        '/assets/leaderboard-background.webp',
        '/assets/quizz-background2.webp',
    ];

    // Manifesto manual de cenários e personagens de narrativa
    const NARRATIVE_ASSETS = [
        '/narrativa/cenarios/cenario1.webp',
        '/narrativa/cenarios/cenario2.webp',
        '/narrativa/cenarios/cenario3.webp',
        '/narrativa/cenarios/cenario4.webp',
        '/narrativa/personagens/aluno1.webp',
        '/narrativa/personagens/aluno2.webp',
        '/narrativa/personagens/instrutor1.webp',
        '/narrativa/personagens/instrutor2.webp',
    ];


    // Lista de assets NÃO-CRÍTICOS
    const nonCriticalImageUrls = useMemo(() => {
        if (!activity) return [];
        const urls = new Set();

        // 1. Decorações (Árvores e Rochas)
        assets.decorations.forEach(d => urls.add(d.src));

        // 2. Fundos de Tabs (Arquivos em /src/assets)
        TAB_BACKGROUND_ASSETS.forEach(url => urls.add(url)); // ~8 itens

        // 3. Cenários de Narrativa (Arquivos em /public/narrativa)
        NARRATIVE_ASSETS.forEach(url => urls.add(url)); // ~8 itens
        // 4. Imagens de Medalhas (Manifesto vindo do Backend)
        if (medalManifest.length > 0) {
            medalManifest.forEach(medal => urls.add(medal.imageUrl)); // Puxa o imageUrl da API
        }
        return Array.from(urls);
    }, [activity, medalManifest, assets]);

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
        const currentDecorations = assets.decorations;

        const occupiedPositions = new Set(stepCoordinates.map(coord => `${coord.x}-${coord.y}`));
        const availablePoints = decorationSpawnPoints.filter(point => !occupiedPositions.has(`${point.x}-${point.y}`));
        const shuffledPoints = shuffleArray(availablePoints);
        return shuffledPoints.slice(0, 20).map((point, index) => {
            const randomDecoration = currentDecorations[Math.floor(Math.random() * currentDecorations.length)];
            return { ...randomDecoration, style: { left: point.x, top: point.y }, id: `decoration-${index}` };
        });
    }, [activity, stepCoordinates, shuffleArray, assets]);

    const { loadingProgress: assetsProgress, isLoaded: assetsAreLoaded, etr: estimatedTimeRemaining } = useAssetLoader(criticalImageUrls);

    // EFEITO PARA FASE 2: Carregamento silencioso em background
    useEffect(() => {
        // Função "fantasma" que carrega imagens no cache do navegador
        const preloadImage = (url) => {
            const img = new Image();
            img.src = url;
        };

        // Se a carga crítica terminou E temos uma lista de assets não-críticos
        if (assetsAreLoaded && nonCriticalImageUrls.length > 0) {
            debugLog(`Fase 2: Iniciando pré-carga de ${nonCriticalImageUrls.length} assets não-críticos em background.`);
            nonCriticalImageUrls.forEach(preloadImage);
        }
    }, [assetsAreLoaded, nonCriticalImageUrls]); // Dispara quando a F1 terminar

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
            showToast("Conteúdo não disponível.");
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
            // A função 'fetchWithAuth' já lida com o token
            const data = await fetchWithAuth(`/api/progress/${activityId}/collect-final-reward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            debugLog('Recompensa final coletada com sucesso no backend.', data);

            // *** CORREÇÃO AQUI ***
            // Atualiza o estado local IMEDIATAMENTE com os dados retornados
            if (data.updated_progress) {
                setUserProgress(data.updated_progress);
            }

            // (Opcional: Atualizar o XP Global no AuthContext - se/quando implementado)
            // if (data.global_xp) {
            //     auth.updateGlobalXp(data.global_xp);
            // }

            // Não precisamos mais do fetchAllData(), mas o leaderboard sim.
            fetchLeaderboard();

            setTimeout(() => {
                debugLog('Retornando para a visão do tabuleiro.');
                handleReturnToBoard();
            }, 1000);

        } catch (error) {
            console.error('Erro detalhado ao coletar recompensa final:', error);
            setError(`Erro ao coletar: ${error.message}`);
            throw error; // Re-lança para o <FinalRewardTab> parar o loading
        }
    }, [activityId, fetchWithAuth, fetchLeaderboard, handleReturnToBoard]);

    const updateUserProgress = useCallback(async (points, coins) => {
        debugLog(`Enviando atualização de progresso:`, { points, coins });
        try {
            // O fetchWithAuth já lida com o token
            const data = await fetchWithAuth(`/api/progress/${activityId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coins }), // A API só aceita 'coins' agora
            });

            // A rota /update não retorna o progresso, então buscamos manualmente
            const progressData = await fetchWithAuth(`/api/progress/${activityId}`);
            if (progressData) {
                setUserProgress(progressData);
                debugLog('Progresso do usuário atualizado com sucesso no estado.', progressData);
            }
            await fetchLeaderboard();
        } catch (err) {
            // O erro já é setado dentro do fetchWithAuth
            debugLog('updateUserProgress: Erro encontrado.', err);
        }
    }, [activityId, fetchWithAuth, fetchLeaderboard]);


    // --- FUNÇÕES NOVAS PARA ROLETA E SLOT ---

    const handleSpin = useCallback(async (isRetryAttempt = false) => { // 1. Aceita o parâmetro
        debugLog('Acionando a Roleta...', { isRetryAttempt });
        try {
            const data = await fetchWithAuth(`/api/progress/${activityId}/spin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // 2. Agora enviamos o body que o backend espera
                body: JSON.stringify({ is_retry: isRetryAttempt }),
                suppressGlobalError: true
            });

            if (data.updated_progress) {
                setUserProgress(data.updated_progress);
                debugLog('Progresso atualizado após Roleta.', data.updated_progress);
            }

            fetchLeaderboard();
            return data;

        } catch (error) {
            console.error('Erro ao girar roleta:', error);
            //setError(`Erro na roleta: ${error.message}`);
            throw error;
        }
    }, [activityId, fetchWithAuth, fetchLeaderboard]);

    const handlePlaySlot = useCallback(async () => {
        debugLog('Acionando o Caça-Níquel...');
        try {
            const data = await fetchWithAuth(`/api/progress/${activityId}/play-slot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                suppressGlobalError: true
            });

            if (data.updated_progress) {
                setUserProgress(data.updated_progress); // ATUALIZA O ESTADO
                debugLog('Progresso atualizado após Caça-Níquel.', data.updated_progress);
            }

            fetchLeaderboard(); // Atualiza o ranking se o XP mudou
            return data; // Retorna os dados do prêmio para o <SlotMachineTab>

        } catch (error) {
            console.error('Erro ao jogar caça-níquel:', error);
            //setError(`Erro no caça-níquel: ${error.message}`);
            throw error; // Re-lança para o <SlotMachineTab>
        }
    }, [activityId, fetchWithAuth, fetchLeaderboard]);

    const handleStudentClick = useCallback((student) => console.log('Clicked student:', student), []);
    const handleOpenQuizEditor = useCallback(() => navigate(`/professor/activity/${activityId}/quiz/edit`), [navigate, activityId]);
    const handleOpenNarrativeEditor = useCallback(() => navigate(`/professor/activity/${activityId}/narrative/edit`), [navigate, activityId]);
    const hubElementsToRender = activity?.gamificationDesign?.hub_elements || [];
    const finalRewardConfig = activity?.gamificationDesign?.finalReward ? assets.path.final_reward : null;

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
        loading: loading, // Somente carrega API
        isAssetsLoading: activity && !assetsAreLoaded,
        error,
        currentView,
        showStatsModal,
        isSidebarOpen,
        assetsProgress,
        estimatedTimeRemaining,

        hubElementsToRender: activity?.gamificationDesign?.hub_elements || [],
        finalRewardConfig: activity?.gamificationDesign?.finalReward ? assets.path.final_reward : null,

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
        assets,

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
        handleSpin,
        handlePlaySlot,
    };
};