import React from 'react';
import { FaCrown } from 'react-icons/fa';

const LeaderboardTab = ({ leaderboardData }) => (
    <div className="bg-gray-800 p-8 rounded-lg text-white">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Ranking da Atividade</h2>
        <div className="space-y-4">
            {leaderboardData.map(player => (
                <div key={player.rank} className={`p-4 rounded-lg flex items-center justify-between border-2 ${player.name.includes('(Você)') ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent bg-gray-700'}`}>
                    <div className="flex items-center">
                        <span className="text-2xl font-bold w-10">{player.rank === 1 ? <FaCrown className="text-yellow-400" /> : player.rank}</span>
                        <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full mx-4" />
                        <span className="font-semibold text-lg">{player.name}</span>
                    </div>
                    <span className="font-bold text-xl text-yellow-400">{player.points} Pontos</span>
                </div>
            ))}
        </div>
    </div>
);

export default LeaderboardTab;