import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaUserPlus, FaBook, FaTrash, FaSave, FaUsers, FaTasks, FaPlusCircle } from 'react-icons/fa';

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

    // --- BUSCA DE DADOS ---
    // Função memoizada para buscar todos os dados de gerenciamento da turma de uma só vez.
    const fetchManagementData = useCallback(async () => {
        if (!user?.token) return;
        setIsLoading(true);
        // Limpa mensagens antigas ao recarregar
        setMessage('');
        setError('');
        try {
            // Usa a nova rota otimizada do backend
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/classes/${class_id}/management-details`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao carregar dados da turma.');
            
            // Preenche todos os estados com os dados recebidos
            setClassDetails(data.details);
            setStudents(data.students);
            setAssignedActivities(data.assigned_activities);
            setAvailableActivities(data.available_activities);

            // Pré-seleciona a primeira atividade disponível no dropdown, se houver
            if (data.available_activities.length > 0) {
                setActivityToAdd(data.available_activities[0].id);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [class_id, user?.token]);

    // Efeito para carregar os dados quando o componente monta
    useEffect(() => {
        fetchManagementData();
    }, [fetchManagementData]);

    // --- FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ---

    // Função genérica para chamadas à API, tratando erros e recarregando os dados
    const handleApiCall = async (url, method, body, successMessage) => {
        setMessage('');
        setError('');
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: body ? JSON.stringify(body) : null,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ocorreu um erro na operação.');
            
            setMessage(successMessage);
            fetchManagementData(); // Recarrega todos os dados da página para refletir a mudança
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
            { name: classDetails.name, description: classDetails.description }, 
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

    // Handler para remover um aluno da turma
    const handleRemoveStudent = (studentId) => {
        if (window.confirm("Tem certeza que deseja remover este aluno da turma?")) {
            handleApiCall(
                `${import.meta.env.VITE_API_URL}/api/classes/${class_id}/students/${studentId}`, 
                'DELETE', 
                null, 
                'Aluno removido com sucesso!'
            );
        }
    };
    
    // Handler para associar uma atividade existente à turma
    const handleAddActivity = () => {
        if (!activityToAdd) return setError("Por favor, selecione uma atividade para associar.");
        handleApiCall(
            `${import.meta.env.VITE_API_URL}/api/classes/${class_id}/activities`, 
            'POST', 
            { activity_id: parseInt(activityToAdd) }, // Garante que o ID é um número
            'Atividade associada com sucesso!'
        );
    };
    
    // Handler para desassociar uma atividade da turma
    const handleRemoveActivity = (activityId) => {
        if (window.confirm("Tem certeza que deseja desassociar esta atividade? Ela não será excluída, apenas removida desta turma.")) {
            handleApiCall(
                `${import.meta.env.VITE_API_URL}/api/classes/${class_id}/activities/${activityId}`, 
                'DELETE', 
                null, 
                'Atividade desassociada com sucesso!'
            );
        }
    };

    // --- RENDERIZAÇÃO ---

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#2c3135] to-[#1e2226] flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-[#ffbd30] mb-4"></div>
                    <p className="text-xl text-gray-300">Carregando dados da turma...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#2c3135] to-[#1e2226] p-4 text-white">
            <div className="max-w-4xl mx-auto">
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
                <form onSubmit={handleUpdateDetails} className="bg-[#343a40] p-6 md:p-8 rounded-2xl shadow-xl border border-[#3e4a52] mb-8">
                    <h2 className="text-xl font-bold mb-4">Detalhes da Turma</h2>
                    <div className="mb-6">
                        <label htmlFor="editName" className="block text-sm font-medium text-gray-300 mb-2">Nome da Turma</label>
                        <input
                            type="text" id="editName"
                            value={classDetails.name}
                            onChange={(e) => setClassDetails({...classDetails, name: e.target.value})}
                            className="w-full px-4 py-3 bg-[#2c3135] border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30] text-white"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="editDescription" className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                        <textarea
                            id="editDescription"
                            value={classDetails.description}
                            onChange={(e) => setClassDetails({...classDetails, description: e.target.value})}
                            className="w-full px-4 py-3 bg-[#2c3135] border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30] text-white h-32"
                        ></textarea>
                    </div>
                    <div className="flex justify-between items-center">
                         <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"><FaSave className="mr-2" /> Salvar Detalhes</button>
                         <button type="button" onClick={() => navigate('/professor/gerenciar-turmas')} className="text-gray-300 hover:text-white">Cancelar</button>
                    </div>
                </form>

                {/* --- SEÇÃO 2: GERENCIAR ALUNOS --- */}
                <div className="bg-[#343a40] p-6 md:p-8 rounded-2xl shadow-xl border border-[#3e4a52] mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center"><FaUsers className="mr-3 text-[#69e8cb]" /> Gerenciar Alunos ({students.length})</h2>
                    <div className="mb-4 flex flex-col sm:flex-row gap-2">
                        <input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="E-mail do aluno para adicionar" className="flex-grow px-4 py-3 bg-[#2c3135] border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30]" />
                        <button onClick={handleAddStudent} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"><FaUserPlus className="mr-2" /> Adicionar Aluno</button>
                    </div>
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {students.map(s => (
                            <li key={s.id} className="flex justify-between items-center bg-[#2c3135] p-3 rounded-lg">
                                <div>
                                    <p className="font-medium">{s.name}</p>
                                    <p className="text-sm text-gray-400">{s.email}</p>
                                </div>
                                <button onClick={() => handleRemoveStudent(s.id)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-500/10"><FaTrash /></button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* --- SEÇÃO 3: GERENCIAR ATIVIDADES --- */}
                <div className="bg-[#343a40] p-6 md:p-8 rounded-2xl shadow-xl border border-[#3e4a52]">
                    <h2 className="text-xl font-bold mb-4 flex items-center"><FaTasks className="mr-3 text-[#9570d9]" /> Gerenciar Atividades ({assignedActivities.length})</h2>
                    <div className="mb-4 flex flex-col sm:flex-row gap-2">
                        <select value={activityToAdd} onChange={(e) => setActivityToAdd(e.target.value)} className="flex-grow px-4 py-3 bg-[#2c3135] border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30]">
                            <option value="" disabled>-- Selecione uma atividade para associar --</option>
                            {availableActivities.map(a => (
                                <option key={a.id} value={a.id}>{a.title}</option>
                            ))}
                        </select>
                        <button onClick={handleAddActivity} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"><FaPlusCircle className="mr-2" /> Associar Atividade</button>
                    </div>
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {assignedActivities.map(a => (
                            <li key={a.id} className="flex justify-between items-center bg-[#2c3135] p-3 rounded-lg">
                                <p className="font-medium">{a.title}</p>
                                <button onClick={() => handleRemoveActivity(a.id)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-500/10"><FaTrash /></button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default ClassEditPage;