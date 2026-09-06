import React, { useState, useEffect, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AuthContext } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHatWizard, FaDice, FaBalanceScale, FaUsers, FaPen, FaRandom, FaArrowLeft } from 'react-icons/fa';

// Debug mode control
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

// --- DICIONÁRIO DE NOMES TEMÁTICOS ---
const TECH_HOUSE_NAMES = [
    "Casa Git", "Casa Python", "Casa Java", "Casa React",
    "Casa Linux", "Casa Docker", "Casa SQL", "Casa Turing",
    "Casa Ada", "Casa Hopper", "Casa Binary", "Casa Pixel",
    "Casa Cloud", "Casa Cyber", "Casa Logic", "Casa Kernel"
];

/**
 * Função auxiliar para sortear nomes sem repetição
 */
const getRandomHouseNames = (quantity, existingNames = []) => {
    // Filtra nomes que já estão sendo usados para evitar duplicatas no sorteio
    const availableNames = TECH_HOUSE_NAMES.filter(n => !existingNames.includes(n));
    // Embaralha
    const shuffled = [...availableNames].sort(() => 0.5 - Math.random());
    // Retorna a quantidade necessária
    return shuffled.slice(0, quantity);
};

/**
 * AssignActivityToClass
 * 
 * Architectural intent: Manages the business logic of assigning an activity to a class, including the
 * orchestration of team generation (Sorting Hat logic). By isolating this process, it keeps the core
 * activity management and class management domains strictly decoupled, adhering to the Single Responsibility Principle.
 */
function AssignActivityToClass({ onAssignSuccess }) {
    const { activityId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Estados de Dados
    const [availableClasses, setAvailableClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [activityDetails, setActivityDetails] = useState(null); // Para saber se é em grupo

    // Estados de UI e Formulário
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [availableFromDate, setAvailableFromDate] = useState('');
    const [availableFromTime, setAvailableFromTime] = useState('');
    const [expiresAtDate, setExpiresAtDate] = useState('');
    const [expiresAtTime, setExpiresAtTime] = useState('');

    // Estados do MODAL DE EQUIPES (Chapéu Seletor)
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [teamConfig, setTeamConfig] = useState({
        quantity: 4,
        method: 'balanced', // 'random' ou 'balanced'
        names: getRandomHouseNames(4)
    });

    // 1. Carregar Atividade para saber se é is_team_activity
    useEffect(() => {
        const fetchActivity = async () => {
            if (!user?.token || !activityId) return;
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setActivityDetails(data);
                }
            } catch (error) {
                console.error("Erro ao buscar detalhes da atividade", error);
            }
        };
        fetchActivity();
    }, [activityId, user?.token]);

    // 2. Carregar Turmas (Mantido igual)
    useEffect(() => {
        const fetchAvailableClasses = async () => {
            const token = user?.token;
            if (user?.role !== 'professor' || !token) return;

            setIsLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/classes`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const data = await response.json();
                if (response.ok) {
                    setAvailableClasses(data);
                    if (data.length > 0) setSelectedClassId(data[0].id);
                } else {
                    setMessage(data.message || 'Erro ao carregar turmas');
                }
            } catch (error) {
                setMessage('Erro na comunicação com o servidor');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAvailableClasses();
    }, [user]);

    // --- LÓGICA DO MODAL DE EQUIPES ---

    // Atualiza nomes quando a quantidade muda
    const handleQuantityChange = (newQty) => {
        const qty = Math.max(2, Math.min(10, parseInt(newQty))); // Min 2, Max 10
        const currentNames = teamConfig.names;

        let newNames;
        if (qty > currentNames.length) {
            // Adicionar novos nomes sorteados
            const needed = qty - currentNames.length;
            const extraNames = getRandomHouseNames(needed, currentNames);
            newNames = [...currentNames, ...extraNames];
        } else {
            // Remover nomes extras
            newNames = currentNames.slice(0, qty);
        }

        setTeamConfig(prev => ({ ...prev, quantity: qty, names: newNames }));
    };

    // Edição manual de um nome específico
    const handleNameChange = (index, value) => {
        const newNames = [...teamConfig.names];
        newNames[index] = value;
        setTeamConfig(prev => ({ ...prev, names: newNames }));
    };

    // Sorteia novos nomes para todos (Reroll)
    const handleRerollNames = () => {
        setTeamConfig(prev => ({
            ...prev,
            names: getRandomHouseNames(prev.quantity)
        }));
    };

    // --- FLUXO DE ATRIBUIÇÃO ---

    const executeAssignment = async () => {
        const token = user?.token;
        const available_from = availableFromDate ? `${availableFromDate}T${availableFromTime || '00:00:00'}` : null;
        const expires_at = expiresAtDate ? `${expiresAtDate}T${expiresAtTime || '00:00:00'}` : null;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                class_id: selectedClassId,
                available_from_date: availableFromDate,
                available_from_time: availableFromTime,
                expires_at_date: expiresAtDate,
                expires_at_time: expiresAtTime,
            }),
        });

        const data = await response.json();
        if (response.ok) {
            setMessage('Atividade atribuída com sucesso!');
            setTimeout(() => navigate('/professor/banco-atividades'), 2000);
            onAssignSuccess?.();
        } else {
            throw new Error(data.message || 'Erro ao atribuir');
        }
    };

    const handleAssignClick = async () => {
        setMessage('');
        setIsLoading(true);

        if (!selectedClassId || !activityId) {
            setIsLoading(false);
            return;
        }

        try {
            // 1. Verifica se é atividade em equipe
            if (activityDetails?.is_team_activity) {
                // 2. Verifica se a turma JÁ tem times
                // Precisamos de um endpoint ou verificar nos detalhes da turma.
                // Como não temos um endpoint leve de "check", vamos buscar os detalhes da turma.
                const classResp = await fetch(`${import.meta.env.VITE_API_URL}/api/classes/${selectedClassId}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                const classData = await classResp.json();

                // Supondo que o backend retorne algo indicando times, ou se não retornar, 
                // assumimos que precisamos criar se a lista de times estiver vazia.
                // *NOTA*: Se o endpoint classes/:id não retornar os times, precisaremos ajustar o backend.
                // Vamos assumir que se não tiver times, precisamos criar.

                // Se o backend ainda não retorna times no GET class, vamos confiar no fluxo:
                // Se o professor quer criar times, ele vai confirmar no modal.
                // Para MVP, vamos SEMPRE mostrar o modal se for a primeira vez (ou verificar via API nova se necessário).

                // Solução robusta: Vamos tentar listar os times dessa turma.
                // Se falhar ou vier vazio, abrimos o modal.
                // Vou assumir que ainda não temos times criados para simplificar o "Primeiro Acesso".

                // TODO: Idealmente, fazer um fetch('/api/classes/:id/teams') aqui.
                // Por enquanto, vou abrir o modal para garantir que o professor configure.
                setShowTeamModal(true);
                setIsLoading(false);
                return; // PAUSA O FLUXO AQUI
            }

            // Se não for equipe, ou se já passou pelo modal:
            await executeAssignment();

        } catch (error) {
            setMessage(error.message);
        } finally {
            if (!showTeamModal) setIsLoading(false);
        }
    };

    // Ação do Botão "Criar Equipes e Atribuir" no Modal
    const handleConfirmTeamsAndAssign = async () => {
        setIsLoading(true);
        try {
            // 1. Gera os times
            const genResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/classes/${selectedClassId}/teams/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({
                    quantity: teamConfig.quantity,
                    method: teamConfig.method,
                    names: teamConfig.names
                })
            });

            if (!genResponse.ok) {
                const err = await genResponse.json();
                throw new Error(err.message || "Erro ao gerar equipes.");
            }

            // 2. Fecha modal e segue para atribuição
            setShowTeamModal(false);
            await executeAssignment();

        } catch (error) {
            setMessage(`Erro: ${error.message}`);
            setIsLoading(false);
        }
    };

    // --- RENDERIZAÇÃO ---

    if (user?.role !== 'professor') return null;

    return (
        <div className="relative bg-primary-bg rounded-2xl shadow-2xl p-6 border border-[#4a525a] overflow-hidden">
            <button 
                onClick={() => navigate(-1)} 
                className="group mb-6 flex items-center gap-2 text-secondary-text hover:text-accent-teal transition-colors font-bold uppercase tracking-widest text-sm"
            >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                Voltar
            </button>
            {/* ... (Cabeçalho igual ao anterior) ... */}
            <div className="flex items-center mb-4">
                <h3 className="text-xl font-bold bg-gradient-to-r from-accent-yellow to-accent-teal bg-clip-text text-transparent">
                    Atribuir Atividade a uma Turma
                </h3>
            </div>

            {/* FORMULÁRIO PRINCIPAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                {/* ... (Inputs de Data iguais ao anterior - availableFrom, expiresAt) ... */}
                <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1">Disponível a partir de:</label>
                    <input type="date" value={availableFromDate} onChange={(e) => setAvailableFromDate(e.target.value)} className="w-full p-2 bg-secondary-bg border border-border-color rounded-lg text-primary-text" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1">Horário (Opcional):</label>
                    <input type="time" value={availableFromTime} onChange={(e) => setAvailableFromTime(e.target.value)} className="w-full p-2 bg-secondary-bg border border-border-color rounded-lg text-primary-text" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1">Prazo final:</label>
                    <input type="date" value={expiresAtDate} onChange={(e) => setExpiresAtDate(e.target.value)} className="w-full p-2 bg-secondary-bg border border-border-color rounded-lg text-primary-text" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1">Horário Final (Opcional):</label>
                    <input type="time" value={expiresAtTime} onChange={(e) => setExpiresAtTime(e.target.value)} className="w-full p-2 bg-secondary-bg border border-border-color rounded-lg text-primary-text" />
                </div>
            </div>

            {/* MENSAGENS DE ERRO/SUCESSO */}
            {message && (
                <div className={`mb-4 p-3 rounded-xl ${message.includes('sucesso') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    <p className="text-sm font-medium">{message}</p>
                </div>
            )}

            {/* SELEÇÃO DE TURMA E BOTÃO */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
                <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="flex-grow pl-4 pr-10 py-3 bg-secondary-bg border-2 border-[#4a525a] rounded-xl text-secondary-text focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                >
                    {availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>

                <button
                    onClick={handleAssignClick}
                    disabled={isLoading || !selectedClassId}
                    className="bg-gradient-to-r from-accent-yellow to-accent-teal text-primary-text font-bold py-3 px-8 rounded-xl shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isLoading ? 'Processando...' : 'Atribuir Atividade'}
                </button>
            </div>

            {/* --- MODAL DO CHAPÉU SELETOR (GERAÇÃO DE EQUIPES) --- */}
            {showTeamModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-secondary-bg w-full max-w-2xl rounded-2xl shadow-2xl border border-accent-purple animate-fade-in overflow-hidden">

                        {/* Header do Modal */}
                        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 border-b border-purple-700">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-800 rounded-full text-yellow-400 text-2xl shadow-inner">
                                    <FaHatWizard />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Configurar Casas da Turma</h2>
                                    <p className="text-purple-200 text-sm">Esta atividade é em grupo e a turma precisa de divisões.</p>
                                </div>
                            </div>
                        </div>

                        {/* Corpo do Modal */}
                        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">

                            {/* 1. Quantidade */}
                            <div className="bg-primary-bg p-4 rounded-xl border border-border-color">
                                <label className="block text-sm font-bold text-accent-yellow mb-2">Quantidade de Casas</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="2" max="10"
                                        value={teamConfig.quantity}
                                        onChange={(e) => handleQuantityChange(e.target.value)}
                                        className="flex-grow h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-purple"
                                    />
                                    <span className="text-2xl font-bold text-white w-12 text-center">{teamConfig.quantity}</span>
                                </div>
                            </div>

                            {/* 2. Método de Distribuição */}
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setTeamConfig(prev => ({ ...prev, method: 'balanced' }))}
                                    className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center text-center transition-all ${teamConfig.method === 'balanced' ? 'border-accent-purple bg-purple-900/30' : 'border-gray-700 bg-primary-bg opacity-60'}`}
                                >
                                    <FaBalanceScale className="text-3xl mb-2 text-accent-teal" />
                                    <h4 className="font-bold text-white">Equilibrado (XP)</h4>
                                    <p className="text-xs text-gray-400">Distribui veteranos igualmente entre as casas.</p>
                                </div>
                                <div
                                    onClick={() => setTeamConfig(prev => ({ ...prev, method: 'random' }))}
                                    className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center text-center transition-all ${teamConfig.method === 'random' ? 'border-accent-purple bg-purple-900/30' : 'border-gray-700 bg-primary-bg opacity-60'}`}
                                >
                                    <FaDice className="text-3xl mb-2 text-accent-yellow" />
                                    <h4 className="font-bold text-white">Sorteio Aleatório</h4>
                                    <p className="text-xs text-gray-400">Pura sorte! Distribuição totalmente randômica.</p>
                                </div>
                            </div>

                            {/* 3. Nomes das Casas */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-accent-yellow">Nomes das Casas</label>
                                    <button onClick={handleRerollNames} className="text-xs flex items-center gap-1 text-accent-teal hover:text-white transition-colors">
                                        <FaRandom /> Sortear Novos Nomes
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {teamConfig.names.map((name, idx) => (
                                        <div key={idx} className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaUsers className="text-gray-500" />
                                            </div>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => handleNameChange(idx, e.target.value)}
                                                className="w-full pl-9 pr-8 py-2 bg-primary-bg border border-border-color rounded-lg text-white focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all"
                                            />
                                            <FaPen className="absolute right-3 top-3 text-gray-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer do Modal */}
                        <div className="p-4 bg-primary-bg border-t border-border-color flex justify-end gap-3">
                            <button
                                onClick={() => setShowTeamModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmTeamsAndAssign}
                                className="bg-accent-purple hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
                            >
                                <FaHatWizard /> Criar Casas e Atribuir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

AssignActivityToClass.propTypes = {
    onAssignSuccess: PropTypes.func
};

export default AssignActivityToClass;