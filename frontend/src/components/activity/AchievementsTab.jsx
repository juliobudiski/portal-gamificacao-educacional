import React from 'react';
import { FaMedal } from 'react-icons/fa';

const AchievementsTab = () => {
    return (
        <div className="bg-gray-800 p-8 rounded-lg text-white text-center">
            <FaMedal className="text-6xl text-orange-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-orange-400">Painel de Conquistas</h2>
            <p className="mt-2 text-gray-400">Em breve, suas medalhas e insígnias aparecerão aqui!</p>
        </div>
    );
};

export default AchievementsTab;