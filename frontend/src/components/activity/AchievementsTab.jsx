// frontend/src/components/activity/AchievementsTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaMedal, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import MedalDetailModal from './MedalDetailModal'; // Importa o novo modal

const AchievementsTab = ({ onReturn }) => {
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
                const fetchApi = (endpoint) => fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, { headers: { 'Authorization': `Bearer ${user.token}` } }).then(res => res.json());

                const [medalsData, unlockedData] = await Promise.all([
                    fetchApi('/api/medals'),
                    fetchApi('/api/medals/my-unlocked')
                ]);

                setAllMedals(medalsData);
                setUnlockedMedalIds(unlockedData);
            } catch (err) {
                setError('Não foi possível carregar as medalhas.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMedalData();
    }, [user.token]);

    // Usar um Set é muito mais rápido para verificar se uma medalha foi desbloqueada
    const unlockedIdsSet = useMemo(() => new Set(unlockedMedalIds), [unlockedMedalIds]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><FaSpinner className="animate-spin text-4xl text-yellow-400" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-400">{error}</div>;
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