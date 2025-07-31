import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import ActivityCard from '../components/activity/ActivityCard';
import { FaUserEdit, FaGlobeAmericas, FaPlusCircle, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function ActivityBankPage() {
    const { user } = useContext(AuthContext);
    const [myActivities, setMyActivities] = useState([]);
    const [publicActivities, setPublicActivities] = useState([]);
    const [activeTab, setActiveTab] = useState('my');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    
    // --- ESTADOS PARA A BUSCA ---
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // --- FUNÇÃO PARA BUSCAR ATIVIDADES (AGORA REUTILIZÁVEL) ---
    const fetchActivities = useCallback(async (currentSearchTerm) => {
        if (!user?.token) return;
        
        // Define o estado de carregamento apropriado
        if (currentSearchTerm) setIsSearching(true);
        else setLoading(true);
        
        setMessage('');
        try {
            const headers = { 'Authorization': `Bearer ${user.token}` };
            // Adiciona o termo de busca na URL se ele existir
            const query = currentSearchTerm ? `?search=${encodeURIComponent(currentSearchTerm)}` : '';

            // Busca ambas as listas com o mesmo termo de busca
            const [myRes, publicRes] = await Promise.all([
                fetch(`http://127.0.0.1:5000/api/activities/my_activities${query}`, { headers }),
                fetch(`http://127.0.0.1:5000/api/activities/public${query}`, { headers })
            ]);

            const myData = await myRes.json();
            const publicData = await publicRes.json();

            if (myRes.ok) setMyActivities(myData);
            else throw new Error(myData.message || 'Erro ao buscar minhas atividades');

            if (publicRes.ok) setPublicActivities(publicData);
            else throw new Error(publicData.message || 'Erro ao buscar atividades públicas');

        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [user?.token]); // Depende apenas do token do usuário

    // --- EFEITO PARA BUSCA "DEBOUNCED" ---
    // Este efeito é acionado sempre que o usuário para de digitar por 500ms
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            console.log("Iniciando busca com o termo:", searchTerm);
            fetchActivities(searchTerm);
        }, 500); // A busca só acontece 500ms após o usuário parar de digitar

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchActivities]); // Roda quando o termo de busca ou a função de fetch mudam
    
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

    // --- LÓGICA DE FILTRO (CLIENT-SIDE) ---
    const filteredMyActivities = useMemo(() => {
        if (!searchTerm) return myActivities;
        return myActivities.filter(activity => 
            activity.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [myActivities, searchTerm]);


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

                {/* --- BARRA DE PESQUISA ADICIONADA AQUI --- */}
                <div className="relative mb-6">
                    <input 
                        type="text"
                        placeholder="Pesquisar por título..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#3a4046] border-2 border-[#4a525a] rounded-xl py-3 px-4 pl-10 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-gray-400" />
                    </div>
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
