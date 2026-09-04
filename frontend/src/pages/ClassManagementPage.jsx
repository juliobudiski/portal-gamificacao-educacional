import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';

/**
 * Componente ClassManagementPage
 * 
 * Dashboard de gerenciamento de turmas do professor, listando as turmas ativas e atalhos de criação.
 */

function ClassListPage() {
    const { user } = useContext(AuthContext); // Removido 'authToken' da desestruturação
    const [classes, setClasses] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    // Estado para controlar o Modal de Confirmação
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: null,      // 'student' ou 'activity'
        itemId: null,    // ID do item a ser removido
        title: '',
        message: ''
    });
    // Log de montagem/desmontagem do componente
    useEffect(() => {
        console.log('[ClassListPage] Componente montado.');
        return () => {
            console.log('[ClassListPage] Componente desmontado.');
        };
    }, []);

    const fetchClasses = async () => {
        console.log('[ClassListPage] Iniciando busca de turmas...');
        setMessage('');
        setIsLoading(true);

        const token = user?.token; // Acessa o token via user.token
        console.log('[ClassListPage] Token de autenticação sendo enviado para listar turmas:', token);

        if (!token) {
            setMessage('Erro: Token de autenticação não encontrado. Faça login novamente.');
            setIsLoading(false);
            console.error('[ClassListPage] Erro: Token de autenticação ausente para listar turmas.');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/classes`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Usando user?.token aqui
                },
            });

            const data = await response.json();
            console.log('[ClassListPage] Resposta bruta da API (listar turmas):', response);
            console.log('[ClassListPage] Dados da resposta da API (listar turmas):', data);

            if (response.ok) {
                setClasses(data);
                console.log('[ClassListPage] Turmas carregadas com sucesso:', data);
            } else {
                setMessage(data.message || 'Erro ao carregar turmas.');
                console.error('[ClassListPage] Erro ao carregar turmas:', data.message);
            }
        } catch (error) {
            console.error('[ClassListPage] Erro na requisição de listagem de turmas:', error);
            setMessage('Erro na comunicação com o servidor ao carregar turmas.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) { // Chama fetchClasses se o token estiver disponível
            fetchClasses();
        } else {
            console.log('[ClassListPage] Usuário ou token não disponível, não buscando turmas inicialmente.');
            setIsLoading(false);
        }
    }, [user?.token]); // Depende do user.token, não do authToken diretamente

    // 1. Ação do Botão: Apenas abre o modal
    const handleLeaveClassClick = (classId) => {
        setModalConfig({
            isOpen: true,
            type: 'leave',
            itemId: classId,
            title: 'Sair da Turma',
            message: 'Tem certeza que deseja sair desta turma? Você perderá acesso às atividades atribuídas.'
        });
    };

    // 2. Ação do Botão: Apenas abre o modal
    const handleDeleteClassClick = (classId) => {
        setModalConfig({
            isOpen: true,
            type: 'delete',
            itemId: classId,
            title: 'Deletar Turma',
            message: 'Tem certeza que deseja deletar esta turma? Esta ação é irreversível e desassociará todas as atividades e matrículas.'
        });
    };

    // 3. Executor Central: Chamado pelo botão "Confirmar" do Modal
    const executeModalAction = async () => {
        const { type, itemId } = modalConfig;

        // Fecha o modal imediatamente
        setModalConfig({ ...modalConfig, isOpen: false });

        // Redireciona para a lógica correta baseada no tipo
        if (type === 'leave') {
            await performLeaveClass(itemId);
        } else if (type === 'delete') {
            await performDeleteClass(itemId);
        }
    };

    const performLeaveClass = async (classId) => {
        console.log(`[ClassListPage] Tentando sair da turma ID: ${classId}`);

        setMessage('');
        setIsLoading(true);

        const token = user?.token;
        if (!token) {
            setMessage('Erro: Token de autenticação não encontrado. Faça login novamente.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/classes/${classId}/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            console.log('[ClassListPage] Resposta bruta da API (sair turma):', response);
            console.log('[ClassListPage] Dados da resposta da API (sair turma):', data);

            if (response.ok) {
                setMessage('Você saiu da turma com sucesso.');
                console.log('[ClassListPage] Saída da turma bem-sucedida.');
                fetchClasses(); // Recarrega a lista de turmas
            } else {
                setMessage(data.message || 'Erro ao sair da turma.');
                console.error('[ClassListPage] Erro ao sair da turma:', data.message);
            }
        } catch (error) {
            console.error('[ClassListPage] Erro na requisição de sair da turma:', error);
            setMessage('Erro na comunicação com o servidor ao sair da turma.');
        } finally {
            setIsLoading(false);
        }
    };

    const performDeleteClass = async (classId) => {
        console.log(`[ClassListPage] Tentando deletar a turma ID: ${classId}`);

        setMessage('');
        setIsLoading(true);

        const token = user?.token;
        if (!token) {
            setMessage('Erro: Token de autenticação não encontrado. Faça login novamente.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/classes/${classId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            console.log('[ClassListPage] Resposta bruta da API (deletar turma):', response);
            console.log('[ClassListPage] Dados da resposta da API (deletar turma):', data);

            if (response.ok) {
                setMessage('Turma deletada com sucesso!');
                console.log('[ClassListPage] Turma deletada com sucesso.');
                fetchClasses(); // Recarrega a lista de turmas
            } else {
                setMessage(data.message || 'Erro ao deletar turma.');
                console.error('[ClassListPage] Erro ao deletar turma:', data.message);
            }
        } catch (error) {
            console.error('[ClassListPage] Erro na requisição de deletar turma:', error);
            setMessage('Erro na comunicação com o servidor ao deletar turma.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-primary-bg transition-colors duration-300">
            {/* Background Animado (Blobs) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[30vw] h-[30vw] rounded-full bg-accent-teal/10 blur-[100px] animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-accent-purple/10 blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute top-[30%] left-[50%] w-[20vw] h-[20vw] rounded-full bg-accent-yellow/5 blur-[80px] animate-blob animation-delay-4000"></div>
            </div>

            <div className="container mx-auto p-4 sm:p-6 lg:p-8 relative z-10 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-purple tracking-tight">
                            {user?.role === 'professor' ? 'Minhas Turmas' : 'Minhas Matrículas'}
                        </h1>
                        <p className="text-secondary-text mt-2">
                            {user?.role === 'professor' ? 'Gerencie suas turmas, alunos e atividades gamificadas.' : 'Acompanhe seu progresso e participe de atividades.'}
                        </p>
                    </div>

                    {/* Botão Criar Nova Turma */}
                    {user?.role === 'professor' && (
                        <Link to="/professor/turmas/nova"
                            className="group flex items-center gap-2 bg-gradient-to-r from-accent-yellow to-[#ffa000] hover:brightness-110 text-gray-900 font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_rgba(255,189,48,0.3)]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Nova Turma
                        </Link>
                    )}
                </div>

                {/* Mensagem de Feedback */}
                {message && (
                    <div className={`mb-8 flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md animate-fade-in ${
                        message.includes('sucesso')
                        ? 'bg-success-bg/80 text-success border-success/30'
                        : 'bg-danger-bg/80 text-danger border-danger/30'
                    }`}>
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            {message.includes('sucesso') 
                                ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                : <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />}
                        </svg>
                        <span className="font-medium text-sm">{message}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-teal"></div>
                        <p className="text-secondary-text font-medium animate-pulse">Carregando informações...</p>
                    </div>
                ) : classes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                        {classes.map((cls) => (
                            <div
                                key={cls.id}
                                className="group bg-secondary-bg/80 backdrop-blur-sm rounded-2xl shadow-xl border border-border-color overflow-hidden hover:border-accent-teal/50 hover:shadow-[0_8px_30px_rgba(105,232,203,0.15)] transition-all duration-300 transform hover:-translate-y-1"
                            >
                                {/* Gradient Header Bar */}
                                <div className="h-2 w-full bg-gradient-to-r from-accent-teal to-accent-purple opacity-70 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <h2 className="text-xl font-extrabold text-primary-text line-clamp-2 pr-2">
                                            <Link
                                                to={`/classes/${cls.id}`}
                                                className="hover:text-accent-teal transition-colors duration-200"
                                            >
                                                {cls.name}
                                            </Link>
                                        </h2>
                                        <div className="w-10 h-10 rounded-full bg-primary-bg/50 flex items-center justify-center flex-shrink-0 border border-border-color">
                                            <svg className="w-5 h-5 text-accent-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    <p className="text-secondary-text text-sm mb-6 line-clamp-3 min-h-[3.75rem]">
                                        {cls.description}
                                    </p>

                                    {user?.role === 'professor' && (
                                        <div className="mb-6 bg-primary-bg/50 rounded-xl p-3 border border-border-color/50">
                                            <p className="text-xs text-secondary-text font-semibold uppercase tracking-wider mb-1">
                                                Código de Inscrição
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-accent-yellow" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                                <span className="font-mono text-accent-yellow font-bold tracking-widest text-lg">
                                                    {cls.enrollment_code}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-border-color/50 mt-auto">
                                        <div className="flex gap-3">
                                            <Link
                                                to={`/classes/${cls.id}`}
                                                className="flex-1 text-center bg-primary-bg hover:bg-accent-teal/10 text-accent-teal border border-accent-teal/30 hover:border-accent-teal font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-300"
                                            >
                                                Acessar
                                            </Link>
                                            {user?.role === 'professor' && (
                                                <>
                                                    <Link
                                                        to={`/classes/${cls.id}/edit`}
                                                        className="flex items-center justify-center bg-primary-bg hover:bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30 hover:border-accent-yellow p-2 rounded-lg transition-all duration-300"
                                                        title="Editar Turma"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteClassClick(cls.id)}
                                                        className="flex items-center justify-center bg-primary-bg hover:bg-danger/10 text-danger border border-danger/30 hover:border-danger p-2 rounded-lg transition-all duration-300"
                                                        title="Deletar Turma"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                            {user?.role === 'aluno' && (
                                                <button
                                                    onClick={() => handleLeaveClassClick(cls.id)}
                                                    className="flex items-center justify-center bg-primary-bg hover:bg-danger/10 text-danger border border-danger/30 hover:border-danger p-2 rounded-lg transition-all duration-300"
                                                    title="Sair da Turma"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-secondary-bg/50 backdrop-blur-sm rounded-3xl border border-border-color shadow-xl">
                        <div className="w-24 h-24 bg-primary-bg rounded-full flex items-center justify-center mb-6 border border-border-color/50">
                            <svg className="w-12 h-12 text-secondary-text/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-primary-text mb-2">Nenhuma turma encontrada</h3>
                        <p className="text-secondary-text mb-8 text-center max-w-md">
                            {user?.role === 'professor' 
                                ? 'Você ainda não criou nenhuma turma. Comece agora para engajar seus alunos com gamificação!' 
                                : 'Você não está matriculado em nenhuma turma. Solicite o código de acesso ao seu professor.'}
                        </p>
                        {user?.role === 'professor' && (
                            <Link to="/professor/turmas/nova"
                                className="bg-accent-teal hover:bg-accent-teal/90 text-gray-900 font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg transform hover:-translate-y-1">
                                Criar Minha Primeira Turma
                            </Link>
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
                isDangerous={true}
                confirmText={modalConfig.type === 'delete' ? 'Deletar' : 'Sair'}
            />
        </div>
    );
}

export default ClassListPage;