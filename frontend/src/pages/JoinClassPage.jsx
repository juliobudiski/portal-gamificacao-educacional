import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function JoinClassPage() {
    const { user } = useContext(AuthContext); // Removido 'authToken'
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
            const response = await fetch('http://127.0.0.1:5000/api/classes/join', {
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
                navigate('/student/dashboard'); // Ou para a lista de turmas do aluno
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
        <div className="container mx-auto p-4 max-w-md">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Entrar em uma Turma</h1>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl border border-gray-200">
                <div className="mb-4">
                    <label htmlFor="enrollmentCode" className="block text-gray-700 text-sm font-bold mb-2">
                        Código de Inscrição:
                    </label>
                    <input
                        type="text"
                        id="enrollmentCode"
                        value={enrollmentCode}
                        onChange={(e) => {
                            setEnrollmentCode(e.target.value);
                            console.log('[JoinClassPage] Código de inscrição alterado para:', e.target.value);
                        }}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out transform hover:scale-105"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Entrando...' : 'Entrar na Turma'}
                    </button>
                    {message && (
                        <p className={`text-sm ml-4 font-medium ${message.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}

export default JoinClassPage;