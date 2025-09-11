// ==== [HEADER] ====  
// Arquivo: ActivityPage.jsx  
// Última revisão: 2024-08-18
// Debug: DEBUG_MODE=true para logs detalhados  
// ==================  

import React, { useState, useEffect, useContext, useCallback } from 'react';
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

// Configuração de debug - ativar no .env.local
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

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
  const [currentView, setCurrentView] = useState('dashboard');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [slotWinners, setSlotWinners] = useState([]);
  const [loadingSlotWinners, setLoadingSlotWinners] = useState(true);

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
      const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
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

  

  

  // Busca todos os dados necessários ao carregar a página
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

    const fetchAllData = async () => {
      setLoading(true);
      setError('');
      debugLog('Iniciando fetchAllData');
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/activities/${activityId}`, 
          { headers: { 'Authorization': `Bearer ${user.token}` } }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Status não-OK ao carregar atividade");
        }

        const activityData = await response.json();
        setActivity(activityData);
        debugLog('Atividade carregada:', activityData);

        const elements = activityData.gameElements?.selectedElements || [];
        const dataPromises = [];
        debugLog('Elementos de jogo detectados:', elements);

        // Lógica de busca de dados específica para cada perfil
        if (user.role === 'aluno') {
          dataPromises.push(fetchData(`/api/progress/${activityId}`, setUserProgress));
        } else if (user.role === 'professor') {
          dataPromises.push(fetchData(`/api/progress/${activityId}/analytics`, setAnalytics));
        }

        // Lógica de busca de dados compartilhada
        if (elements.includes("Sistema de classificação e ranking")) {
            debugLog('Carregando leaderboard...');
            dataPromises.push(fetchData(`/api/progress/${activityId}/leaderboard`, setLeaderboard));
        }
        if (elements.includes("Economia (sistema monetário)")) { 
            debugLog('Carregando itens da loja para aluno ou professor...');
            dataPromises.push(fetchData(`/api/progress/${activityId}/store-items`, setStoreItems));
        }
        if (elements.includes("Chance (sorte e probabilidade)")) {
          dataPromises.push(fetchSlotWinners());
        }

        // Aguarda todas as promessas

        await Promise.all(dataPromises);
        debugLog('Todos os dados complementares carregados');

      } catch (err) {
        const errorMsg = `Erro no fetchAllData: ${err.message}`;
        debugLog(errorMsg, err);
        setError(errorMsg);
      } finally {
        setLoading(false);
        debugLog('Finalizado fetchAllData, fetchSlotWinners');
      }
    };

    fetchAllData();
  }, [activityId, user, fetchData, debugLog, fetchSlotWinners]);

  // --- LÓGICA DE NÍVEL E XP (CLIENT-SIDE PARA FEEDBACK IMEDIATO) ---
  const xpForNextLevel = useCallback((level) => 100 + (level - 1) * 50, []);

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
      const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
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
          const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
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

          // 2. A MÁGICA: Busca os dados do ranking novamente
          // Isso garante que o componente receba a lista com os novos 'active_effects'.
          debugLog('Compra bem-sucedida, atualizando o ranking para exibir os novos efeitos...');
          await fetchData(`/api/progress/${activityId}/leaderboard`, setLeaderboard);

          alert(`"${item.name}" comprado com sucesso!`);
          debugLog('Ranking atualizado.');

      } catch (err) {
          debugLog("Erro na compra:", err);
          setError(`Erro na compra: ${err.message}`);
          setTimeout(() => setError(''), 5000);
      }
  }, [activityId, user?.token, debugLog, fetchData, setLeaderboard]); 

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
            const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
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

    // Função para deletar item (passada para o StoreTab)
    const handleDeleteItem = async (itemId) => {
        if (!window.confirm("Tem certeza que deseja remover este item da loja?")) return;
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
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
      return <div className="text-center text-gray-400 p-8">Esta atividade não possui elementos interativos.</div>;
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
              <h3 className="text-xl font-bold text-white">{card.title}</h3>
            </div>
            <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
              {card.description}
            </p>
          </button>
        ))}
      </div>
    );
  };

  // ---------- [RENDERIZAÇÃO DE CONTEÚDO] ----------
  const renderContent = () => {
    if (!activity) return null;

    if (currentView === 'dashboard') {
      return <ActivityDashboard activity={activity} onSelectView={handleSelectView} userRole={user.role} />;
    }
    
    return (
      <div>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-2 mb-6 text-sm text-gray-400 hover:text-yellow-400 transition-colors"
          aria-label="Voltar ao dashboard"
        >
          <FaArrowLeft />
          Voltar ao Dashboard da Atividade
        </button>
        
        {currentView === 'narrative' && <NarrativeTab narrativeConfig={activity.gameElements?.narrativeConfig} onStart={() => setCurrentView('quiz')} />}
        {currentView === 'quiz' && <QuizTab questions={activity.gameElements?.questions || []} onAnswerCorrect={handlePointsEarned} gameElements={activity.gameElements?.selectedElements || []} />}
        {currentView === 'leaderboard' && <LeaderboardTab leaderboardData={leaderboard} />}
        {currentView === 'mission' && <MissionTab activity={activity} />}
        {currentView === 'chat' && <ChatTab />}
        {currentView === 'store' && (
        <StoreTab 
            items={storeItems} 
            userPoints={userProgress?.points_earned || 0} 
            onPurchase={handlePurchase}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            activityId={activityId}
        />
    )}
        {currentView === 'achievements' && <AchievementsTab />}
        {currentView === 'roulette' && <RouletteTab onPrizeWon={handlePointsEarned} />}
        {currentView === 'slot' && (
          <SlotMachineTab 
            userCoins={userProgress?.coins || 0} 
            onPrizeWon={handlePointsEarned}
            // Passando os dados e a função para o filho
            winners={slotWinners}
            loadingWinners={loadingSlotWinners}
            onWin={fetchSlotWinners} // <--- A "ferramenta" para o filho atualizar a lista
          />
        )}
      </div>
    );
  };

  // ---------- [STATES DE CARREGAMENTO E ERRO] ----------
  if (loading) {
    return <div className="text-center p-10 text-white">Carregando dados da atividade...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center p-10 text-red-500">
        <p className="font-bold">Ocorreu um erro:</p>
        <p>{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-red-700 rounded hover:bg-red-600 text-white"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }
  
  if (!activity) {
    return <div className="text-center p-10 text-white">Atividade não encontrada.</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-1/4 bg-gray-800 p-4 border-r border-gray-700">
        {user.role === 'aluno' && userProgress && (
          <StudentSidebar 
            progress={userProgress} 
            onShowStats={() => setShowStatsModal(true)} 
          />
        )}
        
        {user.role === 'professor' && analytics && (
          <ProfessorSidebar
            analytics={analytics}
            onStudentClick={(student) => console.log('Clicked student:', student)}
            onOpenQuizEditor={() => navigate(`/professor/activity/${activityId}/quiz/edit`)}
            onOpenNarrativeEditor={() => navigate(`/professor/activity/${activityId}/narrative/edit`)}
          />
        )}
      </aside>

      {/* Conteúdo Principal */}
      <main className="w-3/4 p-8">
        <h1 className="text-5xl font-extrabold mb-2">{activity.title}</h1>
        <p className="mb-8 text-lg text-gray-400">{activity.description}</p>
        {/* Adicione o componente do tabuleiro aqui */}
        <GameBoardViewer />
        {renderContent()}
      </main>

      {/* Modal de Estatísticas */}
      {showStatsModal && userProgress && (
        <StatsModal 
          stats={userProgress.stats || {}} 
          onClose={() => setShowStatsModal(false)} 
        />
      )}
    </div>
  );
}

export default ActivityPage;
