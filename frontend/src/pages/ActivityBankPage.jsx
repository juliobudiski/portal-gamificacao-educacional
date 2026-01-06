import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import ActivityCard from '../components/activity/ActivityCard';
import { FaTimes, FaCheckCircle, FaPencilAlt, FaUserEdit, FaGlobeAmericas, FaPlusCircle, FaSearch, FaFilter, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import activityService from '../services/activityService'; // Importe o serviço
import { useNavigate } from 'react-router-dom'; // Importe useNavigate

function ActivityBankPage() {
    const { user } = useContext(AuthContext);
    const [myActivities, setMyActivities] = useState([]);
    const [publicActivities, setPublicActivities] = useState([]);
    const [activeTab, setActiveTab] = useState('my');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [selectedActivities, setSelectedActivities] = useState([]);
    // --- ESTADOS PARA A BUSCA ---
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [assignmentFilter, setAssignmentFilter] = useState('all'); // Opções: 'all', 'assigned', 'unassigned'

    const [drafts, setDrafts] = useState([]); // Novo estado para rascunhos
    const navigate = useNavigate(); // Hook de navegação

    // Estado para controlar o Modal de Confirmação
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: null,      // 'student' ou 'activity'
        itemId: null,    // ID do item a ser removido
        title: '',
        message: ''
    });
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
                fetch(`${import.meta.env.VITE_API_URL}/api/activities/my_activities${query}`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/api/activities/public${query}`, { headers })
            ]);

            const myData = await myRes.json();
            const publicData = await publicRes.json();

            // --- NOVO: Buscar Rascunhos ---
            // Só buscamos rascunhos se não houver termo de busca (ou implemente busca no endpoint de drafts se quiser)
            if (!currentSearchTerm) {
                const draftsData = await activityService.getDrafts();
                setDrafts(draftsData);
            }

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

    // Handlers de Clique (UI)
    const handleCopyClick = (activityId) => {
        setModalConfig({
            isOpen: true,
            type: 'copy',
            itemId: activityId,
            title: 'Copiar Atividade',
            message: 'Deseja criar uma cópia editável desta atividade em "Minhas Atividades"?'
        });
    };

    const handleDeleteClick = (activityId) => {
        setModalConfig({
            isOpen: true,
            type: 'delete_single',
            itemId: activityId,
            title: 'Deletar Atividade',
            message: 'Tem certeza que deseja deletar esta atividade? Esta ação é irreversível.'
        });
    };

    const handleBulkDeleteClick = () => {
        if (selectedActivities.length === 0) return;
        setModalConfig({
            isOpen: true,
            type: 'delete_bulk',
            itemId: null, // Não precisa de ID único aqui
            title: 'Deletar Múltiplas Atividades',
            message: `Tem certeza que deseja deletar ${selectedActivities.length} atividades selecionadas? Esta ação é irreversível.`
        });
    };

    // Executor Central
    const executeModalAction = async () => {
        setModalConfig({ ...modalConfig, isOpen: false });
        const { type, itemId } = modalConfig;

        if (type === 'copy') {
            await performCopyActivity(itemId);
        } else if (type === 'delete_single') {
            await performDeleteActivity(itemId);
        } else if (type === 'delete_bulk') {
            await performBulkDelete();
        }
    };

    const performCopyActivity = async (activityId) => {

        setMessage('Copiando atividade...');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}/copy`, {
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

    const performDeleteActivity = async (activityId) => {

        setMessage('Deletando atividade...');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}`, {
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

    const handleSelectActivity = (activityId) => {
        setSelectedActivities(prevSelected => {
            if (prevSelected.includes(activityId)) {
                return prevSelected.filter(id => id !== activityId); // Desmarcar
            } else {
                return [...prevSelected, activityId]; // Marcar
            }
        });
    };

    // --- LÓGICA DE FILTRO (CLIENT-SIDE) ---
    const filteredMyActivities = useMemo(() => {
        if (assignmentFilter === 'all') {
            return myActivities;
        }
        if (assignmentFilter === 'assigned') {
            // Mostra apenas atividades que têm um class_id (ou seja, estão em uso)
            return myActivities.filter(activity => activity.class_id !== null);
        }
        if (assignmentFilter === 'unassigned') {
            // Mostra apenas atividades que NÃO têm um class_id (ou seja, são "modelos")
            return myActivities.filter(activity => activity.class_id === null);
        }
        return myActivities;
    }, [myActivities, assignmentFilter]);

    const handleSelectAll = () => {
        // Seleciona ou deseleciona todos os IDs das atividades *visíveis*
        const visibleIds = filteredMyActivities.map(a => a.id);
        if (selectedActivities.length === visibleIds.length) {
            setSelectedActivities([]); // Desmarcar todos
        } else {
            setSelectedActivities(visibleIds); // Marcar todos
        }
    };

    const performBulkDelete = async () => {
        const count = selectedActivities.length;
        if (count === 0) return;

        setMessage('Deletando atividades selecionadas...');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/bulk-delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ activity_ids: selectedActivities })
            });
            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
                // Remove as atividades deletadas do estado local
                setMyActivities(prev => prev.filter(act => !selectedActivities.includes(act.id)));
                setSelectedActivities([]); // Limpa a seleção
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            setMessage(`Erro ao deletar: ${error.message}`);
        }
    };

    const isAllSelected = useMemo(() => {
        const visibleIds = filteredMyActivities.map(a => a.id);
        return visibleIds.length > 0 && visibleIds.every(id => selectedActivities.includes(id));
    }, [selectedActivities, filteredMyActivities]);


    return (
        <div className="min-h-screen bg-primary-bg p-4 md:p-8 text-primary-text animate-fade-in">
            <div className="max-w-full mx-auto">
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
                        className="w-full bg-secondary-bg border-2 border-[#4a525a] rounded-xl py-3 px-4 pl-10 text-secondary-text focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-secondary-text" />
                    </div>
                </div>

                {/* Abas de Navegação */}
                <div className="mb-6 flex border-b border-border-color">
                    <button onClick={() => setActiveTab('my')} className={`flex items-center gap-2 py-3 px-6 font-semibold transition-colors ${activeTab === 'my' ? 'border-b-2 border-accent-yellow text-accent-yellow' : 'text-secondary-text hover:text-primary-text'}`}>
                        <FaUserEdit /> Minhas Atividades ({myActivities.length})
                    </button>
                    {/* --- NOVA ABA RASCUNHOS --- */}
                    <button onClick={() => setActiveTab('drafts')} className={`flex items-center gap-2 py-3 px-6 font-semibold transition-colors ${activeTab === 'drafts' ? 'border-b-2 border-gray-400 text-gray-400' : 'text-secondary-text hover:text-primary-text'}`}>
                        <FaPencilAlt /> Rascunhos ({drafts.length})
                    </button>
                    <button onClick={() => setActiveTab('public')} className={`flex items-center gap-2 py-3 px-6 font-semibold transition-colors ${activeTab === 'public' ? 'border-b-2 border-accent-teal text-accent-teal' : 'text-secondary-text hover:text-primary-text'}`}>
                        <FaGlobeAmericas /> Banco Público ({publicActivities.length})
                    </button>
                </div>

                {/* --- MENSAGEM DE FEEDBACK (TOAST) --- */}
                {message && (
                    <div className="fixed bottom-5 right-5 z-50 animate-slide-in-right">
                        <div className="bg-secondary-bg border-l-4 border-accent-yellow text-primary-text px-6 py-4 rounded shadow-2xl flex items-center gap-4 min-w-[300px] max-w-md">
                            <div className="text-accent-yellow text-xl">
                                <FaCheckCircle />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{message}</p>
                            </div>
                            <button
                                onClick={() => setMessage('')}
                                className="text-secondary-text hover:text-primary-text transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <p className="text-center py-10">Carregando atividades...</p>
                ) : (
                    <div>
                        {activeTab === 'my' && (
                            <>
                                {/* ===== 3. BOTÕES DE FILTRO ADICIONADOS AQUI ===== */}
                                <div className="flex flex-wrap justify-center items-center gap-4 mb-8 bg-secondary-bg p-3 rounded-xl">
                                    <span className="font-semibold text-secondary-text mr-2 flex items-center"><FaFilter className="mr-2" />Filtrar por:</span>
                                    <button onClick={() => setAssignmentFilter('all')} className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${assignmentFilter === 'all' ? 'bg-accent-yellow text-primary-text shadow-lg' : 'bg-border-color hover:bg-hover-bg-color text-secondary-text'}`}>
                                        Todas
                                    </button>
                                    <button onClick={() => setAssignmentFilter('assigned')} className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${assignmentFilter === 'assigned' ? 'bg-accent-yellow text-primary-text shadow-lg' : 'bg-border-color hover:bg-hover-bg-color text-secondary-text'}`}>
                                        Atribuídas
                                    </button>
                                    <button onClick={() => setAssignmentFilter('unassigned')} className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${assignmentFilter === 'unassigned' ? 'bg-accent-yellow text-primary-text shadow-lg' : 'bg-border-color hover:bg-hover-bg-color text-secondary-text'}`}>
                                        Não Atribuídas (Modelos)
                                    </button>
                                    {/* ===== 4. CHECKBOX "SELECIONAR TODOS" E BARRA DE AÇÕES ===== */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="selectAll"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="h-5 w-5 rounded bg-border-color border-gray-500 text-accent-yellow focus:ring-accent-yellow cursor-pointer"
                                            />
                                            <label htmlFor="selectAll" className="ml-2 text-sm font-medium text-secondary-text">Selecionar Todos</label>
                                        </div>
                                    </div>
                                </div>


                                {/* BARRA DE AÇÕES FLUTUANTE */}
                                {selectedActivities.length > 0 && (
                                    <div className="sticky top-4 z-20 bg-blue-900/80 backdrop-blur-sm border border-blue-500 text-primary-text rounded-xl shadow-lg p-4 mb-6 flex justify-between items-center animate-fadeIn">
                                        <span className="font-bold">{selectedActivities.length} atividade(s) selecionada(s)</span>
                                        <button onClick={handleBulkDeleteClick} className="flex items-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-transform transform hover:scale-105">
                                            <FaTrash />
                                            Apagar Selecionadas
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredMyActivities.length > 0 ? (
                                        filteredMyActivities.map(activity => (
                                            <ActivityCard
                                                key={activity.id}
                                                activity={activity}
                                                isOwner={true}
                                                onDelete={handleDeleteClick}
                                                onCopy={handleCopyClick}
                                                // ===== 5. PASSANDO PROPS DE SELEÇÃO =====
                                                isSelected={selectedActivities.includes(activity.id)}
                                                onSelect={handleSelectActivity}
                                            />
                                        ))
                                    ) : (
                                        <p className="col-span-full text-center py-10 text-secondary-text">Nenhuma atividade encontrada.</p>
                                    )}
                                </div>
                            </>
                        )}
                        {activeTab === 'drafts' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {drafts.length > 0 ? (
                                    drafts.map(draft => (
                                        <div key={draft.id} className="bg-secondary-bg border border-gray-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all relative group">
                                            {/* Badge de Rascunho */}
                                            <span className="absolute top-4 right-4 bg-gray-700 text-xs text-gray-300 px-2 py-1 rounded">
                                                Rascunho
                                            </span>

                                            <h3 className="text-xl font-bold text-primary-text mb-2 truncate">{draft.title || 'Sem título'}</h3>
                                            <p className="text-sm text-secondary-text mb-4">
                                                Última edição: {new Date(draft.updatedAt || draft.updated_at).toLocaleDateString()} às {new Date(draft.updatedAt || draft.updated_at).toLocaleTimeString()}
                                            </p>

                                            <div className="mt-4 flex gap-3">
                                                <button
                                                    onClick={() => navigate(`/professor/criar-atividade/${draft.id}`)}
                                                    className="flex-1 bg-accent-yellow text-primary-bg py-2 rounded-lg font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <FaPencilAlt /> Continuar Editando
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(draft.id)}
                                                    className="p-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                                    title="Descartar Rascunho"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>

                                            <p className="text-xs text-gray-500 mt-4 text-center">
                                                Expira em 7 dias se não editado.
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="col-span-full text-center py-10 text-secondary-text">Nenhum rascunho pendente.</p>
                                )}
                            </div>
                        )}
                        {activeTab === 'public' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {publicActivities.length > 0 ? (
                                    publicActivities.map(activity => (
                                        <ActivityCard key={activity.id} activity={activity} isOwner={false} onCopy={handleCopyClick} />
                                    ))
                                ) : (
                                    <p className="col-span-full text-center py-10 text-secondary-text">Nenhuma atividade pública disponível no momento.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={executeModalAction}
                title={modalConfig.title}
                message={modalConfig.message}
                isDangerous={modalConfig.type !== 'copy'} // Copy é verde, Delete é vermelho
                confirmText={modalConfig.type === 'copy' ? 'Sim, Copiar' : 'Sim, Deletar'}
            />
        </div>
    );
}

export default ActivityBankPage;
