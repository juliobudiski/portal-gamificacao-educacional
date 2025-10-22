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
    <div className="bg-primary-bg p-4 sm:p-8 rounded-lg text-primary-text animate-fade-in">
      <div
        className="relative w-full h-96 bg-cover bg-center rounded-lg mb-4 border-4 border-border-color shadow-lg"
        style={{ backgroundImage: `url(${scenario})` }}
      >
        {characters.map((char, index) => (
          <img
            key={index}
            src={char.image}
            alt={char.role}
            className={`absolute bottom-0 h-4/5 object-contain transition-all duration-300 ${currentCharacter?.image === char.image ? 'opacity-100 scale-110' : 'opacity-50 scale-100'}`}
            style={{ left: `${10 + index * 25}%` }}
          />
        ))}
      </div>
      {currentLine && (
        <div className="bg-primary-bg/80 backdrop-blur-sm p-4 rounded-lg border border-gray-600 min-h-[120px]">
          <h3 className="text-xl font-bold text-yellow-400 mb-2">{currentLine.characterRole}</h3>
          <p className="text-lg text-secondary-text">{currentLine.text}</p>
        </div>
      )}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={goToPreviousLine}
          disabled={currentLineIndex === 0}
          className="py-2 px-4 bg-border-color hover:bg-hover-bg-color rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaArrowLeft className="mr-2" /> Anterior
        </button>
        <span className="text-secondary-text">{currentLineIndex + 1} / {dialogue.length}</span>
        {currentLineIndex < dialogue.length - 1 ? (
          <button
            onClick={goToNextLine}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center"
          >
            Próximo <FaArrowRight className="ml-2" />
          </button>
        ) : (
          <button
            onClick={handleCompleteNarrative}
            className="py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg flex items-center font-bold"
          >
            Continuar Jornada! <FaPlay className="ml-2" />
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