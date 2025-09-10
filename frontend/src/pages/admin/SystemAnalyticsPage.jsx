// frontend/src/pages/admin/SystemAnalyticsPage.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, ComposedChart, Line, CartesianGrid, Pie, Cell, Tooltip as PieTooltip } from 'recharts';
import { ChevronLeft, ChevronRight, Activity, LogIn, AlertTriangle, FilePlus, Search, Puzzle, Users, Trophy, Gift, Clock, XCircle, HelpCircle } from 'lucide-react';
import { useDebounce } from 'use-debounce';

// Componente para os cards de KPI
const KPI_Card = ({ title, value, icon, color }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

// Componente reutilizável para gráficos de barras horizontais
const HorizontalBarChart = ({ data, dataKey, nameKey, title, icon }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center"><span className="mr-2">{icon}</span>{title}</h2>
        <div style={{ width: '100%', height: 400 }}>  {/* Altura aumentada de 300 para 400 */}
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

// Componente para o gráfico de pizza (MODIFICADO)
const ProfilePieChart = ({ data }) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
    return (
        <div className="bg-gray-800/50 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center"><Users className="mr-2" />Perfis de Jogador Mais Visados</h2>
            <div style={{ width: '100%', height: 400 }}>  {/* Altura aumentada de 300 para 400 */}
                <ResponsiveContainer>
                    <PieChart>
                        <Pie 
                            data={data} 
                            cx="50%" 
                            cy="50%" 
                            labelLine={false} 
                            outerRadius={140}  
                            fill="#8884d8" 
                            dataKey="count" 
                            nameKey="profile" 
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <PieTooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

function SystemAnalyticsPage() {
    const { user } = useContext(AuthContext);
    const [kpis, setKpis] = useState(null);
    const [eventDistribution, setEventDistribution] = useState([]);
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creationTrends, setCreationTrends] = useState(null);
    // Estados para filtros
    const [currentPage, setCurrentPage] = useState(1);
    const [userSearch, setUserSearch] = useState('');
    const [debouncedUserSearch] = useDebounce(userSearch, 500); // Adiciona um delay para não sobrecarregar a API
    const [actionFilter, setActionFilter] = useState('');
    const [creationStepsData, setCreationStepsData] = useState([]);

    // Busca todos os dados da página
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = user?.token;
        if (!token) return;

        const apiPrefix = 'http://127.0.0.1:5000/api/admin/analytics';
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const logParams = new URLSearchParams({ page: currentPage, limit: 15, ...(debouncedUserSearch && { user: debouncedUserSearch }), ...(actionFilter && { action: actionFilter }), });
            const logUrl = `${apiPrefix}/logs?${logParams.toString()}`;

            const [kpiRes, distRes, logRes, trendsRes, stepsRes] = await Promise.all([
            fetch(`${apiPrefix}/kpis`, { headers }),
            fetch(`${apiPrefix}/event_distribution`, { headers }),
            fetch(logUrl, { headers }),
            fetch(`${apiPrefix}/creation_trends`, { headers }),
            fetch(`${apiPrefix}/creation_steps`, { headers }), // Nova chamada
            ]);

            if (!kpiRes.ok || !distRes.ok || !logRes.ok || !trendsRes.ok) throw new Error('Falha ao buscar dados de análise.');

            setKpis(await kpiRes.json());
            setEventDistribution(await distRes.json());
            const logData = await logRes.json();
            setLogs(logData.logs);
            setPagination({ totalPages: logData.total_pages, currentPage: logData.current_page, hasNext: logData.has_next, hasPrev: logData.has_prev });
            setCreationTrends(await trendsRes.json()); // <-- Salva os novos dados no estado
            setCreationStepsData(await stepsRes.json());

        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [user, currentPage, debouncedUserSearch, actionFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Busca novamente quando os filtros mudam
    useEffect(() => {
        setCurrentPage(1); // Reseta para a primeira página ao filtrar
    }, [debouncedUserSearch, actionFilter]);
    
    // Lista de ações para o filtro (pode ser gerada dinamicamente no futuro)
    const availableActions = [
        'activity_created', 'activity_edited', 'activity_deleted',
        'activity_copied', 'activity_assigned', 'login_success',
        'login_fail', 'register_success', 'step_view_duration', 'form_abandoned'
    ];

    return (
        <div className="animate-fade-in space-y-8 text-white">
            <h1 className="text-3xl font-bold">Análise e Logs do Sistema</h1>

            {/* Seção de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPI_Card title="Total de Eventos Registrados" value={kpis?.total_events ?? '...'} icon={<Activity size={24}/>} color="bg-blue-500/30" />
                <KPI_Card title="Logins com Sucesso (24h)" value={kpis?.successful_logins_24h ?? '...'} icon={<LogIn size={24}/>} color="bg-green-500/30" />
                <KPI_Card title="Tentativas de Login Falhas (24h)" value={kpis?.failed_logins_24h ?? '...'} icon={<AlertTriangle size={24}/>} color="bg-yellow-500/30" />
                <KPI_Card title="Atividades Criadas (7d)" value={kpis?.activities_created_7d ?? '...'} icon={<FilePlus size={24}/>} color="bg-purple-500/30" />
                <KPI_Card title="Total de Logins (30d)" 
                    value={kpis?.successful_logins_30d ?? '...'} 
                    icon={<LogIn size={24}/>} 
                    color="bg-blue-500/30" 
                />
                <KPI_Card title="Usuários Ativos (30d)" 
                    value={kpis?.active_users_30d ?? '...'} 
                    icon={<Users size={24}/>} 
                    color="bg-green-500/30" 
                />
            </div>

            {/* NOVA SEÇÃO: Tendências de Criação de Atividades */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold border-b border-gray-700 pb-2">Tendências de Criação de Conteúdo</h2>
                {creationTrends && (
                    <div className="grid grid-cols-1 gap-6"> 
                        <HorizontalBarChart data={creationTrends.game_elements} dataKey="count" nameKey="element" title="Top Elementos de Jogo" icon={<Puzzle/>} />
                        <ProfilePieChart data={creationTrends.player_profiles} />
                        <HorizontalBarChart data={creationTrends.rewards_offered} dataKey="count" nameKey="reward" title="Top Recompensas Oferecidas" icon={<Gift/>} />
                        <HorizontalBarChart data={creationTrends.rewarded_actions} dataKey="count" nameKey="action" title="Top Ações Recompensadas" icon={<Trophy/>} />
                    </div>
                )}
            </div>

            {/* Seção de Análise das Etapas de Criação */}
            <div className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-gray-700 pb-2">Análise das Etapas de Criação</h2>
            
            {/* Informações Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-xl text-center">
                <Clock className="mx-auto mb-2" size={24} />
                <h3 className="font-semibold text-white">Total de Eventos de Duração</h3>
                <p className="text-2xl font-bold text-accent-teal">
                    {creationStepsData.reduce((sum, step) => sum + step.event_count, 0)}
                </p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl text-center">
                <XCircle className="mx-auto mb-2" size={24} />
                <h3 className="font-semibold text-white">Total de Abandonos</h3>
                <p className="text-2xl font-bold text-accent-yellow">
                    {creationStepsData.reduce((sum, step) => sum + step.abandon_count, 0)}
                </p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl text-center">
                <HelpCircle className="mx-auto mb-2" size={24} />
                <h3 className="font-semibold text-white">Total de Solicitações de Ajuda</h3>
                <p className="text-2xl font-bold text-accent-purple">
                    {creationStepsData.reduce((sum, step) => sum + step.help_count, 0)}
                </p>
                </div>
            </div>

            {/* Gráfico de Tempo Médio por Etapa */}
            <div className="bg-gray-800/50 p-6 rounded-xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Clock className="mr-2" /> Tempo Médio por Etapa (segundos)
                </h2>
                <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <BarChart data={creationStepsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                    <XAxis dataKey="step_name" stroke="#A0AEC0" />
                    <YAxis stroke="#A0AEC0" />
                    <Tooltip 
                        contentStyle={{ 
                        backgroundColor: '#2D3748', 
                        border: '1px solid #4A5568',
                        borderRadius: '0.5rem'
                        }} 
                        formatter={(value, name, props) => {
                        if (name === 'avg_duration') return [`${value.toFixed(2)} segundos`, 'Tempo Médio'];
                        return [value, name];
                        }}
                    />
                    <Legend />
                    <Bar dataKey="avg_duration" name="Tempo Médio (segundos)" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </div>

            {/* Gráfico de Abandonos e Ajuda */}
            <div className="bg-gray-800/50 p-6 rounded-xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <XCircle className="mr-2" /> Abandonos e Solicitações de Ajuda
                </h2>
                <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <BarChart data={creationStepsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                    <XAxis dataKey="step_name" stroke="#A0AEC0" />
                    <YAxis stroke="#A0AEC0" />
                    <Tooltip 
                        contentStyle={{ 
                        backgroundColor: '#2D3748', 
                        border: '1px solid #4A5568',
                        borderRadius: '0.5rem'
                        }} 
                    />
                    <Legend />
                    <Bar dataKey="abandon_count" name="Abandonos" fill="#ff8042" />
                    <Bar dataKey="help_count" name="Solicitações de Ajuda" fill="#00C49F" />
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </div>

            {/* Tabela Detalhada */}
            <div className="bg-gray-800/50 p-6 rounded-xl">
                <h2 className="text-xl font-bold text-white mb-4">Detalhes por Etapa</h2>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                    <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Etapa</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Tempo Médio (s)</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Eventos</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Abandonos</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Solicitações de Ajuda</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                    {creationStepsData.map((step) => (
                        <tr key={step.step}>
                        <td className="px-4 py-2 text-sm text-white">{step.step_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{step.avg_duration.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{step.event_count}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{step.abandon_count}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{step.help_count}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
            </div>

            {/* Resumo das Etapas */}
            <div className="bg-gray-800/50 p-6 rounded-xl">
                <h2 className="text-xl font-bold text-white mb-4">Resumo das Etapas de Criação</h2>
                {creationStepsData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400">Etapa Mais Demorada</p>
                    <p className="text-2xl font-bold text-white">
                        {creationStepsData.reduce((max, step) => step.avg_duration > max.avg_duration ? step : max, creationStepsData[0]).step_name}
                    </p>
                    <p className="text-gray-400">
                        {Math.round(creationStepsData.reduce((max, step) => step.avg_duration > max.avg_duration ? step : max, creationStepsData[0]).avg_duration)} segundos
                    </p>
                    </div>
                    <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400">Etapa com Mais Abandonos</p>
                    <p className="text-2xl font-bold text-white">
                        {creationStepsData.reduce((max, step) => step.abandon_count > max.abandon_count ? step : max, creationStepsData[0]).step_name}
                    </p>
                    <p className="text-gray-400">
                        {creationStepsData.reduce((max, step) => step.abandon_count > max.abandon_count ? step : max, creationStepsData[0]).abandon_count} abandonos
                    </p>
                    </div>
                    <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400">Etapa com Mais Dúvidas</p>
                    <p className="text-2xl font-bold text-white">
                        {creationStepsData.reduce((max, step) => step.help_count > max.help_count ? step : max, creationStepsData[0]).step_name}
                    </p>
                    <p className="text-gray-400">
                        {creationStepsData.reduce((max, step) => step.help_count > max.help_count ? step : max, creationStepsData[0]).help_count} solicitações de ajuda
                    </p>
                    </div>
                </div>
                ) : (
                <p className="text-gray-400 text-center py-4">Nenhum dado disponível para análise das etapas.</p>
                )}
            </div>

            {/* Seção de Gráficos */}
            <div className="bg-gray-800/50 p-6 rounded-xl">
                <h2 className="text-xl font-bold mb-4">Top 10 Eventos Mais Frequentes</h2>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={eventDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="action" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="count" fill="#38bdf8" name="Contagem" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Seção de Tabela de Logs */}
            <div className="bg-gray-800/50 p-6 rounded-xl">
                <h2 className="text-xl font-bold mb-4">Explorador de Logs</h2>
                
                {/* Filtros da Tabela */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input 
                            type="text"
                            placeholder="Buscar por nome de usuário..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-accent-teal outline-none"
                        />
                    </div>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-accent-teal outline-none"
                    >
                        <option value="">Filtrar por Ação...</option>
                        {availableActions.map(action => (
                            <option key={action} value={action}>{action.replace(/_/g, ' ').charAt(0).toUpperCase() + action.slice(1).replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>

                {/* Tabela de Logs */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900/60">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ação</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Seção</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">IP</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500">Carregando logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500">Nenhum log encontrado para os filtros selecionados.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-white">{log.user_name}</div>
                                            <div className="text-xs text-gray-400">{log.user_email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{log.action}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{log.section}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{log.ip_address}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                <div className="flex justify-between items-center mt-6">
                    <button 
                        onClick={() => setCurrentPage(p => p - 1)} 
                        disabled={!pagination.hasPrev || loading}
                        className="px-4 py-2 bg-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        <ChevronLeft size={16} className="mr-1" /> Anterior
                    </button>
                    <span className="text-sm text-gray-400">
                        Página {pagination.currentPage} de {pagination.totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => p + 1)} 
                        disabled={!pagination.hasNext || loading}
                        className="px-4 py-2 bg-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        Próxima <ChevronRight size={16} className="ml-1" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SystemAnalyticsPage;

