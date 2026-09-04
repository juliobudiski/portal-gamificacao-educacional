import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaUserPlus, FaBook, FaTrash, FaSave, FaUsers, FaTasks, FaPlusCircle, FaArrowLeft } from 'react-icons/fa';
import ConfirmationModal from '../components/ConfirmationModal';
/**
 * Componente ClassEditPage
 * 
 * Página para edição das configurações de uma turma (nome, descrição, visibilidade).
 */
function ClassEditPage() {
    const { class_id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // --- ESTADOS CONSOLIDADOS ---
    // Detalhes da turma para o formulário de edição
    const [classDetails, setClassDetails] = useState({ name: '', description: '' });
    // Listas para gerenciamento
    const [students, setStudents] = useState([]);
    const [assignedActivities, setAssignedActivities] = useState([]);
    const [availableActivities, setAvailableActivities] = useState([]);

    // Estados para os campos de adição
    const [studentEmail, setStudentEmail] = useState('');
    const [activityToAdd, setActivityToAdd] = useState('');

    // Estados de UI (feedback e carregamento)
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Estado para controlar o Modal de Confirmação
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: null,      // 'student' ou 'activity'
        itemId: null,    // ID do item a ser removido
        title: '',
        message: ''
    });

    // --- BUSCA DE DADOS ---
    // Função memoizada para buscar todos os dados de gerenciamento da turma de uma só vez.
    const fetchManagementData = useCallback(async (showLoading = true) => {
        if (!user?.token) return;

        // Só ativa o loading global se for solicitado (ex: primeira carga)
        if (showLoading) setIsLoading(true);

        // Se for loading silencioso, limpamos mensagens para garantir UI limpa
        if (showLoading) {
            setMessage('');
            setError('');
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/classes/${class_id}/management-details`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao carregar dados da turma.');

            setClassDetails(data.details);
            setStudents(data.students);
            setAssignedActivities(data.assigned_activities);
            setAvailableActivities(data.available_activities);

            // Lógica de pré-seleção CORRIGIDA
            // Usamos o prev (estado anterior) para decidir, sem depender da variável externa
            setActivityToAdd(prev => {
                // Se já existe um valor selecionado pelo usuário, MANTÉM ele.
                if (prev) return prev;
                // Se não tem nada selecionado e existem atividades, pega a primeira.
                if (data.available_activities.length > 0) return data.available_activities[0].id;
                return '';
            });

        } catch (err) {
            setError(err.message);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [class_id, user?.token]);

    // Efeito para carregar os dados quando o componente monta
    useEffect(() => {
        fetchManagementData(true);
    }, [fetchManagementData]);

    // --- FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ---

    // Função genérica para chamadas à API, tratando erros e recarregando os dados
    const handleApiCall = async (url, method, body, successMessage) => {
        setMessage('');
        setError('');
        // Opcional: Crie um estado local setIsSubmitting(true) para desabilitar botões enquanto salva

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: body ? JSON.stringify(body) : null,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ocorreu um erro na operação.');

            setMessage(successMessage);

            // AQUI ESTÁ O PULO DO GATO: false = Não mostra spinner tela cheia
            await fetchManagementData(false);

            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    // Handler para atualizar o nome e a descrição da turma
    const handleUpdateDetails = (e) => {
        e.preventDefault();
        handleApiCall(
            `${import.meta.env.VITE_API_URL}/api/classes/${class_id}`,
            'PUT',
            {
                name: classDetails.name,
                description: classDetails.description,
                is_enrollment_code_public: classDetails.is_enrollment_code_public // <-- ADICIONE ESTA LINHA
            },
            'Detalhes da turma atualizados com sucesso!'
        );
    };

    // Handler para adicionar um novo aluno via e-mail
    const handleAddStudent = () => {
        if (!studentEmail.trim()) return setError("Por favor, insira um e-mail válido.");
        handleApiCall(
            `${import.meta.env.VITE_API_URL}/api/classes/${class_id}/students`,
            'POST',
            { email: studentEmail },
            'Aluno adicionado com sucesso!'
        ).then(success => {
            if (success) setStudentEmail(''); // Limpa o campo apenas se a operação for bem-sucedida
        });
    };

    // Handler para disparar a remoção de ALUNO (Abre o modal)
    const handleRemoveStudentClick = (studentId) => {
        setModalConfig({
            isOpen: true,
            type: 'student',
            itemId: studentId,
            title: 'Remover Aluno',
            message: 'Tem certeza que deseja remover este aluno da turma? Ele perderá o acesso às atividades desta classe.'
        });
    };

    // Handler para associar uma atividade existente à turma
    const handleAddActivity = (e) => { // Receba o evento 'e'
        if (e) e.preventDefault(); // Previne comportamento padrão (refresh/scroll)

        if (!activityToAdd) return setError("Por favor, selecione uma atividade para associar.");

        handleApiCall(
            `${import.meta.env.VITE_API_URL}/api/classes/${class_id}/activities`,
            'POST',
            { activity_id: parseInt(activityToAdd) },
            'Atividade associada com sucesso!'
        );
    };

    // Handler para disparar a remoção de ATIVIDADE (Abre o modal)
    const handleRemoveActivityClick = (activityId) => {
        setModalConfig({
            isOpen: true,
            type: 'activity',
            itemId: activityId,
            title: 'Desassociar Atividade',
            message: 'Tem certeza que deseja desassociar esta atividade? Ela não será excluída do sistema, apenas removida desta turma.'
        });
    };

    // Esta função é chamada SOMENTE quando o usuário clica em "Confirmar" no modal
    const executeRemoval = () => {
        const { type, itemId } = modalConfig;

        if (type === 'student') {
            handleApiCall(
                `${import.meta.env.VITE_API_URL}/api/classes/${class_id}/students/${itemId}`,
                'DELETE',
                null,
                'Aluno removido com sucesso!'
            );
        } else if (type === 'activity') {
            handleApiCall(
                `${import.meta.env.VITE_API_URL}/api/classes/${class_id}/activities/${itemId}`,
                'DELETE',
                null,
                'Atividade desassociada com sucesso!'
            );
        }

        // Fecha o modal (embora o componente ConfirmationModal já chame o close, limpamos o state aqui)
        setModalConfig({ ...modalConfig, isOpen: false });
    };

    // --- RENDERIZAÇÃO ---

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br bg-primary-bg  flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-[#ffbd30] mb-4"></div>
                    <p className="text-xl text-secondary-text">Carregando dados da turma...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br bg-primary-bg  p-4 text-primary-text">
            <div className="max-w-4xl mx-auto">
                <button 
                    onClick={() => navigate(-1)} 
                    className="group mb-6 flex items-center gap-2 text-secondary-text hover:text-accent-teal transition-colors font-bold uppercase tracking-widest text-sm"
                >
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    Voltar
                </button>

                <header className="mb-8 text-center bg-gradient-to-r from-[#ffbd30] to-[#ffa000] p-6 rounded-2xl shadow-2xl border-b-4 border-[#ffcc5c]">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#2c3135]">
                        Gerenciar Turma
                    </h1>
                    <p className="mt-2 text-[#2c3135] font-medium">
                        {classDetails.name}
                    </p>
                </header>

                {error && <div className="bg-red-900/50 border border-red-600 text-red-100 p-3 mb-4 rounded-xl text-center" role="alert">{error}</div>}
                {message && <div className="bg-green-900/50 border border-green-600 text-green-100 p-3 mb-4 rounded-xl text-center" role="alert">{message}</div>}

                {/* --- SEÇÃO 1: DETALHES DA TURMA --- */}
                <form onSubmit={handleUpdateDetails} className="bg-secondary-bg p-6 md:p-8 rounded-2xl shadow-xl border border-[#3e4a52] mb-8">
                    <h2 className="text-xl font-bold mb-4">Detalhes da Turma</h2>
                    <div className="mb-6">
                        <label htmlFor="editName" className="block text-sm font-medium text-secondary-text mb-2">Nome da Turma</label>
                        <input
                            type="text" id="editName"
                            value={classDetails.name}
                            onChange={(e) => setClassDetails({ ...classDetails, name: e.target.value })}
                            className="w-full px-4 py-3 bg-primary-bg border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30] text-primary-text"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="editDescription" className="block text-sm font-medium text-secondary-text mb-2">Descrição</label>
                        <textarea
                            id="editDescription"
                            value={classDetails.description}
                            onChange={(e) => setClassDetails({ ...classDetails, description: e.target.value })}
                            className="w-full px-4 py-3 bg-primary-bg border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30] text-primary-text h-32"
                        ></textarea>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-secondary-text mb-2">Visibilidade do Código</label>
                        <div className="flex items-center p-4 bg-primary-bg rounded-lg border border-[#3e4a52]">
                            <span className="flex-grow text-secondary-text">
                                {classDetails.is_enrollment_code_public ? 'Código Público (Visível para alunos)' : 'Código Privado (Apenas para você)'}
                            </span>
                            <label htmlFor="toggle-public" className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="toggle-public"
                                    className="sr-only peer"
                                    checked={classDetails.is_enrollment_code_public || false}
                                    onChange={(e) => setClassDetails({ ...classDetails, is_enrollment_code_public: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-yellow-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-secondary-bg after:border-border-color after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-primary-text font-bold py-2 px-4 rounded-lg flex items-center"><FaSave className="mr-2" /> Salvar Detalhes</button>
                        <button type="button" onClick={() => navigate('/professor/gerenciar-turmas')} className="text-secondary-text hover:text-primary-text">Cancelar</button>
                    </div>
                </form>

                {/* --- SEÇÃO 2: GERENCIAR ALUNOS --- */}
                <div className="bg-secondary-bg p-6 md:p-8 rounded-2xl shadow-xl border border-[#3e4a52] mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center"><FaUsers className="mr-3 text-[#69e8cb]" /> Gerenciar Alunos ({students.length})</h2>
                    <div className="mb-4 flex flex-col sm:flex-row gap-2">
                        <input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="E-mail do aluno para adicionar" className="flex-grow px-4 py-3 bg-primary-bg border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30]" />
                        <button onClick={handleAddStudent} className="bg-green-600 hover:bg-green-700 text-primary-text font-bold py-2 px-4 rounded-lg flex items-center justify-center"><FaUserPlus className="mr-2" /> Adicionar Aluno</button>
                    </div>
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {students.map(s => (
                            <li key={s.id} className="flex justify-between items-center bg-primary-bg p-3 rounded-lg">
                                <div>
                                    <p className="font-medium">{s.name}</p>
                                    <p className="text-sm text-secondary-text">{s.email}</p>
                                </div>
                                <button onClick={() => handleRemoveStudentClick(s.id)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-500/10"><FaTrash /></button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* --- SEÇÃO 3: GERENCIAR ATIVIDADES --- */}
                <div className="bg-secondary-bg p-6 md:p-8 rounded-2xl shadow-xl border border-[#3e4a52]">
                    <h2 className="text-xl font-bold mb-4 flex items-center"><FaTasks className="mr-3 text-[#9570d9]" /> Gerenciar Atividades ({assignedActivities.length})</h2>
                    <div className="mb-4 flex flex-col sm:flex-row gap-2">
                        <select value={activityToAdd} onChange={(e) => setActivityToAdd(e.target.value)} className="flex-grow px-4 py-3 bg-primary-bg border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30]">
                            <option value="" disabled>-- Selecione uma atividade para associar --</option>
                            {availableActivities.map(a => (
                                <option key={a.id} value={a.id}>{a.title}</option>
                            ))}
                        </select>
                        <button type="button" onClick={handleAddActivity} className="bg-green-600 hover:bg-green-700 text-primary-text font-bold py-2 px-4 rounded-lg flex items-center justify-center"><FaPlusCircle className="mr-2" /> Associar Atividade</button>
                    </div>
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {assignedActivities.map(a => (
                            <li key={a.id} className="flex justify-between items-center bg-primary-bg p-3 rounded-lg">
                                <p className="font-medium">{a.title}</p>
                                <button
                                    type="button" // Adicione isto por segurança
                                    onClick={() => handleRemoveActivityClick(a.id)}
                                    className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-500/10"
                                ><FaTrash /></button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {/* MODAL DE CONFIRMAÇÃO */}
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={executeRemoval}
                title={modalConfig.title}
                message={modalConfig.message}
                isDangerous={true} // Deixa o topo vermelho para indicar perigo/remoção
                confirmText="Sim, remover"
            />
        </div>
    );
}

export default ClassEditPage;