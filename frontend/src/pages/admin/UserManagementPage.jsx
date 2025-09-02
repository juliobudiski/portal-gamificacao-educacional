// frontend/src/pages/admin/UserManagementPage.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ChevronUp, ChevronDown, Pencil, Trash2, Save, X } from 'lucide-react';

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
  const { user } = useContext(AuthContext);

  // Lógica de busca e carregamento de dados (similar à página de dashboard)
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = user?.token;
        if (!token) throw new Error("Token não encontrado.");

        const response = await fetch('http://127.0.0.1:5000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if(!response.ok) throw new Error('Falha ao buscar usuários.');
        
        const data = await response.json();
        setUsersList(data);
      } catch(e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if(user?.token) fetchUsers();
  }, [user]);

  // Lógica de ordenação (extraída da AdminPage original)
  const sortedUsers = useMemo(() => {
    let sortableUsers = [...usersList];
    if (sortConfig.key) {
        sortableUsers.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableUsers;
  }, [usersList, sortConfig]);
  
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
    // A lógica de salvar permanece a mesma da sua AdminPage original
    alert(`Salvando usuário ${editingUserId}... (Lógica a ser implementada)`);
    handleCancelEdit(); // Simula o salvamento
  };
  
  const handleDeleteClick = async (userId, userName) => {
     // A lógica de deletar permanece a mesma da sua AdminPage original
    if(window.confirm(`Tem certeza que deseja deletar ${userName}?`)){
        alert(`Deletando usuário ${userId}... (Lógica a ser implementada)`);
    }
  };


  if (loading) return <div className="text-center text-white p-10">Carregando usuários...</div>;
  if (error) return <div className="text-center text-red-400 p-10">Erro: {error}</div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-6">Gerenciamento de Usuários</h1>
      {/* Aqui entrarão os filtros e a barra de busca no Estágio 3 */}
      
      <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {/* Tabela de Usuários (JSX extraído da AdminPage original) */}
           <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gradient-to-r from-accent-teal/20 to-accent-purple/10">
                <tr>
                  {['id', 'name', 'email', 'role'].map((key) => (
                    <th key={key} className="py-4 px-4 text-left text-sm font-bold uppercase tracking-wider text-gray-300 cursor-pointer" onClick={() => handleSort(key)}>
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
                  <th className="py-4 px-4 text-right text-sm font-bold uppercase tracking-wider text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-700/50">
                    {editingUserId === userItem.id ? (
                      <>
                        <td className="py-4 px-4 text-sm">{userItem.id}</td>
                        <td className="py-4 px-4"><input name="name" value={editFormData.name} onChange={handleEditInputChange} className="bg-gray-700 text-white rounded px-2 py-1 w-full" /></td>
                        <td className="py-4 px-4"><input name="email" value={editFormData.email} onChange={handleEditInputChange} className="bg-gray-700 text-white rounded px-2 py-1 w-full" /></td>
                        <td className="py-4 px-4"><select name="role" value={editFormData.role} onChange={handleEditInputChange} className="bg-gray-700 text-white rounded px-2 py-1 w-full"><option value="aluno">aluno</option><option value="professor">professor</option><option value="admin">admin</option></select></td>
                        <td className="py-4 px-4 flex justify-end space-x-2">
                          <button onClick={handleSaveEdit} className="p-2 hover:bg-green-500/20 rounded"><Save size={18} className="text-green-400" /></button>
                          <button onClick={handleCancelEdit} className="p-2 hover:bg-red-500/20 rounded"><X size={18} className="text-red-400" /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-4 text-sm font-medium text-accent-yellow">{userItem.id}</td>
                        <td className="py-4 px-4 text-sm text-white">{userItem.name}</td>
                        <td className="py-4 px-4 text-sm text-gray-300">{userItem.email}</td>
                        <td className="py-4 px-4 text-sm text-white">{userItem.role}</td>
                        <td className="py-4 px-4 flex justify-end space-x-2">
                           <button onClick={() => handleEditClick(userItem)} className="p-2 hover:bg-yellow-500/20 rounded"><Pencil size={18} className="text-yellow-400" /></button>
                           <button onClick={() => handleDeleteClick(userItem.id, userItem.name)} className="p-2 hover:bg-red-500/20 rounded"><Trash2 size={18} className="text-red-400" /></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

export default UserManagementPage;
