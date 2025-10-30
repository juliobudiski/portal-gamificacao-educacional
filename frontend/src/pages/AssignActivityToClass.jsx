import React, { useState, useEffect, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AuthContext } from '../context/AuthContext';
import { useParams } from 'react-router-dom';

// Debug mode control
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

/**
 * @component
 * @desc Componente para atribuir uma atividade a uma turma.
 * Permite que professores selecionem uma turma para associar uma atividade.
 * @param {Function} onAssignSuccess - Callback executado após atribuição bem-sucedida
 */
function AssignActivityToClass({ onAssignSuccess }) {
    const { activityId } = useParams();
    const { user } = useContext(AuthContext);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [availableFromDate, setAvailableFromDate] = useState('');
    const [availableFromTime, setAvailableFromTime] = useState('');
    const [expiresAtDate, setExpiresAtDate] = useState('');
    const [expiresAtTime, setExpiresAtTime] = useState('');

    useEffect(() => {
        if (isDebugMode) {
            console.log('[AssignActivityToClass] Componente montado para atividade ID:', activityId);
        }
        return () => {
            if (isDebugMode) {
                console.log('[AssignActivityToClass] Componente desmontado.');
            }
        };
    }, []);

    useEffect(() => {
        const fetchAvailableClasses = async () => {
            if (isDebugMode) {
                console.log('[AssignActivityToClass] Buscando turmas disponíveis...');
            }

            const token = user?.token;
            if (user?.role !== 'professor' || !token) {
                setMessage('Apenas professores podem atribuir atividades.');
                setIsLoading(false);
                if (isDebugMode) {
                    console.warn('[AssignActivityToClass] Acesso negado. Role:', user?.role, 'Token presente:', !!token);
                }
                return;
            }

            setIsLoading(true);
            setMessage('');

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/classes`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (isDebugMode) {
                    console.log('[AssignActivityToClass] Resposta API recebida. Status:', response.status);
                }

                const data = await response.json();

                if (isDebugMode && response.ok) {
                    console.log(`[AssignActivityToClass] ${data.length} turma(s) carregada(s)`);
                }

                if (response.ok) {
                    setAvailableClasses(data);
                    if (data.length > 0) {
                        setSelectedClassId(data[0].id);
                    }
                } else {
                    const errorMsg = data.message || 'Erro ao carregar turmas';
                    setMessage(errorMsg);
                    if (isDebugMode) {
                        console.error('[AssignActivityToClass] Erro na resposta:', errorMsg);
                    }
                }
            } catch (error) {
                const errorMsg = 'Erro na comunicação com o servidor';
                setMessage(errorMsg);
                if (isDebugMode) {
                    console.error(
                        '[AssignActivityToClass] Exceção na requisição:',
                        errorMsg,
                        '\nStack trace:', error.stack
                    );
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchAvailableClasses();
    }, [user, user?.token]);

    const handleAssign = useCallback(async () => {
        if (isDebugMode) {
            console.log(`[AssignActivityToClass] Iniciando atribuição. Atividade: ${activityId}, Turma: ${selectedClassId}`);
        }

        setMessage('');
        setIsLoading(true);

        const token = user?.token;

        if (!token) {
            setMessage('Erro: Usuário não autenticado. Faça login novamente.');
            setIsLoading(false);
            console.error('[AssignActivityToClass] Erro fatal: Token de autenticação não encontrado.');
            return;
        }

        if (!selectedClassId) {
            setMessage('Selecione uma turma para atribuir');
            setIsLoading(false);
            return;
        }

        if (!activityId) {
            const errorMsg = 'ID da atividade não fornecido';
            setMessage(errorMsg);
            setIsLoading(false);
            if (isDebugMode) {
                console.error('[AssignActivityToClass] Erro de validação:', errorMsg);
            }
            return;
        }

        try {
            const available_from = availableFromDate ? `${availableFromDate}T${availableFromTime || '00:00:00'}` : null;
            const expires_at = expiresAtDate ? `${expiresAtDate}T${expiresAtTime || '00:00:00'}` : null;
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Esta linha é a que resolve o problema
                },
                body: JSON.stringify({
                    class_id: selectedClassId,
                    available_from_date: availableFromDate,
                    available_from_time: availableFromTime,
                    expires_at_date: expiresAtDate,
                    expires_at_time: expiresAtTime,
                }),
            });

            if (isDebugMode) {
                console.log('[AssignActivityToClass] Resposta de atribuição recebida. Status:', response.status);
            }

            const data = await response.json();

            if (response.ok) {
                const successMsg = 'Atividade atribuída com sucesso à turma!';
                setMessage(successMsg);
                if (isDebugMode) {
                    console.log('[AssignActivityToClass] Atribuição bem-sucedida');
                }
                onAssignSuccess?.();
            } else {
                const errorMsg = data.message || 'Erro ao atribuir atividade';
                setMessage(errorMsg);
                if (isDebugMode) {
                    console.error('[AssignActivityToClass] Erro na atribuição:', errorMsg);
                }
            }
        } catch (error) {
            const errorMsg = 'Erro na comunicação com o servidor';
            setMessage(errorMsg);
            if (isDebugMode) {
                console.error(
                    '[AssignActivityToClass] Exceção na atribuição:',
                    errorMsg,
                    '\nStack trace:', error.stack
                );
            }
        } finally {
            setIsLoading(false);
        }
    }, [
        user,
        activityId,
        selectedClassId,
        availableFromDate,
        availableFromTime,
        expiresAtDate,
        expiresAtTime,
        onAssignSuccess
    ]);

    // Renderização condicional para estados de erro/carregamento
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-teal"></div>
                </div>
            );
        }

        if (availableClasses.length === 0) {
            return (
                <div className="bg-blue-900/30 p-4 rounded-xl flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-blue-400">Nenhuma turma disponível para atribuição. Crie uma turma primeiro.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-secondary-text">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </div>
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-secondary-bg border-2 border-[#4a525a] rounded-xl text-secondary-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent appearance-none"
                    >
                        {availableClasses.map((cls) => (
                            <option key={cls.id} value={cls.id} className="bg-secondary-bg text-secondary-text">
                                {cls.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleAssign}
                    className="relative w-full sm:w-auto bg-gradient-to-r from-accent-yellow to-accent-teal text-primary-text font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-accent-yellow/90 hover:to-accent-teal/90 transform hover:-translate-y-0.5 transition-all duration-300 ease-out disabled:opacity-70 disabled:cursor-not-allowed group"
                    disabled={isLoading || !selectedClassId || !user?.token}
                >
                    <div className="absolute inset-0 bg-secondary-bg opacity-0 group-hover:opacity-10 rounded-xl transition-opacity"></div>
                    <span className="flex items-center justify-center">
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-text" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        );
    };

    if (user?.role !== 'professor') {
        return null;
    }

    return (
        <div className="relative bg-primary-bg rounded-2xl shadow-2xl p-6 border border-[#4a525a] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/10 to-accent-teal/10"></div>
            <div className="relative z-10">
                <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-r from-accent-yellow to-accent-teal p-1 rounded-full mr-3">
                        <div className="bg-secondary-bg rounded-full p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-accent-yellow to-accent-teal bg-clip-text text-transparent">
                        Atribuir Atividade a uma Turma
                    </h3>

                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                    {/* Campos de Data de Início */}
                    <div>
                        <label htmlFor="availableFrom" className="block text-sm font-medium text-secondary-text mb-1">Disponível a partir de (Data):</label>
                        <input
                            type="date"
                            value={availableFromDate}
                            onChange={(e) => setAvailableFromDate(e.target.value)}
                            className="w-full pl-3 pr-3 py-2 bg-secondary-bg border-2 border-[#4a525a] rounded-xl text-secondary-text focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                        />
                    </div>
                    <div>
                        <label htmlFor="expiresAt" className="block text-sm font-medium text-secondary-text mb-1">Horário de Início (Opcional):</label>
                        <input
                            type="time"
                            value={availableFromTime}
                            onChange={(e) => setAvailableFromTime(e.target.value)}
                            className="w-full pl-3 pr-3 py-2 bg-secondary-bg border-2 border-[#4a525a] rounded-xl text-secondary-text focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                        />
                    </div>

                    {/* Campos de Prazo Final */}
                    <div>
                        <label htmlFor="availableFrom" className="block text-sm font-medium text-secondary-text mb-1">Prazo final (Data):</label>
                        <input
                            type="date"
                            value={expiresAtDate}
                            onChange={(e) => setExpiresAtDate(e.target.value)}
                            className="w-full pl-3 pr-3 py-2 bg-secondary-bg border-2 border-[#4a525a] rounded-xl text-secondary-text focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                        />
                    </div>
                    <div>
                        <label htmlFor="expiresAt" className="block text-sm font-medium text-secondary-text mb-1">Horário Final (Opcional):</label>
                        <input
                            type="time"
                            value={expiresAtTime}
                            onChange={(e) => setExpiresAtTime(e.target.value)}
                            className="w-full pl-3 pr-3 py-2 bg-secondary-bg border-2 border-[#4a525a] rounded-xl text-secondary-text focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                        />
                    </div>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-xl ${message.includes('sucesso')
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-red-900/30 text-red-400'
                        } transition-all duration-300`}>
                        <p className="text-sm font-medium">{message}</p>
                    </div>
                )}

                {renderContent()}
            </div>
        </div>
    );
}

AssignActivityToClass.propTypes = {
    onAssignSuccess: PropTypes.func
};

export default AssignActivityToClass;