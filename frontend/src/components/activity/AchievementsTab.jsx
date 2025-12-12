// ==== [HEADER] ====
// Arquivo: frontend/src/components/activity/AchievementsTab.jsx
// Stack: React + Tailwind CSS
// Debug: VITE_DEBUG_MODE=true
// ==================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import { FaMedal, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import MedalDetailModal from './MedalDetailModal';

// Constante para Debug
const DEBUG = import.meta.env.VITE_DEBUG_MODE === 'true';

/**
 * Hook customizado para gerenciar a lógica de busca de medalhas.
 * * @param {string} token - Token de autenticação do usuário.
 * @param {string|number} activityId - ID da atividade atual.
 * @returns {Object} Estado contendo medalhas, IDs desbloqueados, loading e erro.
 */
const useAchievements = (token, activityId) => {
    const [allMedals, setAllMedals] = useState([]);
    const [unlockedMedalIds, setUnlockedMedalIds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const fetchMedalData = async () => {
            if (DEBUG) console.debug('[useAchievements] Iniciando busca de dados. ActivityID:', activityId);

            setIsLoading(true);
            setError('');

            try {
                if (!activityId) {
                    throw new Error("ID da Atividade não foi fornecido.");
                }

                if (!token) {
                    throw new Error("Usuário não autenticado.");
                }

                const baseUrl = import.meta.env.VITE_API_URL;
                const headers = { 'Authorization': `Bearer ${token}` };

                const fetchApi = async (endpoint) => {
                    const res = await fetch(`${baseUrl}${endpoint}`, { headers });
                    if (!res.ok) throw new Error(`Erro na requisição: ${res.status}`);
                    return res.json();
                };

                // Executa as promessas em paralelo
                const [medalsData, unlockedData] = await Promise.all([
                    fetchApi('/api/medals'),
                    fetchApi(`/api/medals/my-unlocked?activity_id=${activityId}`)
                ]);

                if (isMounted) {
                    if (DEBUG) console.debug('[useAchievements] Dados recebidos:', { medals: medalsData.length, unlocked: unlockedData.length });
                    setAllMedals(medalsData);
                    setUnlockedMedalIds(unlockedData);
                }
            } catch (err) {
                if (isMounted) {
                    console.error('[useAchievements] Erro ao carregar medalhas:', err);
                    setError('Não foi possível carregar as medalhas. Tente novamente mais tarde.');
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchMedalData();

        return () => {
            isMounted = false;
        };
    }, [token, activityId]);

    return { allMedals, unlockedMedalIds, isLoading, error };
};

/**
 * @desc Componente para exibir o mural de conquistas (medalhas) de uma atividade.
 * Gerencia a visualização de medalhas bloqueadas/desbloqueadas e modal de detalhes.
 * * @param {Object} props - Props do componente
 * @param {Function} props.onReturn - Função de callback para retornar à tela anterior
 * @param {string|number} props.activityId - ID da atividade para filtrar conquistas
 */
const AchievementsTab = ({ onReturn, activityId }) => {
    const { user } = useAuth();
    const [selectedMedal, setSelectedMedal] = useState(null);

    // Usa o hook customizado para lógica de dados
    const { allMedals, unlockedMedalIds, isLoading, error } = useAchievements(user?.token, activityId);

    // Otimização de performance para verificação rápida de IDs
    const unlockedIdsSet = useMemo(() => {
        return new Set(unlockedMedalIds);
    }, [unlockedMedalIds]);

    // Callbacks memorizados para interações
    const handleMedalClick = useCallback((medal) => {
        if (DEBUG) console.debug('[AchievementsTab] Medalha selecionada:', medal.name);
        setSelectedMedal(medal);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedMedal(null);
    }, []);

    // Renderização de Estados de Carregamento/Erro
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96" role="status">
                <FaSpinner className="animate-spin text-4xl text-yellow-400" aria-label="Carregando" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-red-400 p-8">
                <p>{error}</p>
                <button
                    onClick={onReturn}
                    className="mt-4 px-4 py-2 border border-red-400 rounded hover:bg-red-400 hover:text-white transition"
                >
                    Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="relative pt-16 w-full max-w-5xl mx-auto p-4 text-primary-text">
            {/* Botão de Voltar */}
            <div className='flex-shrink-0'>
                <button
                    onClick={onReturn}
                    className="absolute top-4 left-4 z-20 flex items-center gap-2 py-2 px-4 
                                bg-secondary-bg text-secondary-text 
                                border border-border-color rounded-full shadow-lg 
                                hover:bg-primary-bg hover:shadow-xl transition-all
                                focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    aria-label="Voltar ao Tabuleiro"
                >
                    <FaArrowLeft /> Voltar ao Tabuleiro
                </button>
            </div>

            {/* Cabeçalho */}
            <header className="text-center mb-8 pt-8">
                <h1 className="text-4xl font-bold text-yellow-300 flex items-center justify-center gap-3">
                    <FaMedal />
                    Mural de Conquistas
                </h1>
            </header>

            {/* Grid de Medalhas */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                {allMedals.map(medal => {
                    const isUnlocked = unlockedIdsSet.has(medal.id);
                    return (
                        <div
                            key={medal.id}
                            role="button"
                            tabIndex={0}
                            className="flex flex-col items-center text-center cursor-pointer transition-transform transform hover:scale-110 focus:scale-110 focus:outline-none"
                            onClick={() => handleMedalClick(medal)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') handleMedalClick(medal);
                            }}
                        >
                            <img
                                src={`${import.meta.env.VITE_API_URL}${medal.imageUrl}`}
                                alt={`Medalha ${medal.name}`}
                                loading="lazy"
                                className={`w-24 h-24 transition-all duration-300 ${isUnlocked ? '' : 'filter grayscale opacity-60'}`}
                            />
                            <p className={`mt-2 font-semibold text-sm ${isUnlocked ? 'text-primary-text' : 'text-secondary-text'}`}>
                                {medal.name}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Detalhes */}
            {/* TODO: Considerar mover o Modal para um Portal se houver problemas de z-index */}
            <MedalDetailModal
                medal={selectedMedal}
                isUnlocked={selectedMedal ? unlockedIdsSet.has(selectedMedal.id) : false}
                onClose={handleCloseModal}
            />
        </div>
    );
};

// Validação de Props com PropTypes
AchievementsTab.propTypes = {
    onReturn: PropTypes.func.isRequired,
    activityId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]).isRequired
};

export default AchievementsTab;