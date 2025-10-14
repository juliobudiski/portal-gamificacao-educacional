import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaKey, FaSignInAlt, FaUserGraduate } from 'react-icons/fa';

function JoinClassPage() {
    const { user } = useContext(AuthContext);
    const [enrollmentCode, setEnrollmentCode] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        console.log('[JoinClassPage] Componente montado.');
        return () => {
            console.log('[JoinClassPage] Componente desmontado.');
        };
    }, []);

    useEffect(() => {
        console.log('[JoinClassPage] Estado do usuário no carregamento:', user);
        if (user && user.role !== 'aluno') {
            setMessage('Você não tem permissão para entrar em turmas. Apenas alunos.');
            console.warn('[JoinClassPage] Usuário não-aluno tentou acessar.');
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('[JoinClassPage] Tentativa de entrada em turma iniciada.');
        setMessage('');
        setIsLoading(true);

        const token = user?.token; // Acessa o token via user.token
        console.log('[JoinClassPage] Token de autenticação sendo enviado:', token);

        if (user?.role !== 'aluno') {
            setMessage('Acesso negado: Apenas alunos podem entrar em turmas.');
            setIsLoading(false);
            return;
        }

        if (!token) {
            setMessage('Erro: Token de autenticação não encontrado. Faça login novamente.');
            setIsLoading(false);
            console.error('[JoinClassPage] Erro: Token de autenticação ausente.');
            return;
        }

        if (!enrollmentCode.trim()) {
            setMessage('O código de inscrição é obrigatório.');
            setIsLoading(false);
            return;
        }

        console.log('[JoinClassPage] Código de inscrição a ser enviado:', enrollmentCode);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/classes/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ enrollment_code: enrollmentCode }),
            });

            const data = await response.json();
            console.log('[JoinClassPage] Resposta bruta da API:', response);
            console.log('[JoinClassPage] Dados da resposta da API:', data);

            if (response.ok) {
                setMessage(`Matrícula na turma "${data.class.name}" realizada com sucesso!`);
                setEnrollmentCode('');
                console.log('[JoinClassPage] Matrícula realizada, navegando para /student/dashboard');
                navigate('/aluno/dashboard'); // Ou para a lista de turmas do aluno
            } else {
                setMessage(data.message || 'Erro desconhecido ao entrar na turma.');
                console.error('[JoinClassPage] Erro ao entrar na turma:', data.message);
            }
        } catch (error) {
            console.error('[JoinClassPage] Erro na requisição de entrada em turma:', error);
            setMessage('Erro na comunicação com o servidor. Verifique sua conexão ou o console para mais detalhes.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#2c3135] to-[#1e2226]">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mx-auto bg-gradient-to-r from-accent-purple to-accent-teal p-3 rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                        <FaUserGraduate className="text-primary-text text-4xl" />
                    </div>
                    <h1 className="mt-4 text-3xl font-bold bg-gradient-to-r from-accent-yellow to-accent-teal bg-clip-text text-transparent">
                        Entrar em uma Turma
                    </h1>
                    <p className="mt-2 text-secondary-text">
                        Insira o código fornecido pelo seu professor
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 transform transition-all duration-300 hover:shadow-[0_10px_30px_-5px_rgba(105,232,203,0.15)]"
                >
                    <div className="mb-6">
                        <label htmlFor="enrollmentCode" className="block text-accent-teal font-medium mb-2 flex items-center">
                            <FaKey className="mr-2" />
                            Código de Inscrição
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="enrollmentCode"
                                value={enrollmentCode}
                                onChange={(e) => {
                                    setEnrollmentCode(e.target.value);
                                    console.log('[JoinClassPage] Código de inscrição alterado para:', e.target.value);
                                }}
                                className="w-full bg-gray-700 text-primary-text py-3 px-4 pl-11 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all duration-200"
                                placeholder="Digite o código aqui"
                                required
                                disabled={isLoading}
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaKey className="text-secondary-text" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative bg-gradient-to-r from-accent-yellow to-[#ffa500] hover:from-[#ffcb52] hover:to-accent-yellow text-primary-text font-bold py-3 px-4 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-accent-yellow"
                        >
                            <div className="flex items-center justify-center">
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-text" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Entrando...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        <FaSignInAlt className="mr-2 transition-transform group-hover:translate-x-1" />
                                        Entrar na Turma
                                    </span>
                                )}
                            </div>
                        </button>

                        {message && (
                            <div className={`mt-4 p-3 rounded-xl border ${message.includes('sucesso')
                                ? 'bg-green-900/30 border-green-600'
                                : 'bg-red-900/30 border-red-600'
                                } transition-all duration-300`}>
                                <p className={`text-center font-medium ${message.includes('sucesso')
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                    }`}>
                                    {message}
                                </p>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default JoinClassPage;