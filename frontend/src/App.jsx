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
    // Container principal da aplicação com fundo padrão para modo claro e escuro.
    <div className="min-h-screen w-full bg-gray-100 dark:bg-dark-background p-4">
      {/* Cabeçalho da aplicação, fixo no topo. */}
      <header className="w-full max-w-6xl bg-gray-800 dark:bg-dark-background text-white p-4 rounded-lg shadow-xl mb-8 mx-auto border-4 border-accent-yellow">
        <nav className="flex flex-col sm:flex-row justify-between items-center">
          {/* Logo do Portal com link para a página inicial. */}
          <Link to="/" className="flex items-center space-x-2 mb-4 sm:mb-0" onClick={closeAllMenus}>
            <img src="/images/logotipo.png" alt="Logo GamificaEdu" className="h-20" />
          </Link>

          {/* Menu de Navegação Principal */}
          <ul className="flex flex-wrap justify-center sm:justify-end items-center space-x-4">
            {/* Links públicos, visíveis para todos os usuários. */}
            <li>
              <Link to="/" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-700 text-accent-yellow hover:text-[#FFEA00]" onClick={closeAllMenus}>
                <Home size={18} />
                <span>Início</span>
              </Link>
            </li>
            <li>
              <Link to="/sobre-nos" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-700 text-accent-yellow hover:text-[#FFEA00]" onClick={closeAllMenus}>
                <Info size={18} />
                <span>Sobre Nós</span>
              </Link>
            </li>

            {/* Renderização Condicional: Links para usuários NÃO autenticados. */}
            {!isAuthenticated && (
              <>
                <li>
                  <Link to="/login" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-700 text-accent-yellow hover:text-[#FFEA00]" onClick={closeAllMenus}>
                    <LogIn size={18} />
                    <span>Login</span>
                  </Link>
                </li>
                <li>
                  <Link to="/cadastro" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-700 text-accent-yellow hover:text-[#FFEA00]" onClick={closeAllMenus}>
                    <UserPlus size={18} />
                    <span>Cadastro</span>
                  </Link>
                </li>
              </>
            )}

            {/* Renderização Condicional: Links e Menus para usuários AUTENTICADOS. */}
            {isAuthenticated && (
              <>
                {/* Dropdown de Perfil */}
                <li className="relative">
                  <button
                    onClick={() => {
                      console.log("Clicou no menu Perfil. Estado anterior:", isProfileMenuOpen);
                      setIsProfileMenuOpen(!isProfileMenuOpen);
                      setIsTeacherMenuOpen(false); // Fecha outros menus
                      setIsStudentMenuOpen(false); // Fecha outros menus
                    }}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-700 text-accent-yellow hover:text-[#FFEA00] focus:outline-none"
                  >
                    <User size={18} />
                    <span>Perfil</span>
                  </button>
                  {isProfileMenuOpen && (
                    <ul className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10">
                      <li><Link to="/perfil" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 rounded-t-md" onClick={closeAllMenus}><Settings size={16} className="inline-block mr-2" />Minhas Configurações</Link></li>
                      <li><button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-600 rounded-b-md"><LogOut size={16} className="inline-block mr-2" />Sair</button></li>
                    </ul>
                  )}
                </li>

                {/* Renderização Condicional: Menu para Professores. */}
                {user?.role === 'professor' && (
                  <li className="relative">
                    <button
                      onClick={() => {
                        console.log("Clicou no menu Professor. Estado anterior:", isTeacherMenuOpen);
                        setIsTeacherMenuOpen(!isTeacherMenuOpen);
                        setIsStudentMenuOpen(false); // Fecha outros menus
                        setIsProfileMenuOpen(false);  // Fecha outros menus
                      }}
                      className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-700 text-accent-yellow hover:text-[#FFEA00] focus:outline-none"
                    >
                      <BookOpen size={18} />
                      <span>Professor</span>
                    </button>
                    {isTeacherMenuOpen && (
                      <ul className="absolute right-0 mt-2 w-56 bg-gray-700 rounded-md shadow-lg z-10">
                        <li><Link to="/professor/dashboard" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 rounded-t-md" onClick={closeAllMenus}><LayoutDashboard size={16} className="inline-block mr-2" />Dashboard</Link></li>
                        <li><Link to="/professor/criar-atividade" className="block px-4 py-2 text-gray-300 hover:bg-gray-600" onClick={closeAllMenus}><PlusCircle size={16} className="inline-block mr-2" />Criar Atividade</Link></li>
                        <li><Link to="/professor/banco-atividades" className="block px-4 py-2 text-gray-300 hover:bg-gray-600" onClick={closeAllMenus}><BookOpen size={16} className="inline-block mr-2" />Banco de Atividades</Link></li>
                        <li><Link to="/professor/gerenciar-turmas" className="block px-4 py-2 text-gray-300 hover:bg-gray-600" onClick={closeAllMenus}><Users size={16} className="inline-block mr-2" />Gerenciar Turmas</Link></li>
                        <li><Link to="/professor/desempenho-alunos" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 rounded-b-md" onClick={closeAllMenus}><BarChart2 size={16} className="inline-block mr-2" />Desempenho Alunos</Link></li>
                      </ul>
                    )}
                  </li>
                )}

                {/* Renderização Condicional: Menu para Alunos. */}
                {user?.role === 'aluno' && (
                  <li className="relative">
                    <button
                      onClick={() => {
                        console.log("Clicou no menu Aluno. Estado anterior:", isStudentMenuOpen);
                        setIsStudentMenuOpen(!isStudentMenuOpen);
                        setIsTeacherMenuOpen(false); // Fecha outros menus
                        setIsProfileMenuOpen(false);  // Fecha outros menus
                      }}
                      className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-700 text-accent-yellow hover:text-[#FFEA00] focus:outline-none"
                    >
                      <User size={18} />
                      <span>Aluno</span>
                    </button>
                    {isStudentMenuOpen && (
                      <ul className="absolute right-0 mt-2 w-52 bg-gray-700 rounded-md shadow-lg z-10">
                        <li><Link to="/aluno/dashboard" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 rounded-t-md" onClick={closeAllMenus}><LayoutDashboard size={16} className="inline-block mr-2" />Dashboard</Link></li>
                        <li><Link to="/aluno/entrar-turma" className="block px-4 py-2 text-gray-300 hover:bg-gray-600" onClick={closeAllMenus}><Users size={16} className="inline-block mr-2" />Entrar em Turma</Link></li>
                        <li><Link to="/aluno/minhas-atividades" className="block px-4 py-2 text-gray-300 hover:bg-gray-600" onClick={closeAllMenus}><Award size={16} className="inline-block mr-2" />Minhas Atividades</Link></li>
                        <li><Link to="/aluno/desempenho" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 rounded-b-md" onClick={closeAllMenus}><BarChart2 size={16} className="inline-block mr-2" />Meu Desempenho</Link></li>
                      </ul>
                    )}
                  </li>
                )}

                {/* Renderização Condicional: Link para Dashboard de Admin. */}
                {user?.role === 'admin' && (
                  <li>
                    <Link to="/admin/dashboard" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-700 text-red-400 hover:text-red-300" onClick={closeAllMenus}>
                      <ShieldCheck size={18} />
                      <span>Admin Dashboard</span>
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
        </nav>
      </header>

      {/* Conteúdo principal da aplicação, onde as páginas são renderizadas pelo roteador. */}
      <main className="w-full max-w-6xl bg-white p-8 rounded-lg shadow-lg mx-auto dark:bg-gray-800 dark:text-gray-100">
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="/sobre-nos" element={<AboutUsPage />} />

          {/* Rotas Protegidas Genéricas (qualquer usuário logado) */}
          <Route element={<PrivateRoute />}>
            <Route path="/perfil" element={<UserProfilePage />} />
          </Route>

          {/* Rotas Protegidas para Professores */}
          <Route element={<PrivateRoute allowedRoles={['professor']} />}>
            <Route path="/professor/dashboard" element={<TeacherDashboardPage />} />
            <Route path="/professor/criar-atividade" element={<ActivityCreationPage />} />
            <Route path="/professor/banco-atividades" element={<ActivityBankPage />} />
            <Route path="/professor/gerenciar-turmas" element={<ClassManagementPage />} />
            <Route path="/professor/desempenho-alunos" element={<StudentPerformancePage />} />
          </Route>

          {/* Rotas Protegidas para Alunos */}
          <Route element={<PrivateRoute allowedRoles={['aluno']} />}>
            <Route path="/aluno/dashboard" element={<StudentDashboardPage />} />
            <Route path="/aluno/entrar-turma" element={<JoinClassPage />} />
            <Route path="/aluno/minhas-atividades" element={<StudentActivityPage />} />
            <Route path="/aluno/desempenho" element={<StudentPerformancePage />} />
            <Route path="/aluno/atividade/:id" element={<StudentActivityPage />} />
          </Route>

          {/* Rota Protegida para Administradores */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminPage />} />
          </Route>

          {/* Rota "Catch-all" para páginas não encontradas (404) */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
