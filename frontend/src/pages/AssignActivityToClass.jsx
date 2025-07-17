import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useParams } from 'react-router-dom'; // Importar useParams

function AssignActivityToClass({ onAssignSuccess }) {
    const { activityId } = useParams();
    const { user } = useContext(AuthContext); // Removido 'authToken'
    const [availableClasses, setAvailableClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('[AssignActivityToClass] Componente montado para atividade ID:', activityId);
        return () => {
            console.log('[AssignActivityToClass] Componente desmontado.');
        };
    }, []);

    useEffect(() => {
        const fetchAvailableClasses = async () => {
            console.log('[AssignActivityToClass] Iniciando busca de turmas disponíveis...');
            const token = user?.token; // Acessa o token via user.token
            if (user?.role !== 'professor' || !token) { // Verifica role e token
                setMessage('Apenas professores podem atribuir atividades.');
                setIsLoading(false);
                console.warn('[AssignActivityToClass] Usuário não-professor ou token ausente.');
                return;
            }
            setMessage('');
            setIsLoading(true);

            try {
                const response = await fetch('http://127.0.0.1:5000/api/classes', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`, // Usando user.token
                    },
                });
                const data = await response.json();
                console.log('[AssignActivityToClass] Resposta bruta API (turmas disponíveis):', response);
                console.log('[AssignActivityToClass] Dados API (turmas disponíveis):', data);

                if (response.ok) {
                    setAvailableClasses(data);
                    if (data.length > 0) {
                        setSelectedClassId(data[0].id); // Seleciona a primeira turma por padrão
                    }
                    console.log('[AssignActivityToClass] Turmas disponíveis carregadas:', data);
                } else {
                    setMessage(data.message || 'Erro ao carregar turmas disponíveis.');
                    console.error('[AssignActivityToClass] Erro ao carregar turmas disponíveis:', data.message);
                }
            } catch (error) {
                console.error('[AssignActivityToClass] Erro na requisição de turmas disponíveis:', error);
                setMessage('Erro na comunicação com o servidor.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAvailableClasses();
    }, [user, user?.token]); // Depende do user e user.token

    const handleAssign = async () => {
        console.log(`[AssignActivityToClass] Tentando atribuir atividade ID ${activityId} à turma ID ${selectedClassId}`);
        setMessage('');
        setIsLoading(true);

        const token = user?.token;
        if (!token) {
            setMessage('Erro: Token de autenticação não encontrado. Faça login novamente.');
            setIsLoading(false);
            console.error('[AssignActivityToClass] Erro: Token de autenticação ausente.');
            return;
        }

        if (!selectedClassId) {
            setMessage('Selecione uma turma para atribuir.');
            setIsLoading(false);
            return;
        }
        
        if (!activityId) { // Adicione esta verificação
            setMessage('Erro: ID da atividade não fornecido.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/activities/${activityId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ class_id: selectedClassId }),
            });

            const data = await response.json();
            console.log('[AssignActivityToClass] Resposta bruta da API (atribuir atividade):', response);
            console.log('[AssignActivityToClass] Dados da resposta da API (atribuir atividade):', data);

            if (response.ok) {
                setMessage('Atividade atribuída com sucesso à turma!');
                console.log('[AssignActivityToClass] Atividade atribuída com sucesso.');
                if (onAssignSuccess) {
                    onAssignSuccess(); // Callback para atualizar a UI pai, se necessário
                }
            } else {
                setMessage(data.message || 'Erro ao atribuir atividade.');
                console.error('[AssignActivityToClass] Erro ao atribuir atividade:', data.message);
            }
        } catch (error) {
            console.error('[AssignActivityToClass] Erro na requisição de atribuição de atividade:', error);
            setMessage('Erro na comunicação com o servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    if (user?.role !== 'professor') {
        return null; // Não renderiza se não for professor
    }

    return (
        <div className="relative bg-gradient-to-br from-[#3a4046] to-[#2c3135] rounded-2xl shadow-2xl p-6 border border-[#4a525a] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/10 to-accent-teal/10"></div>
            <div className="relative z-10">
                <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-r from-accent-yellow to-accent-teal p-1 rounded-full mr-3">
                        <div className="bg-[#3a4046] rounded-full p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-accent-yellow to-accent-teal bg-clip-text text-transparent">
                        Atribuir Atividade a uma Turma
                    </h3>
                </div>
                
                {message && (
                    <div className={`mb-4 p-3 rounded-xl ${
                        message.includes('sucesso') 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-red-900/30 text-red-400'
                    } transition-all duration-300`}>
                        <p className="text-sm font-medium">{message}</p>
                    </div>
                )}
                
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-teal"></div>
                    </div>
                ) : availableClasses.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </div>
                            <select
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-[#3a4046] border-2 border-[#4a525a] rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent appearance-none"
                            >
                                {availableClasses.map((cls) => (
                                    <option key={cls.id} value={cls.id} className="bg-[#3a4046] text-gray-200">
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <button
                            onClick={handleAssign}
                            className="relative w-full sm:w-auto bg-gradient-to-r from-accent-yellow to-accent-teal text-gray-900 font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-accent-yellow/90 hover:to-accent-teal/90 transform hover:-translate-y-0.5 transition-all duration-300 ease-out disabled:opacity-70 disabled:cursor-not-allowed group"
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
                                        Atribuindo...
                                    </>
                                ) : (
                                    <>
                                        Atribuir
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                ) : (
                    <div className="bg-blue-900/30 p-4 rounded-xl flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-blue-400">Nenhuma turma disponível para atribuição. Crie uma turma primeiro.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AssignActivityToClass;