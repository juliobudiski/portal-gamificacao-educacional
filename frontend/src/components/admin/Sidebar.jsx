// frontend/src/components/admin/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    MessageSquare, 
    MapPin, 
    LayoutDashboard, 
    Users, 
    BookCopy, 
    BarChart4, 
    LogOut, 
    ShieldCheck,
    ScrollText,
    Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Sidebar
 * 
 * Architectural intent: Provides the primary navigational structure for the administrative interface.
 * Implements a modern SaaS-grade design system with clean active states, contextual icons, and
 * direct logout integration using AuthContext.
 */
function Sidebar() {
  const { logout } = useAuth();

  const baseLinkStyle = "flex items-center px-4 py-3 text-sm font-medium text-secondary-text rounded-xl transition-all duration-200 group";
  const activeLinkStyle = "bg-gradient-to-r from-accent-teal/20 via-accent-purple/10 to-transparent text-primary-text font-bold shadow-sm border-l-4 border-accent-teal";
  const inactiveLinkStyle = "hover:bg-hover-bg-color hover:text-primary-text hover:translate-x-1";

  return (
    <aside className="w-64 bg-secondary-bg/80 backdrop-blur-md flex-shrink-0 flex flex-col border-r border-border-color shadow-sm select-none">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-border-color gap-3 bg-secondary-bg">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent-teal to-accent-purple text-white shadow-md">
          <ShieldCheck size={22} className="text-white" />
        </div>
        <div>
          <span className="text-lg font-extrabold text-primary-text tracking-tight block">Portal Admin</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-teal block">Painel de Controle</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="px-4 pt-6 pb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-text/70 px-4">
          Operações & Conteúdo
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <LayoutDashboard className="mr-3 text-accent-teal" size={18} />
          Painel Principal
        </NavLink>

        <NavLink
          to="/admin/messages"
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <MessageSquare className="mr-3 text-accent-yellow" size={18} />
          <span>Solicitações & Contato</span>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <Users className="mr-3 text-blue-400" size={18} />
          Gerenciar Usuários
        </NavLink>

        <NavLink
          to="/admin/activities"
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <BookCopy className="mr-3 text-purple-400" size={18} />
          Gerenciar Conteúdo
        </NavLink>

        <div className="pt-4 pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-text/70 px-4">
            Auditoria & Inteligência
          </span>
        </div>

        <NavLink
          to="/admin/analytics"
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <BarChart4 className="mr-3 text-emerald-400" size={18} />
          Métricas & Análise
        </NavLink>

        <NavLink
          to="/admin/logs"
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <ScrollText className="mr-3 text-orange-400" size={18} />
          Explorador de Logs
        </NavLink>

        <NavLink
          to="/admin/mapa-localizacao"
          className={({ isActive }) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <MapPin className="mr-3 text-rose-400" size={18} />
          <span>Mapa de Acessos</span>
        </NavLink>
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-border-color bg-secondary-bg/50">
        <button 
          onClick={logout}
          className={`${baseLinkStyle} w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 justify-start`}
        >
          <LogOut className="mr-3" size={18} />
          Encerrar Sessão
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
