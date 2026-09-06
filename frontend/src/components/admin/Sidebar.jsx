// frontend/src/components/admin/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, MapPin, LayoutDashboard, Users, BookCopy, BarChart4, LogOut, GraduationCap } from 'lucide-react';

/**
 * Sidebar
 * 
 * Architectural intent: Provides the primary navigational structure for the administrative interface.
 * It functions as a pure presentation component (dumb component), receiving no complex state, simply
 * mapping out the routing links and maintaining high cohesion for the admin layout.
 */
function Sidebar() {
  // Estilos base para os links de navegação
  const baseLinkStyle = "flex items-center px-4 py-3 text-secondary-text rounded-lg transition-all duration-300";
  // Estilos para o link ativo (página atual)
  const activeLinkStyle = "bg-gradient-to-r from-accent-teal/20 to-accent-purple/20 text-primary-text font-bold shadow-[0_0_15px_rgba(var(--accent-teal),0.1)] border border-accent-teal/10";
  // Estilos para o link inativo (hover)
  const inactiveLinkStyle = "hover:bg-hover-bg-color0 hover:text-primary-text hover:translate-x-1";

  return (
    <aside className="w-64 bg-primary-bg/50 backdrop-blur-sm flex-shrink-0 flex flex-col border-r border-border-color">
      <div className="h-20 flex items-center justify-center border-b border-border-color">
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
        <NavLink
          to="/admin/mapa-localizacao"
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <MapPin className="mr-3" size={20} />
          <span>Mapa e Localização</span>
        </NavLink>
        <NavLink
          to="/admin/messages"
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <MessageSquare className="mr-3" size={20} />
          <span>Fale Conosco</span>
        </NavLink>
      </nav>

      <div className="px-4 py-4 border-t border-border-color">
        <button className={`${baseLinkStyle} w-full ${inactiveLinkStyle}`}>
          <LogOut className="mr-3" size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
