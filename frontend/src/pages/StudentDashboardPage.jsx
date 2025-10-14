// src/pages/StudentDashboardPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  FaBook, FaChalkboardTeacher, FaChevronRight,
  FaStar, FaTrophy, FaTasks, FaUserGraduate
} from 'react-icons/fa';

/**
 * Cartão que representa uma turma no dashboard
 * @component
 * @param {Object} props
 * @param {Object} props.classInfo - Dados da turma
 */
const ClassCard = ({ classInfo }) => {
  if (import.meta.env.VITE_DEBUG_MODE) {
    console.debug('[ClassCard] Renderizando turma:', classInfo.id);
  }

  return (
    <div className="bg-[#3a4046] rounded-2xl shadow-xl border-l-4 border-[#ffbd30] p-6 flex flex-col justify-between transform hover:-translate-y-1 transition-all duration-300">
      <div>
        <h3 className="text-xl font-bold text-primary-text mb-2">{classInfo.name}</h3>
        <div className="flex items-center text-sm text-secondary-text mb-4">
          <FaChalkboardTeacher className="mr-2 text-[#69e8cb]" />
          <span>{classInfo.professor_name}</span>
        </div>
        <p className="text-secondary-text text-sm mb-4">{classInfo.description}</p>
      </div>
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm font-semibold text-primary-text px-3 py-1 bg-[#69e8cb]/20 text-[#69e8cb] rounded-full">
          {classInfo.activities_count} atividades
        </span>
        <Link
          to={`/classes/${classInfo.id}`}
          className="font-bold text-[#ffbd30] hover:text-yellow-300 flex items-center"
        >
          Acessar <FaChevronRight className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

ClassCard.propTypes = {
  classInfo: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    professor_name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    activities_count: PropTypes.number.isRequired
  }).isRequired
};

/**
 * Cartão que representa uma atividade pendente
 * @component
 * @param {Object} props
 * @param {Object} props.activity - Dados da atividade
 */
const ActivityCard = ({ activity }) => {
  if (import.meta.env.VITE_DEBUG_MODE) {
    console.debug('[ActivityCard] Renderizando atividade:', activity.id);
  }

  return (
    <div className="bg-[#3a4046] p-4 rounded-xl flex items-center justify-between hover:bg-[#4a525a] transition-colors">
      <div>
        <p className="font-bold text-primary-text">{activity.title}</p>
        <p className="text-sm text-secondary-text">{activity.class_name}</p>
      </div>
      <Link
        to={`/activities/${activity.id}`}
        className="py-2 px-4 bg-gradient-to-r from-[#69e8cb] to-[#4dd1b3] text-[#2c3135] font-bold rounded-lg text-sm"
      >
        Ver Atividade
      </Link>
    </div>
  );
};

ActivityCard.propTypes = {
  activity: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    class_name: PropTypes.string.isRequired
  }).isRequired
};

/**
 * Componente principal da página do Dashboard do Aluno
 * @component
 * @returns {JSX.Element}
 */
function StudentDashboardPage() {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.debug('[StudentDashboardPage] Iniciando carregamento');
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          const errMsg = "Token não encontrado";
          if (import.meta.env.VITE_DEBUG_MODE) {
            console.warn('[StudentDashboardPage] Erro de autenticação:', errMsg);
          }
          throw new Error(errMsg);
        }

        if (import.meta.env.VITE_DEBUG_MODE) {
          console.debug('[StudentDashboardPage] Buscando dados da API...');
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errMsg = errorData.message || `Erro HTTP: ${response.status}`;
          if (import.meta.env.VITE_DEBUG_MODE) {
            console.error('[StudentDashboardPage] Erro na resposta:', {
              status: response.status,
              message: errMsg
            });
          }
          throw new Error(errMsg);
        }

        const data = await response.json();

        if (import.meta.env.VITE_DEBUG_MODE) {
          console.debug('[StudentDashboardPage] Dados recebidos:', {
            classes: data.classes?.length || 0,
            activities: data.pendingActivities?.length || 0
          });
        }

        setDashboardData(data);
      } catch (err) {
        console.error('[StudentDashboardPage] Erro crítico:', err);
        setError(err.message);

        if (import.meta.env.VITE_DEBUG_MODE) {
          console.trace('[StudentDashboardPage] Stack trace do erro');
        }
      } finally {
        setLoading(false);
        if (import.meta.env.VITE_DEBUG_MODE) {
          console.debug('[StudentDashboardPage] Carregamento finalizado');
        }
      }
    };

    fetchDashboardData();
  }, []);

  // Renderização condicional
  if (loading) {
    return <div className="text-center p-10 text-primary-text">Carregando seu dashboard...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Erro: {error}</div>;
  }

  if (!dashboardData) {
    return <div className="text-center p-10 text-primary-text">Nenhum dado encontrado</div>;
  }

  if (import.meta.env.VITE_DEBUG_MODE) {
    console.debug('[StudentDashboardPage] Renderizando dashboard');
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e2226] to-[#2c3135] p-4 md:p-8 text-primary-text">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho de Boas-vindas */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Bem-vindo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd30] to-[#69e8cb]">{user?.name || 'Aluno'}</span>!
          </h1>
          <p className="mt-2 text-lg text-secondary-text">Pronto para a sua próxima jornada de aprendizado?</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal (Turmas e Atividades) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Seção Minhas Turmas */}
            <section>
              <div className="flex items-center mb-6">
                <FaBook className="text-3xl text-[#ffbd30] mr-4" />
                <h2 className="text-3xl font-bold">Minhas Turmas</h2>
              </div>
              {dashboardData.classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dashboardData.classes.map(cls => (
                    <ClassCard key={cls.id} classInfo={cls} />
                  ))}
                </div>
              ) : (
                <p className="text-secondary-text">Você ainda não está matriculado em nenhuma turma.</p>
              )}
            </section>

            {/* Seção Minhas Atividades Pendentes */}
            <section>
              <div className="flex items-center mb-6">
                <FaTasks className="text-3xl text-[#69e8cb] mr-4" />
                <h2 className="text-3xl font-bold">Minhas Atividades</h2>
              </div>
              {dashboardData.pendingActivities.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.pendingActivities.map(activity => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <p className="text-secondary-text">Nenhuma atividade disponível no momento.</p>
              )}
            </section>
          </div>

          {/* Coluna Lateral (Desempenho e Ações Rápidas) */}
          <aside className="space-y-8">
            {/* Card de Desempenho */}
            <section className="bg-secondary-bg p-6 rounded-2xl shadow-xl border-t-4 border-[#9570d9]">
              <h2 className="text-2xl font-bold mb-6 text-center">Meu Desempenho</h2>
              <div className="space-y-5">
                <div className="flex items-center p-4 bg-primary-bg rounded-lg">
                  <FaStar className="text-3xl text-yellow-400 mr-4" />
                  <div>
                    <p className="text-sm text-secondary-text">Pontuação Total</p>
                    <p className="text-2xl font-bold">{dashboardData.performance.totalPoints}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-primary-bg rounded-lg">
                  <FaUserGraduate className="text-3xl text-green-400 mr-4" />
                  <div>
                    <p className="text-sm text-secondary-text">Nível Atual</p>
                    <p className="text-2xl font-bold">{dashboardData.performance.level}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-primary-bg rounded-lg">
                  <FaTrophy className="text-3xl text-purple-400 mr-4" />
                  <div>
                    <p className="text-sm text-secondary-text">Conquistas</p>
                    <p className="text-2xl font-bold">{dashboardData.performance.achievements}</p>
                  </div>
                </div>
              </div>
              <Link to="/aluno/desempenho" className="block w-full text-center mt-6 py-2 px-4 bg-[#9570d9] hover:bg-purple-600 rounded-lg font-semibold">
                Ver Detalhes
              </Link>
            </section>

            {/* Card de Ações Rápidas */}
            <section className="bg-secondary-bg p-6 rounded-2xl shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-center">Ações Rápidas</h2>
              <Link to="/aluno/entrar-turma" className="block w-full text-center mb-3 py-3 px-4 bg-gradient-to-r from-[#ffbd30] to-[#ffa000] text-[#2c3135] hover:opacity-90 rounded-lg font-bold">
                Entrar em Nova Turma
              </Link>
              <Link to="/aluno/minhas-atividades" className="block w-full text-center py-3 px-4 bg-[#69e8cb] text-[#2c3135] hover:opacity-90 rounded-lg font-bold">
                Ver Todas as Atividades
              </Link>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}

// Componentes auxiliares
const LoadingView = () => (
  <div className="text-center p-10 text-primary-text">Carregando seu dashboard...</div>
);

const ErrorView = ({ error }) => (
  <div className="text-center p-10 text-red-500">Erro: {error}</div>
);

const EmptyDataView = () => (
  <div className="text-center p-10 text-primary-text">Nenhum dado encontrado para o dashboard.</div>
);

export default StudentDashboardPage;
