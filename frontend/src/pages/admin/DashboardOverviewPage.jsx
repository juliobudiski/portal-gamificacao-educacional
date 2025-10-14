// frontend/src/pages/admin/DashboardOverviewPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Users, BookOpen, GraduationCap, User as UserIcon, Info } from 'lucide-react';
import UserGrowthChart from '../../components/admin/UserGrowthChart';
import TopActivitiesChart from '../../components/admin/TopActivitiesChart';
import RecentActivityFeed from '../../components/admin/RecentActivityFeed';

function DashboardOverviewPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [topActivitiesData, setTopActivitiesData] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchAllDashboardData = async () => {
      setLoading(true);
      setError(null);
      const token = user?.token;
      if (!token) {
        setError("Token de autenticação não encontrado.");
        setLoading(false);
        return;
      }

      try {
        const apiPrefix = `${import.meta.env.VITE_API_URL}/api/admin`;
        const headers = { 'Authorization': `Bearer ${token}` };

        const [
          dashboardRes,
          userGrowthRes,
          topActivitiesRes,
          feedRes
        ] = await Promise.all([
          fetch(`${apiPrefix}/dashboard_data`, { headers }),
          fetch(`${apiPrefix}/stats/user_growth`, { headers }),
          fetch(`${apiPrefix}/stats/top_activities`, { headers }),
          fetch(`${apiPrefix}/feed`, { headers })
        ]);

        // Verificação robusta de erros
        if (!dashboardRes.ok) throw new Error(`Falha ao buscar KPIs: ${dashboardRes.statusText}`);
        if (!userGrowthRes.ok) throw new Error(`Falha ao buscar dados de crescimento: ${userGrowthRes.statusText}`);
        if (!topActivitiesRes.ok) throw new Error(`Falha ao buscar top atividades: ${topActivitiesRes.statusText}`);
        if (!feedRes.ok) throw new Error(`Falha ao buscar feed: ${feedRes.statusText}`);

        // Processa as respostas JSON
        setDashboardData(await dashboardRes.json());
        setUserGrowthData(await userGrowthRes.json());
        setTopActivitiesData(await topActivitiesRes.json());
        setActivityFeed(await feedRes.json());

      } catch (e) {
        console.error("Erro detalhado:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchAllDashboardData();
    }
  }, [user]);

  if (loading) {
    return <div className="text-center text-primary-text p-10">Carregando dados do painel...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-900/40 border border-red-700 p-6 rounded-xl max-w-lg text-center mx-auto">
        <Info className="mx-auto mb-3 text-red-400" size={40} />
        <p className="text-red-300 font-bold text-xl">Ocorreu um Erro</p>
        <p className="text-primary-text mt-2">Não foi possível carregar os dados do painel.</p>
        <p className="text-secondary-text text-sm mt-1">Detalhe: {error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary-text mb-2 bg-gradient-to-r from-accent-teal to-accent-purple bg-clip-text text-transparent">
          Painel Principal
        </h1>
        <p className="text-secondary-text">Visão geral da plataforma em tempo real.</p>
      </div>

      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800/50 p-6 rounded-xl"><Users className="text-accent-teal mb-2" size={24} /> <p className="text-secondary-text">Total de Usuários</p> <p className="text-2xl font-bold text-primary-text">{dashboardData.total_users}</p></div>
          <div className="bg-gray-800/50 p-6 rounded-xl"><UserIcon className="text-accent-purple mb-2" size={24} /> <p className="text-secondary-text">Total de Professores</p> <p className="text-2xl font-bold text-primary-text">{dashboardData.total_professors}</p></div>
          <div className="bg-gray-800/50 p-6 rounded-xl"><GraduationCap className="text-accent-yellow mb-2" size={24} /> <p className="text-secondary-text">Total de Alunos</p> <p className="text-2xl font-bold text-primary-text">{dashboardData.total_students}</p></div>
          <div className="bg-gray-800/50 p-6 rounded-xl"><BookOpen className="text-blue-400 mb-2" size={24} /> <p className="text-secondary-text">Total de Atividades</p> <p className="text-2xl font-bold text-primary-text">{dashboardData.total_activities}</p></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-primary-text mb-4">Crescimento de Usuários (Últimos 30 dias)</h2>
          <UserGrowthChart data={userGrowthData} />
        </div>
        <div className="lg:col-span-1 bg-gray-800/50 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-primary-text mb-4">Atividade Recente</h2>
          <RecentActivityFeed feedItems={activityFeed} />
        </div>
        <div className="lg:col-span-3 bg-gray-800/50 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-primary-text mb-4">Top 5 Atividades Mais Copiadas</h2>
          <TopActivitiesChart data={topActivitiesData} />
        </div>
      </div>
    </div>
  );
}

export default DashboardOverviewPage;

