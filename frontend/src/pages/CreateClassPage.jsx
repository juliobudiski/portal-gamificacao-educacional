import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function CreateClassPage() {
    const { user } = useContext(AuthContext); // Removido 'authToken' da desestruturação
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    
    useEffect(() => {
        console.log('[CreateClassPage] Componente montado.');
        return () => {
            console.log('[CreateClassPage] Componente desmontado.');
        };
    }, []);

    useEffect(() => {
        console.log('[CreateClassPage] Estado do usuário no carregamento (useEffect):', user);
        if (user && user.role !== 'professor') { // Verificação da role
            setMessage('Você não tem permissão para criar turmas. Apenas professores.');
            console.warn('[CreateClassPage] Usuário não-professor tentou acessar.');
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('[CreateClassPage] Tentativa de criação de turma iniciada.');
        setMessage('');
        setIsLoading(true);

        // Acessa o token via user.token
        const token = user?.token; 
        console.log('[CreateClassPage] Token de autenticação sendo enviado:', token); // Log do token

        if (user?.role !== 'professor') {
            setMessage('Acesso negado: Apenas professores podem criar turmas.');
            setIsLoading(false);
            return;
        }

        if (!token) { // Verifica se o token existe antes de fazer a requisição
            setMessage('Erro: Token de autenticação não encontrado. Faça login novamente.');
            setIsLoading(false);
            console.error('[CreateClassPage] Erro: Token de autenticação ausente.');
            return;
        }

        if (!name.trim()) {
            setMessage('O nome da turma é obrigatório.');
            setIsLoading(false);
            return;
        }

        console.log('[CreateClassPage] Dados do formulário:', { name, description });
        
        try {
            const response = await fetch('http://127.0.0.1:5000/api/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Usando user?.token aqui
                },
                body: JSON.stringify({ name, description }),
            });

            const data = await response.json();
            console.log('[CreateClassPage] Resposta bruta da API:', response);
            console.log('[CreateClassPage] Dados da resposta da API:', data);

            if (response.ok) {
                setMessage(`Turma "${data.class.name}" criada com sucesso! Código de Inscrição: ${data.class.enrollment_code}`);
                setName('');
                setDescription('');
                console.log('[CreateClassPage] Turma criada, navegando para /teacher/classes');
                navigate('/teacher/classes'); // Navega para a lista de turmas
            } else {
                setMessage(data.message || 'Erro desconhecido ao criar turma.');
                console.error('[CreateClassPage] Erro ao criar turma:', data.message);
            }
        } catch (error) {
            console.error('[CreateClassPage] Erro na requisição de criação de turma:', error);
            setMessage('Erro na comunicação com o servidor. Verifique sua conexão ou o console para mais detalhes.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-md">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Criar Nova Turma</h1>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl border border-gray-200">
                <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                        Nome da Turma:
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            console.log('[CreateClassPage] Nome da turma alterado para:', e.target.value);
                        }}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                        Descrição:
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            console.log('[CreateClassPage] Descrição alterada para:', e.target.value);
                        }}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-y"
                        disabled={isLoading}
                    ></textarea>
                </div>
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out transform hover:scale-105"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Criando...' : 'Criar Turma'}
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

export default CreateClassPage;