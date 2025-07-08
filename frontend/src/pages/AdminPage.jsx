// frontend/src/pages/AdminPage.jsx
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Users, BookOpen, BarChart2, Eye, Mail, User as UserIcon, Building, GraduationCap, ChevronUp, ChevronDown, Pencil, Trash2, Save, X } from 'lucide-react'; // Adicionado Pencil, Trash2, Save, X

function AdminPage() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Estado para controlar a linha que está sendo editada
  const [editingUserId, setEditingUserId] = useState(null);
  // Estado para armazenar os dados do formulário de edição
  const [editFormData, setEditFormData] = useState({});

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');

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
      console.error("Erro ao buscar dados do administrador:", e);
      setError("Não foi possível carregar os dados do dashboard. Verifique a conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAdminData();
  }, [isAuthenticated, user, navigate]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = useMemo(() => {
    let sortableUsers = [...usersList];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [usersList, sortConfig]);

  // Funções de Edição e Exclusão
  const handleEditClick = (userItem) => {
    setEditingUserId(userItem.id);
    setEditFormData({ ...userItem }); // Copia os dados do usuário para o formulário de edição
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:5000/api/admin/users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Erro ao salvar as alterações do usuário.');
      }

      await response.json(); // Pega a resposta de sucesso
      setEditingUserId(null); // Sai do modo de edição
      setEditFormData({}); // Limpa os dados do formulário
      fetchAdminData(); // Recarrega os dados para ver as alterações
    } catch (e) {
      console.error("Erro ao salvar usuário:", e);
      alert(`Erro ao salvar: ${e.message}`); // Exibe um alerta simples com a mensagem de erro
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({});
  };

  const handleDeleteClick = async (userId, userName) => {
    if (window.confirm(`Tem certeza que deseja excluir a conta de ${userName} (ID: ${userId})? Esta ação é irreversível.`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:5000/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || 'Erro ao excluir a conta do usuário.');
        }

        await response.json(); // Pega a resposta de sucesso
        fetchAdminData(); // Recarrega os dados para remover o usuário excluído
      } catch (e) {
        console.error("Erro ao excluir usuário:", e);
        alert(`Erro ao excluir: ${e.message}`);
      }
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white">
        <p>Carregando Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <p>Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-dark-background p-4">
      
      {/* Conteúdo da Dashboard */}
      <main className="container mx-auto mt-8 p-4">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard do Administrador</h1>

        {/* Cards de Totais */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-700 p-6 rounded-lg shadow-md text-white flex items-center space-x-4">
              <Users size={32} className="text-accent-teal" />
              <div>
                <p className="text-xl font-semibold">Total de Usuários</p>
                <p className="text-3xl font-bold">{dashboardData.total_users}</p>
              </div>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg shadow-md text-white flex items-center space-x-4">
              <UserIcon size={32} className="text-accent-purple" />
              <div>
                <p className="text-xl font-semibold">Total de Professores</p>
                <p className="text-3xl font-bold">{dashboardData.total_professors}</p>
              </div>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg shadow-md text-white flex items-center space-x-4">
              <GraduationCap size={32} className="text-accent-yellow" />
              <div>
                <p className="text-xl font-semibold">Total de Alunos</p>
                <p className="text-3xl font-bold">{dashboardData.total_students}</p>
              </div>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg shadow-md text-white flex items-center space-x-4">
              <BookOpen size={32} className="text-blue-400" />
              <div>
                <p className="text-xl font-semibold">Total de Atividades</p>
                <p className="text-3xl font-bold">{dashboardData.total_activities}</p>
              </div>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg shadow-md text-white flex items-center space-x-4">
              <Eye size={32} className="text-green-400" />
              <div>
                <p className="text-xl font-semibold">Visitas (Mock)</p>
                <p className="text-3xl font-bold">{dashboardData.total_visits}</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Usuários */}
        <h2 className="text-2xl font-bold text-white mb-4">Lista de Usuários</h2>
        <div className="bg-gray-800 rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-400 dark:bg-gray-950 cursor-pointer hover:text-white transition-colors duration-200"
                    onClick={() => handleSort('id')}>
                  ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline ml-1" /> : <ChevronDown size={16} className="inline ml-1" />)}
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-400 dark:bg-gray-950 cursor-pointer hover:text-white transition-colors duration-200"
                    onClick={() => handleSort('name')}>
                  Nome {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline ml-1" /> : <ChevronDown size={16} className="inline ml-1" />)}
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-400 dark:bg-gray-950 cursor-pointer hover:text-white transition-colors duration-200"
                    onClick={() => handleSort('email')}>
                  Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline ml-1" /> : <ChevronDown size={16} className="inline ml-1" />)}
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-400 dark:bg-gray-950 cursor-pointer hover:text-white transition-colors duration-200"
                    onClick={() => handleSort('role')}>
                  Tipo {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline ml-1" /> : <ChevronDown size={16} className="inline ml-1" />)}
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-400 dark:bg-gray-950 cursor-pointer hover:text-white transition-colors duration-200"
                    onClick={() => handleSort('institution_name')}>
                  Instituição {sortConfig.key === 'institution_name' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline ml-1" /> : <ChevronDown size={16} className="inline ml-1" />)}
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-400 dark:bg-gray-950 cursor-pointer hover:text-white transition-colors duration-200"
                    onClick={() => handleSort('discipline')}>
                  Disciplina {sortConfig.key === 'discipline' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline ml-1" /> : <ChevronDown size={16} className="inline ml-1" />)}
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-400 dark:bg-gray-950">Ações</th> {/* Nova coluna para ações */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedUsers.map((userItem) => (
                <tr key={userItem.id} className="border-b border-gray-600 dark:border-gray-700 hover:bg-gray-600 dark:hover:bg-gray-800">
                  {editingUserId === userItem.id ? (
                    <>
                      <td className="py-3 px-4 text-sm text-white">{userItem.id}</td>
                      <td className="py-3 px-4 text-sm">
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name || ''}
                          onChange={handleEditInputChange}
                          className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <input
                          type="email"
                          name="email"
                          value={editFormData.email || ''}
                          onChange={handleEditInputChange}
                          className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <select
                          name="role"
                          value={editFormData.role || ''}
                          onChange={handleEditInputChange}
                          className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full"
                        >
                          <option value="aluno">Aluno</option>
                          <option value="professor">Professor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <input
                          type="text"
                          name="institution_name"
                          value={editFormData.institution_name || ''}
                          onChange={handleEditInputChange}
                          className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <input
                          type="text"
                          name="discipline"
                          value={editFormData.discipline || ''}
                          onChange={handleEditInputChange}
                          className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="py-3 px-4 text-sm flex space-x-2">
                        <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300">
                          <Save size={20} />
                        </button>
                        <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-300">
                          <X size={20} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-sm text-white">{userItem.id}</td>
                      <td className="py-3 px-4 text-sm text-white">{userItem.name}</td>
                      <td className="py-3 px-4 text-sm text-white">{userItem.email}</td>
                      <td className="py-3 px-4 text-sm text-white">{userItem.role}</td>
                      <td className="py-3 px-4 text-sm text-white">{userItem.institution_name || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-white">{userItem.discipline || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm flex space-x-2">
                        <button onClick={() => handleEditClick(userItem)} className="text-blue-400 hover:text-blue-300">
                          <Pencil size={20} />
                        </button>
                        <button onClick={() => handleDeleteClick(userItem.id, userItem.name)} className="text-red-400 hover:text-red-300">
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default AdminPage;