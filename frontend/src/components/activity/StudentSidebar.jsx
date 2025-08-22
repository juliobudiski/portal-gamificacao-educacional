import React from 'react';
import { FaGem, FaLevelUpAlt } from 'react-icons/fa';
import PropTypes from 'prop-types'; // Import adicionado para validação de props

// Verifica se o modo debug está ativado
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

/**
 * @component StudentSidebar
 * @desc Componente de barra lateral que exibe o progresso do estudante (pontuação, nível, XP).
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.progress - Objeto contendo dados de progresso do estudante
 * @param {Function} props.onShowStats - Callback para exibir estatísticas detalhadas
 * @returns {JSX.Element} Barra lateral com informações de progresso
 */
const StudentSidebar = ({ progress, onShowStats }) => {
  // Log de inicialização
  if (isDebugMode) {
    console.log('[StudentSidebar] Componente renderizado', {
      hasProgress: !!progress,
      level: progress?.level || 'N/A'
    });
  }

  if (!progress) {
    // Log de estado de carregamento
    if (isDebugMode) {
      console.log('[StudentSidebar] Progresso não carregado - exibindo estado de carregamento');
    }
    return <div className="p-4 text-gray-400">Carregando progresso...</div>;
  }

  // Calcula porcentagem de progresso para barra de XP
  const xpPercentage = progress.xpForNextLevel > 0 ? 
    (progress.xp / progress.xpForNextLevel) * 100 : 
    0;

  // Log de dados de progresso
  if (isDebugMode) {
    console.log('[StudentSidebar] Dados de progresso:', {
      points: progress.points_earned,
      level: progress.level,
      xp: progress.xp,
      xpForNextLevel: progress.xpForNextLevel,
      xpPercentage: xpPercentage.toFixed(1) + '%'
    });
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg space-y-6 sticky top-4">
      {/* Seção de Pontuação */}
      <div>
        <h4 className="text-lg font-bold text-yellow-400 flex items-center">
          <FaGem className="mr-2" /> Pontuação
        </h4>
        <p className="text-4xl font-bold text-white">{progress.points_earned} Pontos</p>
      </div>

      {/* Seção de Nível e Progresso */}
      <div>
        <h4 className="text-lg font-bold text-green-400 flex items-center">
          <FaLevelUpAlt className="mr-2" /> Nível
        </h4>
        <p className="text-2xl font-bold text-white">Nível {progress.level}</p>
        
        {/* Barra de progresso de XP */}
        <div className="w-full bg-gray-700 rounded-full h-4 mt-2">
          <div 
            className="bg-green-500 h-4 rounded-full" 
            style={{ width: `${xpPercentage}%` }}
          >
            {/* TODO: Adicionar tooltip com detalhes do progresso */}
            {/* TODO: Implementar animação suave na barra de progresso */}
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-1 text-right">
          {progress.xp} / {progress.xpForNextLevel} XP
        </p>
      </div>

      {/* Botão para exibir estatísticas */}
      <button 
        onClick={() => {
          // Log de interação do usuário
          if (isDebugMode) {
            console.log('[StudentSidebar] Botão "Ver Estatísticas" clicado');
          }
          onShowStats();
        }} 
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg"
      >
        Ver Estatísticas
      </button>
    </div>
  );
};

// Validação de props
StudentSidebar.propTypes = {
  progress: PropTypes.shape({
    points_earned: PropTypes.number.isRequired,
    level: PropTypes.number.isRequired,
    xp: PropTypes.number.isRequired,
    xpForNextLevel: PropTypes.number.isRequired
  }),
  onShowStats: PropTypes.func.isRequired
};

export default StudentSidebar;