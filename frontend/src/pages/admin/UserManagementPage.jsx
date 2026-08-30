// frontend/src/pages/admin/UserManagementPage.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ChevronUp, ChevronDown, Pencil, Trash2, Save, X, Search } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
/**
 * Componente UserManagementPage
 * * Página dedicada para listar, buscar, ordenar e gerenciar todos os usuários da plataforma.
 * Contém a lógica de busca, edição em linha e exclusão de usuários.
 */
function UserManagementPage() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useContext(AuthContext);
  // Estado para controlar o Modal de Confirmação
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null,      // 'student' ou 'activity'
    itemId: null,    // ID do item a ser removido
    title: '',
    message: ''
  });
  // Lógica de busca e carregamento de dados (similar à página de dashboard)
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = user?.token;
        if (!token) throw new Error("Token não encontrado.");

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Falha ao buscar usuários.');

        const data = await response.json();
        setUsersList(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) fetchUsers();
  }, [user]);

  // Lógica de ordenação (extraída da AdminPage original)
  const sortedUsers = useMemo(() => {
    let sortableUsers = [...usersList];

    // Aplicar Filtro de Busca
    if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        sortableUsers = sortableUsers.filter(u => 
            (u.name && u.name.toLowerCase().includes(lowerCaseQuery)) ||
            (u.email && u.email.toLowerCase().includes(lowerCaseQuery)) ||
            (u.role && u.role.toLowerCase().includes(lowerCaseQuery))
        );
    }

    // Aplicar Ordenação
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [usersList, sortConfig, searchQuery]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handlers para edição (extraídos e adaptados da AdminPage original)
  const handleEditClick = (userItem) => {
    setEditingUserId(userItem.id);
    setEditFormData({ ...userItem });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({});
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      const token = user?.token;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });
      
      if (!response.ok) throw new Error('Falha ao atualizar usuário.');
      
      setUsersList(prev => prev.map(u => u.id === editingUserId ? { ...u, ...editFormData } : u));
      handleCancelEdit();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteUserClick = (userId, userName) => {
    setModalConfig({
      isOpen: true,
      type: 'delete_user',
      itemId: userId,
      title: 'Deletar Usuário',
      message: `Tem certeza que deseja deletar o usuário ${userName}?`
    });
  };

  const executeDeleteUser = async () => {
    try {
      const token = user?.token;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${modalConfig.itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const responseData = await response.json();
      if (!response.ok) {
          throw new Error(responseData.message || 'Falha ao deletar usuário.');
      }
      
      setUsersList(prev => prev.filter(u => u.id !== modalConfig.itemId));
    } catch (e) {
      alert(e.message);
    } finally {
      setModalConfig({ ...modalConfig, isOpen: false });
    }
  };


  if (loading) return <div className="text-center text-primary-text p-10">Carregando usuários...</div>;
  if (error) return <div className="text-center text-red-400 p-10">Erro: {error}</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-3xl font-bold text-primary-text mb-6">Gerenciamento de Usuários</h1>
      
      {/* Barra de Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" size={20} />
        <input
            type="text"
            placeholder="Buscar por nome, email ou cargo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-primary-bg border border-border-color rounded-lg pl-10 pr-4 py-3 text-primary-text focus:ring-2 focus:ring-accent-teal outline-none transition-all shadow-inner hover:shadow-md"
        />
      </div>

      <div className="bg-secondary-bg border border-border-color rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <div className="overflow-x-auto">
          {/* Tabela de Usuários (JSX extraído da AdminPage original) */}
          <table className="min-w-full divide-y divide-border-color">
            <thead className="bg-gradient-to-r from-accent-teal/10 to-accent-purple/10 border-b border-border-color">
              <tr>
                {['id', 'name', 'email', 'role'].map((key) => (
                  <th key={key} className="py-4 px-4 text-left text-sm font-bold uppercase tracking-wider text-secondary-text cursor-pointer" onClick={() => handleSort(key)}>
                    <div className="flex items-center">
                      {key.replace('_', ' ')}
                      <span className="ml-2">
                        {sortConfig.key === key && (sortConfig.direction === 'asc'
                          ? <ChevronUp size={16} />
                          : <ChevronDown size={16} />)}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="py-4 px-4 text-right text-sm font-bold uppercase tracking-wider text-secondary-text">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {sortedUsers.map((userItem) => (
                <tr key={userItem.id} className={`transition-colors ${editingUserId === userItem.id ? 'bg-accent-teal/5' : 'hover:bg-hover-bg-color0'}`}>
                  {editingUserId === userItem.id ? (
                    <>
                      <td className="py-4 px-4 text-sm font-bold text-accent-yellow">{userItem.id}</td>
                      <td className="py-4 px-4 flex flex-col gap-2">
                        <input name="name" value={editFormData.name || ''} onChange={handleEditInputChange} className="bg-primary-bg border border-border-color text-primary-text rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-accent-teal outline-none shadow-inner" placeholder="Nome" />
                        <input name="password" value={editFormData.password || ''} onChange={handleEditInputChange} className="bg-primary-bg border border-border-color text-primary-text rounded-md px-3 py-2 w-full text-xs focus:ring-2 focus:ring-accent-teal outline-none shadow-inner" placeholder="Nova Senha (Opcional)" type="text" />
                      </td>
                      <td className="py-4 px-4"><input name="email" value={editFormData.email || ''} onChange={handleEditInputChange} className="bg-primary-bg border border-border-color text-primary-text rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-accent-teal outline-none shadow-inner" placeholder="Email" /></td>
                      <td className="py-4 px-4"><select name="role" value={editFormData.role} onChange={handleEditInputChange} className="bg-primary-bg border border-border-color text-primary-text rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-accent-teal outline-none shadow-inner"><option value="aluno">aluno</option><option value="professor">professor</option><option value="admin">admin</option></select></td>
                      <td className="py-4 px-4 flex justify-end space-x-2">
                        <button onClick={handleSaveEdit} className="p-2 hover:bg-green-500/20 rounded"><Save size={18} className="text-green-400" /></button>
                        <button onClick={handleCancelEdit} className="p-2 hover:bg-red-500/20 rounded"><X size={18} className="text-red-400" /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-4 px-4 text-sm font-medium text-accent-yellow">{userItem.id}</td>
                      <td className="py-4 px-4 text-sm text-primary-text">{userItem.name}</td>
                      <td className="py-4 px-4 text-sm text-secondary-text">{userItem.email}</td>
                      <td className="py-4 px-4 text-sm text-primary-text">{userItem.role}</td>
                      <td className="py-4 px-4 flex justify-end space-x-2">
                        <button onClick={() => handleEditClick(userItem)} className="p-2 hover:bg-yellow-500/20 rounded"><Pencil size={18} className="text-yellow-400" /></button>
                        <button onClick={() => handleDeleteUserClick(userItem.id, userItem.name)} className="p-2 hover:bg-red-500/20 rounded"><Trash2 size={18} className="text-red-400" /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={executeDeleteUser}
        title={modalConfig.title}
        message={modalConfig.message}
        isDangerous={true}
        confirmText="Deletar Usuário"
      />
    </div>
  );
}

export default UserManagementPage;
