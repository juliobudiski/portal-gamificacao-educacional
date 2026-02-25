import React, { useState, useEffect, useRef } from 'react';
import { FaClock, FaCheckCircle } from 'react-icons/fa'; // Removi FaArrowLeft não usado no render
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import backgroundImage from '../../assets/quiz-background.webp';
import useAnalytics from '../../hooks/useAnalytics';
import { useActivity } from '../../context/ActivityContext';

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
        await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}/submit_answer`, {
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
      <div className="bg-primary-bg p-8 rounded-lg text-primary-text text-center">
        <FaCheckCircle className="text-green-400 text-6xl mb-4" />
        <h2 className="text-3xl font-bold text-green-400 mb-4">Quiz Finalizado!</h2>
        <p className="text-lg text-secondary-text">Retornando ao tabuleiro...</p>
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
    <div className="bg-primary-bg p-8 rounded-lg text-primary-text relative"
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
      }}>

      {isReplay && (
        <div className="mb-4 p-3 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 text-center">
          <p><strong>Modo de Revisão:</strong> As recompensas para este desafio já foram coletadas.</p>
        </div>
      )}

      {feedback.message && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 p-4 rounded-b-lg text-xl font-bold animate-bounce ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {feedback.message}
        </div>
      )}

      {isTimed && currentQuestion.timeLimit && (
        <div className="absolute top-4 right-4 text-2xl font-bold flex items-center">
          <FaClock className="mr-2" /> {timeLeft}s
        </div>
      )}

      <h3 className="text-2xl mb-6">Pergunta {currentIndex + 1}/{questions.length}</h3>
      <p className="text-xl mb-8">{currentQuestion.text}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQuestion.options.map(option => (
          <button
            key={option}
            // [5] Bloqueia seleção de novas opções durante o processamento
            disabled={isSubmitting}
            onClick={() => {
              if (!firstClickTimestamp.current) firstClickTimestamp.current = Date.now();
              setSelectedAnswer(option);
            }}
            className={`p-4 rounded-lg text-left text-lg transition-all 
              ${selectedAnswer === option ? 'bg-yellow-500 ring-4 ring-yellow-300' : 'bg-border-color hover:bg-hover-bg-color'}
              ${isSubmitting ? 'cursor-not-allowed opacity-80' : ''} 
            `}>
            {option}
          </button>
        ))}
      </div>

      <button
        onClick={() => handleSubmit(selectedAnswer)}
        // [6] PROTEÇÃO DO BOTÃO: Desabilitado se sem resposta OU processando
        disabled={!selectedAnswer || isSubmitting}
        className="mt-8 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-bold disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
        {/* [7] Feedback textual */}
        {isSubmitting ? 'Processando...' : 'Confirmar Resposta'}
      </button>
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