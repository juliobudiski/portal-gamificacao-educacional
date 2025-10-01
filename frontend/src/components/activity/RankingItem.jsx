// frontend/src/components/activity/RankingItem.jsx
import React from 'react';
import { FaMedal } from 'react-icons/fa';

// Componente para um único jogador no ranking
const RankingItem = ({ player, isCurrentUser }) => {

  // --- Lógica para Estilo do Pódio (Top 3) ---
  const getPodiumStyle = (rank) => {
    switch (rank) {
      case 1:
        return {
          icon: <FaMedal className="text-yellow-400" />,
          borderClass: 'border-yellow-400',
          bgClass: 'bg-yellow-900/40',
        };
      case 2:
        return {
          icon: <FaMedal className="text-gray-300" />,
          borderClass: 'border-gray-400',
          bgClass: 'bg-gray-700/40',
        };
      case 3:
        return {
          icon: <FaMedal className="text-orange-400" />,
          borderClass: 'border-orange-500',
          bgClass: 'bg-orange-900/40',
        };
      default:
        return { icon: rank, borderClass: 'border-transparent', bgClass: 'bg-gray-700/80' };
    }
  };

  // --- Lógica para aplicar os efeitos cosméticos comprados na loja ---
  const parsePlayerEffects = (name, effects = [], title) => {
    // A lógica de cores continua a mesma, lendo de 'effects'
    const hasGold = effects.includes('RANKING_COLOR_GOLD');
    const hasRainbow = effects.includes('RANKING_GRADIENT_RAINBOW');
    
    let nameClass = "font-semibold text-lg transition-all text-white";
    if (hasRainbow) {
      nameClass = "font-semibold text-lg transition-all bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent";
    } else if (hasGold) {
      nameClass = "font-semibold text-lg transition-all text-yellow-400";
    }

    return (
      <div className="flex flex-col items-start">
        <span className={nameClass}>{name}</span>
        {/* A MUDANÇA CRÍTICA: Apenas exibe o 'title' se ele vier da API.
            Removemos a lógica antiga que tentava adivinhar o título a partir de 'effects'. */}
        {title && <span className="text-xs font-bold text-purple-300 mt-1">{title}</span>}
      </div>
    );
  };
  
  const podiumStyle = getPodiumStyle(player.rank);
  const playerNameWithEffects = parsePlayerEffects(player.name, player.active_effects, player.title);

  // Define a classe base e adiciona classes de destaque condicionalmente
  let baseClasses = `p-4 rounded-lg flex items-center justify-between border-2 transition-all duration-300 backdrop-blur-sm ${podiumStyle.bgClass} ${podiumStyle.borderClass}`;
  if (isCurrentUser) {
    baseClasses += ' scale-105 border-blue-400 ring-4 ring-blue-500/50'; // Destaque para o usuário logado
  }

  return (
    <li className={baseClasses}>
      <div className="flex items-center">
        <span className="text-2xl font-bold w-12 text-center flex justify-center items-center">{podiumStyle.icon}</span>
        <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full mx-4" />
        {playerNameWithEffects}
      </div>
      <span className="font-bold text-xl text-yellow-300">{player.points} Pontos</span>
    </li>
  );
};

export default RankingItem;