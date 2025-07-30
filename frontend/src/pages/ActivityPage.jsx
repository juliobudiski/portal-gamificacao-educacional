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

// Ícones para os cards do dashboard
import { FaPlay, FaQuestionCircle, FaTrophy, FaComments, FaStore, FaArrowLeft, FaBookOpen } from 'react-icons/fa';

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

  // Função para buscar dados da API
  const fetchData = useCallback(async (url, setter) => {
    if (!user?.token) {
      setError('Usuário não autenticado.');
      return;
    }
    
    try {
      const response = await fetch(`http://127.0.0.1:5000${url}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Erro ao buscar dados de ${url}`);
      setter(data);
      
    } catch (err) {
      console.error(`Falha ao buscar de ${url}:`, err);
      setError(prev => `${prev}\n${err.message}`);
    }
  }, [user?.token]);

  // Busca todos os dados necessários ao carregar a página
  useEffect(() => {
    if (!activityId || !user) return;

    const fetchAllData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Busca dados da atividade
        const response = await fetch(
          `http://127.0.0.1:5000/api/activities/${activityId}`, 
          { headers: { 'Authorization': `Bearer ${user.token}` } }
        );
        
        const activityData = await response.json();
        if (!response.ok) throw new Error(activityData.message || "Não foi possível carregar a atividade.");
        setActivity(activityData);

        // Busca dados adicionais baseados nos elementos do jogo
        const elements = activityData.gameElements?.selectedElements || [];
        const dataPromises = [];

        if (user.role === 'aluno') {
          dataPromises.push(fetchData(`/api/progress/${activityId}`, setUserProgress));
          
          if (elements.includes("Sistema de classificação e ranking")) {
            dataPromises.push(fetchData(`/api/progress/${activityId}/leaderboard`, setLeaderboard));
          }
          
          if (elements.includes("Economia (sistema monetário)")) {
            dataPromises.push(fetchData(`/api/progress/${activityId}/store-items`, setStoreItems));
          }
        } 
        else if (user.role === 'professor') {
          dataPromises.push(fetchData(`/api/progress/${activityId}/analytics`, setAnalytics));
        }

        await Promise.all(dataPromises);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [activityId, user, fetchData]);

  // Atualiza os pontos do usuário
  const handlePointsEarned = useCallback(async (points) => {
    const numericPoints = parseInt(points, 10) || 0;

    setUserProgress(prev => {
      const currentProgress = prev || { points_earned: 0, xp: 0 };
      return {
        ...currentProgress,
        points_earned: currentProgress.points_earned + numericPoints,
        xp: (currentProgress.xp || 0) + numericPoints
      };
    });

    try {
      await fetch(`http://127.0.0.1:5000/api/progress/${activityId}/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify({ points: numericPoints })
      });
    } catch (err) {
      setError("Não foi possível salvar seu progresso.");
    }
  }, [activityId, user.token]);

  // Manipula compras na loja
  const handlePurchase = useCallback(async (item) => {
    alert(`Compra de ${item.name} a ser implementada!`);
  }, []);

  // --- COMPONENTE INTERNO: DASHBOARD DA ATIVIDADE ---
  const ActivityDashboard = ({ activity, onSelectView, userRole }) => {
    const elements = activity.gameElements?.selectedElements || [];
    
    // Verifica quais elementos estão ativos
    const hasNarrative = elements.includes("Narrativas envolventes");
    const hasQuiz = elements.includes("Quebra-cabeça");
    const hasLeaderboard = userRole === 'aluno' && elements.includes("Sistema de classificação e ranking");
    const hasChat = elements.includes("Chat ou sistema de mensagens");
    const hasStore = userRole === 'aluno' && elements.includes("Economia (sistema monetário)");

    // Configuração dos cards do dashboard
    const cards = [
      {
        key: 'narrative',
        condition: hasNarrative,
        icon: <FaBookOpen className="text-3xl text-yellow-400" />,
        title: "Narrativa",
        description: "Comece a jornada e entenda a história desta atividade.",
        color: "yellow"
      },
      {
        key: 'quiz',
        condition: hasQuiz,
        icon: <FaQuestionCircle className="text-3xl text-blue-400" />,
        title: "Desafio de Conhecimento",
        description: "Teste suas habilidades e ganhe pontos neste quiz.",
        color: "blue"
      },
      {
        key: 'leaderboard',
        condition: hasLeaderboard,
        icon: <FaTrophy className="text-3xl text-purple-400" />,
        title: "Ver Ranking",
        description: "Veja sua posição em comparação com outros participantes.",
        color: "purple"
      },
      {
        key: 'chat',
        condition: hasChat,
        icon: <FaComments className="text-3xl text-green-400" />,
        title: "Chat da Atividade",
        description: "Converse e colabore com outros participantes.",
        color: "green"
      },
      {
        key: 'store',
        condition: hasStore,
        icon: <FaStore className="text-3xl text-pink-400" />,
        title: "Loja de Recompensas",
        description: "Use seus pontos para adquirir vantagens e itens.",
        color: "pink"
      }
    ];

    const availableCards = cards.filter(card => card.condition);

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

  // Renderiza o conteúdo principal baseado na view atual
  const renderContent = () => {
    if (!activity) return null;

    // Exibe o dashboard por padrão
    if (currentView === 'dashboard') {
      return (
        <ActivityDashboard 
          activity={activity} 
          onSelectView={setCurrentView} 
          userRole={user.role} 
        />
      );
    }
    
    // Renderiza componentes específicos com botão de retorno
    return (
      <div>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-2 mb-6 text-sm text-gray-400 hover:text-yellow-400 transition-colors"
        >
          <FaArrowLeft />
          Voltar ao Dashboard da Atividade
        </button>
        
        {currentView === 'narrative' && (
          <NarrativeTab
            narrativeConfig={activity.gameElements?.narrativeConfig}
            onStart={() => setCurrentView('quiz')}
          />
        )}
        
        {currentView === 'quiz' && (
          <QuizTab 
            questions={activity.gameElements?.questions || []}
            onAnswerCorrect={handlePointsEarned} 
          />
        )}
        
        {currentView === 'leaderboard' && (
          <LeaderboardTab leaderboardData={leaderboard} />
        )}
        
        {currentView === 'chat' && (
          <ChatTab />
        )}
        
        {currentView === 'store' && (
          <StoreTab 
            items={storeItems} 
            userPoints={userProgress?.points_earned || 0} 
          />
        )}
      </div>
    );
  };

  // Estados de carregamento e erro
  if (loading) {
    return <div className="text-center p-10 text-white">Carregando dados da atividade...</div>;
  }
  
  if (error) {
    return <div className="text-center p-10 text-red-500">Erro: {error}</div>;
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