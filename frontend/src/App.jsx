// frontend/src/App.jsx

// --- 1. IMPORTAÇÕES ---
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import useAnalytics from './hooks/useAnalytics';
import PrivateRoute from './components/PrivateRoute';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import ThemeToggleButton from './components/ThemeToggleButton'; // <-- IMPORTAR O BOTÃO
import { Home, LogIn, UserPlus, User, BookOpen, LayoutDashboard, PlusCircle, Users, BarChart2, Award, LogOut, Info, Settings, ShieldCheck } from 'lucide-react';
import { ActivityCreationProvider } from './context/ActivityCreationContext'; // 👈 1. Importe o Provider
// --- IMPORTAÇÃO DAS PÁGINAS ---
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
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
// --- 2. COMPONENTES AUXILIARES ---
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
const debugLog = (message, ...optionalParams) => {
  if (DEBUG_MODE) {
    console.debug(`[App] ${message}`, ...optionalParams);
  }
};
// (O componente GeolocationPrompt permanece o mesmo)
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


function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { logEvent } = useAnalytics('session', user?.token);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isTeacherMenuOpen, setIsTeacherMenuOpen] = useState(false);
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const locationRequestedRef = useRef(false);
  const [loadingAuth, setLoadingAuth] = useState(true); // Começa true até a verificação inicial
  debugLog('AppContent: Renderizando...', { user, isAuthenticated, loadingAuth });
  const closeAllMenus = () => {
    setIsProfileMenuOpen(false);
    setIsTeacherMenuOpen(false);
    setIsStudentMenuOpen(false);
  };

  const handleLogout = () => {
    debugLog('AppContent: Chamando logout.');
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
    if (user && !locationRequestedRef.current) {
      debugLog('AppContent (useEffect [user]): Usuário autenticado. Agendando prompt de localização.');
      locationRequestedRef.current = true;
      setTimeout(() => {
        debugLog('AppContent (useEffect [user] - setTimeout): Mostrando prompt de localização.');
        setShowLocationPrompt(true);
      }, 2000);
    }
    if (!isAuthenticated) {
      debugLog('AppContent (useEffect [user]): Usuário não autenticado. Resetando flag do prompt de localização.');
      locationRequestedRef.current = false;
    }
  }, [user, isAuthenticated]);

  return (
    // Usa a variável de cor do CSS para o fundo
    <div className="min-h-screen w-full bg-primary-bg p-4 pt-4 flex flex-col">
      <ScrollToTop />
      {/* Adiciona o botão de toggle do tema aqui */}
      <ThemeToggleButton />

      {/* O cabeçalho já tem cores que funcionam bem em ambos os temas */}
      <header className="w-full max-w-6xl mx-auto bg-header-bg text-primary-text p-4 rounded-xl shadow-2xl border-t-4 border-accent-yellow z-50">
        <nav className="flex flex-col sm:flex-row justify-between items-center">
          <Link
            to="/"
            className="flex items-center space-x-2 mb-4 sm:mb-0 group transition-transform duration-300"
            onClick={closeAllMenus}
          >
            {/* Logo para o MODO CLARO (o novo, com texto preto) */}
            <img
              src="/images/logotipo-dark.webp"
              alt="Logo GamificaEdu"
              className="h-20 transition-transform duration-300 group-hover:scale-105 dark:hidden"
            />

            {/* Logo para o MODO ESCURO (o original, com texto branco) */}
            <img
              src="/images/logotipo-light.webp"
              alt="Logo GamificaEdu"
              className="h-20 transition-transform duration-300 group-hover:scale-105 hidden dark:block"
            />
          </Link>

          <ul className="flex flex-wrap justify-center sm:justify-end items-center gap-2 sm:gap-3">
            {/* Links e Menus (o HTML permanece o mesmo, o Tailwind cuidará das cores) */}
            <li>
              <Link
                to="/"
                className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-primary-bg text-[#ffbd30] transition-colors duration-200"
                onClick={closeAllMenus}
              >
                <Home size={20} />
                <span>Início</span>
              </Link>
            </li>
            <li>
              <Link
                to="/sobre-nos"
                className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-primary-bg text-[#69e8cb] transition-colors duration-200"
                onClick={closeAllMenus}
              >
                <Info size={20} />
                <span>Sobre Nós</span>
              </Link>
            </li>

            {!isAuthenticated && (
              <>
                <li>
                  <Link
                    to="/login"
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-primary-bg text-[#69e8cb] transition-colors duration-200"
                    onClick={closeAllMenus}
                  >
                    <LogIn size={20} />
                    <span>Login</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cadastro"
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-primary-bg text-[#b39ddb] hover:text-[#d1c4e9] transition-colors duration-200"
                    onClick={closeAllMenus}
                  >
                    <UserPlus size={20} />
                    <span>Cadastro</span>
                  </Link>
                </li>
              </>
            )}

            {isAuthenticated && (
              <>
                <li className="relative">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(!isProfileMenuOpen);
                      setIsTeacherMenuOpen(false);
                      setIsStudentMenuOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${isProfileMenuOpen
                      ? 'bg-[#ffbd30]/20 text-[#ffbd30]'
                      : 'hover:bg-primary-bg text-[#ffbd30]'
                      }`}
                  >
                    <User size={20} />
                    <span>Perfil</span>
                  </button>
                  {isProfileMenuOpen && (
                    <ul
                      className="absolute right-0 mt-2 w-52 bg-primary-bg rounded-xl shadow-2xl z-10 border border-[#3e4a52] animate-fadeIn"
                      onMouseLeave={() => setIsProfileMenuOpen(false)}
                    >
                      <li>
                        <Link
                          to="/perfil"
                          className="flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg transition-colors rounded-t-xl"
                          onClick={closeAllMenus}
                        >
                          <Settings size={18} className="mr-2 text-accent-teal" />
                          Minhas Configurações
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-3 text-left hover:bg-secondary-bg transition-colors rounded-b-xl text-[#ff6b6b]"
                        >
                          <LogOut size={18} className="mr-2" />
                          Sair
                        </button>
                      </li>
                    </ul>
                  )}
                </li>

                {user?.role === 'professor' && (
                  <li className="relative">
                    <button
                      onClick={() => {
                        setIsTeacherMenuOpen(!isTeacherMenuOpen);
                        setIsStudentMenuOpen(false);
                        setIsProfileMenuOpen(false);
                      }}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${isTeacherMenuOpen
                        ? 'bg-accent-teal/20 text-accent-teal'
                        : 'hover:bg-primary-bg text-accent-teal'
                        }`}
                    >
                      <BookOpen size={20} />
                      <span>Professor</span>
                    </button>
                    {isTeacherMenuOpen && (
                      <ul
                        className="absolute right-0 mt-2 w-56 bg-primary-bg rounded-xl shadow-2xl z-10 border border-[#3e4a52] animate-fadeIn"
                        onMouseLeave={() => setIsTeacherMenuOpen(false)}
                      >
                        <li><Link to="/professor/dashboard" className="flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg transition-colors rounded-t-xl" onClick={closeAllMenus}><LayoutDashboard size={18} className="mr-2 text-accent-yellow" />Dashboard</Link></li>
                        <li><Link to="/professor/criar-atividade" className="flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg transition-colors" onClick={closeAllMenus}><PlusCircle size={18} className="mr-2 text-accent-teal" />Criar Atividade</Link></li>
                        <li><Link to="/professor/banco-atividades" className="flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg transition-colors" onClick={closeAllMenus}><BookOpen size={18} className="mr-2 text-accent-purple" />Banco de Atividades</Link></li>
                        <li><Link to="/professor/gerenciar-turmas" className="flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg transition-colors" onClick={closeAllMenus}><Users size={18} className="mr-2 text-accent-yellow" />Gerenciar Turmas</Link></li>
                        <li><Link to="/professor/desempenho-alunos" className="flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg transition-colors rounded-b-xl" onClick={closeAllMenus}><BarChart2 size={18} className="mr-2 text-accent-teal" />Desempenho Alunos</Link></li>
                      </ul>
                    )}
                  </li>
                )}

                {user?.role === 'aluno' && (
                  <li className="relative">
                    <button
                      onClick={() => {
                        setIsStudentMenuOpen(!isStudentMenuOpen);
                        setIsTeacherMenuOpen(false);
                        setIsProfileMenuOpen(false);
                      }}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${isStudentMenuOpen
                        ? 'bg-accent-purple/20 text-accent-purple'
                        : 'hover:bg-primary-bg text-accent-purple'
                        }`}
                    >
                      <User size={20} />
                      <span>Aluno</span>
                    </button>
                    {isStudentMenuOpen && (
                      <ul
                        className="absolute right-0 mt-2 w-52 bg-primary-bg rounded-xl shadow-2xl z-10 border border-[#3e4a52] animate-fadeIn"
                        onMouseLeave={() => setIsStudentMenuOpen(false)}
                      >
                        <li><Link to="/aluno/dashboard" className="flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg transition-colors rounded-t-xl" onClick={closeAllMenus}><LayoutDashboard size={18} className="mr-2 text-accent-yellow" />Dashboard</Link></li>
                        <li><Link to="/aluno/entrar-turma" className="flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg transition-colors" onClick={closeAllMenus}><Users size={18} className="mr-2 text-accent-teal" />Entrar em Turma</Link></li>
                        <li><Link to="/aluno/minhas-atividades" className="flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg transition-colors" onClick={closeAllMenus}><Award size={18} className="mr-2 text-accent-purple" />Minhas Atividades</Link></li>
                        <li><Link to="/aluno/desempenho" className="flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg transition-colors rounded-b-xl" onClick={closeAllMenus}><BarChart2 size={18} className="mr-2 text-accent-yellow" />Meu Desempenho</Link></li>
                      </ul>
                    )}
                  </li>
                )}

                {user?.role === 'admin' && (
                  <li>
                    <Link
                      to="/admin"
                      className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-primary-bg text-[#ff416c] transition-colors duration-200"
                      onClick={closeAllMenus}
                    >
                      <ShieldCheck size={20} />
                      <span>Admin Dashboard</span>
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
        </nav>
      </header>

      {/* Usa as variáveis de cor para o container principal e o texto */}
      <main className="flex-grow w-full max-w-6xl mx-auto bg-secondary-bg text-primary-text p-6 sm:p-8 rounded-xl shadow-xl border-2 border-accent-teal/30 mb-8">
        <Routes>
          {/* As rotas permanecem as mesmas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/sobre-nos" element={<AboutUsPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />

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
              <Route path="/professor/atividades/:activityId/edit" element={<ActivityEditPage />} />
              <Route path="/professor/criar-atividade/criar/:type/:stepId/edit" element={<QuizEditorPage />} /> {/* Exemplo, ajuste se necessário */}
              <Route path="/professor/atividades/:activityId/quiz/:stepId/edit" element={<QuizEditorPage />} />
              <Route path="/professor/atividades/:activityId/narrative/:stepId/edit" element={<NarrativeEditorPage />} />
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
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    // O AuthProvider já está aqui, o que é ótimo.
    // O ThemeProvider será adicionado em `main.jsx` para envolver tudo.
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
