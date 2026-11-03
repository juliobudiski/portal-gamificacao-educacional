import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, LogIn, UserPlus, User, BookOpen, LayoutDashboard, 
  PlusCircle, Users, BarChart2, Award, LogOut, Info, Settings, ShieldCheck 
} from 'lucide-react';
import ThemeToggleButton from './ThemeToggleButton';
import ConnectionStatusBadge from './common/ConnectionStatusBadge';

/**
 * @component Header
 * @description
 * Main application navigation bar with authentication and role-based routing.
 * 
 * Architectural Decisions:
 * - Role-Based Rendering: Evaluates `user.role` from `useAuth` context to conditionally display specific navigation paths.
 * - Event Delegation: Navigation handlers are encapsulated within the component to manage its internal state cohesively.
 * - Note on Coupling: Connected to global `useAuth` context. While functional, passing user state as props from a higher-level layout could increase testability.
 */
function Header({ handleTeacherTour, handleStudentTour, isActivityPage }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isTeacherMenuOpen, setIsTeacherMenuOpen] = useState(false);
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(false);

  const closeAllMenus = () => {
    setIsProfileMenuOpen(false);
    setIsTeacherMenuOpen(false);
    setIsStudentMenuOpen(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('TUTORIAL_MODE');
    logout();
    closeAllMenus();
    navigate('/');
  };

  // Destino padrão do início/logo de acordo com o papel do usuário
  const homePath = isAuthenticated
    ? (user?.role === 'professor' ? '/professor/dashboard' : user?.role === 'aluno' ? '/aluno/dashboard' : '/admin')
    : '/';

  return (
    <header className={`flex-shrink-0 w-full max-w-full mx-auto bg-secondary-bg text-primary-text p-4 rounded-xl shadow-xl border-b-2 border-border-color z-50 transition-all duration-300 ${isActivityPage ? 'mt-0 mb-2 rounded-t-none' : 'mt-4 mb-4'}`}>
      <nav className="flex flex-col sm:flex-row justify-between items-center">
        <Link
          to={homePath}
          className="flex items-center space-x-2 mb-4 sm:mb-0 group transition-transform duration-300"
          onClick={closeAllMenus}
        >
          {/* Logo para o MODO CLARO */}
          <img
            src="/images/logotipo-dark.webp"
            alt="Logo GamificaEdu"
            className="h-20 transition-transform duration-300 group-hover:scale-105 dark:hidden"
          />

          {/* Logo para o MODO ESCURO */}
          <img
            src="/images/logotipo-light.webp"
            alt="Logo GamificaEdu"
            className="h-20 transition-transform duration-300 group-hover:scale-105 hidden dark:block"
          />
        </Link>

        <ul className="flex flex-wrap justify-center sm:justify-end items-center gap-2 sm:gap-3">
          <li>
            <Link
              to={homePath}
              className="flex items-center space-x-1 px-4 py-2 rounded-xl hover:bg-primary-bg/50 hover:shadow-inner text-accent-yellow transition-all duration-300"
              onClick={closeAllMenus}
            >
              <Home size={20} />
              <span className="font-medium">Início</span>
            </Link>
          </li>
          <li>
            <Link
              to="/sobre-nos"
              className="flex items-center space-x-1 px-4 py-2 rounded-xl hover:bg-primary-bg/50 hover:shadow-inner text-accent-teal transition-all duration-300"
              onClick={closeAllMenus}
            >
              <Info size={20} />
              <span className="font-medium">Sobre Nós</span>
            </Link>
          </li>

          {!isAuthenticated && (
            <>
              <li>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl hover:bg-accent-teal/10 hover:text-accent-teal/90 text-accent-teal transition-all duration-300 border border-transparent hover:border-accent-teal/30"
                  onClick={closeAllMenus}
                >
                  <LogIn size={20} />
                  <span className="font-medium">Login</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/cadastro"
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl hover:bg-accent-purple/10 text-accent-purple transition-all duration-300 border border-transparent hover:border-accent-purple/30"
                  onClick={closeAllMenus}
                >
                  <UserPlus size={20} />
                  <span className="font-medium">Cadastro</span>
                </Link>
              </li>
            </>
          )}

          {isAuthenticated && (
            <>
              <li className="relative">
                <button
                  id="tour-profile-menu"
                  onClick={() => {
                    setIsProfileMenuOpen(!isProfileMenuOpen);
                    setIsTeacherMenuOpen(false);
                    setIsStudentMenuOpen(false);
                  }}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-xl transition-all duration-300 border border-transparent ${isProfileMenuOpen
                    ? 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30 shadow-inner'
                    : 'hover:bg-primary-bg/50 text-accent-yellow hover:border-accent-yellow/30'
                    }`}
                >
                  <User size={20} />
                  <span className="font-medium">Perfil</span>
                </button>
                {isProfileMenuOpen && (
                  <ul
                    className="absolute right-0 mt-3 w-56 bg-secondary-bg rounded-2xl shadow-2xl z-10 border border-border-color animate-fade-in overflow-hidden"
                    onMouseLeave={() => setIsProfileMenuOpen(false)}
                  >
                    <li>
                      <Link
                        to="/perfil"
                        className="flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors"
                        onClick={closeAllMenus}
                      >
                        <Settings size={18} className="mr-3 text-accent-teal" />
                        <span className="font-medium">Minhas Configurações</span>
                      </Link>
                    </li>
                    {user?.role === 'professor' ? (
                      <>
                        <li>
                          <button
                            onClick={() => { handleTeacherTour('dashboard'); closeAllMenus(); }}
                            className="w-full flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors text-left group"
                          >
                            <span className="mr-3 text-accent-yellow group-hover:scale-125 transition-transform text-lg">🧭</span>
                            <div>
                              <span className="block text-sm font-bold">Tour: Visão Geral</span>
                              <span className="block text-xs text-secondary-text/70">Conheça o painel</span>
                            </div>
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => { handleTeacherTour('creation'); closeAllMenus(); }}
                            className="w-full flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors text-left group"
                          >
                            <span className="mr-3 text-accent-teal group-hover:scale-125 transition-transform text-lg">✨</span>
                            <div>
                              <span className="block text-sm font-bold">Tour: Criar Atividade</span>
                              <span className="block text-xs text-secondary-text/70">Use o editor</span>
                            </div>
                          </button>
                        </li>
                      </>
                    ) : (
                      <li>
                        <button
                          onClick={() => { handleStudentTour(); closeAllMenus(); }}
                          className="w-full flex items-center px-4 py-3 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors text-left group"
                        >
                          <span className="mr-3 text-accent-yellow group-hover:scale-125 transition-transform text-lg">💡</span>
                          <span className="font-medium">Ver Tutorial</span>
                        </button>
                      </li>
                    )}

                    <div className="border-t border-border-color my-1"></div>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-left hover:bg-danger/10 text-danger transition-colors font-medium"
                      >
                        <LogOut size={18} className="mr-3" />
                        Sair
                      </button>
                    </li>
                  </ul>
                )}
              </li>

              {user?.role === 'professor' && (
                <li className="relative">
                  <button id="tour-teacher-menu"
                    onClick={() => {
                      setIsTeacherMenuOpen(!isTeacherMenuOpen);
                      setIsStudentMenuOpen(false);
                      setIsProfileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-xl transition-all duration-300 border border-transparent ${isTeacherMenuOpen
                      ? 'bg-accent-teal/20 text-accent-teal border-accent-teal/30 shadow-inner'
                      : 'hover:bg-primary-bg/50 text-accent-teal hover:border-accent-teal/30'
                      }`}
                  >
                    <BookOpen size={20} />
                    <span className="font-medium">Professor</span>
                  </button>
                  {isTeacherMenuOpen && (
                    <ul
                      className="absolute right-0 mt-3 w-64 bg-secondary-bg rounded-2xl shadow-2xl z-10 border border-border-color animate-fade-in overflow-hidden"
                      onMouseLeave={() => setIsTeacherMenuOpen(false)}
                    >
                      <li><Link to="/professor/dashboard" className="flex items-center px-5 py-4 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors" onClick={closeAllMenus}><LayoutDashboard size={18} className="mr-3 text-accent-yellow" /><span className="font-medium">Dashboard</span></Link></li>
                      <li id="tour-menu-create-action"><Link to="/professor/criar-atividade" className="flex items-center px-5 py-4 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors" onClick={closeAllMenus}><PlusCircle size={18} className="mr-3 text-accent-teal" /><span className="font-medium">Criar Atividade</span></Link></li>
                      <li><Link to="/professor/banco-atividades" className="flex items-center px-5 py-4 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors" onClick={closeAllMenus}><BookOpen size={18} className="mr-3 text-accent-purple" /><span className="font-medium">Banco de Atividades</span></Link></li>
                      <li><Link to="/professor/gerenciar-turmas" className="flex items-center px-5 py-4 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors" onClick={closeAllMenus}><Users size={18} className="mr-3 text-accent-yellow" /><span className="font-medium">Gerenciar Turmas</span></Link></li>
                      <li><Link to="/professor/desempenho-alunos" className="flex items-center px-5 py-4 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors" onClick={closeAllMenus}><BarChart2 size={18} className="mr-3 text-accent-teal" /><span className="font-medium">Desempenho Alunos</span></Link></li>
                    </ul>
                  )}
                </li>
              )}

              {user?.role === 'aluno' && (
                <li className="relative">
                  <button id="tour-student-menu"
                    onClick={() => {
                      setIsStudentMenuOpen(!isStudentMenuOpen);
                      setIsTeacherMenuOpen(false);
                      setIsProfileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-xl transition-all duration-300 border border-transparent ${isStudentMenuOpen
                      ? 'bg-accent-purple/20 text-accent-purple border-accent-purple/30 shadow-inner'
                      : 'hover:bg-primary-bg/50 text-accent-purple hover:border-accent-purple/30'
                      }`}
                  >
                    <User size={20} />
                    <span className="font-medium">Aluno</span>
                  </button>
                  {isStudentMenuOpen && (
                    <ul
                      className="absolute right-0 mt-3 w-56 bg-secondary-bg rounded-2xl shadow-2xl z-10 border border-border-color animate-fade-in overflow-hidden"
                      onMouseLeave={() => setIsStudentMenuOpen(false)}
                    >
                      <li><Link to="/aluno/dashboard" className="flex items-center px-5 py-4 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors" onClick={closeAllMenus}><LayoutDashboard size={18} className="mr-3 text-accent-yellow" /><span className="font-medium">Dashboard</span></Link></li>
                      <li><Link to="/aluno/entrar-turma" className="flex items-center px-5 py-4 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors" onClick={closeAllMenus}><Users size={18} className="mr-3 text-accent-teal" /><span className="font-medium">Entrar em Turma</span></Link></li>
                      <li><Link to="/aluno/minhas-atividades" className="flex items-center px-5 py-4 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors" onClick={closeAllMenus}><Award size={18} className="mr-3 text-accent-purple" /><span className="font-medium">Minhas Atividades</span></Link></li>
                      <li><Link to="/aluno/desempenho" className="flex items-center px-5 py-4 text-secondary-text hover:bg-secondary-bg hover:text-primary-text transition-colors" onClick={closeAllMenus}><BarChart2 size={18} className="mr-3 text-accent-yellow" /><span className="font-medium">Meu Desempenho</span></Link></li>
                    </ul>
                  )}
                </li>
              )}

              {user?.role === 'admin' && (
                <li>
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 px-4 py-2 rounded-xl hover:bg-danger/10 text-danger hover:border-danger/30 transition-all duration-300 border border-transparent"
                    onClick={closeAllMenus}
                  >
                    <ShieldCheck size={20} />
                    <span className="font-medium">Admin Dashboard</span>
                  </Link>
                </li>
              )}
            </>
          )}

          {/* Status de Conexão Online/Offline (#97) */}
          <li className="ml-1 sm:ml-2">
            <ConnectionStatusBadge />
          </li>

          {/* Botão de Alternar Modo Claro / Escuro no Cabeçalho Desktop */}
          <li className="ml-1 sm:ml-2">
            <ThemeToggleButton className="static p-2.5 rounded-xl bg-primary-bg/70 hover:bg-primary-bg border border-border-color text-primary-text transition-all duration-300 hover:scale-105 shadow-sm inline-flex items-center justify-center" />
          </li>
        </ul>
      </nav>

      {/* BARRA DE NAVEGAÇÃO INFERIOR MÓVEL (Melhoria 73: Bottom Navigation Bar) */}
      {isAuthenticated && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-secondary-bg/95 backdrop-blur-xl border-t border-border-color shadow-[0_-4px_20px_rgba(0,0,0,0.15)] px-4 py-2 flex justify-around items-center">
          <Link
            to="/"
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-secondary-text hover:text-accent-teal transition-colors"
          >
            <Home size={18} />
            <span>Início</span>
          </Link>

          {user?.role === 'aluno' && (
            <>
              <Link
                to="/aluno/dashboard"
                className="flex flex-col items-center gap-1 text-[11px] font-bold text-secondary-text hover:text-accent-yellow transition-colors"
              >
                <LayoutDashboard size={18} />
                <span>Missões</span>
              </Link>
              <Link
                to="/aluno/entrar-turma"
                className="flex flex-col items-center gap-1 text-[11px] font-bold text-secondary-text hover:text-accent-teal transition-colors"
              >
                <Users size={18} />
                <span>Turmas</span>
              </Link>
            </>
          )}

          {user?.role === 'professor' && (
            <>
              <Link
                to="/professor/dashboard"
                className="flex flex-col items-center gap-1 text-[11px] font-bold text-secondary-text hover:text-accent-teal transition-colors"
              >
                <LayoutDashboard size={18} />
                <span>Painel</span>
              </Link>
              <Link
                to="/professor/criar-atividade"
                className="flex flex-col items-center gap-1 text-[11px] font-bold text-accent-yellow transition-colors"
              >
                <PlusCircle size={18} />
                <span>Criar</span>
              </Link>
            </>
          )}

          <Link
            to="/perfil"
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-secondary-text hover:text-accent-purple transition-colors"
          >
            <User size={18} />
            <span>Perfil</span>
          </Link>

          <div className="flex flex-col items-center justify-center">
            <ThemeToggleButton className="static p-1.5 rounded-lg bg-primary-bg/70 text-primary-text transition-all duration-200 shadow-none border border-border-color/60" />
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
