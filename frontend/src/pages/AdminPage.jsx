// frontend/src/pages/AdminPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Ajuste o caminho se necessário
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, BarChart2, Eye, Mail, User as UserIcon } from 'lucide-react'; // Importe os ícones necessários

function AdminPage() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redireciona se não for admin ou não estiver autenticado
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login'); // Ou para uma página de erro/não autorizado
      return;
    }

    const fetchAdminData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token'); // Pega o token do localStorage

        // Fetch Dashboard Data
        const dashboardResponse = await fetch('http://127.0.0.1:5000/api/admin/dashboard_data', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!dashboardResponse.ok) {
          throw new Error(`HTTP error! status: ${dashboardResponse.status}`);
        }
        const dashboardJson = await dashboardResponse.json();
        setDashboardData(dashboardJson);

        // Fetch Users List
        const usersResponse = await fetch('http://127.0.0.1:5000/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!usersResponse.ok) {
          throw new Error(`HTTP error! status: ${usersResponse.status}`);
        }
        const usersJson = await usersResponse.json();
        setUsersList(usersJson);

      } catch (e) {
        console.error("Failed to fetch admin data:", e);
        setError("Erro ao carregar dados do administrador. Verifique sua conexão ou permissões.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isAuthenticated, user, navigate]); // Dependências do useEffect

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 dark:text-gray-300">
        <p>Carregando dados do administrador...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 dark:text-red-400 p-4">
        <p>{error}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-4">
        <p>Nenhum dado de dashboard disponível.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:text-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white text-center">Dashboard do Administrador</h1>

      {/* Seção de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-100 dark:bg-blue-900 p-6 rounded-lg shadow-md flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200">Total de Usuários</h2>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{dashboardData.total_users}</p>
          </div>
          <Users size={48} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-6 rounded-lg shadow-md flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">Professores</h2>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">{dashboardData.total_professors}</p>
          </div>
          <BookOpen size={48} className="text-green-600 dark:text-green-400" />
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900 p-6 rounded-lg shadow-md flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200">Alunos</h2>
            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{dashboardData.total_students}</p>
          </div>
          <UserIcon size={48} className="text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="bg-purple-100 dark:bg-purple-900 p-6 rounded-lg shadow-md flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-purple-800 dark:text-purple-200">Atividades Criadas</h2>
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{dashboardData.total_activities}</p>
          </div>
          <BarChart2 size={48} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div className="bg-gray-200 dark:bg-gray-700 p-6 rounded-lg shadow-md flex items-center justify-between col-span-full md:col-span-2 mx-auto w-full md:w-1/2">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Visitas no Portal (Mock)</h2>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{dashboardData.total_visits}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                *Este é um valor mockado. A implementação real de rastreamento de visitas requer um sistema de logging dedicado no backend.
            </p>
          </div>
          <Eye size={48} className="text-gray-500 dark:text-gray-400" />
        </div>
      </div>

      {/* Lista de Usuários Cadastrados */}
      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white text-center">Usuários Cadastrados</h2>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full bg-gray-700 dark:bg-gray-900 text-white">
          <thead>
            <tr className="bg-gray-600 dark:bg-gray-950">
              <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">ID</th>
              <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Nome</th>
              <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Email</th>
              <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Role</th>
              <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Instituição</th>
              <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Disciplina</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((userItem) => (
              <tr key={userItem.id} className="border-b border-gray-600 dark:border-gray-700 hover:bg-gray-600 dark:hover:bg-gray-800">
                <td className="py-3 px-4 text-sm">{userItem.id}</td>
                <td className="py-3 px-4 text-sm">{userItem.name}</td>
                <td className="py-3 px-4 text-sm">{userItem.email}</td>
                <td className="py-3 px-4 text-sm">{userItem.role}</td>
                <td className="py-3 px-4 text-sm">{userItem.institution_name || 'N/A'}</td>
                <td className="py-3 px-4 text-sm">{userItem.discipline || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPage;