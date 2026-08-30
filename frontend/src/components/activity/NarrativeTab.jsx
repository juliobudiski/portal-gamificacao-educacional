import React, { useState, useEffect } from 'react';
import { FaPlay, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import useAnalytics from '../../hooks/useAnalytics';

const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

const NarrativeTab = ({ content, onComplete }) => {
  const { scenario = '', characters = [], dialogue = [] } = content || {};

  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const { user } = useAuth();
  const { activityId } = useParams();
  const { logEvent } = useAnalytics("narrative", user.token, activityId);

  useEffect(() => {
    if (user?.role === 'aluno') {
      logEvent("narrative_viewed", {
        total_dialogue_lines: dialogue?.length || 0
      });
    }
  }, [logEvent, user?.role, dialogue?.length]);

  const handleCompleteNarrative = () => {
    onComplete(content.step_id);
  };

  if (!scenario || characters.length === 0 || dialogue.length === 0) {
    return (
      <div className="bg-primary-bg p-8 rounded-lg text-primary-text text-center">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Missão</h2>
        <p className="text-secondary-text">A narrativa para esta atividade ainda não foi configurada.</p>
        <button
          onClick={handleCompleteNarrative}
          className="mt-8 py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-bold flex items-center justify-center mx-auto"
        >
          <FaPlay className="mr-2" /> Ir para o Desafio
        </button>
      </div>
    );
  }

  const currentLine = dialogue[currentLineIndex];
  const currentCharacter = characters.find(c => c.role === currentLine?.characterRole);

  const goToNextLine = () => {
    if (currentLineIndex < dialogue.length - 1) {
      if (isDebugMode) {
        console.log(`[NarrativeTab] Avançando para o próximo diálogo: ${currentLineIndex + 1}/${dialogue.length}`);
      }
      logEvent("narrative_next_line", {
        from_line: currentLineIndex,
        to_line: currentLineIndex + 1,
        character_role: currentLine?.characterRole
      });
      setCurrentLineIndex(prev => prev + 1);
    }
  };

  const goToPreviousLine = () => {
    if (currentLineIndex > 0) {
      if (isDebugMode) {
        console.log(`[NarrativeTab] Retrocedendo para diálogo anterior: ${currentLineIndex - 1}/${dialogue.length}`);
      }
      logEvent("narrative_previous_line", {
        from_line: currentLineIndex,
        to_line: currentLineIndex - 1,
        character_role: currentLine?.characterRole
      });
      setCurrentLineIndex(prev => prev - 1);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col bg-black animate-fade-in text-white relative">
      
      {/* Cenário Widescreen */}
      <div
        className="relative w-full aspect-video bg-cover bg-center"
        style={{ backgroundImage: `url(${scenario})` }}
      >
        {/* Sombra de Vignette para um ar mais cinemático */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/80"></div>

        {/* Personagens */}
        {characters.map((char, index) => {
          const isActive = currentCharacter?.image === char.image;
          return (
            <img
              key={index}
              src={char.image}
              alt={char.role}
              className={`absolute bottom-0 h-[85%] object-contain transition-all duration-700 ease-out drop-shadow-2xl
                ${isActive ? 'opacity-100 scale-105 z-20 filter-none brightness-110' : 'opacity-40 scale-95 z-10 grayscale-[50%] blur-[1px]'}`}
              style={{ left: `${15 + index * 30}%`, transformOrigin: 'bottom center' }}
            />
          );
        })}

        {/* Caixa de Diálogo (Glassmorphism sobreposta na parte inferior) */}
        {currentLine && (
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-12 sm:right-12 z-30">
            <div className="bg-black/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl border-t-2 border-l-2 border-white/20 border-b border-r border-white/5 shadow-2xl relative">
              {/* Nome do Personagem Flutuante */}
              <div className="absolute -top-5 left-6 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 rounded-full shadow-lg border border-white/20">
                <h3 className="text-xl font-bold text-white tracking-wider">{currentLine.characterRole}</h3>
              </div>
              
              <p className="text-xl sm:text-2xl text-gray-100 mt-2 leading-relaxed drop-shadow-md">
                {currentLine.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controles de Navegação */}
      <div className="bg-primary-bg border-t border-white/10 p-4 sm:p-6 flex justify-between items-center z-40 relative">
        <button
          onClick={goToPreviousLine}
          disabled={currentLineIndex === 0}
          className="py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center transition-all disabled:opacity-30 disabled:cursor-not-allowed text-secondary-text font-medium"
        >
          <FaArrowLeft className="mr-3" /> Anterior
        </button>
        
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
             {dialogue.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === currentLineIndex ? 'w-6 bg-indigo-500' : 'w-2 bg-gray-600'}`}></div>
             ))}
          </div>
        </div>

        {currentLineIndex < dialogue.length - 1 ? (
          <button
            onClick={goToNextLine}
            className="py-3 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 rounded-full flex items-center shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all transform hover:-translate-y-1 font-bold text-white"
          >
            Próximo <FaArrowRight className="ml-3" />
          </button>
        ) : (
          <button
            onClick={handleCompleteNarrative}
            className="py-3 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-full flex items-center shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1 font-bold text-white"
          >
            Continuar Jornada <FaPlay className="ml-3 text-sm" />
          </button>
        )}
      </div>
    </div>
  );
};

NarrativeTab.propTypes = {
  content: PropTypes.shape({
    step_id: PropTypes.string.isRequired,
    scenario: PropTypes.string,
    characters: PropTypes.arrayOf(
      PropTypes.shape({
        role: PropTypes.string.isRequired,
        image: PropTypes.string.isRequired
      })
    ),
    dialogue: PropTypes.arrayOf(
      PropTypes.shape({
        characterRole: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  onComplete: PropTypes.func.isRequired
};

export default NarrativeTab;