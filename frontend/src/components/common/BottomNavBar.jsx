import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Users, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * @component BottomNavBar
 * @description
 * Barra de navegação móvel de rodapé (Melhoria 73 & 80).
 * Exibida apenas em telas pequenas (`md:hidden`), permitindo acesso ágil
 * com o polegar com respeito a safe-area insets (`pb-safe`).
 */
export default function BottomNavBar() {
  const { user } = useAuth();

  if (!user) return null;

  const isTeacher = user.role === 'professor';

  const navItems = [
    {
      to: isTeacher ? '/professor/dashboard' : '/aluno/dashboard',
      label: 'Início',
      icon: Home
    },
    {
      to: isTeacher ? '/professor/banco-atividades' : '/aluno/minhas-atividades',
      label: isTeacher ? 'Atividades' : 'Jornada',
      icon: Compass
    },
    {
      to: isTeacher ? '/professor/gerenciar-turmas' : '/aluno/turmas',
      label: 'Turmas',
      icon: Users
    },
    {
      to: '/perfil',
      label: 'Perfil',
      icon: User
    }
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-secondary-bg/95 backdrop-blur-lg border-t border-border-color shadow-2xl pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Navegação móvel inferior"
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={idx}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] min-w-[44px] rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-accent-teal font-bold scale-105'
                    : 'text-secondary-text hover:text-primary-text'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
