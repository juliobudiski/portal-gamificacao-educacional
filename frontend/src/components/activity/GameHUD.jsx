import React from 'react';
import { FaStar, FaTrophy, FaCoins, FaShieldAlt } from 'react-icons/fa';
import RecentActivityFeed from './RecentActivityFeed';

const GameHUD = ({ progress }) => {
    // 1. USA OS DADOS VINDOS DO BACKEND (progress.py -> get_activity_progress)
    const currentPoints = progress?.points_earned || 0; // Pontos para a loja
    const currentCoins = progress?.coins || 0;         // Moedas (Tigrinho/Roleta)
    const teamName = progress?.team_name;

    // 2. USA O CÁLCULO DE NÍVEL QUE O BACKEND JÁ FEZ
    const currentLevel = progress?.level || 1;
    const currentLevelXP = progress?.xp || 0; // XP atual dentro do nível
    const nextLevelXP = progress?.xpForNextLevel || 100;
    const progressPercent = nextLevelXP > 0 ? (currentLevelXP / nextLevelXP) * 100 : 0;

    return (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-3xl px-4 pointer-events-none">
            {/* Container Principal do HUD */}
            <div className="bg-primary-bg/80 backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] pointer-events-auto transition-colors duration-300">

                {/* Esquerda: Nível e XP (Barra de Progresso) */}
                <div className="flex items-center flex-1 mr-4">
                    <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center border-2 border-white/20 shadow-lg z-10 relative">
                            <span className="text-xl font-bold text-white">{currentLevel}</span>
                        </div>

                    </div>

                    <div className="ml-3 flex-1">
                        <div className="flex justify-between text-xs text-secondary-text mb-1 font-semibold uppercase tracking-wider">
                            <span>Progresso da Atividade</span>
                            {/* Mostra o XP real do nível */}
                            <span>{currentLevelXP} / {nextLevelXP} XP</span>
                        </div>
                        <div className="h-3 bg-secondary-bg rounded-full overflow-hidden border border-[var(--border-color)]">
                            <div
                                className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(96,165,250,0.5)]"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* --- CENTRO: Nome da Equipe (Condicional) --- */}
                {teamName && (
                    <div className="hidden md:flex flex-col items-center justify-center px-6 border-l border-r border-[var(--border-color)] mx-2">
                        <div className="flex items-center gap-2 text-blue-300 mb-0.5">
                            <FaShieldAlt className="text-sm" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Sua Casa</span>
                        </div>
                        <span className="text-primary-text font-bold text-base truncate max-w-[150px] drop-shadow-sm">
                            {teamName}
                        </span>
                    </div>
                )}

                {/* Direita: Moedas e Pontos (AGORA CORRETOS) */}
                <div className="flex items-center gap-4 border-l border-[var(--border-color)] pl-4">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center text-yellow-400 font-bold text-lg drop-shadow-sm">
                            <FaCoins className="mr-2 text-yellow-500" />
                            {currentCoins}
                        </div>
                        <span className="text-[10px] text-secondary-text uppercase font-bold tracking-widest">Moedas</span>
                    </div>

                    <div className="hidden sm:flex flex-col items-end">
                        <div className="flex items-center text-green-400 font-bold text-lg drop-shadow-sm">
                            <FaTrophy className="mr-2 text-green-500" />
                            {currentPoints}
                        </div>
                        <span className="text-[10px] text-secondary-text uppercase font-bold tracking-widest">Pontos</span>
                    </div>

                    {/* Ícone do Feed Global */}
                    <div className="ml-2 pl-2 border-l border-[var(--border-color)]">
                        <RecentActivityFeed />
                    </div>
                </div>

            </div>
            {/* Badge Mobile para Equipe (aparece fora do HUD principal se a tela for pequena) */}
            {teamName && (
                <div className="md:hidden flex justify-center mt-2">
                    <div className="bg-primary-bg/80 backdrop-blur-md text-info font-bold py-1 px-3 rounded-full border border-info/30 flex items-center gap-2 shadow-lg">
                        <FaShieldAlt /> {teamName}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameHUD;