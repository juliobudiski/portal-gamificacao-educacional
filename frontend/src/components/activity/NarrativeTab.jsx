import React, { useState, useEffect } from 'react';
import { FaPlay, FaArrowRight, FaArrowLeft, FaHistory, FaTimes } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import useAnalytics from '../../hooks/useAnalytics';

/**
 * @component NarrativeTab
 * @description
 * Visual novel style interface for displaying story dialogue between characters over a background scenario.
 * 
 * Architectural Decisions:
 * - Data-Driven UI: Renders the scene dynamically based on the `dialogue` array prop, tracking progress via `currentLineIndex`.
 * - Analytics Integration: Calls `logEvent` (from `useAnalytics`) on every line progression to track student engagement with the narrative.
 * - Visual Focus: Uses conditional CSS filtering (brightness vs grayscale) to highlight the currently speaking character based on `characterRole`.
 */
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

const NarrativeTab = ({ content, onComplete }) => {
  const { scenario = '', characters = [], dialogue = [] } = content || {};

  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Melhoria 30: Histórico de Diálogos
  const [isAutoPlay, setIsAutoPlay] = useState(false); // Melhoria 32: Modo Auto-Play com Pausa
  const { user } = useAuth();
  const { activityId } = useParams();
  const { logEvent } = useAnalytics("narrative", user.token, activityId);

  // Narração por Voz Sintetizada (Melhoria 33: Text-to-Speech)
  const speakCurrentLine = () => {
    if (!('speechSynthesis' in window) || !currentLine?.text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentLine.text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Efeito Auto-Play (Melhoria 32: Avanço automático a cada 4 segundos)
  useEffect(() => {
    if (!isAutoPlay || isTyping) return;

    const timer = setTimeout(() => {
      if (currentLineIndex < dialogue.length - 1) {
        setCurrentLineIndex(prev => prev + 1);
      } else {
        setIsAutoPlay(false);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [isAutoPlay, isTyping, currentLineIndex, dialogue.length]);

  const currentLine = dialogue[currentLineIndex];

  // Efeito Máquina de Escrever (Melhoria 28: Typewriter Effect)
  useEffect(() => {
    if (!currentLine?.text) return;

    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    const fullText = currentLine.text;

    const timer = setInterval(() => {
      index++;
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [currentLineIndex, currentLine?.text]);

  const handleSkipTyping = () => {
    if (isTyping && currentLine?.text) {
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    }
  };

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
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-12 sm:right-12 z-30" onClick={handleSkipTyping}>
            <div className="bg-black/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl border-t-2 border-l-2 border-white/20 border-b border-r border-white/5 shadow-2xl relative cursor-pointer group/dialogue">
              {/* Nome do Personagem Flutuante */}
              <div className="absolute -top-5 left-6 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 rounded-full shadow-lg border border-white/20 flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-wider">{currentLine.characterRole}</h3>
                {isTyping && <span className="text-xs text-white/70 italic">(clique para pular)</span>}
              </div>
              
              {/* Glossário Técnico & Balão de Fala Dinâmico (Melhoria 35 e 29) */}
              <div className="text-xl sm:text-2xl text-gray-100 mt-2 leading-relaxed drop-shadow-md">
                {displayedText.split(' ').map((word, wIdx) => {
                  const cleanWord = word.replace(/[^a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ]/g, '').toLowerCase();
                  const GLOSSARY_TERMS = {
                    'solid': 'Princípios de Design Orientado a Objetos (Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion).',
                    'refatoração': 'Processo de melhorar o design interno do código sem alterar seu comportamento observável externo.',
                    'clean': 'Clean Code: Práticas de escrita legível, testável e manutenível.',
                    'scrum': 'Framework ágil iterativo e incremental para gestão de desenvolvimento de projetos.',
                    'tdd': 'Test-Driven Development: Ciclo Vermelho-Verde-Refatora onde testes são escritos antes do código.',
                    'api': 'Application Programming Interface: Contrato formal de comunicação entre sistemas.',
                    'idor': 'Insecure Direct Object References: Falha de controle de acesso a identificadores diretos.',
                    'polimorfismo': 'Capacidade de diferentes classes implementarem o mesmo método respondendo de forma distinta.'
                  };

                  if (GLOSSARY_TERMS[cleanWord]) {
                    return (
                      <span key={wIdx} className="group/glossary relative inline-block cursor-help text-accent-teal underline decoration-dotted underline-offset-4 font-semibold mr-1.5">
                        {word}
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/glossary:flex flex-col bg-slate-900 border border-accent-teal/50 text-white text-xs p-2.5 rounded-xl shadow-2xl z-50 w-56 text-left pointer-events-none animate-fadeIn font-normal">
                          <span className="text-[10px] uppercase font-bold text-accent-teal mb-0.5">Glossário Técnico</span>
                          {GLOSSARY_TERMS[cleanWord]}
                        </span>
                      </span>
                    );
                  }
                  return <span key={wIdx} className="mr-1.5">{word}</span>;
                })}
                {isTyping && <span className="inline-block w-2.5 h-6 bg-accent-teal ml-1 animate-pulse align-middle"></span>}
              </div>

              {/* Ramificações Cosméticas de Diálogo (Melhoria 31: Escolhas do Aluno) */}
              {!isTyping && currentLine?.choices && currentLine.choices.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                  <span className="text-xs uppercase tracking-wider text-accent-teal font-bold w-full mb-1">
                    Como você responde?
                  </span>
                  {currentLine.choices.map((choice, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (choice.response) {
                          setDisplayedText(choice.response);
                        }
                      }}
                      className="text-xs sm:text-sm bg-white/10 hover:bg-accent-teal/20 border border-white/20 hover:border-accent-teal px-3 py-1.5 rounded-full text-white transition-all transform hover:scale-105"
                    >
                      💬 {choice.text}
                    </button>
                  ))}
                </div>
              )}
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
        
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
             {dialogue.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === currentLineIndex ? 'w-6 bg-indigo-500' : 'w-2 bg-gray-600'}`}></div>
             ))}
          </div>

          {/* Botão de Histórico (Melhoria 30: Histórico de Diálogos) */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-full text-secondary-text hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Ver histórico de falas"
          >
            <FaHistory /> <span className="hidden sm:inline">Histórico</span>
          </button>

          {/* Botão Auto-Play (Melhoria 32) */}
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`p-2.5 border rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isAutoPlay
                ? 'bg-accent-teal/30 border-accent-teal text-accent-teal'
                : 'bg-white/5 hover:bg-white/15 border-white/10 text-secondary-text hover:text-white'
            }`}
            title="Avanço automático a cada 4 segundos"
          >
            <span>{isAutoPlay ? '⏸️ Pausar' : '▶️ Auto'}</span>
          </button>

          {/* Botão Text-to-Speech (Melhoria 33: Narração por Voz) */}
          <button
            onClick={speakCurrentLine}
            className="p-2.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-full text-secondary-text hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Ouvir leitura em voz alta"
          >
            <span>🔊 Ouvir</span>
          </button>
        </div>

        {/* Modal / Gaveta de Histórico de Diálogos */}
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-secondary-bg border border-accent-teal/40 rounded-3xl p-6 max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center border-b border-border-color pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <FaHistory className="text-accent-teal" />
                  <h3 className="font-bold text-lg text-primary-text">Histórico da Narrativa</h3>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-secondary-text hover:text-primary-text p-1.5 rounded-lg hover:bg-white/10"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {dialogue.slice(0, currentLineIndex + 1).map((line, idx) => (
                  <div key={idx} className="bg-primary-bg/70 p-3.5 rounded-2xl border border-border-color/60">
                    <span className="text-xs font-extrabold text-accent-purple uppercase tracking-wider block mb-1">
                      {line.characterRole}
                    </span>
                    <p className="text-sm text-primary-text leading-relaxed">
                      {line.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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