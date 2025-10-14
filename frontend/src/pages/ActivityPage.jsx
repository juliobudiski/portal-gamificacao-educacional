// ==== [HEADER] ====  
// Arquivo: ActivityPage.jsx  
// Última revisão: 06-10-25 (Correção de escopo da função fetchAllData)
// Debug: DEBUG_MODE=true para logs detalhados  
// ==================  

import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SlotMachineTab from '../components/activity/SlotMachineTab';
// Importando os componentes modulares
import StudentSidebar from '../components/activity/StudentSidebar';
import ProfessorSidebar from '../components/activity/ProfessorSidebar';
import StatsModal from '../components/activity/StatsModal';
import NarrativeTab from '../components/activity/NarrativeTab';
import QuizTab from '../components/activity/QuizTab';
import LeaderboardTab from '../components/activity/LeaderboardTab';
import ChatTab from '../components/activity/ChatTab';
import StoreTab from '../components/activity/StoreTab';
import MissionTab from '../components/activity/MissionTab';
import AchievementsTab from '../components/activity/AchievementsTab';
import RouletteTab from '../components/activity/RouletteTab';
// Ícones para os cards do dashboard
import { FaArrowLeft } from 'react-icons/fa';
import useAnalytics from "../hooks/useAnalytics";
import { cardsConfig } from '../components/activity/gameElementsConfig';
import GameBoardViewer from '../components/activity/GameBoardViewer';
import useAssetLoader from '../hooks/useAssetLoader'; // Importa nosso hook
import FinalRewardTab from '../components/activity/FinalRewardTab';
import AvatarCustomizationTab from '../components/activity/CustomizationTab';
import { elementConfig, decorationConfig, decorationSpawnPoints, boardStructuralImages } from '../components/activity/GameBoardConfig';
import ForumTab from '../components/activity/ForumTab';
// Função auxiliar para embaralhar uma array
const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

// Configuração de debug - ativar no .env.local
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

// Componente de Tela de Carregamento
const FullPageLoader = ({ progress, etr }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-primary-text font-sans">
    <h2 className="text-2xl mb-4">Carregando Aventura...</h2>
    <div className="w-3/4 max-w-lg bg-gray-700 rounded-full h-4 overflow-hidden border-2 border-gray-600">
      <div
        className="bg-yellow-400 h-full rounded-full transition-all duration-300 ease-linear"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
    <p className="mt-4 text-xl font-bold">{progress}%</p>
    {etr && <p className="mt-2 text-secondary-text">{etr}</p>}
  </div>
);


/**
 * @desc Página principal de atividades que gerencia diferentes elementos de gamificação
 * @returns {JSX.Element} Componente da página de atividade
 * @throws {Error} Quando ocorrem falhas de carregamento ou autenticação
 */
function ActivityPage() {
  const { activityId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { logEvent } = useAnalytics("activity_page", user.token, activityId);
  // Estados da aplicação
  const [activity, setActivity] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [storeItems, setStoreItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('board');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [slotWinners, setSlotWinners] = useState([]);
  const [loadingSlotWinners, setLoadingSlotWinners] = useState(true);
  const [activeStepContent, setActiveStepContent] = useState(null);
  //const [initialAssetsLoaded, setInitialAssetsLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const handleStudentClick = useCallback((student) => {
    console.log('Clicked student:', student);
  }, []); // Array de dependência vazio é seguro aqui.

  const handleOpenQuizEditor = useCallback(() => {
    // Adicionamos uma verificação para garantir que activityId existe antes de navegar.
    if (activityId) navigate(`/professor/activity/${activityId}/quiz/edit`);
  }, [navigate, activityId]);

  const handleOpenNarrativeEditor = useCallback(() => {
    if (activityId) navigate(`/professor/activity/${activityId}/narrative/edit`);
  }, [navigate, activityId]);

  const handleShowStats = useCallback(() => {
    setShowStatsModal(true);
  }, []); // O array vazio [] garante que a função nunca será recriada



  const handleFinalRewardClick = () => {
    debugLog("Aluno clicou na Recompensa Final.");
    setCurrentView('final_reward');
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    // Damos um pequeno tempo para a animação de fechar antes de limpar o conteúdo
    setTimeout(() => {
      setCurrentView('board');
      setActiveStepContent(null);
    }, 400);
  };

  // Função utilitária para logging
  const debugLog = useCallback((message, ...optionalParams) => {
    if (DEBUG_MODE) {
      console.debug(`[ActivityPage] ${message}`, ...optionalParams);
    }
  }, []);

  /**
   * @desc Busca dados de API com tratamento de erros
   * @param {string} url - Endpoint da API
   * @param {function} setter - Função set do state
   * @throws {Error} Quando falha a requisição
   */
  const fetchData = useCallback(async (url, setter) => {
    debugLog(`Iniciando fetchData para: ${url}`);

    if (!user?.token) {
      const errorMsg = 'Usuário não autenticado.';
      debugLog(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE}${url}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      setter(data);
      debugLog(`Dados recebidos de ${url}:`, data);

    } catch (err) {
      const errorMsg = `Falha ao buscar ${url}: ${err.message}`;
      debugLog(errorMsg, err);
      setError(prev => `${prev}\n${errorMsg}`);
    }
  }, [user?.token, debugLog]);

  const fetchSlotWinners = useCallback(async () => {
    setLoadingSlotWinners(true);
    // Usamos a função fetchData que já existe para buscar os dados
    await fetchData(`/api/progress/${activityId}/slot-winners`, setSlotWinners);
    setLoadingSlotWinners(false);
  }, [activityId, fetchData]);

  // --- INÍCIO DA CORREÇÃO ---
  // 1. A função `fetchAllData` é movida para fora do `useEffect` e envolvida em um `useCallback`.
  //    Isso a torna estável e acessível em todo o escopo do componente.
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    debugLog('Iniciando fetchAllData');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/activities/${activityId}`,
        { headers: { 'Authorization': `Bearer ${user.token}` } }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Status não-OK ao carregar atividade");
      }

      let activityData = await response.json();

      if (activityData.gamificationDesign && !activityData.gamificationDesign.finalReward) {
        console.warn("[TESTE] Adicionando objeto 'finalReward' que não veio da API.");
        activityData.gamificationDesign.finalReward = {
          rewardType: "xp",
          value: 1000,
          displayText: "Recompensa Final",
          celebrationText: "Parabéns por concluir a jornada!"
        };
      }

      const design = activityData.gamificationDesign;
      const missionInHub = design?.hub_elements?.find(el => el.type === 'mission' && el.enabled);

      if (design?.progression_path && missionInHub) {
        const missionStep = {
          id: 'mission_step_01',
          type: 'mission',
          content: { title: 'Sua Missão' }
        };
        design.progression_path.unshift(missionStep);
        missionInHub.enabled = false;
      }

      setActivity(activityData);
      debugLog('Atividade carregada:', activityData);

      const elements = activityData.gameElements?.selectedElements || [];
      const dataPromises = [];
      debugLog('Elementos de jogo detectados:', elements);

      if (user.role === 'aluno') {
        dataPromises.push(fetchData(`/api/progress/${activityId}`, setUserProgress));
      } else if (user.role === 'professor') {
        dataPromises.push(fetchData(`/api/progress/${activityId}/analytics`, setAnalytics));
      }

      if (elements.includes("Sistema de classificação e ranking")) {
        debugLog('Carregando leaderboard...');
        dataPromises.push(fetchData(`/api/progress/${activityId}/leaderboard`, setLeaderboard));
      }
      if (elements.includes("Economia (sistema monetário)")) {
        debugLog('Carregando itens da loja...');
        dataPromises.push(fetchData(`/api/progress/${activityId}/store-items`, setStoreItems));
      }
      if (elements.includes("Chance (sorte e probabilidade)")) {
        dataPromises.push(fetchSlotWinners());
      }

      await Promise.all(dataPromises);
      debugLog('Todos os dados complementares carregados');

    } catch (err) {
      const errorMsg = `Erro no fetchAllData: ${err.message}`;
      debugLog(errorMsg, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
      debugLog('Finalizado fetchAllData');
    }
  }, [activityId, user, fetchData, debugLog, fetchSlotWinners]);

  const handleHubIconClick = useCallback(async (view) => {
    debugLog("Aluno clicou no ícone do hub:", view);

    // Se o usuário quer ver o ranking, atualizamos os dados primeiro
    if (view === 'ranking') {
      debugLog('Atualizando leaderboard antes de exibir...');
      // Usamos 'await' para garantir que a busca termine antes de mudar a tela,
      // embora a mudança de tela seja quase instantânea.
      await fetchData(`/api/progress/${activityId}/leaderboard`, setLeaderboard);
    }

    setCurrentView(view);
  }, [activityId, debugLog, fetchData]);


  // 2. `handleCollectFinalReward` também é envolvida em `useCallback` e agora pode acessar `fetchAllData`.
  const handleCollectFinalReward = useCallback(async () => {
    debugLog("Coletando recompensa final...");
    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE}/api/progress/${activityId}/collect-final-reward`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao coletar recompensa final.");
      }

      alert("Parabéns! Recompensa coletada e atividade finalizada!");

      // A chamada agora funciona, pois `fetchAllData` está no escopo correto.
      await fetchAllData();

      setCurrentView('board');

    } catch (err) {
      setError(`Erro: ${err.message}`);
      debugLog("Erro ao coletar recompensa final:", err);
    }
  }, [activityId, user.token, debugLog, fetchAllData]); // fetchAllData é adicionada como dependência
  // --- FIM DA CORREÇÃO ---


  // --- LÓGICA DE PRELOADING DE ASSETS ---
  const allImageUrls = useMemo(() => {
    if (!activity) return [];

    const urls = new Set(boardStructuralImages);
    const design = activity.gamificationDesign;

    Object.values(elementConfig.path).forEach(p => urls.add(p.icon));
    Object.values(elementConfig.hub).forEach(h => urls.add(h.icon));
    decorationConfig.forEach(d => urls.add(d.src));

    if (design?.progression_path) {
      design.progression_path.forEach(step => {
        if (step.type === 'narrative' && step.content) {
          if (step.content.scenario) urls.add(step.content.scenario);
          if (step.content.characters) {
            step.content.characters.forEach(char => urls.add(char.image));
          }
        }
        if (step.type === 'quiz' && step.content?.questions) {
          step.content.questions.forEach(question => {
            if (question.image_url) {
              urls.add(question.image_url);
            }
          });
        }
      });
    }

    urls.add('/assets/quiz-background.webp'); // Adiciona a imagem de fundo do quiz

    return Array.from(urls);
  }, [activity]);

  const { loadingProgress: assetsProgress, isLoaded: assetsAreLoaded, etr } = useAssetLoader(allImageUrls);



  // Função para gerar coordenadas, necessária para o cálculo das decorações

  const generateStepCoordinates = useCallback((numberOfSteps) => {
    const coords = [];
    const stepsPerRow = 4; const rowHeight = 30; const xMargin = 15; const yMargin = 15;
    for (let i = 0; i < numberOfSteps; i++) {
      const row = Math.floor(i / stepsPerRow);
      const positionInRow = i % stepsPerRow;
      const y = yMargin + (row * rowHeight);
      let x;
      if (row % 2 === 0) { x = xMargin + (positionInRow * ((100 - 2 * xMargin) / (stepsPerRow - 1))); }
      else { x = (100 - xMargin) - (positionInRow * ((100 - 2 * xMargin) / (stepsPerRow - 1))); }
      coords.push({ x: `${x}%`, y: `${y}%` });
    }
    return coords;
  }, []);

  const stepCoordinates = useMemo(() => {
    const path = activity?.gamificationDesign?.progression_path;
    if (!path) return []; // Retorna um array vazio se a trilha não existir

    const numberOfSteps = path.length;
    // Gera coordenadas para todos os passos + 1 (para a casa final)
    return generateStepCoordinates(numberOfSteps + 1);

  }, [activity?.gamificationDesign?.progression_path, generateStepCoordinates]);

  const renderedDecorations = useMemo(() => {
    if (!activity?.gamificationDesign?.progression_path) return [];

    // Reutiliza as coordenadas já calculadas, pegando apenas as dos passos de conteúdo
    const occupiedStepCoordinates = stepCoordinates.slice(0, -1);
    const occupiedPositions = new Set(occupiedStepCoordinates.map(c => `${c.x}-${c.y}`));

    // O resto da sua lógica de decorações, que já está perfeita, continua aqui
    const availablePoints = decorationSpawnPoints.filter(p => !occupiedPositions.has(`${p.x}-${p.y}`));
    const shuffledPoints = shuffleArray([...availablePoints]);
    const MAX_DECORATIONS = 20;
    const limit = Math.min(MAX_DECORATIONS, shuffledPoints.length);
    const decorationsToRender = [];
    for (let i = 0; i < limit; i++) {
      const point = shuffledPoints[i];
      const randomIndex = Math.floor(Math.random() * decorationConfig.length);
      const randomDecoration = decorationConfig[randomIndex];
      decorationsToRender.push({
        ...randomDecoration,
        style: { left: point.x, top: point.y },
        id: `${randomDecoration.id}-instance-${i}`
      });
    }
    return decorationsToRender;
    // Adiciona 'stepCoordinates' ao array de dependências
  }, [activity, stepCoordinates]);

  // 3. O `useEffect` principal agora simplesmente chama a função `fetchAllData`.
  //    As dependências `activityId` e `user` são gerenciadas pelo `useCallback` de `fetchAllData`.
  useEffect(() => {
    debugLog('Iniciando carregamento da atividade', { activityId });

    if (!activityId || !/^\d+$/.test(activityId)) {
      setError('ID de atividade inválido');
      setLoading(false);
      return;
    }

    if (!user) {
      setError('Usuário não autenticado');
      setLoading(false);
      return;
    }

    fetchAllData();
  }, [activityId, user, fetchAllData]); // `fetchAllData` é adicionada como dependência para garantir que a função mais recente seja usada se suas próprias dependências mudarem.


  // --- LÓGICA DE NÍVEL E XP (CLIENT-SIDE PARA FEEDBACK IMEDIATO) ---
  const xpForNextLevel = useCallback((level) => 100 + (level - 1) * 50, []);
  const handlePrizeUnlocked = useCallback(() => {
    // Esta função simplesmente diz para a ActivityPage buscar os dados de progresso mais recentes.
    debugLog('Um prêmio foi ganho, atualizando o progresso do usuário...');
    fetchData(`/api/progress/${activityId}`, setUserProgress);
  }, [activityId, fetchData, debugLog]);
  const handlePointsEarned = useCallback(async (points) => {
    const numericPoints = parseInt(points, 10);
    if (isNaN(numericPoints) || numericPoints === 0) return;

    debugLog(`handlePointsEarned: Adicionando ${numericPoints} pontos.`);

    // 1. Atualiza o estado local de forma otimista com a nova lógica de nível
    setUserProgress(prev => {
      if (!prev) return null; // Guarda de segurança
      let { level, xp, xpForNextLevel: currentXpForNext, points_earned } = prev;
      let newXp = xp + numericPoints;

      // 2. Loop para tratar múltiplos level-ups
      while (newXp >= currentXpForNext) {
        level += 1; // Sobe de nível
        newXp -= currentXpForNext; // Subtrai o XP necessário e mantém o excedente
        currentXpForNext = xpForNextLevel(level); // Calcula o novo XP necessário para o próximo nível
        debugLog(`LEVEL UP! Novo nível: ${level}, XP restante: ${newXp}, Próximo nível em: ${currentXpForNext}`);
      }

      const updatedProgress = {
        ...prev,
        level: level,
        xp: newXp,
        xpForNextLevel: currentXpForNext,
        points_earned: points_earned + numericPoints,
      };

      debugLog('Progresso local atualizado:', updatedProgress);
      return updatedProgress;
    });

    // 3. Envia a atualização para o backend (sem se preocupar com a resposta imediata)
    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE}/api/progress/${activityId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ points: numericPoints })
      });
      if (!response.ok) throw new Error("Falha ao salvar progresso no servidor.");
      debugLog('Pontos salvos no servidor com sucesso.');
    } catch (err) {
      debugLog("Erro ao salvar progresso no servidor:", err);
      setError("Erro de conexão ao salvar seu progresso. Seus pontos podem não ter sido salvos.");
      // Opcional: Implementar lógica para reverter o estado em caso de falha grave
    }
  }, [activityId, user.token, debugLog, xpForNextLevel]);

  const handlePurchase = useCallback(async (item) => {
    debugLog('Tentando comprar o item:', item);
    logEvent("purchase_item", {
      item_id: item.id,
      item_type: item.item_type,
      price: item.price
    }, "store");
    if (!window.confirm(`Você tem certeza que quer gastar ${item.price} pontos para comprar "${item.name}"?`)) {
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE}/api/progress/${activityId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ item_id: item.id }),
        duration_days: item.duration_days
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha ao processar a compra.");
      }

      // 1. Atualiza os pontos do usuário na tela (carteira)
      setUserProgress(prev => ({
        ...prev,
        points_earned: data.new_total_points
      }));

      debugLog('Compra bem-sucedida, atualizando o progresso do usuário...');
      await fetchData(`/api/progress/${activityId}`, setUserProgress);
      // --- FIM DA CORREÇÃO ---

      // Também podemos continuar atualizando o ranking, como já estava fazendo.
      debugLog('Atualizando o ranking para exibir os novos efeitos...');
      await fetchData(`/api/progress/${activityId}/leaderboard`, setLeaderboard);

      debugLog('Progresso e ranking atualizados.');

    } catch (err) {
      debugLog("Erro na compra:", err);
      setError(`Erro na compra: ${err.message}`);
      setTimeout(() => setError(''), 5000);
    }
  }, [activityId, user?.token, debugLog, fetchData, setLeaderboard, logEvent]);

  // --- NOVA FUNÇÃO PARA SELEÇÃO DE VIEW COM ATUALIZAÇÃO DE DADOS ---
  const handleSelectView = useCallback(async (view) => {
    // Se o usuário clicar para ver o ranking, atualizamos os dados primeiro
    if (view === 'leaderboard') {
      debugLog('Atualizando leaderboard antes de exibir...');
      await fetchData(`/api/progress/${activityId}/leaderboard`, setLeaderboard);
    }
    setCurrentView(view);
  }, [activityId, fetchData, debugLog]);

  // Função para adicionar item (passada para o StoreTab)
  const handleAddItem = async (itemData) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE}/api/progress/${activityId}/store-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify(itemData)
      });
      if (!response.ok) throw new Error("Falha ao adicionar item.");
      const newItem = await response.json();
      setStoreItems(prev => [...prev, newItem]); // Atualiza a lista na UI
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReturnToBoard = () => {
    setCurrentView('board');
    setActiveStepContent(null); // Limpa o conteúdo ativo para garantir um estado limpo
  };

  // Função para deletar item (passada para o StoreTab)
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Tem certeza que deseja remover este item da loja?")) return;
    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE}/api/progress/store-items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (!response.ok) throw new Error("Falha ao deletar item.");
      setStoreItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStepClick = (step) => {
    debugLog("Aluno clicou no passo:", step);
    if (step.type === 'mission' || step.content) {
      setActiveStepContent({ ...step.content, step_id: step.id });
      setCurrentView(step.type);
    } else {
      alert("Este passo da jornada ainda não tem conteúdo disponível!");
    }
  };

  const handleStepCompletion = useCallback(async (completedStepId) => {
    debugLog(`Recebido aviso de conclusão para o passo: ${completedStepId}`);

    // 1. ATUALIZAÇÃO SEGURA DO ESTADO LOCAL (SEM DEPENDÊNCIA)
    // Usamos (prev) => ({...}) para evitar a dependência de userProgress no useCallback.
    setUserProgress(prev => {
      if (!prev) return null;
      const updatedCompletedSteps = [...(prev.completed_steps || []), completedStepId];
      return {
        ...prev,
        completed_steps: Array.from(new Set(updatedCompletedSteps))
      };
    });

    // 2. Envia a atualização para o backend (lógica inalterada)
    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE}/api/progress/${activityId}/complete-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ step_id: completedStepId })
      });
      if (!response.ok) throw new Error("Falha ao salvar a conclusão do passo no servidor.");

      debugLog('Conclusão do passo salva no servidor com sucesso.');

    } catch (err) {
      debugLog("Erro ao salvar conclusão do passo:", err);
      setError("Erro de conexão ao salvar seu progresso.");
    }

    // 3. Volta para a visualização do tabuleiro (lógica inalterada)
    setCurrentView('board');
    setActiveStepContent(null);

  }, [activityId, user?.token, debugLog]);

  const onAvatarChange = useCallback((newAvatarUrl) => {
    // Atualiza o estado local para refletir a mudança imediatamente
    setUserProgress(prevProgress => ({
      ...prevProgress,
      equipped_activity_avatar_url: newAvatarUrl
    }));
    // Opcional: Atualizar o leaderboard para refletir a mudança também
    // fetchAllData(); // Pode ser pesado, a atualização local já melhora a UX
  }, []);


  // ---------- [COMPONENTE INTERNO: DASHBOARD] ----------
  const ActivityDashboard = ({ activity, onSelectView, userRole }) => {
    const elements = activity.gameElements?.selectedElements || [];

    const availableCards = cardsConfig.filter(card => {
      if (userRole === 'professor') {
        return card.isEnabled(elements, 'aluno') || card.isEnabled(elements, 'professor');
      }
      return card.isEnabled(elements, userRole);
    });

    debugLog(`Cards disponíveis para ${userRole}:`, availableCards.map(c => c.key));

    if (availableCards.length === 0) {
      return <div className="text-center text-secondary-text p-8">Esta atividade não possui elementos interativos.</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {availableCards.map(card => (
          <button
            key={card.key}
            onClick={() => onSelectView(card.key)} // Usa o novo handler
            className={`bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 text-left transition-all
                        transform hover:-translate-y-2 hover:border-${card.color}-400 group`}
            aria-label={`Acessar ${card.title}`}
          >
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-lg bg-${card.color}-400/10 mr-4`}>
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-primary-text">{card.title}</h3>
            </div>
            <p className="text-secondary-text group-hover:text-secondary-text transition-colors">
              {card.description}
            </p>
          </button>
        ))}
      </div>
    );
  };

  // ---------- [RENDERIZAÇÃO DE CONTEÚDO] ----------
  const getCurrentViewDetails = () => {
    // Para quiz ou narrativa, usamos o título do passo ativo
    if ((currentView === 'quiz' || currentView === 'narrative') && activeStepContent) {
      const config = elementConfig.path[currentView];
      return {
        title: activeStepContent.title || config.name,
        backgroundImage: config.icon
      }
    }

    if (currentView === 'board' || !elementConfig.hub[currentView]) {
      return { title: 'Tabuleiro da Atividade', backgroundImage: '' };
    }
    const config = elementConfig.hub[currentView];
    return {
      title: config.name,
      backgroundImage: config.icon
    };
  };


  const viewDetails = getCurrentViewDetails();

  // Função que decide qual componente "Tab" renderizar dentro do overlay
  const renderActiveContent = () => {
    switch (currentView) {

      case 'quiz': { // Usamos chaves {} para criar um escopo de bloco
        // 1. Verificamos se o ID do passo atual já está na lista de passos concluídos.
        const isStepCompleted = userProgress?.completed_steps?.includes(activeStepContent?.step_id);

        // 2. Criamos um "manipulador de pontos" condicional.
        // Se o passo já foi concluído, ele será uma função vazia.
        // Se não, será a função real que concede pontos.
        const pointsHandler = isStepCompleted ? () => { } : handlePointsEarned;

        // 3. Renderizamos o QuizTab, passando o manipulador correto e um novo prop 'isReplay'.
        return <QuizTab
          content={activeStepContent}
          onAnswerCorrect={pointsHandler}
          onComplete={handleStepCompletion}
          isReplay={isStepCompleted} // Prop extra para o feedback visual
        />;
      }
      case 'narrative':
        return <NarrativeTab
          content={activeStepContent}
          onComplete={handleStepCompletion}
        />;
      case 'ranking':
        return <LeaderboardTab leaderboardData={leaderboard} onReturn={handleReturnToBoard} />;
      case 'mission':
        return <MissionTab
          activity={activity}
          // Ao completar, chamamos a função de conclusão com nosso ID especial
          onComplete={() => handleStepCompletion('mission_step_01')}
          onReturn={handleReturnToBoard}
        />;
      case 'store':
        return <StoreTab onReturn={handleReturnToBoard} userRole={user.role} items={storeItems} userPoints={userProgress?.points_earned || 0} onPurchase={handlePurchase} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} />;
      case 'roulette':
        return <RouletteTab onReturn={handleReturnToBoard} onPrizeWon={handlePointsEarned} onPrizeUnlocked={handlePrizeUnlocked} />;
      case 'slot_machine':
        return <SlotMachineTab onReturn={handleReturnToBoard} onPrizeWon={handlePointsEarned} onWin={fetchSlotWinners} winners={slotWinners} loadingWinners={loadingSlotWinners} userCoins={userProgress?.coins || 0} />;
      case 'badges':
        return <AchievementsTab onReturn={handleReturnToBoard} activityId={activityId} />;
      case 'chat':
        return <ChatTab onReturn={handleReturnToBoard} />;
      case 'final_reward':
        return (
          <FinalRewardTab
            reward={activity?.gamificationDesign?.finalReward}
            onCollect={handleCollectFinalReward}
          />
        );
      case 'forum':
        return <ForumTab onReturn={handleReturnToBoard} />;
      case 'avatar_customization':
        return (
          <AvatarCustomizationTab
            activityId={activityId}
            userProgress={userProgress}
            onReturn={handleReturnToBoard}
            onAvatarChange={onAvatarChange}
          />
        );
      // Adicione outros casos aqui conforme necessário
      default:
        return null;
    }
  };

  // ---------- [STATES DE CARREGAMENTO E ERRO] ----------
  if (loading || (activity && !assetsAreLoaded)) {
    const progress = loading ? 0 : assetsProgress;
    return <FullPageLoader progress={progress} etr={etr} />;
  }

  if (error) {
    return (
      <div className="text-center p-10 text-red-500">
        <p className="font-bold">Ocorreu um erro:</p>
        <p>{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-red-700 rounded hover:bg-red-600 text-primary-text"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!activity) {
    return <div className="text-center p-10 text-primary-text">Atividade não encontrada.</div>;
  }


  return (
    <div className="flex min-h-screen bg-gray-900 text-primary-text relative">
      {/* Botão para controlar a Sidebar */}
      {user.role === 'aluno' && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 z-20 p-2 bg-gray-800 rounded-full text-primary-text hover:bg-yellow-500 transition-all"
          aria-label="Mostrar/Esconder Progresso"
        >
          {/* Ícone muda com base no estado */}
          {isSidebarOpen ?
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" /></svg> :
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" /></svg>
          }
        </button>
      )}
      {/* Sidebar do Aluno com flex-shrink-0 */}
      {user.role === 'aluno' && (
        <aside className={`bg-gray-800 p-4 border-r border-gray-700 transition-all duration-300 ease-in-out transform flex-shrink-0 ${isSidebarOpen ? 'w-1/4 translate-x-0' : 'w-0 -translate-x-full'}`}>
          <div className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
            {userProgress && <StudentSidebar progress={userProgress} onShowStats={handleShowStats} />}
          </div>
        </aside>
      )}


      {/* Sidebar do Professor - Continua como antes */}
      {user.role === 'professor' && (
        <aside className="w-1/4 bg-gray-800 p-4 border-r border-gray-700">
          {analytics && <ProfessorSidebar analytics={analytics} onStudentClick={handleStudentClick} onOpenQuizEditor={handleOpenQuizEditor} onOpenNarrativeEditor={handleOpenNarrativeEditor} />}
        </aside>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 w-3/4 p-8">
        <h1 className="text-5xl font-extrabold mb-2">{activity.title}</h1>
        <p className="mb-8 text-lg text-secondary-text">{activity.description}</p>

        {activity.gamificationDesign && (
          <GameBoardViewer
            gamificationDesign={activity.gamificationDesign}
            studentProgress={userProgress}
            onStepClick={handleStepClick}
            onHubIconClick={handleHubIconClick}
            userRole={user.role}
            renderedDecorations={renderedDecorations}

            currentView={currentView}
            onReturnToBoard={handleReturnToBoard}
            onFinalRewardClick={handleFinalRewardClick}
            stepCoordinates={stepCoordinates}
          >
            {renderActiveContent()} {/* <-- Passa o conteúdo como filho */}
          </GameBoardViewer>
        )}
      </main>
    </div>
  );
}

export default ActivityPage;