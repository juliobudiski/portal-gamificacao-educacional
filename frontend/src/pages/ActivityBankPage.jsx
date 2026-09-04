import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import ActivityCard from '../components/activity/ActivityCard';
import { 
  FaTimes, FaCheckCircle, FaPencilAlt, FaUserEdit, 
  FaGlobeAmericas, FaPlusCircle, FaSearch, FaFilter, 
  FaTrash, FaInbox, FaFolderOpen, FaRocket, FaSpinner,
  FaFileAlt, FaArrowLeft
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import activityService from '../services/activityService';

/**
 * Componente ActivityBankPage
 * 
 * Banco de Atividades Gamificadas para professores.
 * Permite buscar, filtrar, gerenciar rascunhos e clonar atividades públicas com UI/UX de alto nível.
 */
function ActivityBankPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [myActivities, setMyActivities] = useState([]);
  const [publicActivities, setPublicActivities] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [activeTab, setActiveTab] = useState('my'); // 'my', 'drafts', 'public'
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);

  // Estados de Filtro e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState('all'); // 'all', 'assigned', 'unassigned'

  // Modal de Confirmação
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null,
    itemId: null,
    title: '',
    message: ''
  });

  // Busca Atividades do Backend
  const fetchActivities = useCallback(async (currentSearchTerm) => {
    if (!user?.token) return;

    if (currentSearchTerm) setIsSearching(true);
    else setLoading(true);

    setMessage('');
    try {
      const headers = { 'Authorization': `Bearer ${user.token}` };
      const query = currentSearchTerm ? `?search=${encodeURIComponent(currentSearchTerm)}` : '';

      const [myRes, publicRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/activities/my_activities${query}`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/activities/public${query}`, { headers })
      ]);

      const myData = await myRes.json();
      const publicData = await publicRes.json();

      if (!currentSearchTerm) {
        const draftsData = await activityService.getDrafts();
        setDrafts(draftsData || []);
      }

      if (myRes.ok) setMyActivities(myData || []);
      else throw new Error(myData.message || 'Erro ao buscar minhas atividades');

      if (publicRes.ok) setPublicActivities(publicData || []);
      else throw new Error(publicData.message || 'Erro ao buscar atividades públicas');

    } catch (error) {
      setMessage(error.message);
    } fontFinally: {
      setLoading(false);
      setIsSearching(false);
    }
  }, [user?.token]);

  // Debounce na busca
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchActivities(searchTerm);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchActivities]);

  // Ações de Confirmação
  const handleCopyClick = (activityId) => {
    setModalConfig({
      isOpen: true,
      type: 'copy',
      itemId: activityId,
      title: 'Clonar Atividade',
      message: 'Deseja criar uma cópia editável desta atividade na sua coleção "Minhas Atividades"?'
    });
  };

  const handleDeleteClick = (activityId) => {
    setModalConfig({
      isOpen: true,
      type: 'delete_single',
      itemId: activityId,
      title: 'Excluir Atividade',
      message: 'Tem certeza que deseja excluir esta atividade? Essa ação não poderá ser desfeita.'
    });
  };

  const handleBulkDeleteClick = () => {
    if (selectedActivities.length === 0) return;
    setModalConfig({
      isOpen: true,
      type: 'delete_bulk',
      itemId: null,
      title: 'Excluir em Lote',
      message: `Tem certeza que deseja excluir as ${selectedActivities.length} atividades selecionadas? Essa ação é irreversível.`
    });
  };

  const executeModalAction = async () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    const { type, itemId } = modalConfig;

    if (type === 'copy') await performCopyActivity(itemId);
    else if (type === 'delete_single') await performDeleteActivity(itemId);
    else if (type === 'delete_bulk') await performBulkDelete();
  };

  const performCopyActivity = async (activityId) => {
    setMessage('Duplicando atividade...');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}/copy`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Atividade clonada com sucesso! Ela foi adicionada a "Minhas Atividades".');
        setMyActivities(prev => [data.activity, ...prev]);
        setActiveTab('my');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setMessage(`Erro ao copiar: ${error.message}`);
    }
  };

  const performDeleteActivity = async (activityId) => {
    setMessage('Excluindo...');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Atividade removida com sucesso!');
        setMyActivities(prev => prev.filter(act => act.id !== activityId));
        setDrafts(prev => prev.filter(d => d.id !== activityId));
        setSelectedActivities(prev => prev.filter(id => id !== activityId));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setMessage(`Erro ao deletar: ${error.message}`);
    }
  };

  const performBulkDelete = async () => {
    if (selectedActivities.length === 0) return;
    setMessage('Excluindo itens selecionados...');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activity_ids: selectedActivities })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Atividades excluídas com sucesso.');
        if (activeTab === 'my') {
          setMyActivities(prev => prev.filter(act => !selectedActivities.includes(act.id)));
        } else if (activeTab === 'drafts') {
          setDrafts(prev => prev.filter(d => !selectedActivities.includes(d.id)));
        }
        setSelectedActivities([]);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setMessage(`Erro ao deletar em lote: ${error.message}`);
    }
  };

  // Lista visível conforme aba ativa e filtros
  const currentList = useMemo(() => {
    if (activeTab === 'drafts') return drafts;
    if (activeTab === 'public') return publicActivities;

    if (assignmentFilter === 'assigned') {
      return myActivities.filter(a => a.class_id !== null);
    }
    if (assignmentFilter === 'unassigned') {
      return myActivities.filter(a => a.class_id === null);
    }
    return myActivities;
  }, [activeTab, drafts, publicActivities, myActivities, assignmentFilter]);

  const isAllSelected = useMemo(() => {
    const visibleIds = currentList.map(a => a.id);
    return visibleIds.length > 0 && visibleIds.every(id => selectedActivities.includes(id));
  }, [selectedActivities, currentList]);

  const handleSelectAll = () => {
    const visibleIds = currentList.map(a => a.id);
    if (isAllSelected) {
      setSelectedActivities([]);
    } else {
      setSelectedActivities(visibleIds);
    }
  };

  const handleSelectActivity = (activityId) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId) 
        : [...prev, activityId]
    );
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedActivities([]);
    setAssignmentFilter('all');
  };

  return (
    <div className="min-h-screen bg-primary-bg p-4 sm:p-6 lg:p-8 text-primary-text transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <button 
            onClick={() => navigate(-1)} 
            className="group mb-2 flex items-center gap-2 text-secondary-text hover:text-accent-teal transition-colors font-bold uppercase tracking-widest text-sm"
        >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Voltar
        </button>

        {/* Hero Section */}

        {/* Hero Header Section */}
        <div className="relative bg-gradient-to-r from-teal-900/40 via-secondary-bg to-purple-900/30 border border-border-color p-6 md:p-8 rounded-3xl shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-accent-teal/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-accent-yellow/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-teal/10 border border-accent-teal/20 text-accent-teal text-xs font-bold mb-3">
                <FaRocket /> <span>Gamificação Educacional</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-text">
                Banco de Atividades
              </h1>
              <p className="mt-2 text-sm sm:text-base text-secondary-text max-w-xl">
                Explore, crie e compartilhe sequências didáticas gamificadas para engajar seus alunos com quizzes e narrativas interativas.
              </p>
            </div>

            <Link
              to="/professor/criar-atividade"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-teal-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <FaPlusCircle className="text-base" />
              <span>Criar Nova Atividade</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 pt-6 border-t border-border-color/60">
            <div className="bg-primary-bg/60 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-border-color text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-accent-teal">{myActivities.length}</span>
              <p className="text-xs text-secondary-text font-medium mt-0.5">Minhas Atividades</p>
            </div>
            <div className="bg-primary-bg/60 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-border-color text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-500">{drafts.length}</span>
              <p className="text-xs text-secondary-text font-medium mt-0.5">Rascunhos Pendentes</p>
            </div>
            <div className="bg-primary-bg/60 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-border-color text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-purple-500">{publicActivities.length}</span>
              <p className="text-xs text-secondary-text font-medium mt-0.5">Banco Público</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Control Card */}
        <div className="bg-secondary-bg p-4 sm:p-6 rounded-2xl border border-border-color shadow-sm space-y-4">
          
          {/* Barra de Pesquisa */}
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar por título, palavra-chave ou área de conhecimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-primary-bg border border-border-color focus:border-accent-teal rounded-xl py-3.5 pl-11 pr-10 text-sm text-primary-text placeholder-secondary-text outline-none transition-all shadow-inner"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-text">
              {isSearching ? <FaSpinner className="animate-spin text-accent-teal" /> : <FaSearch />}
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary-text hover:text-primary-text"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Abas de Navegação */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border-color/60">
            <div className="flex flex-wrap items-center gap-2">
              {/* Aba Minhas Atividades */}
              <button
                onClick={() => handleTabChange('my')}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all
                  ${activeTab === 'my' 
                    ? 'bg-accent-teal text-white shadow-md' 
                    : 'bg-primary-bg text-secondary-text hover:text-primary-text hover:bg-border-color/50'}
                `}
              >
                <FaUserEdit />
                <span>Minhas Atividades</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'my' ? 'bg-white/20 text-white' : 'bg-secondary-bg text-secondary-text'}`}>
                  {myActivities.length}
                </span>
              </button>

              {/* Aba Rascunhos */}
              <button
                onClick={() => handleTabChange('drafts')}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all
                  ${activeTab === 'drafts' 
                    ? 'bg-amber-500 text-white shadow-md' 
                    : 'bg-primary-bg text-secondary-text hover:text-primary-text hover:bg-border-color/50'}
                `}
              >
                <FaPencilAlt />
                <span>Rascunhos</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'drafts' ? 'bg-white/20 text-white' : 'bg-secondary-bg text-secondary-text'}`}>
                  {drafts.length}
                </span>
              </button>

              {/* Aba Banco Público */}
              <button
                onClick={() => handleTabChange('public')}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all
                  ${activeTab === 'public' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-primary-bg text-secondary-text hover:text-primary-text hover:bg-border-color/50'}
                `}
              >
                <FaGlobeAmericas />
                <span>Banco Público</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'public' ? 'bg-white/20 text-white' : 'bg-secondary-bg text-secondary-text'}`}>
                  {publicActivities.length}
                </span>
              </button>
            </div>

            {/* Checkbox Selecionar Todos */}
            {activeTab !== 'public' && currentList.length > 0 && (
              <div 
                onClick={handleSelectAll}
                className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl bg-primary-bg border border-border-color hover:border-accent-teal transition-all text-xs font-semibold text-secondary-text"
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => {}}
                  className="h-4 w-4 rounded text-accent-teal focus:ring-accent-teal cursor-pointer"
                />
                <span>Selecionar Todos</span>
              </div>
            )}
          </div>

          {/* Sub-Filtros para "Minhas Atividades" */}
          {activeTab === 'my' && (
            <div className="flex items-center gap-2 pt-3 border-t border-border-color/40 text-xs">
              <span className="text-secondary-text font-semibold flex items-center gap-1 mr-1">
                <FaFilter className="text-accent-teal" /> Status:
              </span>

              <button
                onClick={() => setAssignmentFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  assignmentFilter === 'all' 
                    ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/40' 
                    : 'bg-primary-bg text-secondary-text hover:bg-border-color/40'
                }`}
              >
                Todas ({myActivities.length})
              </button>

              <button
                onClick={() => setAssignmentFilter('assigned')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  assignmentFilter === 'assigned' 
                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' 
                    : 'bg-primary-bg text-secondary-text hover:bg-border-color/40'
                }`}
              >
                Atribuídas ({myActivities.filter(a => a.class_id !== null).length})
              </button>

              <button
                onClick={() => setAssignmentFilter('unassigned')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  assignmentFilter === 'unassigned' 
                    ? 'bg-purple-500/20 text-purple-500 border border-purple-500/40' 
                    : 'bg-primary-bg text-secondary-text hover:bg-border-color/40'
                }`}
              >
                Modelos Livres ({myActivities.filter(a => a.class_id === null).length})
              </button>
            </div>
          )}
        </div>

        {/* Floating Action Bar (Excluir em lote) */}
        {selectedActivities.length > 0 && (
          <div className="sticky top-4 z-30 bg-gradient-to-r from-indigo-900/90 to-purple-900/90 backdrop-blur-md border border-indigo-500/50 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center font-bold text-sm">
                {selectedActivities.length}
              </span>
              <p className="font-semibold text-sm">
                {selectedActivities.length === 1 ? '1 atividade selecionada' : `${selectedActivities.length} atividades selecionadas`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedActivities([])}
                className="px-3 py-1.5 text-xs text-secondary-text hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDeleteClick}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition-all active:scale-95"
              >
                <FaTrash />
                <span>Excluir Selecionados</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          /* Skeleton Loading Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-secondary-bg h-80 rounded-2xl border border-border-color p-5 animate-pulse flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-24 bg-primary-bg rounded-xl"></div>
                  <div className="h-6 bg-primary-bg rounded w-3/4"></div>
                  <div className="h-4 bg-primary-bg rounded w-1/2"></div>
                </div>
                <div className="h-10 bg-primary-bg rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {/* Renderização da Aba Ativa */}
            {currentList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'drafts' ? (
                  /* Cards Especiais de Rascunhos */
                  currentList.map(draft => (
                    <div 
                      key={draft.id}
                      className={`
                        group relative flex flex-col justify-between bg-secondary-bg border rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300
                        ${selectedActivities.includes(draft.id) ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-border-color hover:border-amber-500/40'}
                      `}
                    >
                      <div>
                        {/* Top Bar Rascunho */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedActivities.includes(draft.id)}
                              onChange={() => handleSelectActivity(draft.id)}
                              className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                            />
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                              <FaPencilAlt className="text-[10px]" /> Rascunho
                            </span>
                          </div>

                          <span className="text-[11px] text-secondary-text">
                            Expira em 7 dias
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-primary-text mb-2 line-clamp-1 group-hover:text-amber-500 transition-colors">
                          {draft.title || 'Atividade Sem Título'}
                        </h3>
                        <p className="text-xs text-secondary-text mb-4">
                          Última edição: {new Date(draft.updatedAt || draft.updated_at).toLocaleDateString('pt-BR')} às {new Date(draft.updatedAt || draft.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-border-color flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/professor/criar-atividade/${draft.id}`)}
                          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <FaPencilAlt />
                          <span>Continuar Edição</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(draft.id)}
                          className="p-2.5 bg-primary-bg hover:bg-red-500/20 text-red-500 rounded-xl border border-border-color hover:border-red-500/40 transition-colors"
                          title="Descartar Rascunho"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  /* Cards Padrão de Atividades */
                  currentList.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      isOwner={activeTab === 'my'}
                      onDelete={handleDeleteClick}
                      onCopy={handleCopyClick}
                      isSelected={selectedActivities.includes(activity.id)}
                      onSelect={handleSelectActivity}
                    />
                  ))
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-secondary-bg border border-border-color rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 my-8">
                <div className="w-16 h-16 bg-primary-bg rounded-2xl border border-border-color flex items-center justify-center mx-auto text-accent-teal text-2xl shadow-inner">
                  {activeTab === 'drafts' ? <FaFileAlt /> : activeTab === 'public' ? <FaGlobeAmericas /> : <FaFolderOpen />}
                </div>
                <h3 className="text-xl font-bold text-primary-text">
                  {searchTerm ? 'Nenhum resultado encontrado' : activeTab === 'drafts' ? 'Nenhum rascunho em andamento' : activeTab === 'public' ? 'Nenhuma atividade pública disponível' : 'Sua coleção está vazia'}
                </h3>
                <p className="text-sm text-secondary-text leading-relaxed">
                  {searchTerm 
                    ? `Não encontramos atividades correspondentes a "${searchTerm}". Tente outros termos de busca.` 
                    : activeTab === 'drafts' 
                    ? 'Você não possui rascunhos salvos recentemente. Comece a criar uma nova atividade!' 
                    : 'Crie sua primeira atividade gamificada e compartilhe com suas turmas.'}
                </p>
                {activeTab !== 'public' && !searchTerm && (
                  <Link
                    to="/professor/criar-atividade"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-teal hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow transition-all mt-2"
                  >
                    <FaPlusCircle />
                    <span>Criar Atividade Agora</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Toast de Feedback */}
      {message && (
        <div className="fixed bottom-5 right-5 z-50 animate-slide-in-right">
          <div className="bg-secondary-bg border-l-4 border-accent-teal text-primary-text px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px] max-w-md border border-border-color">
            <div className="text-accent-teal text-xl">
              <FaCheckCircle />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{message}</p>
            </div>
            <button
              onClick={() => setMessage('')}
              className="text-secondary-text hover:text-primary-text transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeModalAction}
        title={modalConfig.title}
        message={modalConfig.message}
        isDangerous={modalConfig.type !== 'copy'}
        confirmText={modalConfig.type === 'copy' ? 'Sim, Clonar' : 'Sim, Excluir'}
      />
    </div>
  );
}

export default ActivityBankPage;
