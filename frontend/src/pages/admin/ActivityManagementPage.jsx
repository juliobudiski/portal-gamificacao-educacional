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
    const [modalConfig, setModalConfig] = useState({ isOpen: false, activityId: null, title: '', isMassDelete: false });
    const [selectedActivities, setSelectedActivities] = useState([]);

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
            
            if (modalConfig.isMassDelete) {
                // Deleção em massa
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/activities/mass`, {
                    method: 'DELETE',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ activity_ids: selectedActivities })
                });
                
                if (!response.ok) throw new Error('Falha ao deletar atividades em massa.');
                setActivitiesList(prev => prev.filter(a => !selectedActivities.includes(a.id)));
                setSelectedActivities([]);
            } else {
                // Deleção única
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/activities/${modalConfig.activityId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao deletar atividade.');
                setActivitiesList(prev => prev.filter(a => a.id !== modalConfig.activityId));
            }
        } catch (e) {
            alert(e.message);
        } finally {
            setModalConfig({ isOpen: false, activityId: null, title: '', isMassDelete: false });
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedActivities(filteredActivities.map(a => a.id));
        } else {
            setSelectedActivities([]);
        }
    };

    const toggleSelectActivity = (id) => {
        setSelectedActivities(prev => 
            prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
        );
    };

    const handleMassDeleteClick = () => {
        if (selectedActivities.length === 0) return;
        setModalConfig({ 
            isOpen: true, 
            activityId: null, 
            title: `${selectedActivities.length} atividades`, 
            isMassDelete: true 
        });
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
            
            {/* Barra de Busca e Ações */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por título ou professor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-primary-bg border border-border-color rounded-lg pl-10 pr-4 py-3 text-primary-text focus:ring-2 focus:ring-accent-teal outline-none transition-all shadow-inner hover:shadow-md"
                    />
                </div>
                
                {selectedActivities.length > 0 && (
                    <button 
                        onClick={handleMassDeleteClick}
                        className="flex items-center space-x-2 bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 hover:border-danger/50 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm animate-fade-in"
                    >
                        <Trash2 size={18} />
                        <span>Deletar Selecionados ({selectedActivities.length})</span>
                    </button>
                )}
            </div>

            <div className="bg-secondary-bg border border-border-color rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-color">
                        <thead className="bg-gradient-to-r from-accent-teal/10 to-accent-purple/10 border-b border-border-color">
                            <tr>
                                <th className="py-4 px-4 text-left">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-border-color text-accent-teal focus:ring-accent-teal bg-primary-bg cursor-pointer"
                                        checked={selectedActivities.length === filteredActivities.length && filteredActivities.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
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
                                    <tr className={`transition-colors ${expandedActivityId === activity.id ? 'bg-accent-teal/5' : 'hover:bg-hover-bg-color0'} ${selectedActivities.includes(activity.id) ? 'bg-accent-teal/10' : ''}`}>
                                        <td className="py-4 px-4">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-border-color text-accent-teal focus:ring-accent-teal bg-primary-bg cursor-pointer"
                                                checked={selectedActivities.includes(activity.id)}
                                                onChange={() => toggleSelectActivity(activity.id)}
                                            />
                                        </td>
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
                                            <td colSpan="6" className="p-4 bg-accent-teal/5">
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
                title={modalConfig.isMassDelete ? "Deletar Múltiplas Atividades" : "Deletar Atividade"}
                message={modalConfig.isMassDelete 
                    ? `Tem certeza que deseja deletar permanentemente as ${modalConfig.title} selecionadas? Esta ação é irreversível e removerá todo o progresso e eventos relacionados a elas.`
                    : `Tem certeza que deseja deletar a atividade "${modalConfig.title}"? Esta ação removerá progresso e eventos relacionados.`}
                isDangerous={true}
                confirmText={modalConfig.isMassDelete ? "Deletar Atividades" : "Deletar Atividade"}
            />
        </div>
    );
}

export default ActivityManagementPage;
