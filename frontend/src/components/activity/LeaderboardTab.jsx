// frontend/src/components/activity/LeaderboardTab.jsx
import React from 'react';
import { FaSpinner, FaTrophy, FaExclamationCircle, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import RankingItem from './RankingItem'; // Importa o novo componente de item

const LeaderboardTab = ({ leaderboardData, isLoading, onReturn }) => {
    // Pega o usuário logado do contexto para poder destacá-lo
    const { user } = useAuth();
    React.useEffect(() => {
        if (leaderboardData && leaderboardData.length > 0) {
            console.log("[DEBUG_POINTS] Data received by LeaderboardTab:", JSON.stringify(leaderboardData, null, 2));
        }
    }, [leaderboardData]);
    // --- Componente para o Estado de Carregamento ---
    if (isLoading) {
        return (
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 text-primary-text min-h-[400px]">
                <FaSpinner className="text-4xl animate-spin text-secondary-text mb-4" />
                <p className="text-lg text-secondary-text">Carregando o Ranking...</p>
            </div>
        );
    }

    // --- Componente para o Estado Vazio ---
    if (!leaderboardData || leaderboardData.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 text-primary-text min-h-[400px]">
                <button onClick={onReturn} className="absolute top-4 left-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200 transition-colors z-20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" /></svg>
                    Voltar
                </button>
                <FaExclamationCircle className="text-5xl text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Ranking Vazio</h2>
                <p className="text-secondary-text">Ainda não há pontuações registradas. Seja o primeiro a jogar!</p>
            </div>
        );
    }

    // --- Renderização Principal do Ranking ---
    return (
        <div className="relative pt-16 w-full max-w-3xl mx-auto p-4 text-primary-text">
            <div className='flex-shrink-0'>
                <button
                    onClick={onReturn}
                    className="absolute top-4 left-4 z-20 flex items-center gap-2 py-2 px-4 
                                bg-secondary-bg text-secondary-text 
                                border border-border-color rounded-full shadow-lg 
                                hover:bg-primary-bg hover:shadow-xl transition-all"
                >
                    <FaArrowLeft /> Voltar ao Tabuleiro
                </button>
            </div>
            <header className="text-center mb-8 pt-8">
                <h1 className="text-4xl font-bold text-yellow-300 flex items-center justify-center gap-3">
                    <FaTrophy />
                    Hall da Fama
                </h1>
            </header>

            {/* Usando uma lista ordenada <ol> para semântica correta */}
            <ol className="space-y-4">
                {leaderboardData.map(player => (
                    <RankingItem
                        key={player.rank}
                        player={player}
                        // Verifica se o ID do jogador na lista é o mesmo do usuário logado
                        isCurrentUser={player.id === user.id}
                    />
                ))}
            </ol>
        </div>
    );
};

export default LeaderboardTab;