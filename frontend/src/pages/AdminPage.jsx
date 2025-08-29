// frontend/src/pages/AdminPage.jsx

// --- Importações de Módulos e Componentes ---
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext'; // Contexto para obter informações de autenticação
import { useNavigate } from 'react-router-dom'; // Hook para navegação programática
import { 
  Users, BookOpen, Eye, User as UserIcon, Building, 
  GraduationCap, ChevronUp, ChevronDown, Pencil, 
  Trash2, Save, X, Info, ArrowUpRight, Activity
} from 'lucide-react'; // Ícones para a UI

// Componente auxiliar para formatar e exibir dados JSONB
// ESTE COMPONENTE DEVE SER DEFINIDO FORA DA FUNÇÃO AdminPage
const JsonViewer = ({ data, title }) => {
  if (!data || Object.keys(data).length === 0) {
    return null; // Não renderiza se não houver dados
  }

  // Função para formatar o título da seção
  const formatSectionTitle = (key) => {
    // Adiciona espaço antes de letras maiúsculas e capitaliza a primeira letra
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  };

  // Função para formatar um valor para exibição
  const formatValue = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'N/A';
  }
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }
  // VERIFICAÇÃO ADICIONAL: só usa .trim() se o valor for uma string.
  if (typeof value === 'string' && value.trim() === '') {
    return 'N/A';
  }
  if (value === null || value === undefined) {
    return 'N/A';
  }
  // Converte o valor para string para garantir a renderização.
  return String(value);
};

  return (
    <div className="bg-gray-700 p-4 rounded-xl shadow-md mt-3 border border-gray-600 transition-all duration-300 hover:border-accent-teal/50">
      <h4 className="text-lg font-bold text-accent-teal mb-3 flex items-center">
        <Activity className="mr-2" size={18} />
        {title}
      </h4>
      <div className="space-y-2 text-sm text-gray-300">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-wrap p-2 hover:bg-gray-600 rounded-lg transition-colors">
            <span className="font-semibold text-accent-yellow mr-2">{formatSectionTitle(key)}:</span>
            <span className="text-gray-100">{formatValue(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const [activitiesList, setActivitiesList] = useState([]);
  // Armazena a lista completa de usuários vinda da API
  const [usersList, setUsersList] = useState([]);
  // Controla a exibição do indicador de carregamento
  const [loading, setLoading] = useState(true);
  // Armazena mensagens de erro para exibição na UI
  const [error, setError] = useState(null);
  // Configuração da ordenação da tabela usuarios (coluna e direção)
  const [sortConfigUsers, setSortConfigUsers] = useState({ key: null, direction: 'asc' }); // NOME RENOMEADO
    // Controla qual usuário está em modo de edição (pelo ID)
  const [editingUserId, setEditingUserId] = useState(null);
  // Armazena os dados do formulário de edição do usuário
  const [editFormData, setEditFormData] = useState({});
  // Configuração da ordenação da tabela de atividades (coluna e direção)
  const [sortConfigActivities, setSortConfigActivities] = useState({ key: null, direction: 'asc' }); // NOVO ESTADO
  // Armazena o ID da atividade que está com os detalhes expandidos
  const [expandedActivityId, setExpandedActivityId] = useState(null); // NOVO ESTADO
  // NOVO ESTADO: Controla qual tipo de lista está visível ou filtro está ativo
  // Pode ser 'all_users', 'professors', 'students', 'all_activities' ou null para nenhum filtro.
  const [activeListFilter, setActiveListFilter] = useState(null); // Inicia sem filtro ativo

  console.log("Componente AdminPage renderizado. Estado inicial:", {
    isAuthenticated,
    userRole: user?.role,
    loading,
    error,
    activeListFilter
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

      // NOVO: Requisição para a lista de atividades
      console.log("Buscando lista de atividades...");
      const activitiesResponse = await fetch('http://127.0.0.1:5000/api/admin/activities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Resposta da API (atividades):", activitiesResponse);
      if (!activitiesResponse.ok) {
        throw new Error(`Erro na requisição de atividades: ${activitiesResponse.status} ${activitiesResponse.statusText}`);
      }
      const activitiesJson = await activitiesResponse.json();
      console.log("Lista de atividades recebida:", activitiesJson);
      setActivitiesList(activitiesJson); // ATUALIZA O NOVO ESTADO

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
  const handleSortUsers = (key) => {
    let direction = 'asc';
    // Se já está ordenando pela mesma chave, inverte a direção
    if (sortConfigUsers.key === key && sortConfigUsers.direction === 'asc') {
      direction = 'desc';
    }
    console.log(`Ordenando pela chave: '${key}', direção: '${direction}'`);
    setSortConfigUsers({ key, direction });
  };

  /**
   * Lida com o clique no cabeçalho da tabela de atividades para ordenar os dados.
   * @param {string} key - A chave da coluna pela qual ordenar (ex: 'title', 'createdAt').
   */
  const handleSortActivities = (key) => { // NOVO HANDLER
    let direction = 'asc';
    if (sortConfigActivities.key === key && sortConfigActivities.direction === 'asc') {
      direction = 'desc';
    }
    console.log(`Ordenando atividades pela chave: '${key}', direção: '${direction}'`);
    setSortConfigActivities({ key, direction });
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

  /**
   * Alterna a visibilidade dos detalhes da atividade.
   * @param {number} activityId - O ID da atividade a ser expandida/recolhida.
   */
  const toggleActivityDetails = (activityId) => { // NOVO HANDLER
    console.log(`Alternando detalhes para a atividade ID: ${activityId}`);
    setExpandedActivityId(prevId => (prevId === activityId ? null : activityId));
  };

  // NOVO: Handler para os cliques nos cards do dashboard
  const handleCardClick = (filterType) => {
    console.log(`Card clicado: ${filterType}`);
    // Se o filtro clicado já estiver ativo, desativa (volta para null)
    setActiveListFilter(prevFilter => prevFilter === filterType ? null : filterType);
    // Garante que a ordenação seja redefinida para 'asc' ao mudar o filtro, se desejar
    setSortConfigUsers({ key: null, direction: 'asc' });
    setSortConfigActivities({ key: null, direction: 'asc' });
    setExpandedActivityId(null); // Recolhe qualquer detalhe de atividade expandido
  };


  // --- Memoização ---

  const sortedUsers = useMemo(() => {
    console.log("Memo de ordenação de usuários: recalculando a lista de usuários ordenada.");
    let filteredUsers = [...usersList];

    // Aplicar filtro com base em activeListFilter
    if (activeListFilter === 'professors') {
      filteredUsers = filteredUsers.filter(userItem => userItem.role === 'professor');
    } else if (activeListFilter === 'students') {
      filteredUsers = filteredUsers.filter(userItem => userItem.role === 'aluno');
    } else if (activeListFilter === 'all_users') {
        // Se 'all_users' está ativo, não filtra por role, mostra todos os usuários
        // Já está implícito, mas deixamos explícito para clareza.
    } else {
        // Se activeListFilter não for um filtro de usuário (ex: null, ou 'all_activities'),
        // a tabela de usuários não deve ser mostrada por padrão
        filteredUsers = []; // Adiciona essa linha para esconder a lista de usuários quando nenhum filtro de usuário está ativo
    }


    if (sortConfigUsers.key) {
      filteredUsers.sort((a, b) => {
        const aValue = a[sortConfigUsers.key];
        const bValue = b[sortConfigUsers.key];

        if (aValue === null || aValue === undefined) return sortConfigUsers.direction === 'asc' ? 1 : -1;
        if (bValue === null || bValue === undefined) return sortConfigUsers.direction === 'asc' ? -1 : 1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfigUsers.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfigUsers.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        if (aValue < bValue) return sortConfigUsers.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfigUsers.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filteredUsers; // Retorna a lista filtrada e ordenada
  }, [usersList, sortConfigUsers, activeListFilter]); // Adiciona activeListFilter como dependência


  
  const sortedActivities = useMemo(() => { // ESTE É O BLOCO QUE PRECISA ESTAR NO LUGAR CERTO
    console.log("Memo de ordenação de atividades: recalculando a lista de atividades ordenada.");
    let sortableActivities = [...activitiesList];
    if (sortConfigActivities.key) {
      sortableActivities.sort((a, b) => {
        const aValue = a[sortConfigActivities.key];
        const bValue = b[sortConfigActivities.key];

        if (aValue === null || aValue === undefined) return sortConfigActivities.direction === 'asc' ? 1 : -1;
        if (bValue === null || bValue === undefined) return sortConfigActivities.direction === 'asc' ? -1 : 1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfigActivities.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfigActivities.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Para datas (assumindo formato ISO string)
        if (sortConfigActivities.key === 'createdAt' || sortConfigActivities.key === 'updatedAt') {
            const dateA = new Date(aValue);
            const dateB = new Date(bValue);
            return sortConfigActivities.direction === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        }

        if (aValue < bValue) return sortConfigActivities.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfigActivities.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableActivities;
  }, [activitiesList, sortConfigActivities]);


  // --- Renderização Condicional ---

  // Exibe enquanto os dados estão sendo carregados
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white bg-dark-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="bg-accent-teal/20 w-16 h-16 rounded-full mb-4"></div>
          <p className="text-xl font-semibold">Carregando Dashboard...</p>
        </div>
      </div>
    );
  }

  // Exibe se ocorreu um erro na busca de dados
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-dark-background">
        <div className="bg-red-500/20 p-6 rounded-xl max-w-md text-center">
          <Info className="mx-auto mb-3 text-red-400" size={40} />
          <p className="text-red-300 font-bold text-xl">Erro ao carregar dados</p>
          <p className="text-white mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // --- Renderização Principal ---
  return (
    <div className="min-h-screen w-full bg-dark-background p-4">
      <main className="container mx-auto mt-4 p-4 flex flex-col gap-8">
        {/* Seção do Dashboard */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-accent-teal to-accent-purple bg-clip-text text-transparent">
            Dashboard do Administrador
          </h1>
          <div className="bg-gray-800 px-4 py-2 rounded-full text-gray-300 text-sm font-medium flex items-center">
            <span className="bg-accent-purple/20 w-2 h-2 rounded-full mr-2"></span>
            Online
          </div>
        </div>

        {/* Seção de Cards com os dados do dashboard */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Card: Total de Usuários */}
            <button
              onClick={() => handleCardClick('all_users')}
              className={`relative overflow-hidden p-6 rounded-xl shadow-xl text-white flex flex-col transition-all duration-300 cursor-pointer
                         hover:translate-y-[-5px] hover:shadow-2xl
                         ${activeListFilter === 'all_users' 
                           ? 'ring-2 ring-accent-teal bg-gradient-to-br from-accent-teal/10 via-gray-700 to-gray-800' 
                           : 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900'}`}
            >
              <div className="absolute top-0 right-0 p-2">
                <ArrowUpRight className={`transition-opacity ${activeListFilter === 'all_users' ? 'text-accent-teal opacity-100' : 'text-gray-500 opacity-30'}`} />
              </div>
              <div className="flex items-center mb-4">
                <div className="bg-accent-teal/20 p-3 rounded-lg mr-4">
                  <Users size={32} className="text-accent-teal" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-300">Total de Usuários</p>
                  <p className="text-3xl font-bold">{dashboardData.total_users}</p>
                </div>
              </div>
              <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-accent-teal w-[65%] rounded-full"></div>
              </div>
            </button>
            
            {/* Card: Total de Professores */}
            <button
              onClick={() => handleCardClick('professors')}
              className={`relative overflow-hidden p-6 rounded-xl shadow-xl text-white flex flex-col transition-all duration-300 cursor-pointer
                         hover:translate-y-[-5px] hover:shadow-2xl
                         ${activeListFilter === 'professors' 
                           ? 'ring-2 ring-accent-purple bg-gradient-to-br from-accent-purple/10 via-gray-700 to-gray-800' 
                           : 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900'}`}
            >
              <div className="absolute top-0 right-0 p-2">
                <ArrowUpRight className={`transition-opacity ${activeListFilter === 'professors' ? 'text-accent-purple opacity-100' : 'text-gray-500 opacity-30'}`} />
              </div>
              <div className="flex items-center mb-4">
                <div className="bg-accent-purple/20 p-3 rounded-lg mr-4">
                  <UserIcon size={32} className="text-accent-purple" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-300">Total de Professores</p>
                  <p className="text-3xl font-bold">{dashboardData.total_professors}</p>
                </div>
              </div>
              <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-accent-purple w-[45%] rounded-full"></div>
              </div>
            </button>
            
            {/* Card: Total de Alunos */}
            <button
              onClick={() => handleCardClick('students')}
              className={`relative overflow-hidden p-6 rounded-xl shadow-xl text-white flex flex-col transition-all duration-300 cursor-pointer
                         hover:translate-y-[-5px] hover:shadow-2xl
                         ${activeListFilter === 'students' 
                           ? 'ring-2 ring-accent-yellow bg-gradient-to-br from-accent-yellow/10 via-gray-700 to-gray-800' 
                           : 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900'}`}
            >
              <div className="absolute top-0 right-0 p-2">
                <ArrowUpRight className={`transition-opacity ${activeListFilter === 'students' ? 'text-accent-yellow opacity-100' : 'text-gray-500 opacity-30'}`} />
              </div>
              <div className="flex items-center mb-4">
                <div className="bg-accent-yellow/20 p-3 rounded-lg mr-4">
                  <GraduationCap size={32} className="text-accent-yellow" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-300">Total de Alunos</p>
                  <p className="text-3xl font-bold">{dashboardData.total_students}</p>
                </div>
              </div>
              <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-accent-yellow w-[75%] rounded-full"></div>
              </div>
            </button>
            
            {/* Card: Total de Atividades */}
            <button
              onClick={() => handleCardClick('all_activities')}
              className={`relative overflow-hidden p-6 rounded-xl shadow-xl text-white flex flex-col transition-all duration-300 cursor-pointer
                         hover:translate-y-[-5px] hover:shadow-2xl
                         ${activeListFilter === 'all_activities' 
                           ? 'ring-2 ring-blue-400 bg-gradient-to-br from-blue-400/10 via-gray-700 to-gray-800' 
                           : 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900'}`}
            >
              <div className="absolute top-0 right-0 p-2">
                <ArrowUpRight className={`transition-opacity ${activeListFilter === 'all_activities' ? 'text-blue-400 opacity-100' : 'text-gray-500 opacity-30'}`} />
              </div>
              <div className="flex items-center mb-4">
                <div className="bg-blue-400/20 p-3 rounded-lg mr-4">
                  <BookOpen size={32} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-300">Total de Atividades</p>
                  <p className="text-3xl font-bold">{dashboardData.total_activities}</p>
                </div>
              </div>
              <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-blue-400 w-[55%] rounded-full"></div>
              </div>
            </button>
            
            {/* Card: Visitas (Mock) */}
            <div className="relative overflow-hidden p-6 rounded-xl shadow-xl bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 text-white flex flex-col">
              <div className="flex items-center mb-4">
                <div className="bg-green-400/20 p-3 rounded-lg mr-4">
                  <Eye size={32} className="text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-300">Visitas (Mock)</p>
                  <p className="text-3xl font-bold">{dashboardData.total_visits}</p>
                </div>
              </div>
              <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-green-400 w-[85%] rounded-full"></div>
              </div>
            </div>
          </div>
        )}

    {/* Renderiza a tabela de usuários CONDICIONALMENTE */}
        {(activeListFilter === 'all_users' || activeListFilter === 'professors' || activeListFilter === 'students') && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">
                {activeListFilter === 'professors' ? 'Lista de Professores' :
                 activeListFilter === 'students' ? 'Lista de Alunos' :
                 'Lista de Usuários'}
              </h2>
              <div className="bg-gray-800 px-3 py-1 rounded-full text-gray-300 text-sm">
                {sortedUsers.length} {sortedUsers.length === 1 ? 'registro' : 'registros'}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gradient-to-r from-accent-teal/20 to-accent-purple/10">
                    <tr>
                      {['id', 'name', 'email', 'role', 'institution_name', 'discipline'].map((key) => (
                        <th key={key} className="py-4 px-4 text-left text-sm font-bold uppercase tracking-wider text-gray-300 cursor-pointer group hover:bg-gray-700/30 transition-colors"
                            onClick={() => handleSortUsers(key)}>
                          <div className="flex items-center">
                            {key.replace('_', ' ')}
                            <span className="ml-2">
                              {sortConfigUsers.key === key && (sortConfigUsers.direction === 'asc' 
                                ? <ChevronUp size={16} className="text-accent-yellow" /> 
                                : <ChevronDown size={16} className="text-accent-yellow" />)}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="py-4 px-4 text-right text-sm font-bold uppercase tracking-wider text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {sortedUsers.map((userItem) => (
                      <tr key={userItem.id} 
                          className={`border-b border-gray-600 hover:bg-gray-700/50 transition-colors
                                    ${editingUserId === userItem.id ? 'bg-gray-700/80' : ''}`}>
                        {editingUserId === userItem.id ? (
                          <>
                            <td className="py-4 px-4 text-sm text-white">{userItem.id}</td>
                            <td className="py-4 px-4 text-sm">
                              <input 
                                type="text" 
                                name="name" 
                                value={editFormData.name || ''} 
                                onChange={handleEditInputChange} 
                                className="bg-gray-700 text-white border border-gray-600 rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-accent-teal focus:outline-none transition-all"
                              />
                            </td>
                            <td className="py-4 px-4 text-sm">
                              <input 
                                type="email" 
                                name="email" 
                                value={editFormData.email || ''} 
                                onChange={handleEditInputChange} 
                                className="bg-gray-700 text-white border border-gray-600 rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-accent-teal focus:outline-none transition-all"
                              />
                            </td>
                            <td className="py-4 px-4 text-sm">
                              <select 
                                name="role" 
                                value={editFormData.role || ''} 
                                onChange={handleEditInputChange} 
                                className="bg-gray-700 text-white border border-gray-600 rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-accent-teal focus:outline-none transition-all"
                              >
                                <option value="aluno">Aluno</option>
                                <option value="professor">Professor</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="py-4 px-4 text-sm">
                              <input 
                                type="text" 
                                name="institution_name" 
                                value={editFormData.institution_name || ''} 
                                onChange={handleEditInputChange} 
                                className="bg-gray-700 text-white border border-gray-600 rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-accent-teal focus:outline-none transition-all"
                              />
                            </td>
                            <td className="py-4 px-4 text-sm">
                              <input 
                                type="text" 
                                name="discipline" 
                                value={editFormData.discipline || ''} 
                                onChange={handleEditInputChange} 
                                className="bg-gray-700 text-white border border-gray-600 rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-accent-teal focus:outline-none transition-all"
                              />
                            </td>
                            <td className="py-4 px-4 text-sm flex justify-end space-x-2">
                              <button 
                                onClick={handleSaveEdit} 
                                className="p-2 bg-accent-teal/20 hover:bg-accent-teal/40 rounded-xl transition-colors group"
                                title="Salvar alterações"
                              >
                                <Save size={20} className="text-accent-teal group-hover:text-white" />
                              </button>
                              <button 
                                onClick={handleCancelEdit} 
                                className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl transition-colors group"
                                title="Cancelar edição"
                              >
                                <X size={20} className="text-red-400 group-hover:text-white" />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-4 text-sm font-medium text-accent-yellow">{userItem.id}</td>
                            <td className="py-4 px-4 text-sm text-white font-medium">{userItem.name}</td>
                            <td className="py-4 px-4 text-sm text-gray-300">{userItem.email}</td>
                            <td className="py-4 px-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium
                                ${userItem.role === 'admin' ? 'bg-accent-purple/20 text-accent-purple' : 
                                  userItem.role === 'professor' ? 'bg-blue-400/20 text-blue-400' : 
                                  'bg-accent-yellow/20 text-accent-yellow'}`}>
                                {userItem.role}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-sm text-white">{userItem.institution_name || 'N/A'}</td>
                            <td className="py-4 px-4 text-sm text-white">{userItem.discipline || 'N/A'}</td>
                            <td className="py-4 px-4 text-sm flex justify-end space-x-2">
                              <button 
                                onClick={() => handleEditClick(userItem)} 
                                className="p-2 bg-gray-700 hover:bg-accent-teal/30 rounded-xl transition-colors group"
                                title="Editar usuário"
                              >
                                <Pencil size={18} className="text-gray-400 group-hover:text-accent-teal" />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(userItem.id, userItem.name)} 
                                className="p-2 bg-gray-700 hover:bg-red-500/30 rounded-xl transition-colors group"
                                title="Excluir usuário"
                              >
                                <Trash2 size={18} className="text-gray-400 group-hover:text-red-400" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}


        {/* Renderiza a tabela de atividades CONDICIONALMENTE */}
        {(activeListFilter === 'all_activities') && ( // Mostra por padrão ou quando 'all_activities' é clicado
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Lista de Atividades Criadas</h2>
              <div className="bg-gray-800 px-3 py-1 rounded-full text-gray-300 text-sm">
                {sortedActivities.length} {sortedActivities.length === 1 ? 'atividade' : 'atividades'}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  {/* Cabeçalho da Tabela de Atividades */}
                  <thead className="bg-gradient-to-r from-blue-400/20 to-accent-purple/10">
                    <tr>
                      {['id', 'title', 'professor_name', 'professor_email', 'areaKnowledge', 'isPublic', 'createdAt'].map((key) => (
                        <th key={key} className="py-4 px-4 text-left text-sm font-bold uppercase tracking-wider text-gray-300 cursor-pointer group hover:bg-gray-700/30 transition-colors"
                            onClick={() => handleSortActivities(key)}>
                          <div className="flex items-center">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).replace('professo R_name', 'Professor Name').replace('professo R_email', 'Professor Email').replace('is Public', 'Public')}
                            <span className="ml-2">
                              {sortConfigActivities.key === key && (sortConfigActivities.direction === 'asc' 
                                ? <ChevronUp size={16} className="text-accent-yellow" /> 
                                : <ChevronDown size={16} className="text-accent-yellow" />)}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="py-4 px-4 text-right text-sm font-bold uppercase tracking-wider text-gray-300">Detalhes</th>
                    </tr>
                  </thead>
                  {/* Corpo da Tabela de Atividades */}
                  <tbody className="divide-y divide-gray-700">
                    {sortedActivities.map((activity) => (
                      <React.Fragment key={activity.id}>
                        <tr className={`border-b border-gray-600 hover:bg-gray-700/50 transition-colors
                                      ${expandedActivityId === activity.id ? 'bg-gray-700/50' : ''}`}>
                          <td className="py-4 px-4 text-sm font-medium text-accent-yellow">{activity.id}</td>
                          <td className="py-4 px-4 text-sm font-medium text-white">{activity.title}</td>
                          <td className="py-4 px-4 text-sm text-white">{activity.professor_name || 'N/A'}</td>
                          <td className="py-4 px-4 text-sm text-gray-300">{activity.professor_email || 'N/A'}</td>
                          <td className="py-4 px-4 text-sm">
                            <span className="px-2 py-1 rounded-full bg-blue-400/20 text-blue-400 text-xs font-medium">
                              {activity.areaKnowledge || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                              ${activity.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}`}>
                              {activity.isPublic ? 'Pública' : 'Privada'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-400">
                            {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-4 text-sm text-right">
                            <button 
                              onClick={() => toggleActivityDetails(activity.id)} 
                              className="p-2 bg-gray-700 hover:bg-blue-400/30 rounded-xl transition-colors group"
                              title={expandedActivityId === activity.id ? "Recolher detalhes" : "Expandir detalhes"}
                            >
                              {expandedActivityId === activity.id 
                                ? <ChevronUp size={20} className="text-blue-400 group-hover:text-white" /> 
                                : <ChevronDown size={20} className="text-blue-400 group-hover:text-white" />}
                            </button>
                          </td>
                        </tr>
                        {/* Linha expandida para mostrar detalhes da atividade */}
                        {expandedActivityId === activity.id && (
                          <tr>
                            <td colSpan="8" className="p-4 bg-gray-700/50">
                              <div className="space-y-4 p-4 bg-gray-800 rounded-xl shadow-inner">
                                <div className="mb-4">
                                  <h3 className="text-lg font-bold text-white mb-2">Descrição:</h3>
                                  <p className="text-gray-300 bg-gray-700 p-4 rounded-xl">{activity.description || 'N/A'}</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <JsonViewer data={activity.currentScenario} title="Cenário Atual" />
                                  <JsonViewer data={activity.desiredScenario} title="Cenário Desejado" />
                                  <JsonViewer data={activity.activityPlanning} title="Planejamento" />
                                  <JsonViewer data={activity.playerProfile} title="Perfil do Jogador" />
                                  <JsonViewer data={activity.gameElements} title="Elementos de Jogos" />
                                  <JsonViewer data={activity.rewardsOffered} title="Recompensas" />
                                  <JsonViewer data={activity.rewardedActions} title="Ações Recompensadas" />
                                  <JsonViewer data={activity.gamificationRules} title="Regras de Gamificação" />
                                </div>
                                
                                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                                  <div>
                                    <p className="text-gray-400 text-sm">
                                      <strong>Criado em:</strong> {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 text-sm">
                                      <strong>Última atualização:</strong> {activity.updatedAt ? new Date(activity.updatedAt).toLocaleString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminPage;