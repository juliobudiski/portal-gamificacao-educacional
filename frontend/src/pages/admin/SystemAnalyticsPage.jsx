// frontend/src/pages/admin/SystemAnalyticsPage.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Activity, LogIn, AlertTriangle, FilePlus, Search } from 'lucide-react';
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

function SystemAnalyticsPage() {
    const { user } = useContext(AuthContext);
    const [kpis, setKpis] = useState(null);
    const [eventDistribution, setEventDistribution] = useState([]);
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para filtros
    const [currentPage, setCurrentPage] = useState(1);
    const [userSearch, setUserSearch] = useState('');
    const [debouncedUserSearch] = useDebounce(userSearch, 500); // Adiciona um delay para não sobrecarregar a API
    const [actionFilter, setActionFilter] = useState('');

    // Busca todos os dados da página
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = user?.token;
        if (!token) return;

        const apiPrefix = 'http://127.0.0.1:5000/api/admin/analytics';
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // Constrói a URL para os logs com os filtros
            const logParams = new URLSearchParams({
                page: currentPage,
                limit: 15,
                ...(debouncedUserSearch && { user: debouncedUserSearch }),
                ...(actionFilter && { action: actionFilter }),
            });
            const logUrl = `${apiPrefix}/logs?${logParams.toString()}`;

            const [kpiRes, distRes, logRes] = await Promise.all([
                fetch(`${apiPrefix}/kpis`, { headers }),
                fetch(`${apiPrefix}/event_distribution`, { headers }),
                fetch(logUrl, { headers }),
            ]);

            if (!kpiRes.ok || !distRes.ok || !logRes.ok) throw new Error('Falha ao buscar dados de análise.');

            const kpiData = await kpiRes.json();
            const distData = await distRes.json();
            const logData = await logRes.json();

            setKpis(kpiData);
            setEventDistribution(distData);
            setLogs(logData.logs);
            setPagination({
                totalPages: logData.total_pages,
                currentPage: logData.current_page,
                hasNext: logData.has_next,
                hasPrev: logData.has_prev,
            });

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

