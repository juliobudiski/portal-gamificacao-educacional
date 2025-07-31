// ==== [HEADER] ====  
// Arquivo: ActivityPage.jsx  
// Última revisão: 2024-06-12  
// Debug: DEBUG_MODE=true para logs detalhados  
// ==================  

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
import { FaQuestionCircle, FaTrophy, FaComments, FaStore, FaArrowLeft, FaBookOpen, FaBullseye } from 'react-icons/fa';
import { cardsConfig } from '../components/activity/gameElementsConfig';
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

  // Busca todos os dados necessários ao carregar a página
  useEffect(() => {
    debugLog('Iniciando carregamento da atividade', { activityId });
    
    // Validação de parâmetros críticos
    if (!activityId || !/^\d+$/.test(activityId)) {
      const errorMsg = 'ID de atividade inválido';
      setError(errorMsg);
      setLoading(false);
      debugLog(errorMsg, activityId);
      return;
    }

    if (!user) {
      const errorMsg = 'Usuário não autenticado';
      setError(errorMsg);
      setLoading(false);
      debugLog(errorMsg);
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      setError('');
      debugLog('Iniciando fetchAllData');
      
      try {
        // Busca dados da atividade
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

        // Busca dados adicionais baseados nos elementos do jogo
        const elements = activityData.gameElements?.selectedElements || [];
        const dataPromises = [];
        debugLog('Elementos de jogo detectados:', elements);

        if (user.role === 'aluno') {
          dataPromises.push(fetchData(`/api/progress/${activityId}`, setUserProgress));
          
          if (elements.includes("Sistema de classificação e ranking")) {
            debugLog('Carregando leaderboard...');
            dataPromises.push(fetchData(`/api/progress/${activityId}/leaderboard`, setLeaderboard));
          }
          
          if (elements.includes("Economia (sistema monetário)")) {
            debugLog('Carregando itens da loja...');
            dataPromises.push(fetchData(`/api/progress/${activityId}/store-items`, setStoreItems));
          }
        } 
        else if (user.role === 'professor') {
          debugLog('Carregando analytics...');
          dataPromises.push(fetchData(`/api/progress/${activityId}/analytics`, setAnalytics));
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
    };

    fetchAllData();
  }, [activityId, user, fetchData, debugLog]);

  /**
   * @desc Atualiza os pontos do usuário localmente e na API
   * @param {number} points - Pontos a serem adicionados
   * @throws {Error} Quando falha a atualização do servidor
   */
  const handlePointsEarned = useCallback(async (points) => {
    debugLog('handlePointsEarned chamado com pontos:', points);
    const numericPoints = parseInt(points, 10) || 0;

    if (isNaN(numericPoints)) {
      debugLog('Pontos inválidos, abortando atualização');
      return;
    }

    // Atualização otimista do estado local
    setUserProgress(prev => {
      const currentProgress = prev || { points_earned: 0, xp: 0 };
      const newProgress = {
        ...currentProgress,
        points_earned: currentProgress.points_earned + numericPoints,
        xp: (currentProgress.xp || 0) + numericPoints
      };
      debugLog('Novo progresso local:', newProgress);
      return newProgress;
    });

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      await fetch(`${API_BASE}/api/progress/${activityId}/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify({ points: numericPoints })
      });
      debugLog('Pontos atualizados no servidor com sucesso');
    } catch (err) {
      const errorMsg = "Falha ao salvar progresso: " + err.message;
      debugLog(errorMsg, err);
      
      // Reverte a atualização otimista
      setUserProgress(prev => {
        const revertedProgress = prev 
          ? { 
              ...prev, 
              points_earned: prev.points_earned - numericPoints,
              xp: prev.xp - numericPoints
            } 
          : null;
        debugLog('Revertendo progresso:', revertedProgress);
        return revertedProgress;
      });
      
      setError(errorMsg);
    }
  }, [activityId, user.token, debugLog]);

  /**
   * @desc Manipula compras na loja (esqueleto para implementação futura)
   * @param {object} item - Item a ser comprado
   */
  const handlePurchase = useCallback(async (item) => {
    debugLog('handlePurchase chamado para item:', item);
    alert(`Compra de ${item.name} a ser implementada!`);
  }, [debugLog]);

  // ---------- [COMPONENTE INTERNO: DASHBOARD] ----------
  /**
   * @desc Componente de dashboard para seleção de elementos de atividade
   * @param {object} props - Propriedades do componente
   * @param {object} props.activity - Dados da atividade
   * @param {function} props.onSelectView - Callback para seleção de view
   * @param {string} props.userRole - Perfil do usuário (aluno/professor)
   */
  const ActivityDashboard = ({ activity, onSelectView, userRole }) => {
    debugLog('Renderizando ActivityDashboard');
    const elements = activity.gameElements?.selectedElements || [];
    
    // --- 2. A LÓGICA DE FILTRO AGORA É MUITO MAIS LIMPA E ROBUSTA ---
    const availableCards = cardsConfig.filter(card => card.isEnabled(elements, userRole));
    
    debugLog('Cards disponíveis:', availableCards);

    if (availableCards.length === 0) {
      return (
        <div className="text-center text-gray-400 p-8">
          Esta atividade não possui elementos interativos para seu perfil.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {availableCards.map(card => (
          <button
            key={card.key}
            onClick={() => onSelectView(card.key)}
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
  /**
   * @desc Seleciona o conteúdo principal baseado na view atual
   * @returns {JSX.Element} Componente da view ativa
   */
  const renderContent = () => {
    debugLog(`Renderizando view: ${currentView}`);
    if (!activity) return null;

    // O Dashboard é a tela padrão
    if (currentView === 'dashboard') {
      return (
        <ActivityDashboard 
          activity={activity} 
          onSelectView={setCurrentView} 
          userRole={user.role} 
        />
      );
    }
    
    // As outras telas são carregadas sob demanda
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
        {currentView === 'store' && <StoreTab items={storeItems} userPoints={userProgress?.points_earned || 0} onPurchase={handlePurchase} />}
        {currentView === 'achievements' && <AchievementsTab />}
        {currentView === 'roulette' && <RouletteTab />}
      </div>
    );
  };


  // ---------- [STATES DE CARREGAMENTO] ----------
  if (loading) {
    return <div className="text-center p-10 text-white">Carregando dados da atividade...</div>;
  }
  
  if (error) {
    debugLog('Erro detectado na renderização:', error);
    return (
      <div className="text-center p-10 text-red-500">
        Erro: {error}
        <button 
          className="mt-4 px-4 py-2 bg-red-700 rounded hover:bg-red-600"
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
            onShowStats={() => {
              debugLog('Abrindo modal de estatísticas');
              setShowStatsModal(true);
            }} 
          />
        )}
        
        {user.role === 'professor' && analytics && (
          <ProfessorSidebar
            analytics={analytics}
            onStudentClick={(student) => {
              debugLog('Clique em estudante:', student);
              console.log('Clicked student:', student);
            }}
            onOpenQuizEditor={() => {
              debugLog('Navegando para editor de quiz');
              navigate(`/professor/activity/${activityId}/quiz/edit`);
            }}
            onOpenNarrativeEditor={() => {
              debugLog('Navegando para editor de narrativa');
              navigate(`/professor/activity/${activityId}/narrative/edit`);
            }}
          />
        )}
      </aside>

      {/* Conteúdo Principal */}
      <main className="w-3/4 p-8">
        <h1 className="text-5xl font-extrabold mb-2">{activity.title}</h1>
        <p className="mb-8 text-lg text-gray-400">{activity.description}</p>
        
        {renderContent()}
      </main>

      {/* Modal de Estatísticas */}
      {showStatsModal && userProgress && (
        <StatsModal 
          stats={userProgress.stats || {}} 
          onClose={() => {
            debugLog('Fechando modal de estatísticas');
            setShowStatsModal(false);
          }} 
        />
      )}
    </div>
  );
}

export default ActivityPage;

// ==== [TESTES UNITÁRIOS SUGERIDOS] ====  
/* 
describe('ActivityPage', () => {
  test('deve validar activityId corretamente', () => {
    expect(isValidActivityId('123')).toBe(true);
    expect(isValidActivityId('abc')).toBe(false);
  });

  test('handlePointsEarned deve atualizar estado corretamente', () => {
    const initialProgress = { points_earned: 100, xp: 100 };
    const newProgress = addPoints(initialProgress, 50);
    expect(newProgress.points_earned).toBe(150);
    expect(newProgress.xp).toBe(150);
  });

  test('deve filtrar cards corretamente', () => {
    const elements = ['Narrativas envolventes', 'Quebra-cabeça'];
    const cards = filterCards(cardsConfig, 'aluno', elements);
    expect(cards.length).toBe(2);
    expect(cards.some(c => c.key === 'narrative')).toBe(true);
  });
});
*/

// ==== [RECOMENDAÇÕES] ====  
// TODO: Separar lógica de API em serviço dedicado (apiService.js)
// TODO: Implementar OpenTelemetry para observabilidade
// TODO: Adicionar TypeScript para tipagem estática
// TODO: Implementar sistema de retry para chamadas de API
// TODO: Adicionar tratamento offline com cache local