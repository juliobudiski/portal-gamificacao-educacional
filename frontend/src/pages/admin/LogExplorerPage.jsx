// frontend/src/pages/admin/LogExplorerPage.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useDebounce } from 'use-debounce';

/**
 * Componente LogExplorerPage
 * Página dedicada para buscar, filtrar e visualizar todos os logs de eventos do sistema.
 * Contém paginação para lidar com grandes volumes de dados de forma eficiente.
 */
function LogExplorerPage() {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para filtros
    const [currentPage, setCurrentPage] = useState(1);
    const [userSearch, setUserSearch] = useState('');
    const [debouncedUserSearch] = useDebounce(userSearch, 500); // Adiciona um delay para não sobrecarregar a API
    const [actionFilter, setActionFilter] = useState('');

    // Busca os dados de logs com base nos filtros e paginação
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = user?.token;
        if (!token) {
            setError("Usuário não autenticado.");
            setLoading(false);
            return;
        }

        const apiPrefix = `${import.meta.env.VITE_API_URL}/api/admin/analytics`;
        const logParams = new URLSearchParams({
            page: currentPage,
            limit: 15,
            ...(debouncedUserSearch && { user: debouncedUserSearch }),
            ...(actionFilter && { action: actionFilter }),
        });
        const logUrl = `${apiPrefix}/logs?${logParams.toString()}`;

        try {
            const response = await fetch(logUrl, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao buscar os logs do sistema.');

            const data = await response.json();
            setLogs(data.logs);
            setPagination({
                totalPages: data.total_pages,
                currentPage: data.current_page,
                hasNext: data.has_next,
                hasPrev: data.has_prev
            });
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [user, currentPage, debouncedUserSearch, actionFilter]);

    // Efeito para buscar os dados quando a página carrega ou os filtros mudam
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Efeito para resetar a página para 1 quando um novo filtro é aplicado
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedUserSearch, actionFilter]);

    // Lista de ações para o filtro (pode ser gerada dinamicamente no futuro)
    const availableActions = [
        'activity_created', 'activity_edited', 'activity_deleted',
        'activity_copied', 'activity_assigned', 'login_success',
        'login_fail', 'register_success', 'step_view_duration', 'form_abandoned', 'help_button_click'
    ];

    return (
        <div className="animate-fade-in space-y-8 text-primary-text">
            <h1 className="text-3xl font-bold">Explorador de Logs do Sistema</h1>

            {/* Seção de Tabela de Logs */}
            <div className="bg-gray-800/50 p-6 rounded-xl">
                {/* Filtros da Tabela */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" size={20} />
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

                {error && <p className="text-center text-red-400 mb-4">{error}</p>}

                {/* Tabela de Logs */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900/60">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Ação</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Seção</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">IP</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-10 text-secondary-text">Carregando logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-secondary-text">Nenhum log encontrado para os filtros selecionados.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-primary-text">{log.user_name}</div>
                                            <div className="text-xs text-secondary-text">{log.user_email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{log.action}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{log.section}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{log.ip_address}</td>
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
                    <span className="text-sm text-secondary-text">
                        Página {pagination.currentPage ?? '...'} de {pagination.totalPages ?? '...'}
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

export default LogExplorerPage;
