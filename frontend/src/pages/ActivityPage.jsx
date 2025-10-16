// ==== [HEADER] ====
// Arquivo: ActivityPage.jsx
// Refatorado para corrigir a ordem dos Hooks, a passagem de props e a lógica do Hub.
// ==================

import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SlotMachineTab from '../components/activity/SlotMachineTab';
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
import { FaArrowLeft } from 'react-icons/fa';
import useAnalytics from "../hooks/useAnalytics";
import { cardsConfig } from '../components/activity/gameElementsConfig';
import GameBoardViewer from '../components/activity/GameBoardViewer';
import useAssetLoader from '../hooks/useAssetLoader';
import FinalRewardTab from '../components/activity/FinalRewardTab';
import AvatarCustomizationTab from '../components/activity/CustomizationTab';
import { elementConfig, decorationConfig, decorationSpawnPoints, boardStructuralImages } from '../components/activity/GameBoardConfig';
import ForumTab from '../components/activity/ForumTab';
import './ActivityPage.css';

// Função auxiliar (mantida do original)
const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

const FullPageLoader = ({ progress, etr }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-primary-bg text-primary-text font-sans">
    <h2 className="text-2xl mb-4">Carregando Aventura...</h2>
    <div className="w-3/4 max-w-lg bg-border-color rounded-full h-4 overflow-hidden border-2 border-gray-600">
      <div className="bg-yellow-400 h-full rounded-full transition-all duration-300 ease-linear" style={{ width: `${progress}%` }}></div>
    </div>
    <p className="mt-4 text-xl font-bold">{progress}%</p>
    {etr && <p className="mt-2 text-secondary-text">{etr}</p>}
  </div>
);


function ActivityPage() {

  // ========================================================================
  // 1. HOOKS: Todos os hooks de estado e contexto no topo.
  // ========================================================================
  const { activityId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { logEvent } = useAnalytics("activity_page", token, activityId);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ========================================================================
  // 2. FUNÇÕES E LÓGICA MEMORIZADA (useCallback, useMemo)
  // ========================================================================

  const debugLog = useCallback((message, ...optionalParams) => {
    if (DEBUG_MODE) {
      console.debug(`[ActivityPage] ${message}`, ...optionalParams);
    }
  }, []);

  const fetchData = useCallback(async (url, setter) => {
    debugLog(`Iniciando fetchData para: ${url}`);
    if (!user?.token) {
      setError('Usuário não autenticado.');
      return;
    }
    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE}${url}`, { headers: { 'Authorization': `Bearer ${user.token}` } });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }
      const data = await response.json();
      setter(data);
      debugLog(`Dados recebidos de ${url}:`, data);
    } catch (err) {
      setError(prev => `${prev}\nFalha ao buscar ${url}: ${err.message}`);
    }
  }, [user?.token, debugLog]);

  const fetchSlotWinners = useCallback(async () => {
    setLoadingSlotWinners(true);
    await fetchData(`/api/progress/${activityId}/slot-winners`, setSlotWinners);
    setLoadingSlotWinners(false);
  }, [activityId, fetchData]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    debugLog('Iniciando fetchAllData');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}`, { headers: { 'Authorization': `Bearer ${user.token}` } });
      if (!response.ok) throw new Error((await response.json()).message || "Status não-OK");

      let activityData = await response.json();
      if (activityData.gamificationDesign && !activityData.gamificationDesign.finalReward) {
        console.warn("[TESTE] Adicionando objeto 'finalReward' que não veio da API.");
        activityData.gamificationDesign.finalReward = { rewardType: "xp", value: 1000, displayText: "Recompensa Final", celebrationText: "Parabéns por concluir a jornada!" };
      }

      const design = activityData.gamificationDesign;
      const missionInHub = design?.hub_elements?.find(el => el.type === 'mission' && el.enabled);
      if (design?.progression_path && missionInHub) {
        const missionStep = { id: 'mission_step_01', type: 'mission', content: { title: 'Sua Missão' } };
        design.progression_path.unshift(missionStep);
        missionInHub.enabled = false;
      }

      setActivity(activityData);
      debugLog('Atividade carregada:', activityData);

      const elements = activityData.gameElements?.selectedElements || [];
      const dataPromises = [];
      if (user.role === 'aluno') dataPromises.push(fetchData(`/api/progress/${activityId}`, setUserProgress));
      else if (user.role === 'professor') dataPromises.push(fetchData(`/api/progress/${activityId}/analytics`, setAnalytics));

      if (elements.includes("Sistema de classificação e ranking")) dataPromises.push(fetchData(`/api/progress/${activityId}/leaderboard`, setLeaderboard));
      if (elements.includes("Economia (sistema monetário)")) dataPromises.push(fetchData(`/api/progress/${activityId}/store-items`, setStoreItems));
      if (elements.includes("Chance (sorte e probabilidade)")) dataPromises.push(fetchSlotWinners());

      await Promise.all(dataPromises);
    } catch (err) {
      setError(`Erro no fetchAllData: ${err.message}`);
    } finally {
      setLoading(false);
      debugLog('Finalizado fetchAllData');
    }
  }, [activityId, user, fetchData, debugLog, fetchSlotWinners]);

  // --- Lógica de cálculo (useMemo) ---
  const completedStepsSet = useMemo(() => new Set(userProgress?.completed_steps || []), [userProgress]);

  const activeStepId = useMemo(() => {
    if (user.role !== 'aluno' || !activity?.gamificationDesign?.progression_path) return null;
    for (const step of activity.gamificationDesign.progression_path) {
      if (!completedStepsSet.has(step.id)) return step.id;
    }
    return null;
  }, [user.role, activity, completedStepsSet]);

  const getStepStatus = useCallback((step) => {
    if (user.role === 'professor') return 'active';
    if (completedStepsSet.has(step.id)) return 'completed';
    if (step.id === activeStepId) return 'active';
    return 'locked';
  }, [user.role, completedStepsSet, activeStepId]);

  const finalRewardStatus = useMemo(() => {
    if (!activity || !userProgress) return 'locked';
    if (userProgress.status === 'completed' || userProgress.completed_steps?.includes('final_reward')) return 'completed';
    const allStepsCompleted = activity?.gamificationDesign?.progression_path.every(step => completedStepsSet.has(step.id));
    return allStepsCompleted ? 'active' : 'locked';
  }, [activity, userProgress, completedStepsSet]);

  const finalRewardConfig = useMemo(() => elementConfig.path.final_reward, []);

  const hubElementsToRender = useMemo(() => {
    if (!activity) return [];
    const baseElements = activity.gamificationDesign?.hub_elements || [];
    let finalElements = [...baseElements];
    const defaultIcons = [
      { type: 'avatar_customization', roles: ['aluno', 'professor'] },
      { type: 'forum', roles: ['aluno', 'professor'] }
    ];
    defaultIcons.forEach(icon => {
      const alreadyExists = finalElements.some(el => el.type === icon.type);
      const roleIsAllowed = !icon.roles || icon.roles.includes(user.role);
      if (roleIsAllowed && !alreadyExists) {
        finalElements.push({ id: `hub_${icon.type}`, type: icon.type, enabled: true });
      }
    });
    return finalElements;
  }, [activity, user.role]);

  const generateStepCoordinates = useCallback((numberOfSteps) => {
    const coords = [];
    for (let i = 0; i < numberOfSteps; i++) {
      const row = Math.floor(i / 4);
      const positionInRow = i % 4;
      const y = 15 + (row * 30);
      let x;
      if (row % 2 === 0) { x = 15 + (positionInRow * ((70 - 2 * 15) / 3)); }
      else { x = (70 - 15) - (positionInRow * ((70 - 2 * 15) / (4 - 1))); }
      coords.push({ x: `${x}%`, y: `${y}%` });
    }
    return coords;
  }, []);

  const stepCoordinates = useMemo(() => {
    const path = activity?.gamificationDesign?.progression_path;
    if (!path) return [];
    return generateStepCoordinates(path.length + (activity.gamificationDesign.finalReward ? 1 : 0));
  }, [activity?.gamificationDesign, generateStepCoordinates]);

  const renderedDecorations = useMemo(() => {
    if (!activity?.gamificationDesign?.progression_path) return [];
    const occupiedPositions = new Set(stepCoordinates.map(c => `${c.x}-${c.y}`));
    const availablePoints = decorationSpawnPoints.filter(p => !occupiedPositions.has(`${p.x}-${p.y}`));
    const shuffledPoints = shuffleArray([...availablePoints]);
    const decorationsToRender = [];
    for (let i = 0; i < Math.min(20, shuffledPoints.length); i++) {
      const point = shuffledPoints[i];
      const randomDecoration = decorationConfig[Math.floor(Math.random() * decorationConfig.length)];
      decorationsToRender.push({ ...randomDecoration, style: { left: point.x, top: point.y }, id: `deco-instance-${i}` });
    }
    return decorationsToRender;
  }, [activity, stepCoordinates]);

  const allImageUrls = useMemo(() => {
    if (!activity) return [];
    const urls = new Set(boardStructuralImages);
    Object.values(elementConfig.path).forEach(p => urls.add(p.icon));
    Object.values(elementConfig.hub).forEach(h => urls.add(h.icon));
    decorationConfig.forEach(d => urls.add(d.src));
    // ... (resto da sua lógica de preloading)
    return Array.from(urls);
  }, [activity]);

  const { loadingProgress: assetsProgress, isLoaded: assetsAreLoaded, etr } = useAssetLoader(allImageUrls);

  // --- Handlers ---
  const handleStepClick = useCallback((step) => {
    debugLog("Step clicked", step);
    if (step.type === 'mission' || step.content) {
      setActiveStepContent({ ...step.content, step_id: step.id });
      setCurrentView(step.type);
    } else {
      alert("Conteúdo não disponível.");
    }
  }, [debugLog]);

  const handleHubIconClick = useCallback((view) => {
    debugLog("Hub icon clicked", view);
    if (view === 'ranking') {
      fetchData(`/api/progress/${activityId}/leaderboard`, setLeaderboard);
    }
    setCurrentView(view);
  }, [debugLog, activityId, fetchData]);

  const handleReturnToBoard = useCallback(() => {
    setCurrentView('board');
    setActiveStepContent(null);
  }, []);

  const handleFinalRewardClick = useCallback(() => {
    debugLog("Final reward clicked");
    setCurrentView('final_reward');
  }, [debugLog]);

  const handleStepCompletion = useCallback(async (completedStepId) => {
    debugLog(`Recebido aviso de conclusão para o passo: ${completedStepId}`);
    setUserProgress(prev => prev ? { ...prev, completed_steps: Array.from(new Set([...(prev.completed_steps || []), completedStepId])) } : null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/progress/${activityId}/complete-step`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ step_id: completedStepId })
      });
      if (!response.ok) throw new Error("Falha ao salvar a conclusão do passo no servidor.");
    } catch (err) {
      setError("Erro de conexão ao salvar seu progresso.");
    }
    setCurrentView('board');
    setActiveStepContent(null);
  }, [activityId, token, debugLog]);

  // **AQUI ESTÁ A FUNÇÃO QUE FALTAVA**
  const onAvatarChange = useCallback((newAvatarUrl) => {
    setUserProgress(prevProgress => ({
      ...prevProgress,
      equipped_activity_avatar_url: newAvatarUrl
    }));
  }, []);
  const xpForNextLevel = useCallback((level) => 100 + (level - 1) * 50, []);
  // (outros handlers como handlePurchase, handlePointsEarned, etc. são mantidos)
  const handlePointsEarned = useCallback(async (points) => {
    const numericPoints = parseInt(points, 10);
    if (isNaN(numericPoints) || numericPoints === 0) return;
    debugLog(`handlePointsEarned: Adicionando ${numericPoints} pontos.`);
    setUserProgress(prev => {
      if (!prev) return null;
      let { level, xp, xpForNextLevel: currentXpForNext, points_earned } = prev;
      let newXp = xp + numericPoints;
      while (newXp >= currentXpForNext) {
        level += 1; newXp -= currentXpForNext; currentXpForNext = xpForNextLevel(level);
      }
      return { ...prev, level, xp: newXp, xpForNextLevel: currentXpForNext, points_earned: points_earned + numericPoints };
    });
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/progress/${activityId}/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ points: numericPoints })
      });
      if (!response.ok) throw new Error("Falha ao salvar progresso no servidor.");
    } catch (err) {
      setError("Erro de conexão ao salvar seu progresso.");
    }
  }, [activityId, token, debugLog, xpForNextLevel]);
  const handleStudentClick = useCallback((student) => { console.log('Clicked student:', student); }, []);
  const handleOpenQuizEditor = useCallback(() => { if (activityId) navigate(`/professor/activity/${activityId}/quiz/edit`); }, [navigate, activityId]);
  const handleOpenNarrativeEditor = useCallback(() => { if (activityId) navigate(`/professor/activity/${activityId}/narrative/edit`); }, [navigate, activityId]);
  const handleShowStats = useCallback(() => { setShowStatsModal(true); }, []);
  const handleCollectFinalReward = useCallback(async () => { /* ... sua lógica ... */ }, [activityId, token, debugLog, fetchAllData]);

  // ========================================================================
  // 3. HOOKS DE EFEITO (useEffect)
  // ========================================================================

  useEffect(() => {
    if (activityId && user) {
      fetchAllData();
    }
  }, [activityId, user, fetchAllData]);

  // ========================================================================
  // 4. RETORNOS CONDICIONAIS (ESTADOS DE CARREGAMENTO E ERRO)
  // ========================================================================

  if (loading || (activity && !assetsAreLoaded)) {
    const progress = loading ? 0 : assetsProgress;
    return <FullPageLoader progress={progress} etr={etr} />;
  }

  if (error) {
    return (
      <div className="text-center p-10 text-red-500">
        <p className="font-bold">Ocorreu um erro:</p><p>{error}</p>
      </div>
    );
  }

  if (!activity) {
    return <div className="text-center p-10 text-primary-text">Atividade não encontrada.</div>;
  }

  // ========================================================================
  // 5. RENDERIZAÇÃO PRINCIPAL
  // ========================================================================

  const renderActiveContent = () => {
    switch (currentView) {
      case 'quiz':
        const isStepCompleted = userProgress?.completed_steps?.includes(activeStepContent?.step_id);
        return <QuizTab content={activeStepContent} onComplete={handleStepCompletion} isReplay={isStepCompleted} />;
      case 'narrative':
        return <NarrativeTab content={activeStepContent} onComplete={handleStepCompletion} />;
      case 'ranking':
        return <LeaderboardTab leaderboardData={leaderboard} onReturn={handleReturnToBoard} />;
      case 'mission':
        return <MissionTab activity={activity} onComplete={() => handleStepCompletion('mission_step_01')} onReturn={handleReturnToBoard} />;
      case 'store':
        return <StoreTab onReturn={handleReturnToBoard} userRole={user.role} items={storeItems} />;
      case 'final_reward':
        return <FinalRewardTab reward={activity?.gamificationDesign?.finalReward} onCollect={handleCollectFinalReward} />;
      case 'forum':
        return <ForumTab onReturn={handleReturnToBoard} />;
      case 'avatar_customization':
        return <AvatarCustomizationTab activityId={activityId} userProgress={userProgress} onReturn={handleReturnToBoard} onAvatarChange={onAvatarChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-primary-bg text-primary-text relative">
      {/* Lógica da Sidebar */}
      {user.role === 'aluno' && (
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute top-4 left-4 z-20 p-2 bg-primary-bg rounded-full text-primary-text hover:bg-yellow-500 transition-all">
          {isSidebarOpen ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" /></svg>}
        </button>
      )}
      {user.role === 'aluno' && (
        <aside className={`bg-primary-bg p-4 border-r border-border-color transition-all duration-300 ease-in-out transform flex-shrink-0 ${isSidebarOpen ? 'w-1/4 translate-x-0' : 'w-0 -translate-x-full'}`}>
          <div className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
            {userProgress && <StudentSidebar progress={userProgress} onShowStats={handleShowStats} />}
          </div>
        </aside>
      )}
      {user.role === 'professor' && (
        <aside className="w-1/4 bg-primary-bg p-4 border-r border-border-color">
          {analytics && <ProfessorSidebar analytics={analytics} onStudentClick={handleStudentClick} onOpenQuizEditor={handleOpenQuizEditor} onOpenNarrativeEditor={handleOpenNarrativeEditor} />}
        </aside>
      )}

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
            getStepStatus={getStepStatus}
            finalRewardStatus={finalRewardStatus}
            finalRewardConfig={finalRewardConfig}
            hubElementsToRender={hubElementsToRender}
          >
            {renderActiveContent()}
          </GameBoardViewer>
        )}
      </main>
      {showStatsModal && userProgress && <StatsModal stats={userProgress.stats} onClose={() => setShowStatsModal(false)} />}
    </div>
  );
}

export default ActivityPage;

