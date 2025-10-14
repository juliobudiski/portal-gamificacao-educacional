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
          icon: <FaMedal className="text-secondary-text" />,
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
      baseClass += " text-primary-text"; // Cor padrão se não houver efeito
    }

    // Retorna o objeto de estilo e a classe base
    return { style: visualStyle, className: baseClass };
  };
  const applyCosmetic = (cosmetic) => {
    const style = {};
    if (cosmetic?.type === 'color') {
      style.color = cosmetic.color;
      if (cosmetic.effect === 'neon') {
        style.textShadow = `0 0 5px ${cosmetic.color}, 0 0 7px ${cosmetic.color}`;
      }
    }
    return style;
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
          <span style={applyCosmetic(player.name_cosmetic)} className="font-semibold text-lg text-primary-text">
            {player.name}
          </span>
          {player.title && (
            <span style={applyCosmetic(player.title_cosmetic)} className="text-xs font-bold mt-1 text-secondary-text">
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