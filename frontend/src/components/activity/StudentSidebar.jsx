import React from 'react';
import { FaGem, FaLevelUpAlt } from 'react-icons/fa';

const StudentSidebar = ({ progress, onShowStats }) => {
    if (!progress) return <div className="p-4 text-gray-400">Carregando progresso...</div>;
    const xpPercentage = progress.xpForNextLevel > 0 ? (progress.xp / progress.xpForNextLevel) * 100 : 0;
    return (
        <div className="p-4 bg-gray-900 rounded-lg space-y-6 sticky top-4">
            <div>
                <h4 className="text-lg font-bold text-yellow-400 flex items-center"><FaGem className="mr-2" /> Pontuação</h4>
                <p className="text-4xl font-bold text-white">{progress.points} Pontos</p>
            </div>
            <div>
                <h4 className="text-lg font-bold text-green-400 flex items-center"><FaLevelUpAlt className="mr-2" /> Nível</h4>
                <p className="text-2xl font-bold text-white">Nível {progress.level}</p>
                <div className="w-full bg-gray-700 rounded-full h-4 mt-2"><div className="bg-green-500 h-4 rounded-full" style={{ width: `${xpPercentage}%` }}></div></div>
                <p className="text-sm text-gray-400 mt-1 text-right">{progress.xp} / {progress.xpForNextLevel} XP</p>
            </div>
            <button onClick={onShowStats} className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg">Ver Estatísticas</button>
        </div>
    );
};

export default StudentSidebar;