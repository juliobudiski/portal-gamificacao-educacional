// frontend/src/pages/admin/SystemAnalyticsPage.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as PieTooltip } from 'recharts';

import {
    Activity, LogIn, AlertTriangle, FilePlus, Puzzle, Users, Trophy, Gift, Clock, XCircle,
    HelpCircle, ShoppingCart, Gamepad2, TrendingUp, DollarSign, Coins, ChevronsRight
} from 'lucide-react';
// --- Componentes de UI Reutilizáveis (sem alterações) ---

const KPI_Card = ({ title, value, icon, color }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-secondary-text text-sm">{title}</p>
            <p className="text-2xl font-bold text-primary-text">{value}</p>
        </div>
    </div>
);

const HorizontalBarChart = ({ data, dataKey, nameKey, title, icon }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-primary-text mb-4 flex items-center"><span className="mr-2">{icon}</span>{title}</h2>
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis type="category" dataKey={nameKey} stroke="#9ca3af" width={150} fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }} />
                    <Bar dataKey={dataKey} fill="#8884d8" name="Seleções" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const ProfilePieChart = ({ data }) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
    return (
        <div className="bg-gray-800/50 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-primary-text mb-4 flex items-center"><Users className="mr-2" />Perfis de Jogador Mais Visados</h2>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={140} fill="#8884d8" dataKey="count" nameKey="profile" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <PieTooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const CustomPieChart = ({ data, title, icon, dataKey, nameKey }) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
    return (
        <div className="bg-gray-800/50 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-primary-text mb-4 flex items-center">{icon}<span className="ml-2">{title}</span></h2>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={140} fill="#8884d8" dataKey={dataKey} nameKey={nameKey} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <PieTooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Componente Principal Refatorado ---

function SystemAnalyticsPage() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Estado para controlar a aba ativa
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'trends', 'funnel'

    // Estados separados para cada grupo de dados
    const [kpis, setKpis] = useState(null);
    const [eventDistribution, setEventDistribution] = useState(null);
    const [creationTrends, setCreationTrends] = useState(null);
    const [creationStepsData, setCreationStepsData] = useState(null);

    // Estados de loading separados por aba
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingTrends, setLoadingTrends] = useState(false);
    const [loadingFunnel, setLoadingFunnel] = useState(false);
    const [loadingEngagement, setLoadingEngagement] = useState(false);
    const [error, setError] = useState(null);
    const [studentEngagementData, setStudentEngagementData] = useState(null);

    const apiPrefix = `${import.meta.env.VITE_API_URL}/api/admin/analytics`;
    const headers = { 'Authorization': `Bearer ${user?.token}` };

    const fetchData = useCallback(async (endpoint, setter, setLoading) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiPrefix}/${endpoint}`, { headers });
            if (!response.ok) throw new Error(`Falha ao buscar dados de ${endpoint}.`);
            const data = await response.json();
            setter(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // --- Funções de Fetch Específicas para cada Aba ---

    const fetchOverviewData = useCallback(async () => {
        setLoadingOverview(true);
        try {
            const [kpiRes, distRes] = await Promise.all([
                fetch(`${apiPrefix}/kpis`, { headers }),
                fetch(`${apiPrefix}/event_distribution`, { headers }),
            ]);
            if (!kpiRes.ok || !distRes.ok) throw new Error('Falha ao buscar dados da visão geral.');
            setKpis(await kpiRes.json());
            setEventDistribution(await distRes.json());
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingOverview(false);
        }
    }, [user]);

    const fetchTrendsData = useCallback(async () => {
        setLoadingTrends(true);
        try {
            const trendsRes = await fetch(`${apiPrefix}/creation_trends`, { headers });
            if (!trendsRes.ok) throw new Error('Falha ao buscar tendências de criação.');
            setCreationTrends(await trendsRes.json());
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingTrends(false);
        }
    }, [user]);

    const fetchFunnelData = useCallback(async () => {
        setLoadingFunnel(true);
        try {
            const stepsRes = await fetch(`${apiPrefix}/creation_steps`, { headers });
            if (!stepsRes.ok) throw new Error('Falha ao buscar dados do funil de criação.');
            setCreationStepsData(await stepsRes.json());
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingFunnel(false);
        }
    }, [user]);

    // Carrega os dados da primeira aba ao montar o componente
    useEffect(() => {
        if (user?.token) fetchOverviewData();
    }, [fetchOverviewData, user]);

    // Carrega os dados das outras abas sob demanda (quando clicadas)
    useEffect(() => {
        if (user?.token) {
            if (activeTab === 'trends' && !creationTrends) {
                fetchTrendsData();
            }
            if (activeTab === 'funnel' && !creationStepsData) {
                fetchFunnelData();
            }
            if (activeTab === 'engagement' && !studentEngagementData) {
                fetchData('student_engagement', setStudentEngagementData, setLoadingEngagement);
            }
        }
    }, [activeTab, creationTrends, creationStepsData, fetchTrendsData, fetchFunnelData, user]);

    // Componente para o conteúdo de cada aba
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return loadingOverview ? <p>Carregando visão geral...</p> : (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KPI_Card title="Total de Eventos" value={kpis?.total_events ?? '...'} icon={<Activity size={24} />} color="bg-blue-500/30" />
                            <KPI_Card title="Logins (24h)" value={kpis?.successful_logins_24h ?? '...'} icon={<LogIn size={24} />} color="bg-green-500/30" />
                            <KPI_Card title="Falhas de Login (24h)" value={kpis?.failed_logins_24h ?? '...'} icon={<AlertTriangle size={24} />} color="bg-yellow-500/30" />
                            <KPI_Card title="Atividades Criadas (7d)" value={kpis?.activities_created_7d ?? '...'} icon={<FilePlus size={24} />} color="bg-purple-500/30" />
                        </div>
                        <div className="bg-gray-800/50 p-6 rounded-xl">
                            <h2 className="text-xl font-bold mb-4">Top 10 Eventos Mais Frequentes</h2>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={eventDistribution}>
                                        <XAxis dataKey="action" stroke="#9ca3af" fontSize={12} />
                                        <YAxis stroke="#9ca3af" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                                        <Bar dataKey="count" fill="#38bdf8" name="Contagem" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-gray-800/50 p-6 rounded-xl text-center border-2 border-dashed border-gray-700">
                            <h2 className="text-xl font-bold text-primary-text mb-4">Explorador de Logs</h2>
                            <p className="text-secondary-text mb-4 max-w-lg mx-auto">Para uma análise profunda, busca e filtragem de todos os eventos do sistema, acesse a página dedicada.</p>
                            <button onClick={() => navigate('/admin/logs')} className="py-2 px-5 bg-accent-teal text-primary-text font-bold rounded-lg hover:bg-accent-teal/80 transition-colors">
                                Acessar Explorador de Logs
                            </button>
                        </div>
                    </div>
                );
            case 'trends':
                return loadingTrends ? <p>Carregando tendências de criação...</p> : (
                    creationTrends && <div className="space-y-6 animate-fade-in">
                        <HorizontalBarChart data={creationTrends.game_elements} dataKey="count" nameKey="element" title="Top Elementos de Jogo" icon={<Puzzle />} />
                        <ProfilePieChart data={creationTrends.player_profiles} />
                        <HorizontalBarChart data={creationTrends.rewards_offered} dataKey="count" nameKey="reward" title="Top Recompensas Oferecidas" icon={<Gift />} />
                        <HorizontalBarChart data={creationTrends.rewarded_actions} dataKey="count" nameKey="action" title="Top Ações Recompensadas" icon={<Trophy />} />
                    </div>
                );
            case 'funnel':
                return loadingFunnel ? <p>Carregando análise do funil...</p> : (
                    creationStepsData && <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <KPI_Card title="Eventos de Duração" value={creationStepsData.reduce((s, i) => s + i.event_count, 0)} icon={<Clock size={24} />} color="bg-teal-500/30" />
                            <KPI_Card title="Total de Abandonos" value={creationStepsData.reduce((s, i) => s + i.abandon_count, 0)} icon={<XCircle size={24} />} color="bg-yellow-500/30" />
                            <KPI_Card title="Pedidos de Ajuda" value={creationStepsData.reduce((s, i) => s + i.help_count, 0)} icon={<HelpCircle size={24} />} color="bg-purple-500/30" />
                        </div>
                        <div className="bg-gray-800/50 p-6 rounded-xl">
                            <h2 className="text-xl font-bold text-primary-text mb-4">Detalhes por Etapa</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 text-left text-sm font-medium">Etapa</th>
                                            <th className="px-4 py-2 text-left text-sm font-medium">Tempo Médio (s)</th>
                                            <th className="px-4 py-2 text-left text-sm font-medium">Abandonos</th>
                                            <th className="px-4 py-2 text-left text-sm font-medium">Pedidos de Ajuda</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {creationStepsData.map((step) => (
                                            <tr key={step.step}>
                                                <td className="px-4 py-2 text-sm">{step.step_name}</td>
                                                <td className="px-4 py-2 text-sm">{step.avg_duration.toFixed(2)}</td>
                                                <td className="px-4 py-2 text-sm">{step.abandon_count}</td>
                                                <td className="px-4 py-2 text-sm">{step.help_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'engagement':
                return loadingEngagement ? <p className="text-center">Carregando dados de engajamento...</p> : (
                    studentEngagementData && <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <KPI_Card title="Total de Moedas Ganhas" value={studentEngagementData.economy_kpis.coins_earned} icon={<Coins size={24} />} color="bg-green-500/30" />
                            <KPI_Card title="Total de Moedas Gastas" value={studentEngagementData.economy_kpis.coins_spent} icon={<DollarSign size={24} />} color="bg-red-500/30" />
                        </div>
                        <HorizontalBarChart data={studentEngagementData.game_element_usage} dataKey="count" nameKey="name" title="Mecânicas de Jogo Mais Usadas" icon={<Gamepad2 />} barFill="#f97316" />
                        <HorizontalBarChart data={studentEngagementData.top_store_items} dataKey="count" nameKey="name" title="Itens Mais Populares da Loja" icon={<ShoppingCart />} barFill="#10b981" />
                        <CustomPieChart data={studentEngagementData.progress_status} title="Status de Progresso das Atividades" icon={<ChevronsRight />} dataKey="count" nameKey="status" />
                        <HorizontalBarChart data={studentEngagementData.most_engaging_activities} dataKey="total_seconds" nameKey="title" title="Atividades com Maior Tempo de Interação (s)" icon={<Clock />} barFill="#6366f1" />
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="animate-fade-in space-y-8 text-primary-text">
            <h1 className="text-3xl font-bold">Análise de Sistema</h1>

            {error && <div className="bg-red-500/20 text-red-300 p-4 rounded-lg">{error}</div>}

            {/* Navegação por Abas */}
            <div className="flex space-x-1 border-b border-gray-700">
                {['overview', 'trends', 'engagement', 'funnel'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none ${activeTab === tab
                            ? 'border-b-2 border-accent-teal text-accent-teal'
                            : 'text-secondary-text hover:text-primary-text'
                            }`}
                    >
                        {tab === 'overview' && 'Visão Geral'}
                        {tab === 'trends' && 'Tendências de Criação'}
                        {tab === 'engagement' && 'Engajamento (Alunos)'}
                        {tab === 'funnel' && 'Funil de Criação'}
                    </button>
                ))}
            </div>

            {/* Conteúdo da Aba Ativa */}
            <div className="mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
}

export default SystemAnalyticsPage;