// frontend/src/pages/AdminPage.jsx
import React, { useContext, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/admin/Sidebar'; // Importando o novo componente Sidebar

/**
 * AdminPage (Layout Principal)
 * 
 * Architectural intent: Defines the layout and routing boundary for the administrative dashboard.
 * It encapsulates route protection (authorization checks) and structural layout elements (Sidebar, Outlet),
 * ensuring that administrative views remain completely decoupled from the main user-facing application architecture.
 */
function AdminPage() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Efeito para verificar a autorização do usuário.
  // Se o usuário não estiver autenticado ou não for um admin, ele é redirecionado.
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      console.warn("Acesso não autorizado à área de admin. Redirecionando...");
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // Renderiza um estado de carregamento ou nulo enquanto a verificação acontece
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen text-primary-text bg-border-color">
        <p>Verificando permissões...</p>
      </div>
    );
  }

  // Renderização principal do layout do admin
  return (
    <div className="min-h-screen w-full bg-primary-bg text-primary-text flex relative overflow-hidden transition-colors duration-300">
      {/* Luzes Holográficas de Fundo globais para o Admin (Ajustadas para modo claro/escuro) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-accent-purple/20 dark:bg-accent-purple/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent-teal/10 dark:bg-accent-teal/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Barra de Navegação Lateral Fixa */}
      <Sidebar />

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative z-10">
        {/* O React Router renderizará a página aninhada correspondente aqui */}
        <Outlet />
      </main>
    </div>
  );
}

export default AdminPage;
