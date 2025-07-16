import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function AssignActivityToClass({ activityId, onAssignSuccess }) {
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
        <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200 mt-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Atribuir Atividade a uma Turma</h3>
            {message && (
                <p className={`text-sm mb-4 ${message.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                </p>
            )}
            {isLoading ? (
                <p className="text-gray-600">Carregando turmas disponíveis...</p>
            ) : availableClasses.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-700"
                    >
                        {availableClasses.map((cls) => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleAssign}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out transform hover:scale-105"
                        disabled={isLoading}
                    >
                        Atribuir
                    </button>
                </div>
            ) : (
                <p className="text-gray-500">Nenhuma turma disponível para atribuição. Crie uma turma primeiro.</p>
            )}
        </div>
    );
}

export default AssignActivityToClass;