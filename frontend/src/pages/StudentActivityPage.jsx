// src/pages/StudentActivityPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Ajuste o caminho conforme sua estrutura
import { Link } from 'react-router-dom';
import {
  FaSearch, FaFilter, FaCheckCircle, FaClock, FaTimesCircle, FaCalendarAlt, FaTrophy, FaChevronRight
} from 'react-icons/fa';

/**
 * Componente de Badge para Status
 */
const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
    completed: "bg-green-500/20 text-green-500 border-green-500/50",
    expired: "bg-red-500/20 text-red-500 border-red-500/50",
  };

  const icons = {
    pending: <FaClock className="mr-1" />,
    completed: <FaCheckCircle className="mr-1" />,
    expired: <FaTimesCircle className="mr-1" />,
  };

  const labels = {
    pending: "Pendente",
    completed: "Concluída",
    expired: "Expirada",
  };

  return (
    <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
      {icons[status]} {labels[status]}
    </span>
  );
};

/**
 * StudentActivityPage
 * 
 * Architectural intent: Orchestrates the display and filtering of a student's assigned activities.
 * It acts as a Container component, fetching activity data, computing real-time status (pending, completed,
 * expired), and managing local state for search and status filters, decoupling the complex business logic
 * from the UI presentation.
 */
const StudentActivityPage = () => {
  const { user } = useContext(AuthContext);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // pending, completed, expired, all
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');

        // CHAMADA REAL À API
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/activities/all`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao buscar atividades');
        }

        const data = await response.json();

        // O backend já retorna no formato correto, basta setar o estado
        setActivities(data);

      } catch (error) {
        console.error("Erro ao buscar atividades", error);
        // Opcional: Setar um estado de erro para mostrar na tela
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Lógica de Filtragem e Busca
  const getFilteredActivities = () => {
    return activities.filter(activity => {
      // 1. Filtro de Busca (Texto)
      const titleMatch = activity.title ? activity.title.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const classMatch = activity.class_name ? activity.class_name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const matchesSearch = titleMatch || classMatch;

      if (!matchesSearch) return false;

      // 2. Cálculo de Status Real
      const isExpired = activity.expiresAt && new Date(activity.expiresAt) < new Date();
      const status = activity.is_completed ? 'completed' : (isExpired ? 'expired' : 'pending');

      // 3. Filtro de Aba (Status)
      if (filterStatus === 'all') return true;
      return status === filterStatus;
    });
  };

  const filteredList = getFilteredActivities();

  if (loading) {
    return <div className="text-center p-10 text-primary-text">Carregando atividades...</div>;
  }

  return (
    <div className="min-h-screen bg-primary-bg p-4 md:p-8 text-primary-text">
      <div className="max-w-5xl mx-auto">

        {/* Cabeçalho */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#69e8cb] to-[#4dd1b3]">
              Banco de Atividades
            </h1>
            <p className="text-secondary-text mt-1">Gerencie suas tarefas e consulte seu histórico.</p>
          </div>

          {/* Barra de Busca */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Buscar atividade ou matéria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary-bg border border-border-color rounded-lg py-2 pl-10 pr-4 text-primary-text focus:outline-none focus:border-[#69e8cb] transition-colors"
            />
            <FaSearch className="absolute left-3 top-3 text-secondary-text" />
          </div>
        </div>

        {/* Abas de Filtro */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 border-b border-border-color/30">
          {[
            { id: 'pending', label: 'Pendentes', icon: FaClock },
            { id: 'completed', label: 'Concluídas', icon: FaCheckCircle },
            { id: 'expired', label: 'Não Realizadas', icon: FaTimesCircle },
            { id: 'all', label: 'Todas', icon: FaFilter },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`
                flex items-center px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
                ${filterStatus === tab.id
                  ? 'bg-[#9570d9] text-white shadow-lg scale-105'
                  : 'bg-secondary-bg text-secondary-text hover:bg-hover-bg-color'}
              `}
            >
              <tab.icon className="mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Lista de Atividades */}
        <div className="space-y-4">
          {filteredList.length > 0 ? (
            filteredList.map((activity) => {
              // Recalcula status para renderização do item
              const isExpired = activity.expiresAt && new Date(activity.expiresAt) < new Date();
              const status = activity.is_completed ? 'completed' : (isExpired ? 'expired' : 'pending');

              return (
                <div
                  key={activity.id}
                  className={`
                    relative bg-secondary-bg p-5 rounded-xl border-l-4 shadow-md hover:shadow-lg transition-all duration-300
                    ${status === 'pending' ? 'border-[#ffbd30]' : status === 'completed' ? 'border-green-500' : 'border-red-500 opacity-75 hover:opacity-100'}
                  `}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">

                    {/* Info Principal */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusBadge status={status} />
                        <span className="text-xs font-semibold text-secondary-text bg-primary-bg px-2 py-1 rounded">
                          {activity.class_name}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-primary-text mb-1">{activity.title}</h3>
                      <p className="text-sm text-secondary-text line-clamp-1">{activity.description}</p>
                      {/* --- BARRA DE PROGRESSO (NOVO) --- */}
                      <div className="w-full max-w-xs mt-2">
                        <div className="flex justify-between text-xs text-secondary-text mb-1">
                          <span>Progresso</span>
                          <span>{activity.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-primary-bg rounded-full h-2.5 border border-border-color">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${activity.progress_percentage === 100 ? 'bg-green-500' : 'bg-[#69e8cb]'
                              }`}
                            style={{ width: `${activity.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      {/* --------------------------------- */}
                    </div>

                    {/* Info Gamificação e Datas */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 min-w-[140px]">

                      {/* Recompensa / Nota */}
                      <div className="text-right">
                        {status === 'completed' ? (
                          <div className="flex items-center text-green-400 font-bold">
                            <FaTrophy className="mr-2" /> +{activity.xp_earned || activity.xp_reward} XP
                          </div>
                        ) : (
                          <div className="flex items-center text-[#ffbd30] text-sm">
                            <span>Recompensa: {activity.xp_reward} XP</span>
                          </div>
                        )}
                      </div>

                      {/* Data */}
                      <div className="flex items-center text-sm text-secondary-text">
                        <FaCalendarAlt className="mr-2" />
                        {activity.expiresAt
                          ? new Date(activity.expiresAt).toLocaleDateString('pt-BR')
                          : 'Sem prazo'}
                      </div>

                      {/* Botão de Ação */}
                      <Link
                        to={status === 'expired' ? '#' : `/activities/${activity.id}`}
                        className={`
                          hidden md:flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-colors
                          ${status === 'pending'
                            ? 'bg-[#69e8cb] text-[#2c3135] hover:bg-[#4dd1b3]'
                            : status === 'completed'
                              ? 'bg-secondary-bg border border-border-color text-primary-text hover:bg-hover-bg-color'
                              : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
                        `}
                        style={{ pointerEvents: status === 'expired' ? 'none' : 'auto' }}
                      >
                        {status === 'pending' ? 'Começar' : status === 'completed' ? 'Revisar' : 'Encerrada'}
                        {status !== 'expired' && <FaChevronRight className="ml-2" />}
                      </Link>
                    </div>
                  </div>

                  {/* Botão Mobile (Aparece só em telas pequenas) */}
                  <Link
                    to={status === 'expired' ? '#' : `/activities/${activity.id}`}
                    className={`
                        mt-4 w-full md:hidden flex justify-center items-center px-4 py-3 rounded-lg font-bold text-sm transition-colors
                        ${status === 'pending'
                        ? 'bg-[#69e8cb] text-[#2c3135]'
                        : status === 'completed'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-800 text-gray-500'}
                      `}
                  >
                    {status === 'pending' ? 'Começar Atividade' : status === 'completed' ? 'Ver Detalhes' : 'Atividade Encerrada'}
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-secondary-bg rounded-xl border border-dashed border-border-color">
              <div className="text-6xl mb-4 opacity-20">📂</div>
              <h3 className="text-xl font-bold text-secondary-text">Nenhuma atividade encontrada</h3>
              <p className="text-sm text-secondary-text mt-2">Tente mudar o filtro ou buscar por outro termo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentActivityPage;