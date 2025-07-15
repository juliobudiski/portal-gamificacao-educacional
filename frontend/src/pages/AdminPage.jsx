// frontend/src/pages/AdminPage.jsx

// --- Importações de Módulos e Componentes ---
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext'; // Contexto para obter informações de autenticação
import { useNavigate } from 'react-router-dom'; // Hook para navegação programática
import { 
  Users, BookOpen, Eye, User as UserIcon, Building, 
  GraduationCap, ChevronUp, ChevronDown, Pencil, 
  Trash2, Save, X 
} from 'lucide-react'; // Ícones para a UI

// --- Definição do Componente ---
function AdminPage() {
  // --- Hooks e Contexto ---
  // Obtém o usuário e o status de autenticação do AuthContext
  const { user, isAuthenticated } = useContext(AuthContext);
  // Hook para redirecionar o usuário se necessário
  const navigate = useNavigate();

  // --- Estados do Componente ---
  // Armazena os dados agregados do dashboard (ex: totais de usuários, atividades)
  const [dashboardData, setDashboardData] = useState(null);
  // Armazena a lista completa de usuários vinda da API
  const [usersList, setUsersList] = useState([]);
  // Controla a exibição do indicador de carregamento
  const [loading, setLoading] = useState(true);
  // Armazena mensagens de erro para exibição na UI
  const [error, setError] = useState(null);
  // Configuração da ordenação da tabela (coluna e direção)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  // Controla qual usuário está em modo de edição (pelo ID)
  const [editingUserId, setEditingUserId] = useState(null);
  // Armazena os dados do formulário de edição do usuário
  const [editFormData, setEditFormData] = useState({});

  console.log("Componente AdminPage renderizado. Estado inicial:", {
    isAuthenticated,
    userRole: user?.role,
    loading,
    error,
  });

  // --- Funções ---

  /**
   * Busca os dados do dashboard e a lista de usuários da API.
   * Esta função é assíncrona e lida com os estados de carregamento e erro.
   */
  const fetchAdminData = async () => {
    console.log("Iniciando busca de dados do administrador...");
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      console.log("Token de autenticação recuperado do localStorage.");
      if (!token) {
        throw new Error("Token de autenticação não encontrado.");
      }

      // Requisição para os dados do dashboard
      console.log("Buscando dados do dashboard...");
      const dashboardResponse = await fetch('http://127.0.0.1:5000/api/admin/dashboard_data', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log("Resposta da API (dashboard):", dashboardResponse);
      if (!dashboardResponse.ok) {
        throw new Error(`Erro na requisição do dashboard: ${dashboardResponse.status} ${dashboardResponse.statusText}`);
      }
      const dashboardJson = await dashboardResponse.json();
      console.log("Dados do dashboard recebidos:", dashboardJson);
      setDashboardData(dashboardJson);

      // Requisição para a lista de usuários
      console.log("Buscando lista de usuários...");
      const usersResponse = await fetch('http://127.0.0.1:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Resposta da API (usuários):", usersResponse);
      if (!usersResponse.ok) {
        throw new Error(`Erro na requisição de usuários: ${usersResponse.status} ${usersResponse.statusText}`);
      }
      const usersJson = await usersResponse.json();
      console.log("Lista de usuários recebida:", usersJson);
      setUsersList(usersJson);

    } catch (e) {
      console.error("Falha ao buscar dados do administrador:", e);
      setError("Não foi possível carregar os dados. Verifique a conexão e se você tem permissão para acessar esta página.");
    } finally {
      setLoading(false);
      console.log("Busca de dados finalizada.");
    }
  };

  // --- Efeitos ---

  // useEffect para verificar a autorização e buscar os dados iniciais
  useEffect(() => {
    console.log("useEffect de autorização e busca de dados disparado.");
    // Se o usuário não está autenticado ou não é um admin, redireciona para a página de login
    if (!isAuthenticated || user?.role !== 'admin') {
      console.warn("Acesso não autorizado. Redirecionando para /login.");
      navigate('/login');
      return; // Interrompe a execução do efeito
    }
    // Se autorizado, busca os dados
    fetchAdminData();
  }, [isAuthenticated, user, navigate]); // Dependências do efeito

  // --- Manipuladores de Eventos (Handlers) ---

  /**
   * Lida com o clique no cabeçalho da tabela para ordenar os dados.
   * @param {string} key - A chave da coluna pela qual ordenar (ex: 'name', 'email').
   */
  const handleSort = (key) => {
    let direction = 'asc';
    // Se já está ordenando pela mesma chave, inverte a direção
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    console.log(`Ordenando pela chave: '${key}', direção: '${direction}'`);
    setSortConfig({ key, direction });
  };

  /**
   * Ativa o modo de edição para uma linha da tabela.
   * @param {object} userItem - O objeto do usuário a ser editado.
   */
  const handleEditClick = (userItem) => {
    console.log(`Entrando em modo de edição para o usuário ID: ${userItem.id}`, userItem);
    setEditingUserId(userItem.id);
    setEditFormData({ ...userItem }); // Preenche o formulário com os dados atuais do usuário
  };

  /**
   * Atualiza o estado do formulário de edição conforme o usuário digita.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - O evento de mudança.
   */
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prevData => {
      const newData = { ...prevData, [name]: value };
      console.log("Dados do formulário de edição atualizados:", newData);
      return newData;
    });
  };

  /**
   * Salva as alterações feitas no formulário de edição enviando uma requisição PUT para a API.
   */
  const handleSaveEdit = async () => {
    console.log(`Tentando salvar alterações para o usuário ID: ${editingUserId}`, editFormData);
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
        console.error("Erro da API ao salvar usuário:", errorData);
        throw new Error(errorData.msg || 'Erro ao salvar as alterações do usuário.');
      }

      console.log("Usuário salvo com sucesso. Resposta:", await response.json());
      setEditingUserId(null); // Sai do modo de edição
      setEditFormData({}); // Limpa o formulário
      fetchAdminData(); // Recarrega os dados para refletir as alterações
    } catch (e) {
      console.error("Erro ao salvar usuário:", e);
      alert(`Erro ao salvar: ${e.message}`);
    }
  };

  /**
   * Cancela o modo de edição, descartando quaisquer alterações.
   */
  const handleCancelEdit = () => {
    console.log("Edição cancelada.");
    setEditingUserId(null);
    setEditFormData({});
  };

  /**
   * Lida com o clique no botão de exclusão de um usuário.
   * @param {number} userId - O ID do usuário a ser excluído.
   * @param {string} userName - O nome do usuário, para a mensagem de confirmação.
   */
  const handleDeleteClick = async (userId, userName) => {
    console.log(`Tentando excluir usuário ID: ${userId}, Nome: ${userName}`);
    if (window.confirm(`Tem certeza que deseja excluir a conta de ${userName} (ID: ${userId})? Esta ação é irreversível.`)) {
      console.log("Confirmação de exclusão recebida.");
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
          console.error("Erro da API ao excluir usuário:", errorData);
          throw new Error(errorData.msg || 'Erro ao excluir a conta do usuário.');
        }

        console.log("Usuário excluído com sucesso. Resposta:", await response.json());
        fetchAdminData(); // Recarrega os dados para remover o usuário da lista
      } catch (e) {
        console.error("Erro ao excluir usuário:", e);
        alert(`Erro ao excluir: ${e.message}`);
      }
    } else {
      console.log("Exclusão cancelada pelo usuário.");
    }
  };

  // --- Memoização ---

  // Ordena a lista de usuários. `useMemo` garante que a ordenação só é refeita
  // quando a lista de usuários ou a configuração de ordenação mudam.
  const sortedUsers = useMemo(() => {
    console.log("Memo de ordenação: recalculando a lista de usuários ordenada.");
    let sortableUsers = [...usersList];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Trata valores nulos ou indefinidos
        if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;

        // Comparação de strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        // Comparação de números
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Fallback para outros tipos
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableUsers;
  }, [usersList, sortConfig]);


  // --- Renderização Condicional ---

  // Exibe enquanto os dados estão sendo carregados
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white">
        <p>Carregando Dashboard...</p>
      </div>
    );
  }

  // Exibe se ocorreu um erro na busca de dados
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <p>Erro: {error}</p>
      </div>
    );
  }

  // --- Renderização Principal ---
  return (
    <div className="min-h-screen w-full bg-dark-background p-4">
      <main className="container mx-auto mt-8 p-4">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard do Administrador</h1>

        {/* Seção de Cards com os dados do dashboard */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Card: Total de Usuários */}
            <div className="bg-gray-700 p-6 rounded-lg shadow-md text-white flex items-center space-x-4">
              <Users size={32} className="text-accent-teal" />
              <div>
                <p className="text-xl font-semibold">Total de Usuários</p>
                <p className="text-3xl font-bold">{dashboardData.total_users}</p>
              </div>
            </div>
            {/* Card: Total de Professores */}
            <div className="bg-gray-700 p-6 rounded-lg shadow-md text-white flex items-center space-x-4">
              <UserIcon size={32} className="text-accent-purple" />
              <div>
                <p className="text-xl font-semibold">Total de Professores</p>
                <p className="text-3xl font-bold">{dashboardData.total_professors}</p>
              </div>
            </div>
             {/* Card: Total de Alunos */}
            <div className="bg-gray-700 p-6 rounded-lg shadow-md text-white flex items-center space-x-4">
              <GraduationCap size={32} className="text-accent-yellow" />
              <div>
                <p className="text-xl font-semibold">Total de Alunos</p>
                <p className="text-3xl font-bold">{dashboardData.total_students}</p>
              </div>
            </div>
            {/* Card: Total de Atividades */}
            <div className="bg-gray-700 p-6 rounded-lg shadow-md text-white flex items-center space-x-4">
              <BookOpen size={32} className="text-blue-400" />
              <div>
                <p className="text-xl font-semibold">Total de Atividades</p>
                <p className="text-3xl font-bold">{dashboardData.total_activities}</p>
              </div>
            </div>
            {/* Card: Visitas (Mock) */}
            <div className="bg-gray-700 p-6 rounded-lg shadow-md text-white flex items-center space-x-4">
              <Eye size={32} className="text-green-400" />
              <div>
                <p className="text-xl font-semibold">Visitas (Mock)</p>
                <p className="text-3xl font-bold">{dashboardData.total_visits}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Lista de Usuários */}
        <h2 className="text-2xl font-bold text-white mb-4">Lista de Usuários</h2>
        <div className="bg-gray-800 rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            {/* Cabeçalho da Tabela */}
            <thead>
              <tr>
                {['id', 'name', 'email', 'role', 'institution_name', 'discipline'].map((key) => (
                  <th key={key} className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-400 dark:bg-gray-950 cursor-pointer hover:text-white transition-colors duration-200"
                      onClick={() => handleSort(key)}>
                    {key.replace('_', ' ')} {/* Formata o nome da coluna */}
                    {sortConfig.key === key && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline ml-1" /> : <ChevronDown size={16} className="inline ml-1" />)}
                  </th>
                ))}
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-400 dark:bg-gray-950">Ações</th>
              </tr>
            </thead>
            {/* Corpo da Tabela */}
            <tbody className="divide-y divide-gray-700">
              {sortedUsers.map((userItem) => (
                <tr key={userItem.id} className="border-b border-gray-600 dark:border-gray-700 hover:bg-gray-600 dark:hover:bg-gray-800">
                  {/* Renderização condicional: modo de edição ou modo de visualização */}
                  {editingUserId === userItem.id ? (
                    // MODO DE EDIÇÃO: Renderiza inputs para alterar os dados
                    <>
                      <td className="py-3 px-4 text-sm text-white">{userItem.id}</td>
                      <td className="py-3 px-4 text-sm">
                        <input type="text" name="name" value={editFormData.name || ''} onChange={handleEditInputChange} className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full"/>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <input type="email" name="email" value={editFormData.email || ''} onChange={handleEditInputChange} className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full"/>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <select name="role" value={editFormData.role || ''} onChange={handleEditInputChange} className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full">
                          <option value="aluno">Aluno</option>
                          <option value="professor">Professor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <input type="text" name="institution_name" value={editFormData.institution_name || ''} onChange={handleEditInputChange} className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full"/>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <input type="text" name="discipline" value={editFormData.discipline || ''} onChange={handleEditInputChange} className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full"/>
                      </td>
                      <td className="py-3 px-4 text-sm flex space-x-2">
                        <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300"><Save size={20} /></button>
                        <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-300"><X size={20} /></button>
                      </td>
                    </>
                  ) : (
                    // MODO DE VISUALIZAÇÃO: Exibe os dados do usuário
                    <>
                      <td className="py-3 px-4 text-sm text-white">{userItem.id}</td>
                      <td className="py-3 px-4 text-sm text-white">{userItem.name}</td>
                      <td className="py-3 px-4 text-sm text-white">{userItem.email}</td>
                      <td className="py-3 px-4 text-sm text-white">{userItem.role}</td>
                      <td className="py-3 px-4 text-sm text-white">{userItem.institution_name || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-white">{userItem.discipline || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm flex space-x-2">
                        <button onClick={() => handleEditClick(userItem)} className="text-blue-400 hover:text-blue-300"><Pencil size={20} /></button>
                        <button onClick={() => handleDeleteClick(userItem.id, userItem.name)} className="text-red-400 hover:text-red-300"><Trash2 size={20} /></button>
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
