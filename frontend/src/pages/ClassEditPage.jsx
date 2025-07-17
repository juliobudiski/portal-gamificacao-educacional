import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ClassEditPage() {
    const { class_id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('[ClassEditPage] Componente montado para edição da turma ID:', class_id);
        const fetchClassData = async () => {
            if (!user?.token || user?.role !== 'professor' || !class_id) {
                setMessage('Acesso negado ou token/ID da turma ausente.');
                setIsLoading(false);
                console.warn('[ClassEditPage] Acesso negado ou dados ausentes.');
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:5000/api/classes/${class_id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`,
                    },
                });
                const data = await response.json();
                console.log('[ClassEditPage] Resposta API (detalhes para edição):', data);

                if (response.ok) {
                    setName(data.name);
                    setDescription(data.description);
                    setMessage('');
                } else {
                    setMessage(data.message || 'Erro ao carregar detalhes da turma.');
                }
            } catch (error) {
                console.error('[ClassEditPage] Erro ao carregar detalhes da turma:', error);
                setMessage('Erro na comunicação com o servidor ao carregar detalhes.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClassData();
        return () => {
            console.log('[ClassEditPage] Componente desmontado.');
        };
    }, [class_id, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('[ClassEditPage] Tentando atualizar turma...');
        setMessage('');
        setIsLoading(true);

        const token = user?.token;
        if (!token || user?.role !== 'professor' || !class_id) {
            setMessage('Erro: Acesso negado, token ou ID da turma ausente.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/classes/${class_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name, description }),
            });

            const data = await response.json();
            console.log('[ClassEditPage] Resposta API (atualizar turma):', data);

            if (response.ok) {
                setMessage('Turma atualizada com sucesso!');
                console.log('[ClassEditPage] Turma atualizada, navegando de volta.');
                setTimeout(() => navigate('/teacher/classes'), 2000);
            } else {
                setMessage(data.message || 'Erro ao atualizar turma.');
                console.error('[ClassEditPage] Erro ao atualizar turma:', data.message);
            }
        } catch (error) {
            console.error('[ClassEditPage] Erro na requisição de atualização:', error);
            setMessage('Erro na comunicação com o servidor.');
        } finally {
            setIsLoading(false);
        }
    };

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

    if (message && !name) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#2c3135] to-[#1e2226] flex items-center justify-center p-4">
                <div className="bg-[#343a40] p-8 rounded-2xl shadow-xl border-l-4 border-red-600 max-w-md text-center">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-white mb-4">Erro ao carregar turma</h3>
                    <p className="text-gray-300">{message}</p>
                    <button 
                        onClick={() => navigate('/teacher/classes')}
                        className="mt-6 bg-gradient-to-r from-[#ffbd30] to-[#ffa000] text-[#2c3135] font-bold py-2 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        Voltar para turmas
                    </button>
                </div>
            </div>
        );
    }
    
    if (user?.role !== 'professor') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#2c3135] to-[#1e2226] flex items-center justify-center p-4">
                <div className="bg-[#343a40] p-8 rounded-2xl shadow-xl border-l-4 border-red-600 max-w-md text-center">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-white mb-4">Acesso Negado</h3>
                    <p className="text-gray-300">Você não tem permissão para editar esta turma.</p>
                    <button 
                        onClick={() => navigate('/')}
                        className="mt-6 bg-gradient-to-r from-[#ffbd30] to-[#ffa000] text-[#2c3135] font-bold py-2 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        Voltar ao início
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#2c3135] to-[#1e2226] p-4">
            <div className="max-w-2xl mx-auto">
                {/* Cabeçalho com gradiente */}
                <header className="mb-8 text-center bg-gradient-to-r from-[#ffbd30] to-[#ffa000] p-6 rounded-2xl shadow-2xl border-b-4 border-[#ffcc5c]">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#2c3135]">
                        Editar Turma
                    </h1>
                    <p className="mt-2 text-[#2c3135] font-medium">
                        Atualize os detalhes da turma: <span className="bg-white/30 px-2 py-1 rounded-md">{name}</span>
                    </p>
                </header>

                {/* Formulário de edição */}
                <form onSubmit={handleSubmit} className="bg-[#343a40] p-6 md:p-8 rounded-2xl shadow-xl border border-[#3e4a52]">
                    {/* Campo Nome */}
                    <div className="mb-6">
                        <label htmlFor="editName" className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#ffbd30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            Nome da Turma
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="editName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-[#2c3135] border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30] text-white placeholder-gray-500 transition-all duration-200"
                                required
                                disabled={isLoading}
                                placeholder="Digite o nome da turma"
                            />
                        </div>
                    </div>
                    
                    {/* Campo Descrição */}
                    <div className="mb-8">
                        <label htmlFor="editDescription" className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#69e8cb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Descrição
                        </label>
                        <div className="relative">
                            <textarea
                                id="editDescription"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-[#2c3135] border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30] text-white placeholder-gray-500 transition-all duration-200 h-40"
                                disabled={isLoading}
                                placeholder="Descreva a finalidade desta turma"
                            ></textarea>
                        </div>
                    </div>
                    
                    {/* Botões e Mensagem */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button
                            type="submit"
                            className={`w-full sm:w-auto flex-1 flex justify-center items-center py-3 px-6 rounded-xl shadow-lg text-lg font-bold text-[#2c3135] bg-gradient-to-r from-[#ffbd30] to-[#ffa000] hover:from-[#ffcc5c] hover:to-[#ffb140] transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffbd30] ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-[#2c3135]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Atualizando...
                                </>
                            ) : (
                                <>
                                    Atualizar Turma
                                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => navigate('/teacher/classes')}
                            className="w-full sm:w-auto flex justify-center items-center py-3 px-6 rounded-xl border border-[#3e4a52] text-gray-300 hover:text-white hover:bg-[#3e4a52] transition-all duration-300"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                    </div>
                    
                    {message && (
                        <div className={`mt-6 p-4 rounded-xl text-center font-medium ${
                            message.includes('sucesso') 
                                ? 'bg-green-900/50 border border-green-600 text-green-100' 
                                : 'bg-red-900/50 border border-red-600 text-red-100'
                        }`}>
                            {message}
                        </div>
                    )}
                </form>
                
                {/* Rodapé com informações */}
                <footer className="mt-8 text-center text-gray-500 text-sm border-t border-[#3e4a52] pt-6">
                    <p>Portal de Gamificação Educacional • Edição de Turma</p>
                    <p className="mt-1">ID da Turma: {class_id}</p>
                </footer>
            </div>
        </div>
    );
}

export default ClassEditPage;