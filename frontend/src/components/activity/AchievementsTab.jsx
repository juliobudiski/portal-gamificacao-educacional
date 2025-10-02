import React from 'react';
import { FaMedal } from 'react-icons/fa';

const AchievementsTab = ({ onReturn }) => {
    return (
        <div className="bg-gray-800 p-8 rounded-lg text-white text-center">
            <button
                onClick={onReturn}
                className="mb-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
                </svg>
                Voltar ao Tabuleiro
            </button>
            <FaMedal className="text-6xl text-orange-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-orange-400">Painel de Conquistas</h2>
            <p className="mt-2 text-gray-400">Em breve, suas medalhas e insígnias aparecerão aqui!</p>
        </div>
    );
};

export default AchievementsTab;