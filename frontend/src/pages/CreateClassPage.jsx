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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/classes`, {
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
                setTimeout(() => navigate('/teacher/classes'), 2000);
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
        <div className="min-h-screen bg-gradient-to-br from-[#1e2226] to-[#2c3135] py-10 px-4 sm:px-6">
            <div className="max-w-md mx-auto">
                <div className="flex items-center justify-center mb-8">
                    <div className="bg-gradient-to-r from-accent-yellow to-accent-teal p-1 rounded-full">
                        <div className="bg-[#2c3135] rounded-full p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold ml-4 bg-gradient-to-r from-accent-yellow to-accent-teal bg-clip-text text-transparent">
                        Criar Nova Turma
                    </h1>
                </div>

                <div className="relative bg-gradient-to-br from-[#3a4046] to-[#2c3135] rounded-2xl shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/10 to-accent-teal/10"></div>
                    <div className="relative p-8 z-10">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label htmlFor="name" className="block text-accent-teal font-medium mb-2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Nome da Turma
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        console.log('[CreateClassPage] Nome da turma alterado para:', e.target.value);
                                    }}
                                    className="w-full bg-[#3a4046] border-2 border-[#4a525a] rounded-xl py-3 px-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition duration-300"
                                    placeholder="Digite o nome da turma"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <div className="mb-8">
                                <label htmlFor="description" className="block text-accent-teal font-medium mb-2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Descrição
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        console.log('[CreateClassPage] Descrição alterada para:', e.target.value);
                                    }}
                                    className="w-full bg-[#3a4046] border-2 border-[#4a525a] rounded-xl py-3 px-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition duration-300 h-40 resize-none"
                                    placeholder="Adicione uma descrição para a turma..."
                                    disabled={isLoading}
                                ></textarea>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-between">
                                <button
                                    type="submit"
                                    className="relative w-full sm:w-auto bg-gradient-to-r from-accent-yellow to-accent-teal text-gray-900 font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl hover:from-accent-yellow/90 hover:to-accent-teal/90 transform hover:-translate-y-0.5 transition-all duration-300 ease-out disabled:opacity-70 disabled:cursor-not-allowed group"
                                    disabled={isLoading}
                                >
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity"></div>
                                    <span className="flex items-center justify-center">
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Criando...
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Criar Turma
                                            </>
                                        )}
                                    </span>
                                </button>
                                
                                {message && (
                                    <div className={`mt-4 sm:mt-0 sm:ml-4 py-2 px-4 rounded-xl ${message.includes('sucesso') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'} transition-all duration-300 max-w-xs`}>
                                        <p className="text-sm font-medium">{message}</p>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
                
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>Preencha todos os campos obrigatórios para criar uma nova turma</p>
                </div>
            </div>
        </div>
    );
}

export default CreateClassPage;