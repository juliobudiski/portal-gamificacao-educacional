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
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-center text-accent-yellow">
                {user?.role === 'professor' ? 'Minhas Turmas' : 'Minhas Matrículas'}
            </h1>

            {/* Mensagem de Feedback com cores semânticas */}
            {message && (
                <p className={`text-sm mb-4 text-center font-medium py-2 px-4 rounded-lg border ${message.includes('sucesso')
                    ? 'bg-success-bg text-success border-success/30'
                    : 'bg-danger-bg text-danger border-danger/30'
                    }`}>
                    {message}
                </p>
            )}

            {/* Botão Criar Nova Turma */}
            {user?.role === 'professor' && (
                <div className="text-center mb-6">
                    <Link to="/professor/turmas/nova"
                        // Mudado para 'bg-success' para indicar ação positiva
                        className="bg-success hover:bg-success/90 text-white dark:text-primary-bg font-bold py-2 px-6 rounded-lg inline-block transition duration-200 ease-in-out transform hover:scale-105 shadow-md">
                        Criar Nova Turma
                    </Link>
                </div>
            )}

            {isLoading ? (
                <p className="text-center text-secondary-text">Carregando turmas...</p>
            ) : classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div
                            key={cls.id}
                            // Card agora usa secondary-bg e bordas semânticas
                            className="bg-secondary-bg p-6 rounded-xl shadow-lg border border-[var(--border-color)] border-t-4 border-t-accent-yellow transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 hover:border-t-accent-teal"
                        >
                            <h2 className="text-xl font-bold mb-3 text-primary-text">
                                <Link
                                    to={`/classes/${cls.id}`}
                                    // Cores de link atualizadas
                                    className="text-accent-teal hover:text-accent-yellow transition-colors duration-200"
                                >
                                    {cls.name}
                                </Link>
                            </h2>
                            {/* Correção do typo: text-secondary-text text-sm (estava junto) */}
                            <p className="text-secondary-text text-sm mb-4">{cls.description}</p>

                            {user?.role === 'professor' && (
                                <>
                                    <p className="text-secondary-text text-sm mb-4">
                                        Código de Inscrição:
                                        {/* Código com fundo primary-bg para contraste dentro do card */}
                                        <span className="font-mono bg-primary-bg border border-[var(--border-color)] p-1.5 rounded-md text-accent-yellow block mt-1.5">
                                            {cls.enrollment_code}
                                        </span>
                                    </p>
                                    <div className="flex space-x-3 mt-5">
                                        <Link
                                            to={`/classes/${cls.id}/edit`}
                                            // Botão Editar usando accent-yellow
                                            className="flex-1 bg-accent-yellow hover:brightness-110 text-white dark:text-primary-bg font-bold py-2 px-4 rounded-lg text-center text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                                        >
                                            Editar
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteClassClick(cls.id)}
                                            // Botão Deletar usando danger
                                            className="flex-1 bg-danger hover:bg-danger/90 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                                        >
                                            Deletar
                                        </button>
                                    </div>
                                </>
                            )}

                            {user?.role === 'aluno' && (
                                <div className="mt-5">
                                    <button
                                        onClick={() => handleLeaveClassClick(cls.id)}
                                        // Botão Sair usando danger
                                        className="w-full bg-danger hover:bg-danger/90 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        Sair da Turma
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-secondary-text">Nenhuma turma encontrada.</p>
            )}
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={executeModalAction}
                title={modalConfig.title}
                message={modalConfig.message}
                isDangerous={true} // Ambos são destrutivos
                confirmText={modalConfig.type === 'delete' ? 'Deletar' : 'Sair'}
            />

        </div>
    );
}

export default ClassListPage;