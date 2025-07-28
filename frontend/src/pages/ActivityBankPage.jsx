import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ActivityCard from '../components/activity/ActivityCard'; // Importa o novo componente
import { FaUserEdit, FaGlobeAmericas, FaPlusCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function ActivityBankPage() {
    const { user } = useContext(AuthContext);
    const [myActivities, setMyActivities] = useState([]);
    const [publicActivities, setPublicActivities] = useState([]);
    const [activeTab, setActiveTab] = useState('my'); // 'my' ou 'public'
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchActivities = async () => {
            if (!user?.token) return;
            setLoading(true);
            setMessage('');
            try {
                const headers = { 'Authorization': `Bearer ${user.token}` };

                // Busca as atividades do professor
                const myActivitiesRes = await fetch('http://127.0.0.1:5000/api/activities/my_activities', { headers });
                const myActivitiesData = await myActivitiesRes.json();
                if (myActivitiesRes.ok) {
                    setMyActivities(myActivitiesData);
                } else {
                    throw new Error(myActivitiesData.message || 'Erro ao buscar minhas atividades');
                }

                // Busca as atividades públicas
                const publicActivitiesRes = await fetch('http://127.0.0.1:5000/api/activities/public', { headers });
                const publicActivitiesData = await publicActivitiesRes.json();
                if (publicActivitiesRes.ok) {
                    setPublicActivities(publicActivitiesData);
                } else {
                    throw new Error(publicActivitiesData.message || 'Erro ao buscar atividades públicas');
                }

            } catch (error) {
                setMessage(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [user]);
    
    const handleCopyActivity = async (activityId) => {
        if (!window.confirm("Tem certeza que deseja criar uma cópia editável desta atividade?")) return;
        setMessage('Copiando atividade...');
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/activities/${activityId}/copy`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setMessage('Atividade copiada com sucesso! Ela está agora em "Minhas Atividades".');
                setMyActivities(prev => [data.activity, ...prev]);
                setActiveTab('my'); // Muda para a aba de atividades do usuário
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            setMessage(`Erro ao copiar: ${error.message}`);
        }
    };

    const handleDeleteActivity = async (activityId) => {
        if (!window.confirm("Tem certeza que deseja deletar esta atividade? Esta ação é irreversível.")) return;
        setMessage('Deletando atividade...');
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/activities/${activityId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setMessage('Atividade deletada com sucesso!');
                setMyActivities(prev => prev.filter(act => act.id !== activityId));
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            setMessage(`Erro ao deletar: ${error.message}`);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1e2226] to-[#2c3135] p-4 md:p-8 text-white">
            <div className="max-w-7xl mx-auto">
                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-yellow to-accent-teal bg-clip-text text-transparent mb-4 md:mb-0">
                        Banco de Atividades
                    </h1>
                    <Link to="/professor/criar-atividade" className="flex items-center gap-2 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-transform transform hover:scale-105">
                        <FaPlusCircle />
                        Criar Nova Atividade
                    </Link>
                </div>

                {/* Abas de Navegação */}
                <div className="mb-6 flex border-b border-gray-700">
                    <button onClick={() => setActiveTab('my')} className={`flex items-center gap-2 py-3 px-6 font-semibold transition-colors ${activeTab === 'my' ? 'border-b-2 border-accent-yellow text-accent-yellow' : 'text-gray-400 hover:text-white'}`}>
                        <FaUserEdit /> Minhas Atividades ({myActivities.length})
                    </button>
                    <button onClick={() => setActiveTab('public')} className={`flex items-center gap-2 py-3 px-6 font-semibold transition-colors ${activeTab === 'public' ? 'border-b-2 border-accent-teal text-accent-teal' : 'text-gray-400 hover:text-white'}`}>
                        <FaGlobeAmericas /> Banco Público ({publicActivities.length})
                    </button>
                </div>

                {/* Mensagem de Feedback */}
                {message && <div className="bg-gray-700 p-3 rounded-lg mb-4 text-center">{message}</div>}

                {/* Conteúdo das Abas */}
                {loading ? (
                    <p className="text-center py-10">Carregando atividades...</p>
                ) : (
                    <div>
                        {activeTab === 'my' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myActivities.length > 0 ? (
                                    myActivities.map(activity => (
                                        <ActivityCard key={activity.id} activity={activity} isOwner={true} onDelete={handleDeleteActivity} />
                                    ))
                                ) : (
                                    <p className="col-span-full text-center py-10 text-gray-400">Você ainda não criou nenhuma atividade.</p>
                                )}
                            </div>
                        )}
                        {activeTab === 'public' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {publicActivities.length > 0 ? (
                                    publicActivities.map(activity => (
                                        <ActivityCard key={activity.id} activity={activity} isOwner={false} onCopy={handleCopyActivity} />
                                    ))
                                ) : (
                                    <p className="col-span-full text-center py-10 text-gray-400">Nenhuma atividade pública disponível no momento.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ActivityBankPage;
