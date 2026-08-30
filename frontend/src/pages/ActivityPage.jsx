import React from 'react';
import { useParams } from 'react-router-dom';
import { ActivityProvider, useActivity } from '../context/ActivityContext.jsx';
import { useActivityLogic } from '../hooks/useActivityLogic';

// Componentes de UI


import StatsModal from '../components/activity/StatsModal';
import NarrativeTab from '../components/activity/NarrativeTab';
import QuizTab from '../components/activity/QuizTab';
import LeaderboardTab from '../components/activity/LeaderboardTab';
import StoreTab from '../components/activity/StoreTab';
import MissionTab from '../components/activity/MissionTab';
import FinalRewardTab from '../components/activity/FinalRewardTab';
import AvatarCustomizationTab from '../components/activity/CustomizationTab';
import ForumTab from '../components/activity/ForumTab';
import RouletteTab from '../components/activity/RouletteTab';
import SlotMachineTab from '../components/activity/SlotMachineTab';
import GameBoardViewer from '../components/activity/GameBoardViewer';
import AchievementsTab from '../components/activity/AchievementsTab';
import ChatTab from '../components/activity/ChatTab';
import LearningMaterialViewer from '../components/activity/LearningMaterialViewer';

import './ActivityPage.css';

const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
const debugLog = (message, ...optionalParams) => {
  if (DEBUG_MODE) {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    console.debug(`[${timestamp} ActivityPage] ${message}`, ...optionalParams);
  }
};

// ========================================================================
// COMPONENTES DE UI MENORES
// ========================================================================
const FullPageLoader = ({ progress, estimatedTimeRemaining }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-primary-bg text-primary-text font-sans">
    <h2 className="text-2xl mb-4">Carregando Aventura...</h2>
    <div className="w-3/4 max-w-lg bg-border-color rounded-full h-4 overflow-hidden border-2 border-gray-600">
      <div className="bg-yellow-400 h-full rounded-full transition-all duration-300 ease-linear" style={{ width: `${progress}%` }} />
    </div>
    <p className="mt-4 text-xl font-bold">{progress}%</p>
    {estimatedTimeRemaining && <p className="mt-2 text-secondary-text">{estimatedTimeRemaining}</p>}
  </div>
);

const ErrorDisplay = ({ error }) => (
  <div className="text-center p-10 text-red-500">
    <p className="font-bold">Ocorreu um erro:</p>
    <p>{error}</p>
  </div>
);

const ToggleSidebarButton = () => {
  const { isSidebarOpen, toggleSidebar } = useActivity();
  return (
    <button onClick={toggleSidebar} className="absolute top-4 left-4 z-20 p-2 bg-primary-bg rounded-full text-primary-text hover:bg-yellow-500 transition-all" aria-label={isSidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}>
      {isSidebarOpen ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" /></svg>}
    </button>
  );
};

const ActivityHeader = () => {
  const { activity } = useActivity();
  return (
    <>
      <h1 className="text-5xl font-extrabold mb-2">{activity.title}</h1>
      <p className="mb-8 text-lg text-secondary-text">{activity.description}</p>
    </>
  );
};



// ========================================================================
// CORREÇÃO PRINCIPAL APLICADA AQUI
// ========================================================================
const ViewRenderer = () => {
  // 1. Desestruturamos TODOS os dados e funções necessários do contexto.
  const {
    currentView,
    activity,
    user,
    userProgress,
    activeStepContent,
    leaderboard,
    storeItems,
    loading,
    completeStep,
    handleReturnToBoard,
    handlePurchaseSuccess,
    handleCollectFinalReward,
    handleCustomizationChange,
    fetchAllData,
    handleSpin,
    handlePlaySlot
  } = useActivity();

  const isStepCompleted = userProgress?.completed_steps?.includes(activeStepContent?.step_id);

  // 2. Passamos os dados e funções desestruturados como PROPS para cada componente.
  switch (currentView) {
    case 'quiz':
      return <QuizTab
        content={activeStepContent}
        onComplete={completeStep}
        isReplay={isStepCompleted}
        gameElements={activity?.gameElements?.selectedElements || []}
        onAnswerCorrect={() => { }} // Adicionando uma função vazia para evitar erros
      />;
    case 'narrative':
      return <NarrativeTab
        content={activeStepContent}
        onComplete={completeStep}
      />;
    case 'content':
      return <LearningMaterialViewer
        content={activeStepContent}
        onComplete={completeStep}
      />;
    case 'ranking':
      return <LeaderboardTab
        leaderboardData={leaderboard}
        isLoading={loading}
        onReturn={handleReturnToBoard}
      />;
    case 'mission':
      return <MissionTab
        activity={activity}
        onComplete={() => completeStep('mission_step_01')}
        onReturn={handleReturnToBoard}
      />;
    case 'store':
      return <StoreTab
        items={storeItems}
        userPoints={userProgress?.coins || 0}
        onPurchaseSuccess={handlePurchaseSuccess}
        onAddItem={fetchAllData}
        onDeleteItem={fetchAllData}
        onReturn={handleReturnToBoard}
        userRole={user.role}
      />;
    case 'final_reward':
      return <FinalRewardTab
        reward={activity?.gamificationDesign?.finalReward}
        activityId={activity.id}
        onCollect={handleCollectFinalReward}
        onReturnToBoard={handleReturnToBoard}
      />;
    case 'forum':
      return <ForumTab onReturn={handleReturnToBoard} />;
    case 'avatar_customization':
      return <AvatarCustomizationTab
        activityId={activity.id}
        onReturn={handleReturnToBoard}
        onCustomizationChange={handleCustomizationChange}
      />;
    case 'roulette':
      return <RouletteTab
        onReturn={handleReturnToBoard}
        onSpin={handleSpin} // <-- CORRETO
      />;
    case 'chat':
      return <ChatTab onReturn={handleReturnToBoard} />;
    case 'slot_machine':
      return <SlotMachineTab
        userCoins={userProgress?.coins || 0}
        onReturn={handleReturnToBoard}
        onPlay={handlePlaySlot} // <-- CORRETO
      />;
    case 'badges':
      return <AchievementsTab
        activityId={activity.id}
        onReturn={handleReturnToBoard}
      />;
    default:
      return null;
  }
};


// ========================================================================
// COMPONENTE CONTAINER PRINCIPAL (Sem grandes alterações)
// ========================================================================
const ActivityPageContent = () => {
  const { activity, user, showStatsModal, userProgress, handleCloseStats, loading, error } = useActivity();

  debugLog('ActivityPageContent renderizado. Valor do contexto (useActivity):', { activity, user, showStatsModal, userProgress, loading, error });

  if (!activity && !loading && !error) {
    debugLog('ActivityPageContent: Atividade não encontrada (após loading e sem erro explícito).');
    return <div className="text-center p-10 text-primary-text">Atividade não encontrada.</div>;
  }

  if (!activity) {
    debugLog('ActivityPageContent: Aguardando objeto de atividade...');
    return null;
  }

  return (
    // MUDANÇA 1: 'h-screen' em vez de 'min-h-screen' e 'overflow-hidden'
    // Isso impede que a página inteira role, permitindo que apenas os painéis internos rolem.
    <div className="flex h-screen w-full bg-primary-bg text-primary-text relative overflow-hidden">

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full relative p-0 overflow-hidden">

        {/* HEADER (Opcional): 
           Se você quiser mostrar o título, descomente abaixo. 
           Atualmente removi para dar foco total ao tabuleiro estilo "Imersivo".
        */}
        {/* <div className="absolute top-0 left-0 w-full z-20 p-6 pointer-events-none bg-gradient-to-b from-primary-bg/80 to-transparent">
            <ActivityHeader />
        </div> 
        */}

        {/* CONTAINER DO TABULEIRO (CORRIGIDO)
           1. Removemos 'bg-secondary-bg', 'rounded', 'border' -> Adeus borda branca!
           2. Adicionamos 'overflow-y-auto' -> Permite rolar o mapa verticalmente.
           3. Adicionamos 'h-full w-full' -> Ocupa tudo.
        */}
        <div className="flex-grow relative w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
          {activity?.gamificationDesign && (
            <GameBoardViewer>
              <ViewRenderer />
            </GameBoardViewer>
          )}
        </div>
      </main>

      {showStatsModal && userProgress && <StatsModal stats={userProgress.stats} onClose={handleCloseStats} />}
    </div>
  );
};

// ========================================================================
// COMPONENTE EXPORTADO (ENTRY POINT) (Sem alterações)
// ========================================================================
/**
 * Componente ActivityPage
 * 
 * Página de visualização detalhada de uma atividade e seus metadados, frequentemente usada como hub antes de iniciar.
 */
function ActivityPage() {
  const { activityId } = useParams();
  debugLog(`Componente ActivityPage montado para activityId: ${activityId}`);
  const activityLogic = useActivityLogic(activityId);
  debugLog('Resultado do useActivityLogic:', activityLogic);

  const { loading, error, assetsProgress, estimatedTimeRemaining } = activityLogic;
  debugLog('Estado de carregamento recebido do hook:', { loading, error });

  if (loading === true) {
    debugLog('Renderizando FullPageLoader...', { progress: assetsProgress });
    return (
      <FullPageLoader
        progress={assetsProgress}
        estimatedTimeRemaining={estimatedTimeRemaining}
      />
    );
  }

  if (error) {
    debugLog('Renderizando ErrorDisplay...', { error });
    return <ErrorDisplay error={error} />;
  }

  debugLog('Renderizando ActivityProvider e ActivityPageContent...');
  return (
    <ActivityProvider value={activityLogic}>
      <ActivityPageContent />
    </ActivityProvider>
  );
}
export default ActivityPage;