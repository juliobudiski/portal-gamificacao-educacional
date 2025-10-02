// frontend/src/components/activity/RankingItem.jsx
import React from 'react';
import { FaMedal } from 'react-icons/fa';

// Componente para um único jogador no ranking
const RankingItem = ({ player, isCurrentUser }) => {
  console.log(`[RankingItem] Renderizando para: ${player.name}`, {
    isCurrentUser,
    receivedTitle: player.title,
    receivedEffects: player.active_effects
  });
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

  // --- LÓGICA DE EFEITOS ATUALIZADA ---
  const generateVisuals = (effects = []) => {
    const visualStyle = {};
    let baseClass = "font-semibold text-lg transition-all";

    const cosmeticEffect = effects.find(e => typeof e === 'object' && e !== null && e.type === 'color');

    if (cosmeticEffect) {
      visualStyle.color = cosmeticEffect.color;
      if (cosmeticEffect.effect === 'neon') {
        visualStyle.textShadow = `0 0 5px ${cosmeticEffect.color}, 0 0 7px ${cosmeticEffect.color}`;
      }
    } else {
      baseClass += " text-white"; // Cor padrão se não houver efeito
    }

    // Retorna o objeto de estilo e a classe base
    return { style: visualStyle, className: baseClass };
  };

  const podiumStyle = getPodiumStyle(player.rank);
  const visuals = generateVisuals(player.active_effects);

  // Define a classe base e adiciona classes de destaque condicionalmente
  let containerClasses = `p-4 rounded-lg flex items-center justify-between border-2 transition-all duration-300 backdrop-blur-sm ${podiumStyle.bgClass} ${podiumStyle.borderClass}`;
  if (isCurrentUser) {
    containerClasses += ' scale-105 border-blue-400 ring-4 ring-blue-500/50';
  }

  return (
    <li className={containerClasses}>
      <div className="flex items-center">
        <span className="text-2xl font-bold w-12 text-center flex justify-center items-center">{podiumStyle.icon}</span>
        <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full mx-4" />

        {/* Nome e Título agora usam o mesmo objeto de estilo 'visuals' */}
        <div className="flex flex-col items-start">
          <span style={visuals.style} className={visuals.className}>{player.name}</span>
          {player.title && (
            <span
              style={visuals.style} // <-- APLICA O MESMO ESTILO AQUI
              className="text-xs font-bold mt-1" // <-- Classe base para o título
            >
              {player.title}
            </span>
          )}
        </div>

      </div>
      <span className="font-bold text-xl text-yellow-300">{player.points} Pontos</span>
    </li>
  );
};

export default RankingItem;