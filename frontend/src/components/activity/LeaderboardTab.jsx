import React from 'react';
import { FaCrown } from 'react-icons/fa';
import backgroundImage from '../../assets/leaderboard-background.png';
import '../../styles/Leaderboard.css'; // Certifique-se que este caminho está correto
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useAnalytics from '../../hooks/useAnalytics';
// --- NOVO SUBCOMPONENTE ---
// Este componente é responsável por renderizar o nome com os efeitos corretos.
const PlayerName = ({ name, effects = [] }) => { // Adicionado 'effects = []' como valor padrão
    // Procura por um título nos efeitos
    const titleEffect = effects.find(e => e && e.startsWith('RANKING_TITLE_'));
    const title = titleEffect ? titleEffect.replace('RANKING_TITLE_', '').replace('_', ' ') : null;

    // Procura por um efeito de cor
    const hasGold = effects.includes('RANKING_COLOR_GOLD');
    const hasRainbow = effects.includes('RANKING_GRADIENT_RAINBOW');
    
    // Define a classe CSS com base nos efeitos encontrados
    let nameClass = "font-semibold text-lg transition-all";
    if (hasRainbow) {
        nameClass += " text-gradient-rainbow";
    } else if (hasGold) {
        nameClass += " text-gold";
    }

    return (
        <div className="flex flex-col items-start">
            <span className={nameClass}>{name}</span>
            {title && <span className="text-xs font-bold text-purple-400 mt-1 animate-fadeIn">{title}</span>}
        </div>
    );
};


const LeaderboardTab = ({ leaderboardData }) => {
    const { user } = useAuth();
    const { activityId } = useParams();
    
    
    useAnalytics("leaderboard", user.token, activityId);
    return (
    <div className="bg-gray-800 p-8 rounded-lg text-white" 
        style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
            color: 'white',
            width: '90%',
            maxWidth: '1200px',
        }}
    >
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            Ranking da Atividade
        </h2>
        <div className="space-y-4 w-full max-w-2xl">
            {leaderboardData.map(player => (
                <div 
                    key={player.rank} 
                    className={`p-4 rounded-lg flex items-center justify-between border-2 transition-all duration-300 ${player.name.includes('(Você)') ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent bg-gray-700/80 backdrop-blur-sm'}`}
                >
                    <div className="flex items-center">
                        <span className="text-2xl font-bold w-10 text-center">{player.rank === 1 ? <FaCrown className="text-yellow-400" /> : player.rank}</span>
                        <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full mx-4" />
                        
                        {/* --- A MÁGICA ACONTECE AQUI --- */}
                        {/* Usando o novo componente para renderizar o nome com os efeitos que vêm do backend */}
                        <PlayerName name={player.name} effects={player.active_effects} />

                    </div>
                    <span className="font-bold text-xl text-yellow-400">{player.points} Pontos</span>
                </div>
            ))}
        </div>
    </div>
    )
};

export default LeaderboardTab;