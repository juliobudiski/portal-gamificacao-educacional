// frontend/src/pages/App.jsx
import React, { useContext, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext'; // Certifique-se de que o caminho está correto
import PrivateRoute from './components/PrivateRoute'; // Certifique-se de que o caminho está correto

// Importe os componentes das suas páginas
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

// Importe os ícones do Lucide React
import { Home, LogIn, UserPlus, Key, User, BookOpen, LayoutDashboard, PlusCircle, Users, BarChart2, Award, LogOut, Info, Settings, ShieldCheck } from 'lucide-react';

function App() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Estados para controlar a visibilidade dos dropdowns
  const [isTeacherMenuOpen, setIsTeacherMenuOpen] = useState(false);
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Função para fechar todos os menus
  const closeAllMenus = () => {
    setIsTeacherMenuOpen(false);
    setIsStudentMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  // Função para lidar com o logout
  const handleLogout = () => {
    logout();
    closeAllMenus();
    navigate('/'); // Redireciona para a página inicial após o logout
  };

  return (
    // O fundo padrão será 'bg-gray-100', mas no modo escuro será 'dark:bg-gray-900'
    <div className="min-h-screen w-full bg-dark-background p-4"> {/* Removido 'flex flex-col items-center justify-center' daqui */}
      {/* Cabeçalho da aplicação */}
      <header className="w-full max-w-6xl bg-gray-800 text-white p-4 rounded-lg shadow-xl mb-8 mx-auto dark:bg-dark-background ring-2 ring-offset-2 ring-accent-yellow ring-offset-dark-background">
        <nav className="flex flex-col sm:flex-row justify-between items-center">
          {/* Logo do Portal */}
          <Link to="/" className="flex items-center space-x-2 mb-4 sm:mb-0" onClick={closeAllMenus}>
            <img
              src="/images/logotipo.png"
              alt="Logo GamificaEdu" // Alterado para refletir o logo combinado
              className="h-20" // Ajuste a altura conforme necessário para que o texto fique visível
            />
          </Link>

          {/* Menu de Navegação Principal */}
          <ul className="flex flex-wrap justify-center sm:justify-end items-center space-x-4">
            <li>
              <Link to="/" className="flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 dark:hover:bg-gray-700 text-gray-300 hover:text-white" onClick={closeAllMenus}>
                <Home size={18} />
                <span>Início</span>
              </Link>
            </li>
            <li>
              <Link to="/sobre-nos" className="flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 dark:hover:bg-gray-700 text-gray-300 hover:text-white" onClick={closeAllMenus}>
                <Info size={18} />
                <span>Sobre Nós</span>
              </Link>
            </li>

            {/* Links para usuários não autenticados */}
            {!isAuthenticated && (
              <>
                <li>
                  <Link to="/login" className="flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 dark:hover:bg-gray-700 text-gray-300 hover:text-white" onClick={closeAllMenus}>
                    <LogIn size={18} />
                    <span>Login</span>
                  </Link>
                </li>
                <li>
                  <Link to="/cadastro" className="flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 dark:hover:bg-gray-700 text-gray-300 hover:text-white" onClick={closeAllMenus}>
                    <UserPlus size={18} />
                    <span>Cadastro</span>
                  </Link>
                </li>
                <li>
                  <Link to="/recuperar-senha" className="flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 dark:hover:bg-gray-700 text-gray-300 hover:text-white" onClick={closeAllMenus}>
                    <Key size={18} />
                    <span>Recuperar Senha</span>
                  </Link>
                </li>
              </>
            )}

            {/* Links para usuários autenticados */}
            {isAuthenticated && (
              <>
                {/* Dropdown de Perfil */}
                <li className="relative">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(!isProfileMenuOpen);
                      setIsTeacherMenuOpen(false);
                      setIsStudentMenuOpen(false);
                    }}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 dark:hover:bg-gray-700 text-gray-300 hover:text-white focus:outline-none"
                  >
                    <User size={18} />
                    <span>Perfil</span>
                  </button>
                  {isProfileMenuOpen && (
                    <ul className="absolute right-0 mt-2 w-48 bg-gray-700 dark:bg-gray-800 rounded-md shadow-lg z-10">
                      <li>
                        <Link to="/perfil" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700 rounded-t-md" onClick={closeAllMenus}>
                          <Settings size={16} className="inline-block mr-2" />
                          Minhas Configurações
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-600 dark:hover:bg-gray-700 rounded-b-md"
                        >
                          <LogOut size={16} className="inline-block mr-2" />
                          Sair
                        </button>
                      </li>
                    </ul>
                  )}
                </li>

                {/* Menu para Professores */}
                {user && user.role === 'professor' && (
                  <li className="relative">
                    <button
                      onClick={() => {
                        setIsTeacherMenuOpen(!isTeacherMenuOpen);
                        setIsStudentMenuOpen(false);
                        setIsProfileMenuOpen(false);
                      }}
                      className="flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 dark:hover:bg-gray-700 text-gray-300 hover:text-white focus:outline-none"
                    >
                      <BookOpen size={18} />
                      <span>Professor</span>
                    </button>
                    {isTeacherMenuOpen && (
                      <ul className="absolute right-0 mt-2 w-48 bg-gray-700 dark:bg-gray-800 rounded-md shadow-lg z-10">
                        <li>
                          <Link to="/professor/dashboard" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700 rounded-t-md" onClick={closeAllMenus}>
                            <LayoutDashboard size={16} className="inline-block mr-2" />
                            Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link to="/professor/criar-atividade" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700" onClick={closeAllMenus}>
                            <PlusCircle size={16} className="inline-block mr-2" />
                            Criar Atividade
                          </Link>
                        </li>
                        <li>
                          <Link to="/professor/banco-atividades" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700" onClick={closeAllMenus}>
                            <BookOpen size={16} className="inline-block mr-2" />
                            Banco de Atividades
                          </Link>
                        </li>
                        <li>
                          <Link to="/professor/gerenciar-turmas" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700" onClick={closeAllMenus}>
                            <Users size={16} className="inline-block mr-2" />
                            Gerenciar Turmas
                          </Link>
                        </li>
                        <li>
                          <Link to="/professor/desempenho-alunos" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700 rounded-b-md" onClick={closeAllMenus}>
                            <BarChart2 size={16} className="inline-block mr-2" />
                            Desempenho Alunos
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                )}

                {/* Menu para Alunos */}
                {user && user.role === 'aluno' && (
                  <li className="relative">
                    <button
                      onClick={() => {
                        setIsStudentMenuOpen(!isStudentMenuOpen);
                        setIsTeacherMenuOpen(false);
                        setIsProfileMenuOpen(false);
                      }}
                      className="flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 dark:hover:bg-gray-700 text-gray-300 hover:text-white focus:outline-none"
                    >
                      <User size={18} />
                      <span>Aluno</span>
                    </button>
                    {isStudentMenuOpen && (
                      <ul className="absolute right-0 mt-2 w-48 bg-gray-700 dark:bg-gray-800 rounded-md shadow-lg z-10">
                        <li>
                          <Link to="/aluno/dashboard" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700 rounded-t-md" onClick={closeAllMenus}>
                            <LayoutDashboard size={16} className="inline-block mr-2" />
                            Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link to="/aluno/entrar-turma" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700" onClick={closeAllMenus}>
                            <Users size={16} className="inline-block mr-2" />
                            Entrar em Turma
                          </Link>
                        </li>
                        <li>
                          <Link to="/aluno/minhas-atividades" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700" onClick={closeAllMenus}>
                            <Award size={16} className="inline-block mr-2" />
                            Minhas Atividades
                          </Link>
                        </li>
                        <li>
                          <Link to="/aluno/desempenho" className="block px-4 py-2 text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700 rounded-b-md" onClick={closeAllMenus}>
                            <BarChart2 size={16} className="inline-block mr-2" />
                            Meu Desempenho
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                )}

                {/* Link para Dashboard Admin (apenas se for admin) */}
                {user && user.role === 'admin' && (
                  <li>
                    <Link to="/admin/dashboard" className="flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 dark:hover:bg-gray-700 text-red-400 hover:text-red-300" onClick={closeAllMenus}>
                      <ShieldCheck size={18} /> {/* Ícone para Admin */}
                      <span>Admin Dashboard</span>
                    </Link>
                  </li>
                )}

                {/* Botão de Sair */}
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
                  >
                    <LogOut size={18} />
                    <span>Sair</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>

      {/* Conteúdo principal da aplicação */}
      <div className="w-full max-w-6xl bg-white p-8 rounded-lg shadow-lg mx-auto
                    dark:bg-gray-800 dark:text-gray-100">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="/sobre-nos" element={<AboutUsPage />} /> {/* Rota para a nova página */}

          {/* Rotas Protegidas - Apenas para usuários autenticados */}
          <Route element={<PrivateRoute />}>
            <Route path="/perfil" element={<UserProfilePage />} />
            {/* Adicione outras rotas que qualquer usuário logado pode acessar aqui */}
          </Route>

          {/* Rotas Protegidas - Apenas para Professores */}
          <Route element={<PrivateRoute allowedRoles={['professor']} />}>
            <Route path="/professor/dashboard" element={<TeacherDashboardPage />} />
            <Route path="/professor/criar-atividade" element={<ActivityCreationPage />} />
            <Route path="/professor/banco-atividades" element={<ActivityBankPage />} />
            <Route path="/professor/gerenciar-turmas" element={<ClassManagementPage />} />
            <Route path="/professor/desempenho-alunos" element={<StudentPerformancePage />} />
          </Route>

          {/* Rotas Protegidas - Apenas para Alunos */}
          <Route element={<PrivateRoute allowedRoles={['aluno']} />}>
            <Route path="/aluno/dashboard" element={<StudentDashboardPage />} />
            <Route path="/aluno/entrar-turma" element={<JoinClassPage />} />
            <Route path="/aluno/minhas-atividades" element={<StudentActivityPage />} /> {/* Rota para as atividades do aluno */}
            <Route path="/aluno/desempenho" element={<StudentPerformancePage />} /> {/* Rota para o desempenho do aluno */}
            <Route path="/aluno/atividade/:id" element={<StudentActivityPage />} /> {/* Rota para atividade específica do aluno */}
          </Route>

          {/* Rota para Dashboard Admin */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminPage />} /> 
          </Route>

          {/* Rota para páginas não encontradas */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
