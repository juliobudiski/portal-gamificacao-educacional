// frontend/src/pages/AdminPage.jsx
import React, { useContext, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/admin/Sidebar'; // Importando o novo componente Sidebar

/**
 * Componente AdminPage (Layout Principal)
 * * Esta é a nova estrutura principal para toda a seção de administração.
 * Ele verifica a autorização do usuário e renderiza um layout consistente 
 * com uma barra de navegação lateral (Sidebar) e uma área de conteúdo principal 
 * onde as páginas aninhadas (Dashboard, Usuários, etc.) serão exibidas através do <Outlet>.
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
        <div className="flex justify-center items-center min-h-screen text-white bg-dark-background">
            <p>Verificando permissões...</p>
        </div>
    );
  }

  // Renderização principal do layout do admin
  return (
    <div className="min-h-screen w-full bg-dark-background flex">
      {/* Barra de Navegação Lateral Fixa */}
      <Sidebar />

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* O React Router renderizará a página aninhada correspondente aqui */}
        <Outlet /> 
      </main>
    </div>
  );
}

export default AdminPage;
