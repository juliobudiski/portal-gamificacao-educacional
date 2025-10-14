// frontend/src/components/admin/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookCopy, BarChart4, LogOut, GraduationCap } from 'lucide-react';

/**
 * Componente Sidebar
 * * Barra de navegação lateral para a área de administração.
 * Utiliza NavLink do react-router-dom para destacar o link da página ativa.
 */
function Sidebar() {
  // Estilos base para os links de navegação
  const baseLinkStyle = "flex items-center px-4 py-3 text-secondary-text rounded-lg transition-colors duration-200";
  // Estilos para o link ativo (página atual)
  const activeLinkStyle = "bg-gradient-to-r from-accent-teal/20 to-accent-purple/20 text-primary-text font-semibold shadow-inner";
  // Estilos para o link inativo (hover)
  const inactiveLinkStyle = "hover:bg-gray-700 hover:text-primary-text";

  return (
    <aside className="w-64 bg-gray-800/50 backdrop-blur-sm flex-shrink-0 flex flex-col border-r border-gray-700">
      <div className="h-20 flex items-center justify-center border-b border-gray-700">
        <div className="flex items-center text-primary-text">
          <GraduationCap size={32} className="text-accent-yellow mr-3" />
          <span className="text-xl font-bold">Admin</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavLink
          to="/admin"
          end // A propriedade 'end' garante que este link só esteja ativo na rota exata "/"
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <LayoutDashboard className="mr-3" size={20} />
          Painel Principal
        </NavLink>
        <NavLink
          to="/admin/users"
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <Users className="mr-3" size={20} />
          Gerenciar Usuários
        </NavLink>
        <NavLink
          to="/admin/activities"
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <BookCopy className="mr-3" size={20} />
          Gerenciar Conteúdo
        </NavLink>
        <NavLink
          to="/admin/analytics"
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <BarChart4 className="mr-3" size={20} />
          Análise e Logs
        </NavLink>
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <button className={`${baseLinkStyle} w-full ${inactiveLinkStyle}`}>
          <LogOut className="mr-3" size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
