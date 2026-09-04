// frontend/src/App.jsx

// --- 1. IMPORTAÇÕES ---
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import useAnalytics from './hooks/useAnalytics';
import PrivateRoute from './components/PrivateRoute';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import Header from './components/Header';
import ThemeToggleButton from './components/ThemeToggleButton'; // <-- IMPORTAR O BOTÃO
// --- IMPORTAÇÃO DAS PÁGINAS ---
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage'
import UserProfilePage from './pages/UserProfilePage';
import AboutUsPage from './pages/AboutUsPage';
import NotFoundPage from './pages/NotFoundPage';
import GameBoardTestPage from './pages/GameBoardTestPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import ActivityCreationPage from './pages/ActivityCreationPage';
import ActivityBankPage from './pages/ActivityBankPage';
import ClassManagementPage from './pages/ClassManagementPage';
import StudentPerformancePage from './pages/StudentPerformancePage';
import CreateClassPage from './pages/CreateClassPage';
import ClassEditPage from './pages/ClassEditPage';
import AssignActivityToClass from './pages/AssignActivityToClass';
import ActivityEditPage from './pages/ActivityEditPage';
import QuizEditorPage from './pages/QuizEditorPage';
import NarrativeEditorPage from './pages/NarrativeEditorPage';
import TeacherRankingPage from './pages/TeacherRankingPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentActivityPage from './pages/StudentActivityPage';
import JoinClassPage from './pages/JoinClassPage';
import ActivityPage from './pages/ActivityPage';
import ClassDetailsPage from './pages/ClassDetailsPage';
import AdminPage from './pages/AdminPage';
import DashboardOverviewPage from './pages/admin/DashboardOverviewPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import ActivityManagementPage from './pages/admin/ActivityManagementPage';
import SystemAnalyticsPage from './pages/admin/SystemAnalyticsPage';
import LogExplorerPage from './pages/admin/LogExplorerPage';
import LocationMapPage from './pages/admin/LocationMapPage';
import LearningContentEditorPage from './pages/LearningContentEditorPage';
import ContactPage from './pages/ContactPage';
import ContactMessagesPage from './pages/admin/ContactMessagesPage';
import { TutorialProvider } from './context/TutorialContext';
import { useTutorial } from './context/TutorialContext';
import { STUDENT_DASHBOARD_STEPS } from './data/tutorialSteps';
import { ACTIVITY_SELECTION_STEPS } from './data/tutorialSteps';
import ServerWakeupNotice from './components/ServerWakeupNotice';
import useKonamiCode from './hooks/useKonamiCode';

// --- 2. COMPONENTES AUXILIARES ---
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
const debugLog = (message, ...optionalParams) => {
  if (DEBUG_MODE) {
    console.debug(`[App] ${message}`, ...optionalParams);
  }
};
// (O componente GeolocationPrompt permanece o mesmo)
/**
 * @component GeolocationPrompt
 * @desc Componente modal para solicitar permissão de geolocalização ao usuário.
 * @param {Object} props - Propriedades do componente.
 * @param {Function} props.onAccept - Função callback chamada quando o usuário aceita a solicitação.
 * @returns {JSX.Element} Modal de aviso de localização.
 */
const GeolocationPrompt = ({ onAccept }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[999] p-4">
    <div className="bg-primary-bg p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-yellow-500/50">
      <h3 className="text-2xl font-bold text-yellow-400 mb-4">Aviso de Localização</h3>
      <p className="text-secondary-text mb-6">
        Para aprimorar sua experiência e a segurança da plataforma, nosso portal solicita acesso à sua localização. Seus dados são confidenciais e usados apenas para fins de registro.
      </p>
      <p className="text-sm text-secondary-text mb-6">
        Por favor, clique em "Permitir" na solicitação que aparecerá em seguida.
      </p>
      <button
        onClick={onAccept}
        className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-primary-text font-semibold rounded-lg shadow-md transition-colors"
      >
        Entendi, Continuar
      </button>
    </div>
  </div>
);



// Validação de PropTypes para GeolocationPrompt
GeolocationPrompt.propTypes = {
  onAccept: PropTypes.func.isRequired,
};

/**
 * @component AppContent
 * @desc Componente principal que gerencia o estado da aplicação, rotas e lógica de navegação/autenticação.
 * @returns {JSX.Element} Estrutura principal da UI (Header, Main, Footer).
 */
function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { logEvent } = useAnalytics('session', user?.token);
  const { startTour } = useTutorial();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isTeacherMenuOpen, setIsTeacherMenuOpen] = useState(false);
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const locationRequestedRef = useRef(false);
  const checkRunRef = useRef(false);
  const hasRegisteredHitRef = useRef(false); // NOVO: Ref para controle de hit global
  const [loadingAuth, setLoadingAuth] = useState(true); // Começa true até a verificação inicial

  // Easter Egg: Konami Code
  const isMatrixMode = useKonamiCode('exevo gran mas vis');
  
  useEffect(() => {
    if (isMatrixMode) {
      document.body.classList.add('matrix-mode');
    } else {
      document.body.classList.remove('matrix-mode');
    }
  }, [isMatrixMode]);

  debugLog('AppContent: Renderizando...', { user, isAuthenticated, loadingAuth });

  // --- LÓGICA DE HIT GLOBAL DA PLATAFORMA ---
  useEffect(() => {
    if (!hasRegisteredHitRef.current) {
      hasRegisteredHitRef.current = true;
      fetch(`${import.meta.env.VITE_API_URL}/api/public/hit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => console.warn('[App] Erro ao registrar hit global:', err));
    }
  }, []);

  // --- LÓGICA DE LAYOUT IMERSIVO SIMPLIFICADA ---
  // Verifica APENAS se é uma página de atividade jogável (/activities/ID)
  const isActivityPage = /^\/activities\/\d+/.test(location.pathname);

  const closeAllMenus = () => {
    setIsProfileMenuOpen(false);
    setIsTeacherMenuOpen(false);
    setIsStudentMenuOpen(false);
  };

  // --- LÓGICA INTELIGENTE DE GEOLOCALIZAÇÃO ---

  const checkAndRequestLocation = useCallback(async () => {
    if (!("geolocation" in navigator)) return;

    try {
      // 1. Verifica o status atual da permissão no navegador
      // Nota: Alguns navegadores antigos podem não suportar 'permissions.query', então usamos try/catch
      let permissionState = 'prompt'; // Default

      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        permissionState = result.state; // 'granted', 'denied', ou 'prompt'
      }

      // CENÁRIO A: Já permitido ('granted')
      // Não mostra modal nenhum, apenas coleta os dados silenciosamente para os logs.
      if (permissionState === 'granted') {
        debugLog('[Geo] Permissão já concedida. Coletando silenciosamente.');
        navigator.geolocation.getCurrentPosition(
          (position) => logEvent("location_auto_logged", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }),
          (error) => console.warn("[Geo] Erro ao coletar mesmo com permissão:", error)
        );
        return;
      }

      // CENÁRIO B: Negado ('denied')
      // O usuário bloqueou no navegador. Não adianta mostrar modal.
      if (permissionState === 'denied') {
        debugLog('[Geo] Permissão negada pelo navegador. Ignorando.');
        return;
      }

      // CENÁRIO C: Perguntar ('prompt')
      // Aqui aplicamos a regra de "Não incomodar sempre"
      if (permissionState === 'prompt') {
        const lastPromptDate = localStorage.getItem('geo_last_prompt_date');
        const now = new Date().getTime();
        const COOLDOWN_DAYS = 3; // Só pergunta a cada 3 dias se ele não aceitar
        const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

        if (lastPromptDate && (now - parseInt(lastPromptDate) < COOLDOWN_MS)) {
          debugLog('[Geo] Em período de silêncio (Cooldown). Não mostrar modal.');
          return;
        }

        // Se passou do tempo ou nunca viu, mostra o modal
        debugLog('[Geo] Mostrando modal de solicitação.');
        setShowLocationPrompt(true);

        // Atualiza a data da última exibição imediatamente para não mostrar de novo no próximo F5
        localStorage.setItem('geo_last_prompt_date', now.toString());
      }

    } catch (error) {
      console.error("[Geo] Erro ao verificar permissões:", error);
      // Fallback: Se a API de permissões falhar, não mostramos nada para evitar bugs
    }
  }, [logEvent]);

  // Função chamada quando o usuário clica em "Entendi, Continuar" no Modal
  const handleUserAcceptedPrompt = useCallback(() => {
    setShowLocationPrompt(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        logEvent("location_access_granted", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        // Se ele aceitou, o navegador muda para 'granted' automaticamente para as próximas vezes
      },
      (error) => {
        logEvent("location_access_denied_by_user", { code: error.code, message: error.message });
      }
    );
  }, [logEvent]);

  // UseEffect que dispara a verificação ao logar
  useEffect(() => {
    if (user && !checkRunRef.current) {
      checkRunRef.current = true;
      // Pequeno delay para não competir com renderização inicial
      setTimeout(() => {
        checkAndRequestLocation();
      }, 2000);
    }

    if (!isAuthenticated) {
      checkRunRef.current = false;
      setShowLocationPrompt(false);
    }
  }, [user, isAuthenticated, checkAndRequestLocation]);

  // Handler inteligente para Professores
  const handleTeacherTour = (type) => {
    debugLog(`[AppContent] handleTeacherTour: Iniciando tour do tipo '${type}'.`);
    closeAllMenus();

    if (type === 'dashboard') {
      // Opção 1: Jornada Completa (Dashboard -> Criação)
      // Ativamos a flag na sessão para que, ao mudar de página, o tutorial continue
      sessionStorage.setItem('TUTORIAL_MODE', 'true');
      navigate('/professor/dashboard', { state: { forceTour: true } });

    } else if (type === 'creation') {
      // Opção 2: Apenas Criação (Direto ao ponto)
      // Removemos a flag da sessão para não causar efeitos colaterais
      sessionStorage.removeItem('TUTORIAL_MODE');
      // Forçamos apenas via state (que morre após esta navegação)
      navigate('/professor/criar-atividade', { state: { forceTour: true } });
    }
  };

  const handleStudentTour = () => {
    debugLog('[AppContent] handleStudentTour: Iniciando tour do aluno.');
    closeAllMenus();
    navigate('/aluno/dashboard', { state: { forceTour: true } });
  };

  const handleLogout = () => {
    debugLog('AppContent: Chamando logout.');
    // LOG: Registrando saída do usuário
    sessionStorage.removeItem('TUTORIAL_MODE');
    logout();
    closeAllMenus();
    navigate('/');
  };

  const handleRequestLocation = useCallback(() => {
    setShowLocationPrompt(false);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => logEvent("location_access_granted", { latitude: position.coords.latitude, longitude: position.coords.longitude }),
        (error) => logEvent("location_access_denied", { code: error.code, message: error.message })
      );
    } else {
      logEvent("geolocation_not_supported", {});
    }
  }, [logEvent]);

  useEffect(() => {
    // Só roda se tiver usuário e ainda não tiver rodado nesta sessão
    if (user && !locationRequestedRef.current) {
      debugLog('AppContent (useEffect [user]): Usuário autenticado. Iniciando verificação de geolocalização.');

      locationRequestedRef.current = true;

      // Pequeno delay para não competir com renderização inicial
      setTimeout(() => {
        debugLog('AppContent: Chamando checkAndRequestLocation()...');

        // --- AQUI ESTÁ A MUDANÇA ---
        // Antes estava: setShowLocationPrompt(true);
        // Agora chamamos a função que verifica se já tem permissão antes de mostrar
        checkAndRequestLocation();

      }, 2000);
    }

    if (!isAuthenticated) {
      debugLog('AppContent: Usuário deslogou. Resetando flags.');
      checkRunRef.current = false; // Resetar refs
      locationRequestedRef.current = false;
      setShowLocationPrompt(false);
    }
  }, [user, isAuthenticated, checkAndRequestLocation]);

  const handleRestartTour = () => {
    debugLog('[AppContent] handleRestartTour: Reiniciando tour.');
    closeAllMenus();

    if (user?.role === 'aluno') {
      startTour(STUDENT_DASHBOARD_STEPS, 'student_dashboard_v1', true);
      navigate('/aluno/dashboard');
    } else if (user?.role === 'professor') {
      // 1. ATIVAR MODO TUTORIAL NA SESSÃO
      // Isso garante que a flag sobreviva à navegação do Dashboard para a Criação
      sessionStorage.setItem('TUTORIAL_MODE', 'true');

      // 2. Navegar para o INÍCIO da jornada (Dashboard)
      // Usamos forceTour no state para o Dashboard pegar imediatamente
      navigate('/professor/dashboard', { state: { forceTour: true } });
    }
  };

  return (
    // TODO: Considerar extrair o Header para um componente separado para melhorar a legibilidade.
    // Usa a variável de cor do CSS para o fundo
    <div className={`w-full bg-primary-bg flex flex-col transition-colors duration-300 h-full ${isActivityPage ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'
      }`}>
      <ScrollToTop />
      {/* Adiciona o botão de toggle do tema aqui */}
      <ThemeToggleButton />
      {showLocationPrompt && <GeolocationPrompt onAccept={handleUserAcceptedPrompt} />}
      {/* O cabeçalho já tem cores que funcionam bem em ambos os temas */}
      <Header 
        handleTeacherTour={handleTeacherTour} 
        handleStudentTour={handleStudentTour} 
        isActivityPage={isActivityPage} 
      />

      {/* Usa as variáveis de cor para o container principal e o texto */}
      <main className={`flex-grow mx-auto transition-all duration-300 
        ${isActivityPage
          ? 'w-full p-0 bg-transparent flex flex-col overflow-hidden' // MODO ATIVIDADE
          : 'w-full max-w-full bg-secondary-bg text-primary-text p-6 sm:p-8 rounded-xl shadow-xl border-2 border-accent-teal/30 mb-8' // MODO PADRÃO
        }
      `}>
        <Routes>
          {/* As rotas permanecem as mesmas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/sobre-nos" element={<AboutUsPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/contact" element={<ContactPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="/perfil" element={<UserProfilePage />} />
            <Route path="/activities/:activityId" element={<ActivityPage />} />
            <Route path="/classes/:class_id" element={<ClassDetailsPage />} />
            <Route path="/teste-tabuleiro" element={<GameBoardTestPage />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['professor']} />}>
            <Route path="/professor/dashboard" element={<TeacherDashboardPage />} />
            {/* 1. Crie uma rota "pai" que simplesmente fornece o contexto para as rotas filhas */}
            <Route element={<ActivityCreationProvider><Outlet /></ActivityCreationProvider>}>
              <Route path="/professor/criar-atividade" element={<ActivityCreationPage />} />
              <Route path="/professor/criar-atividade/:activityId" element={<ActivityCreationPage />} />
              <Route path="/professor/atividades/:activityId/edit" element={<ActivityEditPage />} />
              <Route path="/professor/criar-atividade/criar/:type/:stepId/edit" element={<QuizEditorPage />} /> {/* Exemplo, ajuste se necessário */}
              <Route path="/professor/atividades/:activityId/quiz/:stepId/edit" element={<QuizEditorPage />} />
              <Route path="/professor/atividades/:activityId/narrative/:stepId/edit" element={<NarrativeEditorPage />} />
              <Route path="/professor/atividades/:activityId/learning-material/:stepId/edit" element={<LearningContentEditorPage />} />
            </Route>

            <Route path="/professor/banco-atividades" element={<ActivityBankPage />} />
            <Route path="/professor/gerenciar-turmas" element={<ClassManagementPage />} />
            <Route path="/professor/ranking" element={<TeacherRankingPage />} />
            <Route path="/professor/turmas/nova" element={<CreateClassPage />} />
            <Route path="/classes/:class_id/edit" element={<ClassEditPage />} />
            <Route path="/assign-activity-to-class/:activityId" element={<AssignActivityToClass />} />

            <Route path="/professor/desempenho-alunos" element={<StudentPerformancePage />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['aluno']} />}>
            <Route path="/aluno/dashboard" element={<StudentDashboardPage />} />
            <Route path="/aluno/entrar-turma" element={<JoinClassPage />} />
            <Route path="/aluno/minhas-atividades" element={<StudentActivityPage />} />
            <Route path="/aluno/desempenho" element={<StudentPerformancePage />} />
          </Route>

          <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route element={<AdminPage />}>
              <Route index element={<DashboardOverviewPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="activities" element={<ActivityManagementPage />} />
              <Route path="analytics" element={<SystemAnalyticsPage />} />
              <Route path="logs" element={<LogExplorerPage />} />
              <Route path="mapa-localizacao" element={<LocationMapPage />} />
              <Route path="messages" element={<ContactMessagesPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isActivityPage && <Footer />}
    </div>
  );
}

/**
 * @component App
 * @desc Componente raiz que envolve a aplicação com os provedores de contexto (Auth, Tutorial).
 * @returns {JSX.Element} A aplicação completa.
 */
function App() {
  return (
    // O AuthProvider já está aqui, o que é ótimo.
    // O ThemeProvider será adicionado em `main.jsx` para envolver tudo.
    <AuthProvider>
      <ServerWakeupNotice />
      <TutorialProvider>
        <AppContent />
      </TutorialProvider>
    </AuthProvider>
  );
}

export default App;
