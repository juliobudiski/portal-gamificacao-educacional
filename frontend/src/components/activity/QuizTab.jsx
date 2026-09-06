import React, { useState, useEffect, useRef } from 'react';
import { FaClock, FaCheckCircle, FaTimes, FaMedal } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import backgroundImage from '../../assets/quiz-background.webp';
import useAnalytics from '../../hooks/useAnalytics';
import { useActivity } from '../../context/ActivityContext';

/**
 * @component QuizTab
 * @description
 * Interactive multiple-choice quiz interface with anti-spam protection, timer logic, and analytics tracking.
 * 
 * Architectural Decisions:
 * - Anti-Spam State: Uses `isSubmitting` state to block UI interactions and timer countdowns while waiting for API response/visual feedback.
 * - Time-Hesitation Tracking: Uses `useRef` to calculate how long a student hesitates before answering, sending this to the analytics hook.
 * - Role-Based API Calls: Conditionally executes the backend call only if the user is a student, preventing teachers from affecting stats.
 */
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

const QuizTab = ({ content, gameElements, onAnswerCorrect, onComplete, isReplay }) => {
  const { questions = [], step_id } = content;

  if (isDebugMode) {
    console.log('[QuizTab] Componente inicializado', {
      questionCount: questions.length,
      timedMode: gameElements.includes("Pressão de tempo")
    });
  }

  const { user } = useAuth();
  const { showToast } = useToast();
  const { activityId } = useParams();
  const { logEvent } = useAnalytics("quiz", user.token, activityId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);

  // [1] NOVO ESTADO: Proteção contra múltiplos cliques
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firstClickTimestamp = useRef(null);
  const questionStartTime = useRef(null);
  const isTimed = gameElements.includes("Pressão de tempo");
  const { updateUserProgress } = useActivity();

  const handleFinishQuiz = () => {
    setIsFinished(true);
    console.log(`[QuizTab] Quiz finalizado. Step ID: ${step_id}`);
    onComplete(step_id);
  };

  const handleSubmit = async (answer) => {
    // [2] PROTEÇÃO: Se já estiver submetendo, ignora novos cliques
    if (isSubmitting) return;

    // Bloqueia interações imediatamente
    setIsSubmitting(true);

    const currentQuestion = questions[currentIndex];
    const submitTimestamp = Date.now();

    // Lógica de tempo de hesitação
    const hesitationTime = firstClickTimestamp.current
      ? (submitTimestamp - firstClickTimestamp.current) / 1000
      : (submitTimestamp - questionStartTime.current) / 1000;

    logEvent("quiz_answer_submit", {
      question_id: currentIndex,
      question_text: currentQuestion.text,
      selected_option: answer,
      is_correct: answer === currentQuestion.correct_option,
      hesitation_time: hesitationTime
    });

    const isCorrect = answer === currentQuestion.correct_option;
    const points = isCorrect ? questions[currentIndex].points : 0;
    const coins = isCorrect ? questions[currentIndex].coins : 0;

    // CORREÇÃO AQUI: Só tenta atualizar os pontos no backend se for um ALUNO
    if (isCorrect && user?.role === 'aluno') {
      try {
        await updateUserProgress(points, coins);
      } catch (err) {
        console.error("Erro ao atualizar progresso do aluno:", err);
      }
    }

    const feedbackMessage = isCorrect
      ? (isReplay ? 'Resposta Correta!' : `+${points} Pontos!`)
      : 'Resposta Incorreta!';

    setFeedback({
      type: isCorrect ? 'success' : 'error',
      message: feedbackMessage
    });

    // O restante do salvamento detalhado da resposta já estava protegido
    if (user?.role === 'aluno') {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}/submit_answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            question_text: currentQuestion.text,
            selected_option: answer,
            is_correct: isCorrect,
            points_earned: points,
            coins_earned: coins
          })
        });

        if (res.ok) {
            const data = await res.json();
            if (data.new_medals && data.new_medals.length > 0) {
                data.new_medals.forEach(medal => {
                    showToast(`🏅 Nova Medalha Desbloqueada: ${medal.name || medal}`, 'success');
                });
            }
        }

        if (isCorrect && !isReplay) {
          onAnswerCorrect(points);
        }
      } catch (error) {
        console.error("Erro ao salvar resposta detalhada:", error);
      }
    }

    // Delay para feedback visual
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
      setSelectedAnswer(null);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        // [3] LIBERAÇÃO: Só destrava quando a próxima pergunta estiver pronta
        setIsSubmitting(false);
      } else {
        logEvent("quiz_complete", { total_questions: questions.length });
        handleFinishQuiz();
        // Não destravamos isSubmitting aqui para evitar cliques durante o unmount
      }
    }, 2000);
  };

  // Timer Effect
  useEffect(() => {
    // [4] PROTEÇÃO DO TIMER: O timer para se estivermos submetendo (feedback visível)
    if (isFinished || !questions[currentIndex] || !isTimed || isSubmitting) {
      return;
    }

    // Reseta o timer apenas se não estiver submetendo
    // Nota: A lógica original usava timeLimit ou 30 fixo.
    // Se isSubmitting mudar para false (nova questão), o efeito roda e reinicia o timer.
    const timeLimit = questions[currentIndex].timeLimit || 30;
    // Só reseta o timeLeft se estivermos começando a questão (para evitar reset ao re-renderizar por outros motivos)
    // Mas como currentIndex muda, isso é seguro.
    setTimeLeft(timeLimit);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(null); // Tempo esgotado
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, isFinished, isTimed, isSubmitting]); // Adicionado isSubmitting

  // Analytics Effect
  useEffect(() => {
    questionStartTime.current = Date.now();
    firstClickTimestamp.current = null;
    return () => {
      if (!isFinished) {
        // Opcional: só logar abandono se não estiver submetendo
      }
    };
  }, [currentIndex, isFinished]);

  if (isFinished) {
    return (
      <div className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10 min-h-[600px] flex flex-col items-center justify-center p-6 relative transition-all"
        style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
        <div className="relative z-10 flex flex-col items-center bg-black/40 p-10 rounded-3xl border border-green-500/30 shadow-[0_0_40px_rgba(74,222,128,0.2)]">
          <FaCheckCircle className="text-green-400 text-7xl mb-6 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)] animate-bounce" />
          <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Desafio Concluído!</h2>
          <p className="text-xl text-green-200 font-medium">Preparando próxima etapa...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return <div className="text-center text-secondary-text p-8">Nenhum quiz disponível.</div>;
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) {
    handleFinishQuiz();
    return null;
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10 min-h-[600px] flex flex-col p-6 sm:p-10 transition-all text-white"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
      
      {/* Overlay Glassmorphism */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>

      <div className="relative z-10 w-full h-full flex flex-col">
        {isReplay && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-500/20 text-blue-100 border border-blue-400/30 text-center backdrop-blur-sm flex items-center justify-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <p className="font-medium"><strong>Modo de Revisão:</strong> As recompensas para este desafio já foram coletadas.</p>
          </div>
        )}

        {/* Modal de Feedback (Sucesso/Erro) */}
        {feedback.message && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn`}>
             <div className={`p-8 rounded-3xl shadow-2xl transform scale-110 flex flex-col items-center gap-4 border-2 transition-all duration-300
                ${feedback.type === 'success' ? 'bg-green-900/90 border-green-400 shadow-[0_0_60px_rgba(74,222,128,0.4)]' : 'bg-red-900/90 border-red-400 shadow-[0_0_60px_rgba(248,113,113,0.4)]'}`}>
                {feedback.type === 'success' ? <FaCheckCircle className="text-7xl text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]" /> : <FaTimes className="text-7xl text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.8)]" />}
                <h2 className={`text-4xl font-bold text-white drop-shadow-lg text-center`}>{feedback.message}</h2>
             </div>
          </div>
        )}

        {/* Top Header */}
        <div className="flex justify-between items-center w-full mb-8">
          <div className="bg-black/40 px-6 py-3 rounded-full border border-white/10 flex flex-col items-center shadow-inner">
             <span className="text-cyan-400 font-bold tracking-wider text-xs uppercase mb-1">Progresso</span>
             <span className="text-xl sm:text-2xl font-bold text-white tracking-widest">{currentIndex + 1} <span className="text-secondary-text text-lg">/ {questions.length}</span></span>
          </div>
          
          {isTimed && currentQuestion.timeLimit && (
            <div className={`px-6 py-3 rounded-full border flex items-center gap-3 text-2xl font-bold shadow-lg transition-colors duration-500
               ${timeLeft <= 10 ? 'bg-red-500/80 border-red-400 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-black/40 border-white/10 text-yellow-400'}`}>
              <FaClock className={timeLeft <= 10 ? "animate-bounce" : ""} /> 
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>

        {/* Pergunta */}
        <div className="bg-black/30 p-6 sm:p-10 rounded-3xl border border-white/10 mb-8 backdrop-blur-sm shadow-inner relative overflow-hidden">
          {/* Efeito de luz sutil no fundo */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-[50px]"></div>
          <p className="text-2xl sm:text-3xl text-white font-medium leading-relaxed text-center drop-shadow-md relative z-10">
            {currentQuestion.text}
          </p>
        </div>

        {/* Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow content-start">
          {currentQuestion.options.map(option => (
            <button
              key={option}
              disabled={isSubmitting}
              onClick={() => {
                if (!firstClickTimestamp.current) firstClickTimestamp.current = Date.now();
                setSelectedAnswer(option);
              }}
              className={`p-5 rounded-2xl text-left text-lg font-semibold transition-all duration-300 transform outline-none
                ${selectedAnswer === option 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-[1.02] border-transparent text-white' 
                  : 'bg-white/10 hover:bg-white/20 border border-white/20 hover:scale-[1.01] hover:shadow-lg text-gray-100'}
                ${isSubmitting ? 'cursor-not-allowed opacity-70 scale-100' : ''} 
              `}>
              {option}
            </button>
          ))}
        </div>

        {/* Botão Confirmar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-center">
          <button
            onClick={() => handleSubmit(selectedAnswer)}
            disabled={!selectedAnswer || isSubmitting}
            className="w-full md:w-auto md:min-w-[350px] py-4 px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-full text-xl font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] disabled:from-gray-700 disabled:to-gray-800 disabled:shadow-none disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 disabled:translate-y-0 text-white flex justify-center items-center gap-3">
            {isSubmitting ? (
              <><div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> Processando...</>
            ) : 'Confirmar Resposta'}
          </button>
        </div>
      </div>
    </div>
  );
};

QuizTab.propTypes = {
  content: PropTypes.shape({
    step_id: PropTypes.string.isRequired,
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string.isRequired,
        options: PropTypes.arrayOf(PropTypes.string).isRequired,
        correct_option: PropTypes.string.isRequired,
        points: PropTypes.number.isRequired,
        coins: PropTypes.number,
        timeLimit: PropTypes.number
      })
    ),
    gameElements: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  gameElements: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAnswerCorrect: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  isReplay: PropTypes.bool
};

export default QuizTab;