import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Trophy, Star, Target, BookOpen, Sword, Shield, Zap,
  Clock, CheckCircle, TrendingUp, Crosshair, Activity as ActivityIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes UI
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
    {children}
  </div>
);

const StatBox = ({ label, value, subtext, icon: Icon, color }) => (
  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex items-start justify-between relative overflow-hidden group hover:shadow-md transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
    <div className="z-10">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <h4 className="text-2xl font-black text-gray-800 dark:text-white">{value}</h4>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg bg-white dark:bg-gray-800 text-${color}-500 shadow-sm group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    {/* Background decoration */}
    <div className={`absolute -bottom-4 -right-4 opacity-5 text-${color}-500/10 transform rotate-12 scale-150`}>
      <Icon size={80} />
    </div>
  </div>
);

const StudentPerformancePage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  // Mock de Medalhas
  const medalsCatalog = [
    { id: 1, name: "Primeira Vitória", description: "Concluiu 1 atividade", icon: <Star />, requiredXP: 100 },
    { id: 2, name: "Nota 100", description: "Acertou tudo em uma atividade", icon: <Target />, requiredXP: 500 },
    { id: 3, name: "Veterano", description: "Nível 5 alcançado", icon: <Shield />, requiredXP: 2500 },
    { id: 4, name: "Lenda", description: "Top 1 no Ranking", icon: <Trophy />, requiredXP: 5000 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const dashRes = await fetch('http://localhost:5000/student/dashboard', { headers });
        const dashData = await dashRes.json();

        const actRes = await fetch('http://localhost:5000/student/activities/all', { headers });
        const actData = await actRes.json();

        setDashboardData(dashData);
        setActivities(actData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- CÁLCULOS ESTATÍSTICOS CONCRETOS ---
  const stats = useMemo(() => {
    if (!activities.length) return null;

    const completed = activities.filter(a => a.is_completed);
    const total = activities.length;

    // Média de Notas (Considerando apenas atividades completas que têm nota)
    const grades = completed.map(a => a.grade).filter(g => g !== null);
    const avgGrade = grades.length > 0
      ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)
      : 0;

    // Taxa de Conclusão
    const completionRate = Math.round((completed.length / total) * 100);

    // XP Total Acumulado (Soma de xp_earned das atividades)
    const totalXPFromActivities = completed.reduce((sum, a) => sum + (a.xp_earned || 0), 0);

    // Melhor Desempenho (Maior nota)
    const bestGrade = grades.length > 0 ? Math.max(...grades) : 0;

    return {
      totalMissions: total,
      completedMissions: completed.length,
      avgGrade,
      completionRate,
      totalXP: totalXPFromActivities,
      bestGrade
    };
  }, [activities]);

  // Dados para o Gráfico de Evolução (Histórico de Notas)
  const evolutionData = useMemo(() => {
    return activities
      .filter(a => a.is_completed && a.grade !== null)
      // Ordenar por ID ou data se disponível (assumindo ID incremental como ordem cronológica por enquanto)
      .sort((a, b) => a.id - b.id)
      .map(a => ({
        name: a.title.length > 15 ? a.title.substring(0, 12) + '...' : a.title,
        nota: a.grade,
        fullTitle: a.title
      }));
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (activeTab === 'pending') return activities.filter(a => !a.is_completed);
    if (activeTab === 'completed') return activities.filter(a => a.is_completed);
    return activities;
  }, [activities, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  const { performance } = dashboardData || {};
  const levelInfo = performance?.global_level_info || { level: 1, xp_current: 0, xp_to_next_level: 100 };
  const xpPercentage = Math.min((levelInfo.xp_current / (levelInfo.xp_current + levelInfo.xp_to_next_level)) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 text-gray-800 dark:text-gray-100 font-sans">

      {/* --- HEADER: IDENTIDADE DO JOGADOR --- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row items-end gap-6 mb-6">
          <div className="relative">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              alt="Avatar"
              className="w-24 h-24 rounded-xl border-4 border-white dark:border-gray-800 shadow-lg bg-gray-200"
            />
            <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md border-2 border-white dark:border-gray-800">
              Nvl. {levelInfo.level}
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
              Estatísticas de Combate
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
              Matrícula: #2025-DEV • Classe: Engenheiro de Software
            </p>
          </div>

          {/* Barra de XP Discreta */}
          <div className="w-full md:w-1/3">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-1 uppercase">
              <span>XP Atual</span>
              <span>{levelInfo.xp_current} / {levelInfo.xp_cumulative + levelInfo.xp_to_next_level}</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* --- GRID DE MÉTRICAS (KPIs) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatBox
            label="Missões Cumpridas"
            value={`${stats?.completedMissions} / ${stats?.totalMissions}`}
            subtext="Atividades finalizadas"
            icon={CheckCircle}
            color="green"
          />
          <StatBox
            label="Precisão Média"
            value={`${stats?.avgGrade}%`}
            subtext="Média de acertos (Notas)"
            icon={Crosshair}
            color="blue"
          />
          <StatBox
            label="Melhor Desempenho"
            value={`${stats?.bestGrade}%`}
            subtext="Maior nota registrada"
            icon={Trophy}
            color="yellow"
          />
          <StatBox
            label="XP de Atividades"
            value={stats?.totalXP}
            subtext="Pontos ganhos em missões"
            icon={Zap}
            color="purple"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* --- ESQUERDA: GRÁFICOS ANALÍTICOS --- */}
        <div className="lg:col-span-2 space-y-8">

          {/* GRÁFICO DE EVOLUÇÃO */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                <TrendingUp className="text-blue-500" />
                Histórico de Desempenho
              </h3>
              {/* Pequena legenda */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span> Nota da Atividade
              </div>
            </div>

            <div className="h-[300px] w-full">
              {evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="nota"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ActivityIcon size={48} className="mb-2 opacity-20" />
                  <p>Complete atividades para ver seu gráfico de evolução.</p>
                </div>
              )}
            </div>
          </Card>

          {/* LISTA DE ATIVIDADES (TABELA DETALHADA) */}
          <Card className="flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                <BookOpen className="text-gray-500" />
                Log de Missões
              </h3>
              <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                {['all', 'pending', 'completed'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-xs font-bold uppercase rounded transition-all ${activeTab === tab
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    {tab === 'all' ? 'Todas' : tab === 'pending' ? 'Pendentes' : 'Concluídas'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700">
                    <th className="p-4 font-semibold">Atividade</th>
                    <th className="p-4 font-semibold">Turma</th>
                    <th className="p-4 font-semibold text-center">Prazo</th>
                    <th className="p-4 font-semibold text-center">Nota</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredActivities.map(activity => (
                    <tr key={activity.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-gray-800 dark:text-gray-200">{activity.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{activity.description}</p>
                      </td>
                      <td className="p-4 text-gray-500 dark:text-gray-400">
                        {activity.class_name}
                      </td>
                      <td className="p-4 text-center">
                        {activity.expiresAt ? (
                          <span className={`text-xs font-mono ${new Date(activity.expiresAt) < new Date() && !activity.is_completed ? 'text-red-500' : 'text-gray-500'}`}>
                            {format(new Date(activity.expiresAt), "dd/MM")}
                          </span>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="p-4 text-center">
                        {activity.grade !== null ? (
                          <span className={`font-bold ${activity.grade >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {activity.grade}
                          </span>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="p-4 text-center">
                        {activity.is_completed ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Concluída
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Em Andamento
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredActivities.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400 italic">
                        Nenhuma atividade encontrada neste filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* --- DIREITA: RESUMO E CONQUISTAS --- */}
        <div className="lg:col-span-1 space-y-6">

          {/* Elemento Mais Jogado (Mockado por enquanto, mas pronto para lógica) */}
          <Card className="p-6 bg-gradient-to-br from-blue-600 to-purple-700 text-white border-none">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-blue-200 text-xs font-bold uppercase">Estilo de Jogo</p>
                <h3 className="text-xl font-bold">Explorador de Quizzes</h3>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <Target size={24} className="text-white" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-black/20 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-blue-100">Respostas Corretas</span>
                <span className="font-bold text-white">85%</span>
              </div>
              <div className="bg-black/20 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-blue-100">Tipo Favorito</span>
                <span className="font-bold text-white">Múltipla Escolha</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-blue-200 text-center opacity-80">
              Você tende a ter melhor desempenho em desafios lógicos.
            </p>
          </Card>

          {/* Sala de Troféus Simplificada */}
          <Card className="p-6">
            <h3 className="text-md font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" />
              Conquistas Recentes
            </h3>
            <div className="space-y-4">
              {medalsCatalog.slice(0, 3).map((medal, idx) => {
                const isUnlocked = idx < (performance?.total_achievements || 0);
                return (
                  <div key={medal.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isUnlocked ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'opacity-50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'}`}>
                      {React.cloneElement(medal.icon, { size: 18 })}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isUnlocked ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>{medal.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{medal.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default StudentPerformancePage;