// frontend/src/pages/admin/ActivityManagementPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Componente ActivityManagementPage
 * * Página para listar e visualizar todas as atividades criadas na plataforma.
 * No futuro, terá filtros, busca e ações de moderação.
 */
function ActivityManagementPage() {
    const [activitiesList, setActivitiesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedActivityId, setExpandedActivityId] = useState(null);
    const { user } = useContext(AuthContext);

    // Lógica de busca e carregamento de dados
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const token = user?.token;
                if (!token) throw new Error("Token não encontrado.");

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/activities`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar atividades.');

                const data = await response.json();
                setActivitiesList(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        if (user?.token) fetchActivities();
    }, [user]);

    const toggleActivityDetails = (activityId) => {
        setExpandedActivityId(prevId => (prevId === activityId ? null : activityId));
    };

    if (loading) return <div className="text-center text-primary-text p-10">Carregando atividades...</div>;
    if (error) return <div className="text-center text-red-400 p-10">Erro: {error}</div>;

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-primary-text mb-6">Gerenciamento de Conteúdo</h1>
            <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gradient-to-r from-blue-400/20 to-accent-purple/10">
                            <tr>
                                <th className="py-4 px-4 text-left text-sm font-bold uppercase">ID</th>
                                <th className="py-4 px-4 text-left text-sm font-bold uppercase">Título</th>
                                <th className="py-4 px-4 text-left text-sm font-bold uppercase">Professor</th>
                                <th className="py-4 px-4 text-left text-sm font-bold uppercase">Tempo Médio</th>
                                <th className="py-4 px-4 text-left text-sm font-bold uppercase">Status</th>
                                <th className="py-4 px-4 text-right text-sm font-bold uppercase">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {activitiesList.map((activity) => (
                                <React.Fragment key={activity.id}>
                                    <tr className="hover:bg-gray-700/50">
                                        <td className="py-4 px-4 text-sm font-medium text-accent-yellow">{activity.id}</td>
                                        <td className="py-4 px-4 text-sm text-primary-text">{activity.title}</td>
                                        <td className="py-4 px-4 text-sm text-secondary-text">{activity.professor_name || 'N/A'}</td>
                                        <td className="py-4 px-4 text-sm text-secondary-text"> {activity.average_engagement_time || 'N/A'}</td>
                                        <td className="py-4 px-4 text-sm">
                                            <span className={activity.isPublic ? 'text-green-400' : 'text-secondary-text'}>
                                                {activity.isPublic ? 'Pública' : 'Privada'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <button onClick={() => toggleActivityDetails(activity.id)}>
                                                {expandedActivityId === activity.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedActivityId === activity.id && (
                                        <tr>
                                            <td colSpan="5" className="p-4 bg-gray-900/50">
                                                <div className="bg-gray-800 p-4 rounded-lg">
                                                    <h4 className="font-bold text-primary-text">Descrição:</h4>
                                                    <p className="text-secondary-text">{activity.description || 'Sem descrição.'}</p>
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
        </div>
    );
}

export default ActivityManagementPage;
