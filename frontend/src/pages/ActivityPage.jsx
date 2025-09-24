// ==== [HEADER] ====  
// Arquivo: ActivityPage.jsx  
// Última revisão: 23-09-25
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
// IMPORTA AS CONFIGURAÇÕES DO NOVO ARQUIVO
import { elementConfig, decorationConfig, decorationSpawnPoints, boardStructuralImages } from '../components/activity/GameBoardConfig';
import ActivityViewOverlay from '../components/activity/ActivityViewOverlay';
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans">
        <h2 className="text-2xl mb-4">Carregando Aventura...</h2>
        <div className="w-3/4 max-w-lg bg-gray-700 rounded-full h-4 overflow-hidden border-2 border-gray-600">
            <div 
                className="bg-yellow-400 h-full rounded-full transition-all duration-300 ease-linear"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
        <p className="mt-4 text-xl font-bold">{progress}%</p>
        {etr && <p className="mt-2 text-gray-400">{etr}</p>}
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

  const handleHubIconClick = useCallback((view) => {
      setCurrentView(view); // Atualiza o estado para a visão clicada (ex: 'store', 'ranking')
  }, []);


  

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
      
      urls.add('../../assets/quiz-background.png'); // Adiciona a imagem de fundo do quiz
      
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
  
  const renderedDecorations = useMemo(() => {
      // 1. SETUP INICIAL (Sua lógica original, que está perfeita)
      if (!activity?.gamificationDesign?.progression_path) return [];
      
      const stepCoordinates = generateStepCoordinates(activity.gamificationDesign.progression_path.length);
      const occupiedPositions = new Set(stepCoordinates.map(c => `${c.x}-${c.y}`));
      
      // 2. FILTRAR E EMBARALHAR OS PONTOS
      // Filtra os pontos de spawn para pegar apenas os que estão livres
      const availablePoints = decorationSpawnPoints.filter(p => !occupiedPositions.has(`${p.x}-${p.y}`));
      // Embaralha os pontos disponíveis para que as decorações apareçam em locais variados a cada recarga
      const shuffledPoints = shuffleArray([...availablePoints]);

      // 3. DEFINIR UM LIMITE
      // Defina aqui o número máximo de decorações que você quer no mapa. Sinta-se à vontade para ajustar este valor!
      const MAX_DECORATIONS = 20; 
      const limit = Math.min(MAX_DECORATIONS, shuffledPoints.length);

      // 4. CRIAR A LISTA FINAL DE DECORAÇÕES
      const decorationsToRender = [];
      for(let i = 0; i < limit; i++) {
          const point = shuffledPoints[i];
          
          // Sorteia uma decoração aleatória da sua configuração
          const randomIndex = Math.floor(Math.random() * decorationConfig.length);
          const randomDecoration = decorationConfig[randomIndex];
          
          decorationsToRender.push({
            ...randomDecoration,
            style: { left: point.x, top: point.y },
            // A CORREÇÃO DEFINITIVA: Sobrescrevemos o 'id' em vez de criar uma nova prop 'key'
            id: `${randomDecoration.id}-instance-${i}` 
        });
      }
      
      return decorationsToRender;

  }, [activity, generateStepCoordinates]);

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
          `${import.meta.env.VITE_API_URL}/api/activities/${activityId}`, 
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
        if (step.content) {
            // --- CORREÇÃO APLICADA AQUI ---
            // Nós combinamos o conteúdo do passo com o seu ID
            setActiveStepContent({ 
                ...step.content, 
                step_id: step.id // Adiciona explicitamente o step_id
            });
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
  const getCurrentViewDetails = () => {
    if (currentView === 'board' || !elementConfig.hub[currentView]) {
      return { title: '', backgroundImage: '' };
    }
    const config = elementConfig.hub[currentView];
    return {
      title: config.name,
      backgroundImage: config.icon
    };
  };

  const viewDetails = getCurrentViewDetails();

  // Função que decide qual componente "Tab" renderizar dentro do overlay
  const renderOverlayContent = () => {
    switch (currentView) {
      case 'ranking':
        return <LeaderboardTab leaderboardData={leaderboard} />;
      case 'mission':
        return <MissionTab activity={activity} onGoBack={() => setCurrentView('board')} />;
      case 'store':
        return <StoreTab userRole={user.role} items={storeItems} userPoints={userProgress?.points_earned || 0} onPurchase={handlePurchase} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} />;
      case 'roulette':
        return <RouletteTab onPrizeWon={handlePointsEarned} />;
      case 'slot_machine':
        return <SlotMachineTab onPrizeWon={handlePointsEarned} onWin={fetchSlotWinners} winners={slotWinners} loadingWinners={loadingSlotWinners} userCoins={userProgress?.coins || 0} />;
      case 'badges':
        return <AchievementsTab />;
      case 'chat':
        return <ChatTab />;
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
            onShowStats={handleShowStats}
          />
        )}
        
        {user.role === 'professor' && analytics && (
          <ProfessorSidebar
            analytics={analytics}
            onStudentClick={handleStudentClick} // Agora usa a função que sempre existe
            onOpenQuizEditor={handleOpenQuizEditor}
            onOpenNarrativeEditor={handleOpenNarrativeEditor}
          />
        )}
      </aside>

      <main className="w-3/4 p-8">
        <h1 className="text-5xl font-extrabold mb-2">{activity.title}</h1>
        <p className="mb-8 text-lg text-gray-400">{activity.description}</p>
        
        {/* O Tabuleiro é renderizado incondicionalmente */}
        {activity.gamificationDesign && (user.role === 'professor' || (user.role === 'aluno' && userProgress)) && (
          <GameBoardViewer
            gamificationDesign={activity.gamificationDesign}
            studentProgress={userProgress}
            onStepClick={handleStepClick}
            onHubIconClick={handleHubIconClick}
            userRole={user.role}
            renderedDecorations={renderedDecorations}
            generateStepCoordinates={generateStepCoordinates}
          />
        )}

        {/* --- O OVERLAY MÁGICO --- */}
        <ActivityViewOverlay
          isOpen={currentView !== 'board' && currentView !== 'quiz' && currentView !== 'narrative'}
          onClose={() => setCurrentView('board')}
          title={viewDetails.title}
          backgroundImage={viewDetails.backgroundImage}
        >
          {renderOverlayContent()}
        </ActivityViewOverlay>

        {/* Lógica para Quiz e Narrativa pode continuar separada se preferir, ou ser movida para o overlay */}
        {currentView === 'quiz' && activeStepContent && (
          <QuizTab content={activeStepContent} onAnswerCorrect={handlePointsEarned} onComplete={handleStepCompletion} />
        )}
        {currentView === 'narrative' && activeStepContent && (
          <NarrativeTab content={activeStepContent} onComplete={handleStepCompletion} />
        )}
      </main>
    </div>
  );
}

export default ActivityPage;