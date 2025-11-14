import React from 'react';
import { FaStar, FaTrophy, FaCoins } from 'react-icons/fa';

const GameHUD = ({ progress }) => {
    // 1. USA OS DADOS VINDOS DO BACKEND (progress.py -> get_activity_progress)
    const currentPoints = progress?.points_earned || 0; // Pontos para a loja
    const currentCoins = progress?.coins || 0;         // Moedas (Tigrinho/Roleta)

    // 2. USA O CÁLCULO DE NÍVEL QUE O BACKEND JÁ FEZ
    const currentLevel = progress?.level || 1;
    const currentLevelXP = progress?.xp || 0; // XP atual dentro do nível
    const nextLevelXP = progress?.xpForNextLevel || 100;
    const progressPercent = nextLevelXP > 0 ? (currentLevelXP / nextLevelXP) * 100 : 0;

    return (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-3xl px-4 pointer-events-none">
            {/* Container Principal do HUD */}
            <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center justify-between shadow-2xl pointer-events-auto">

                {/* Esquerda: Nível e XP (Barra de Progresso) */}
                <div className="flex items-center flex-1 mr-4">
                    <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center border-2 border-white/20 shadow-lg z-10 relative">
                            <span className="text-xl font-bold text-white">{currentLevel}</span>
                        </div>

                    </div>

                    <div className="ml-3 flex-1">
                        <div className="flex justify-between text-xs text-gray-300 mb-1 font-semibold uppercase tracking-wider">
                            <span>Progresso da Atividade</span>
                            {/* Mostra o XP real do nível */}
                            <span>{currentLevelXP} / {nextLevelXP} XP</span>
                        </div>
                        <div className="h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600/50">
                            <div
                                className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(96,165,250,0.5)]"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Direita: Moedas e Pontos (AGORA CORRETOS) */}
                <div className="flex items-center gap-4 border-l border-gray-700 pl-4">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center text-yellow-400 font-bold text-lg drop-shadow-sm">
                            <FaCoins className="mr-2 text-yellow-500" />
                            {currentCoins}
                        </div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Moedas</span>
                    </div>

                    <div className="hidden sm:flex flex-col items-end">
                        <div className="flex items-center text-green-400 font-bold text-lg drop-shadow-sm">
                            <FaTrophy className="mr-2 text-green-500" />
                            {currentPoints}
                        </div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Pontos (Loja)</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GameHUD;