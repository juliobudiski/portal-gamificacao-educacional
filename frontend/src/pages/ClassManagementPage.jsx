import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function ClassListPage() {
    const { user } = useContext(AuthContext); // Removido 'authToken' da desestruturação
    const [classes, setClasses] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

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

    const handleLeaveClass = async (classId) => {
        console.log(`[ClassListPage] Tentando sair da turma ID: ${classId}`);
        if (!window.confirm('Tem certeza que deseja sair desta turma?')) {
            console.log('[ClassListPage] Ação de sair da turma cancelada pelo usuário.');
            return;
        }
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

    const handleDeleteClass = async (classId) => {
        console.log(`[ClassListPage] Tentando deletar a turma ID: ${classId}`);
        if (!window.confirm('Tem certeza que deseja deletar esta turma? Esta ação é irreversível e desassociará todas as atividades e matrículas.')) {
            console.log('[ClassListPage] Ação de deletar turma cancelada pelo usuário.');
            return;
        }
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
            {message && (
                <p className={`text-sm mb-4 text-center font-medium ${message.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                </p>
            )}
            {user?.role === 'professor' && (
                <div className="text-center mb-6">
                    <Link to="/teacher/classes/new" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-block transition duration-200 ease-in-out transform hover:scale-105">
                        Criar Nova Turma
                    </Link>
                </div>
            )}
            {isLoading ? (
                <p className="text-center text-gray-400">Carregando turmas...</p>
            ) : classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div 
                            key={cls.id} 
                            className="bg-[#343a40] p-6 rounded-xl shadow-lg border-t-4 border-[#ffbd30] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 hover:border-[#69e8cb]"
                        >
                            <h2 className="text-xl font-bold mb-3 text-white">
                                <Link 
                                    to={`/classes/${cls.id}`} 
                                    className="text-[#69e8cb] hover:text-[#ffbd30] transition-colors duration-200"
                                >
                                    {cls.name}
                                </Link>
                            </h2>
                            <p className="text-[#e9ecef] text-sm mb-4">{cls.description}</p>
                            
                            {user?.role === 'professor' && (
                                <>
                                    <p className="text-[#e9ecef] text-sm mb-4">
                                        Código de Inscrição: 
                                        <span className="font-mono bg-[#2c3135] p-1.5 rounded-md text-[#ffbd30] block mt-1.5">
                                            {cls.enrollment_code}
                                        </span>
                                    </p>
                                    <div className="flex space-x-3 mt-5">
                                        <Link 
                                            to={`/classes/${cls.id}/edit`} 
                                            className="flex-1 bg-gradient-to-r from-[#ffbd30] to-[#ffa000] hover:from-[#ffcc5c] hover:to-[#ffb140] text-[#2c3135] font-bold py-2 px-4 rounded-lg text-center text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                                        >
                                            Editar
                                        </Link>
                                        <button 
                                            onClick={() => handleDeleteClass(cls.id)} 
                                            className="flex-1 bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] hover:from-[#ff557c] hover:to-[#ff6340] text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                                        >
                                            Deletar
                                        </button>
                                    </div>
                                </>
                            )}
                            
                            {user?.role === 'aluno' && (
                                <div className="mt-5">
                                    <button 
                                        onClick={() => handleLeaveClass(cls.id)} 
                                        className="w-full bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] hover:from-[#ff557c] hover:to-[#ff6340] text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        Sair da Turma
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-400">Nenhuma turma encontrada.</p>
            )}
        </div>
    );
}

export default ClassListPage;