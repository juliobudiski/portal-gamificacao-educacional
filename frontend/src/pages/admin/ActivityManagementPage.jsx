// frontend/src/pages/admin/ActivityManagementPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ChevronDown, ChevronUp, Search, Trash2, Eye, EyeOff } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';

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
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useContext(AuthContext);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, activityId: null, title: '' });

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

    const handleDeleteClick = (activityId, activityTitle) => {
        setModalConfig({ isOpen: true, activityId, title: activityTitle });
    };

    const confirmDelete = async () => {
        try {
            const token = user?.token;
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/activities/${modalConfig.activityId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao deletar atividade.');
            setActivitiesList(prev => prev.filter(a => a.id !== modalConfig.activityId));
        } catch (e) {
            alert(e.message);
        } finally {
            setModalConfig({ isOpen: false, activityId: null, title: '' });
        }
    };

    const toggleVisibility = async (activityId) => {
        try {
            const token = user?.token;
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/activities/${activityId}/visibility`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao alterar visibilidade.');
            setActivitiesList(prev => prev.map(a => a.id === activityId ? { ...a, isPublic: !a.isPublic } : a));
        } catch (e) {
            alert(e.message);
        }
    };

    const filteredActivities = activitiesList.filter(activity =>
        (activity.title && activity.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (activity.professor_name && activity.professor_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return <div className="text-center text-primary-text p-10">Carregando atividades...</div>;
    if (error) return <div className="text-center text-red-400 p-10">Erro: {error}</div>;

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold text-primary-text mb-6">Gerenciamento de Conteúdo</h1>
            
            {/* Barra de Busca */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por título ou professor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-secondary-bg border border-border-color rounded-lg pl-10 pr-4 py-3 text-primary-text focus:ring-2 focus:ring-accent-teal outline-none transition-all shadow-md hover:shadow-lg"
                />
            </div>

            <div className="bg-secondary-bg border border-border-color rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-color">
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
                        <tbody className="divide-y divide-border-color">
                            {filteredActivities.map((activity) => (
                                <React.Fragment key={activity.id}>
                                    <tr className="hover:bg-border-color/50">
                                        <td className="py-4 px-4 text-sm font-medium text-accent-yellow">{activity.id}</td>
                                        <td className="py-4 px-4 text-sm text-primary-text">{activity.title}</td>
                                        <td className="py-4 px-4 text-sm text-secondary-text">{activity.professor_name || 'N/A'}</td>
                                        <td className="py-4 px-4 text-sm text-secondary-text"> {activity.average_engagement_time || 'N/A'}</td>
                                        <td className="py-4 px-4 text-sm">
                                            <span className={activity.isPublic ? 'text-green-400' : 'text-secondary-text'}>
                                                {activity.isPublic ? 'Pública' : 'Privada'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right flex justify-end space-x-2">
                                            <button onClick={() => toggleVisibility(activity.id)} className="p-2 hover:bg-blue-500/20 rounded" title="Alternar Visibilidade">
                                                {activity.isPublic ? <Eye size={18} className="text-blue-400" /> : <EyeOff size={18} className="text-gray-400" />}
                                            </button>
                                            <button onClick={() => handleDeleteClick(activity.id, activity.title)} className="p-2 hover:bg-red-500/20 rounded" title="Deletar">
                                                <Trash2 size={18} className="text-red-400" />
                                            </button>
                                            <button onClick={() => toggleActivityDetails(activity.id)} className="p-2 hover:bg-white/10 rounded">
                                                {expandedActivityId === activity.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedActivityId === activity.id && (
                                        <tr>
                                            <td colSpan="6" className="p-4 bg-hover-bg-color">
                                                <div className="bg-secondary-bg border border-border-color p-4 rounded-lg">
                                                    <h4 className="font-bold text-primary-text mb-2">Descrição:</h4>
                                                    <p className="text-secondary-text text-sm leading-relaxed">{activity.description || 'Sem descrição.'}</p>
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
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={confirmDelete}
                title="Deletar Atividade"
                message={`Tem certeza que deseja deletar a atividade "${modalConfig.title}"? Esta ação removerá progresso e eventos relacionados.`}
                isDangerous={true}
                confirmText="Deletar Atividade"
            />
        </div>
    );
}

export default ActivityManagementPage;
