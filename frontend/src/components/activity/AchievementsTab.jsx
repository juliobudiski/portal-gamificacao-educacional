// frontend/src/components/activity/AchievementsTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaMedal, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import MedalDetailModal from './MedalDetailModal';

const AchievementsTab = ({ onReturn, activityId }) => {
    const { user } = useAuth();
    const [allMedals, setAllMedals] = useState([]);
    const [unlockedMedalIds, setUnlockedMedalIds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMedal, setSelectedMedal] = useState(null);

    useEffect(() => {
        const fetchMedalData = async () => {
            setIsLoading(true);
            try {
                // Se o activityId não for passado, não faz nada para evitar erros.
                if (!activityId) {
                    throw new Error("ID da Atividade não foi fornecido.");
                }

                const fetchApi = (endpoint) => fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, { headers: { 'Authorization': `Bearer ${user.token}` } }).then(res => res.json());

                const [medalsData, unlockedData] = await Promise.all([
                    fetchApi('/api/medals'),
                    // A variável 'activityId' agora existe e pode ser usada com segurança
                    fetchApi(`/api/medals/my-unlocked?activity_id=${activityId}`)
                ]);

                setAllMedals(medalsData);
                setUnlockedMedalIds(unlockedData);
            } catch (err) {
                setError('Não foi possível carregar as medalhas.');
                console.error(err); // Adiciona um log do erro real para facilitar a depuração
            } finally {
                setIsLoading(false);
            }
        };

        fetchMedalData();
        // --- CORREÇÃO 2: Adiciona activityId ao array de dependências do useEffect ---
        // Isso garante que a busca de dados seja refeita se o componente for reutilizado noutra atividade.
    }, [user.token, activityId]);

    const unlockedIdsSet = useMemo(() => new Set(unlockedMedalIds), [unlockedMedalIds]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><FaSpinner className="animate-spin text-4xl text-yellow-400" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-400 p-8">{error}</div>;
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-4 text-white">
            <button onClick={onReturn} className="absolute top-4 left-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200">
                <FaArrowLeft /> Voltar
            </button>
            <header className="text-center mb-8 pt-8">
                <h1 className="text-4xl font-bold text-yellow-300 flex items-center justify-center gap-3">
                    <FaMedal />
                    Mural de Conquistas
                </h1>
            </header>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                {allMedals.map(medal => {
                    const isUnlocked = unlockedIdsSet.has(medal.id);
                    return (
                        <div
                            key={medal.id}
                            className="flex flex-col items-center text-center cursor-pointer transition-transform transform hover:scale-110"
                            onClick={() => setSelectedMedal(medal)}
                        >
                            <img
                                src={medal.imageUrl}
                                alt={medal.name}
                                className={`w-24 h-24 transition-all duration-300 ${isUnlocked ? '' : 'filter grayscale opacity-60'}`}
                            />
                            <p className={`mt-2 font-semibold text-sm ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                                {medal.name}
                            </p>
                        </div>
                    );
                })}
            </div>

            <MedalDetailModal
                medal={selectedMedal}
                isUnlocked={selectedMedal ? unlockedIdsSet.has(selectedMedal.id) : false}
                onClose={() => setSelectedMedal(null)}
            />
        </div>
    );
};

export default AchievementsTab;