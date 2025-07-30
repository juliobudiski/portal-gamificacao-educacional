// frontend/src/App.jsx
import React, { useContext, useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext'; // Importa o contexto de autenticação
import PrivateRoute from './components/PrivateRoute'; // Importa o componente de rota protegida

// Importação de todos os componentes de página da aplicação
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UserProfilePage from './pages/UserProfilePage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import ActivityCreationPage from './pages/ActivityCreationPage';
import ActivityBankPage from './pages/ActivityBankPage';
import ClassManagementPage from './pages/ClassManagementPage';
import StudentPerformancePage from './pages/StudentPerformancePage';
import StudentActivityPage from './pages/StudentActivityPage';
import JoinClassPage from './pages/JoinClassPage';
import NotFoundPage from './pages/NotFoundPage';
import AboutUsPage from './pages/AboutUsPage';
import AdminPage from './pages/AdminPage';
import QuizEditorPage from './pages/QuizEditorPage'; 
import NarrativeEditorPage from './pages/NarrativeEditorPage'; 
// Importar as novas páginas e componentes
import CreateClassPage from './pages/CreateClassPage'; 
import ClassListPage from './pages/ClassManagementPage';
import ClassDetailsPage from './pages/ClassDetailsPage';
import ClassEditPage from './pages/ClassEditPage';
import AssignActivityToClass from './pages/AssignActivityToClass';
import ActivityPage from './pages/ActivityPage';
import ActivityEditPage from './pages/ActivityEditPage';
// Importação dos ícones da biblioteca Lucide React para a UI
import { Home, LogIn, UserPlus, Key, User, BookOpen, LayoutDashboard, PlusCircle, Users, BarChart2, Award, LogOut, Info, Settings, ShieldCheck } from 'lucide-react';

/**
 * Componente App
 * Este é o componente raiz da aplicação. Ele é responsável por:
 * - Definir a estrutura principal do layout (cabeçalho e área de conteúdo).
 * - Gerenciar o sistema de rotas da aplicação usando React Router.
 * - Renderizar a barra de navegação com links que mudam com base no estado de autenticação do usuário.
 * - Controlar a visibilidade dos menus dropdown na navegação.
 */
function App() {
  // --- Hooks de Contexto e Navegação ---
  // Extrai o estado de autenticação (user, isAuthenticated) e a função de logout do AuthContext.
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  // Hook do React Router para navegar programaticamente.
  const navigate = useNavigate();

  // --- Hooks de Estado para UI ---
  // Controlam a visibilidade (aberto/fechado) dos menus dropdown na barra de navegação.
  const [isTeacherMenuOpen, setIsTeacherMenuOpen] = useState(false);
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Loga o estado de autenticação sempre que o componente renderiza ou o estado de `isAuthenticated` muda.
  useEffect(() => {
    console.log("App.jsx: Estado de autenticação atualizado.", { isAuthenticated, user });
  }, [isAuthenticated, user]);

  // --- Funções de Manipulação de Eventos ---

  /**
   * closeAllMenus: Função utilitária para fechar todos os menus dropdown.
   * É chamada ao clicar em um link de navegação para garantir que os menus não fiquem abertos.
   */
  const closeAllMenus = () => {
    console.log("closeAllMenus: Fechando todos os menus dropdown.");
    setIsTeacherMenuOpen(false);
    setIsStudentMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  /**
   * handleLogout: Lida com o processo de logout do usuário.
   * Chama a função `logout` do contexto, fecha todos os menus e redireciona para a página inicial.
   */
  const handleLogout = () => {
    console.log("handleLogout: Iniciando processo de logout.");
    logout();
    closeAllMenus();
    navigate('/');
    console.log("handleLogout: Logout concluído. Redirecionado para a página inicial.");
  };

  // --- Renderização do Componente ---
  console.log("App.jsx: Renderizando componente principal.");

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-[#2c3135] p-4 pt-4">
      {/* Cabeçalho aprimorado visualmente */}
      <header className="w-full max-w-6xl mx-auto bg-[#343a40] text-white p-4 rounded-xl shadow-2xl border-t-4 border-[#ffbd30] z-50">
        <nav className="flex flex-col sm:flex-row justify-between items-center">
          {/* Logo com efeito sutil */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 mb-4 sm:mb-0 group transition-transform duration-300"
            onClick={closeAllMenus}
          >
            <img 
              src="/images/logotipo.png" 
              alt="Logo GamificaEdu" 
              className="h-20 transition-transform duration-300 group-hover:scale-105" 
            />
          </Link>

          {/* Menu de Navegação com melhorias visuais */}
          <ul className="flex flex-wrap justify-center sm:justify-end items-center gap-2 sm:gap-3">
            {/* Links públicos com feedback visual */}
            <li>
              <Link 
                to="/" 
                className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-[#2c3135] text-[#ffbd30] transition-colors duration-200"
                onClick={closeAllMenus}
              >
                <Home size={20} />
                <span>Início</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/sobre-nos" 
                className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-[#2c3135] text-[#69e8cb] transition-colors duration-200"
                onClick={closeAllMenus}
              >
                <Info size={20} />
                <span>Sobre Nós</span>
              </Link>
            </li>

            {/* Usuários não autenticados */}
            {!isAuthenticated && (
              <>
                <li>
                  <Link 
                    to="/login" 
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-[#2c3135] text-[#69e8cb] transition-colors duration-200"
                    onClick={closeAllMenus}
                  >
                    <LogIn size={20} />
                    <span>Login</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/cadastro" 
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-[#2c3135] text-[#b39ddb] hover:text-[#d1c4e9] transition-colors duration-200"
                    onClick={closeAllMenus}
                  >
                    <UserPlus size={20} />
                    <span>Cadastro</span>
                  </Link>
                </li>
              </>
            )}

            {/* Usuários autenticados */}
            {isAuthenticated && (
              <>
                {/* Dropdown de Perfil com melhorias visuais */}
                <li className="relative">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(!isProfileMenuOpen);
                      setIsTeacherMenuOpen(false);
                      setIsStudentMenuOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                      isProfileMenuOpen 
                        ? 'bg-[#ffbd30]/20 text-[#ffbd30]' 
                        : 'hover:bg-[#2c3135] text-[#ffbd30]'
                    }`}
                  >
                    <User size={20} />
                    <span>Perfil</span>
                  </button>
                  {isProfileMenuOpen && (
                    <ul 
                      className="absolute right-0 mt-2 w-52 bg-[#2c3135] rounded-xl shadow-2xl z-10 border border-[#3e4a52] animate-fadeIn"
                      onMouseLeave={() => setIsProfileMenuOpen(false)}
                    >
                      <li>
                        <Link 
                          to="/perfil" 
                          className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#343a40] transition-colors rounded-t-xl"
                          onClick={closeAllMenus}
                        >
                          <Settings size={18} className="mr-2 text-[#69e8cb]" />
                          Minhas Configurações
                        </Link>
                      </li>
                      <li>
                        <button 
                          onClick={handleLogout} 
                          className="w-full flex items-center px-4 py-3 text-left hover:bg-[#343a40] transition-colors rounded-b-xl text-[#ff6b6b]"
                        >
                          <LogOut size={18} className="mr-2" />
                          Sair
                        </button>
                      </li>
                    </ul>
                  )}
                </li>

                {/* Menu Professor com aparência aprimorada */}
                {user?.role === 'professor' && (
                  <li className="relative">
                    <button
                      onClick={() => {
                        setIsTeacherMenuOpen(!isTeacherMenuOpen);
                        setIsStudentMenuOpen(false);
                        setIsProfileMenuOpen(false);
                      }}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                        isTeacherMenuOpen 
                          ? 'bg-[#69e8cb]/20 text-[#69e8cb]' 
                          : 'hover:bg-[#2c3135] text-[#69e8cb]'
                      }`}
                    >
                      <BookOpen size={20} />
                      <span>Professor</span>
                    </button>
                    {isTeacherMenuOpen && (
                      <ul 
                        className="absolute right-0 mt-2 w-56 bg-[#2c3135] rounded-xl shadow-2xl z-10 border border-[#3e4a52] animate-fadeIn"
                        onMouseLeave={() => setIsTeacherMenuOpen(false)}
                      >
                        <li>
                          <Link 
                            to="/professor/dashboard" 
                            className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#343a40] transition-colors rounded-t-xl"
                            onClick={closeAllMenus}
                          >
                            <LayoutDashboard size={18} className="mr-2 text-[#ffbd30]" />
                            Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/professor/criar-atividade" 
                            className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#343a40] transition-colors"
                            onClick={closeAllMenus}
                          >
                            <PlusCircle size={18} className="mr-2 text-[#69e8cb]" />
                            Criar Atividade
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/professor/banco-atividades" 
                            className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#343a40] transition-colors"
                            onClick={closeAllMenus}
                          >
                            <BookOpen size={18} className="mr-2 text-[#9570d9]" />
                            Banco de Atividades
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/professor/gerenciar-turmas" 
                            className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#343a40] transition-colors"
                            onClick={closeAllMenus}
                          >
                            <Users size={18} className="mr-2 text-[#ffbd30]" />
                            Gerenciar Turmas
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/professor/desempenho-alunos" 
                            className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#343a40] transition-colors rounded-b-xl"
                            onClick={closeAllMenus}
                          >
                            <BarChart2 size={18} className="mr-2 text-[#69e8cb]" />
                            Desempenho Alunos
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                )}

                {/* Menu Aluno com aparência consistente */}
                {user?.role === 'aluno' && (
                  <li className="relative">
                    <button
                      onClick={() => {
                        setIsStudentMenuOpen(!isStudentMenuOpen);
                        setIsTeacherMenuOpen(false);
                        setIsProfileMenuOpen(false);
                      }}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                        isStudentMenuOpen 
                          ? 'bg-[#9570d9]/20 text-[#9570d9]' 
                          : 'hover:bg-[#2c3135] text-[#9570d9]'
                      }`}
                    >
                      <User size={20} />
                      <span>Aluno</span>
                    </button>
                    {isStudentMenuOpen && (
                      <ul 
                        className="absolute right-0 mt-2 w-52 bg-[#2c3135] rounded-xl shadow-2xl z-10 border border-[#3e4a52] animate-fadeIn"
                        onMouseLeave={() => setIsStudentMenuOpen(false)}
                      >
                        <li>
                          <Link 
                            to="/aluno/dashboard" 
                            className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#343a40] transition-colors rounded-t-xl"
                            onClick={closeAllMenus}
                          >
                            <LayoutDashboard size={18} className="mr-2 text-[#ffbd30]" />
                            Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/aluno/entrar-turma" 
                            className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#343a40] transition-colors"
                            onClick={closeAllMenus}
                          >
                            <Users size={18} className="mr-2 text-[#69e8cb]" />
                            Entrar em Turma
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/aluno/minhas-atividades" 
                            className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#343a40] transition-colors"
                            onClick={closeAllMenus}
                          >
                            <Award size={18} className="mr-2 text-[#9570d9]" />
                            Minhas Atividades
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/aluno/desempenho" 
                            className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#343a40] transition-colors rounded-b-xl"
                            onClick={closeAllMenus}
                          >
                            <BarChart2 size={18} className="mr-2 text-[#ffbd30]" />
                            Meu Desempenho
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                )}

                {/* Admin com destaque visual */}
                {user?.role === 'admin' && (
                  <li>
                    <Link 
                      to="/admin/dashboard" 
                      className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-[#2c3135] text-[#ff416c] transition-colors duration-200"
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

      {/* Conteúdo principal mantendo estrutura */}
      <main className="mt-5 w-full max-w-6xl mx-auto bg-white dark:bg-[#343a40] p-6 sm:p-8 rounded-xl shadow-xl mx-auto dark:text-gray-100 border-2 border-[#69e8cb]/30">
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="/sobre-nos" element={<AboutUsPage />} />

          {/* Rotas Protegidas */}
          <Route element={<PrivateRoute />}>
            <Route path="/perfil" element={<UserProfilePage />} />
            <Route path="/classes/:class_id" element={<ClassDetailsPage />} />
            <Route path="/activities/:activityId" element={<ActivityPage />} />
          </Route>

          {/* Rotas Professor */}
          <Route element={<PrivateRoute allowedRoles={['professor']} />}>
            <Route path="/professor/dashboard" element={<TeacherDashboardPage />} />
            <Route path="/professor/criar-atividade" element={<ActivityCreationPage />} />
            <Route path="/professor/banco-atividades" element={<ActivityBankPage />} />
            <Route path="/professor/gerenciar-turmas" element={<ClassManagementPage />} />
            <Route path="/professor/desempenho-alunos" element={<StudentPerformancePage />} />
            <Route path="/teacher/classes/new" element={<CreateClassPage />} />
            <Route path="/teacher/classes" element={<ClassListPage />} />
            <Route path="/classes/:class_id/edit" element={<ClassEditPage />} /> 
            <Route path="/assign-activity-to-class/:activityId" element={<AssignActivityToClass />} />
            <Route path="/professor/atividades/:activityId/edit" element={<ActivityEditPage />} />
            <Route path="/professor/activity/:activityId/quiz/edit" element={<QuizEditorPage />} />
            <Route path="/professor/activity/:activityId/narrative/edit" element={<NarrativeEditorPage />} />
          </Route>

          {/* Rotas Aluno */}
          <Route element={<PrivateRoute allowedRoles={['aluno']} />}>
            <Route path="/aluno/dashboard" element={<StudentDashboardPage />} />
            <Route path="/aluno/entrar-turma" element={<JoinClassPage />} />
            <Route path="/aluno/desempenho" element={<StudentPerformancePage />} />
            <Route path="/student/join-class" element={<JoinClassPage />} />
            <Route path="/aluno/minhas-atividades" element={<StudentActivityPage />} />
            
          </Route>

          {/* Rota Admin */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminPage />} />
          </Route>

          {/* Rota 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;