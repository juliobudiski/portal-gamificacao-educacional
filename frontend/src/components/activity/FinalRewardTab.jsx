// frontend/src/components/activity/FinalRewardTab.jsx
import React from 'react';
import { FaTrophy, FaCheckCircle } from 'react-icons/fa';

const FinalRewardTab = ({ reward, onCollect, onReturnToBoard }) => {
    return (
        <div className="text-center text-white p-4 animate-fade-in">
            <FaTrophy className="text-7xl text-yellow-400 mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 15px #facc15)' }} />
            <h2 className="text-4xl font-bold mb-2">{reward?.celebrationText || 'Atividade Concluída!'}</h2>
            <p className="text-lg text-gray-300 mb-6">Você superou todos os desafios desta jornada. Veja sua recompensa!</p>

            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 max-w-md mx-auto mb-8">
                <h3 className="text-xl font-semibold text-green-400 mb-3">Recompensa Final</h3>
                <p className="text-3xl font-bold">
                    {/* Exibe a recompensa baseada no tipo */}
                    {reward?.rewardType === 'xp' && `${reward.value} XP`}
                    {reward?.rewardType === 'title' && `Título: "${reward.displayText}"`}
                </p>
            </div>

            <button
                onClick={onCollect}
                className="w-full max-w-xs py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-bold text-white shadow-lg transition-all transform hover:scale-105"
            >
                <FaCheckCircle className="inline mr-2" />
                Coletar Recompensa
            </button>
        </div>
    );
};

export default FinalRewardTab;