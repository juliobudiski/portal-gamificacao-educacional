import React, { useState, useEffect, useRef } from 'react';
import { FaClock, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import PropTypes from 'prop-types'; // Import adicionado para validação de props
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import backgroundImage from '../../assets/quiz-background.png';
import useAnalytics from '../../hooks/useAnalytics';
// Verifica se o modo debug está ativado
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

/**
 * @component QuizTab
 * @desc Componente para exibição de quizzes com temporizador e feedback imediato.
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.questions - Lista de perguntas do quiz
 * @param {Function} props.onAnswerCorrect - Callback para respostas corretas
 * @param {Array} props.gameElements - Elementos de jogo ativos
 * @returns {JSX.Element} Interface de quiz interativo
 */
const QuizTab = ({ content, onAnswerCorrect, onComplete, isReplay }) => {

  // Acessa as perguntas e elementos de dentro do objeto 'content'
  const { questions = [], step_id } = content; // Pega 'questions' e o 'step_id' do nível superior
  const gameElements = content.gameElements || []; // Pode ser útil se precisar no futuro

  // Log de inicialização do componente
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

  //  Refs para métricas de interação (hesitação, abandono)
  const firstClickTimestamp = useRef(null);
  const questionStartTime = useRef(null);

  // Verifica se "Pressão de tempo" está habilitado
  const isTimed = gameElements.includes("Pressão de tempo");

  const handleFinishQuiz = () => {
    setIsFinished(true);
    // Esta função agora vai funcionar, pois 'content.step_id' existirá.
    console.log(`[QuizTab] Quiz finalizado. Chamando onComplete com o step_id: ${content.step_id}`);
    onComplete(content.step_id);
  };




  /**
   * @function handleSubmit
   * @desc Processa resposta do usuário e fornece feedback
   * @param {string|null} answer - Resposta selecionada (null para tempo esgotado)
   * @returns {void}
   */
  const handleSubmit = async (answer) => {
    const currentQuestion = questions[currentIndex];
    const submitTimestamp = Date.now();
    if (isDebugMode) {
      console.log(`[QuizTab] Resposta submetida para pergunta ${currentIndex + 1}:`, {
        selected: answer,
        correct: questions[currentIndex].correct_option
      });
    }
    console.log('%c[DEBUG 2] Dentro de handleSubmit. Valor de `content`:', 'color: orange;', content);

    //  Logar o evento de submissão da resposta com o tempo de hesitação
    const hesitationTime = firstClickTimestamp.current
      ? (submitTimestamp - firstClickTimestamp.current) / 1000
      : (submitTimestamp - questionStartTime.current) / 1000; // Tempo total se não houve clique

    logEvent("quiz_answer_submit", {
      question_id: currentIndex, // ou um ID único da pergunta se tiver
      question_text: currentQuestion.text,
      selected_option: answer,
      is_correct: answer === currentQuestion.correct_option,
      hesitation_time: hesitationTime
    });

    const isCorrect = answer === questions[currentIndex].correct_option;
    const points = isCorrect ? questions[currentIndex].points : 0;
    const coins = isCorrect ? questions[currentIndex].coins : 0;

    const feedbackMessage = isCorrect
      ? (isReplay ? 'Resposta Correta!' : `+${points} Pontos!`)
      : 'Resposta Incorreta!';

    setFeedback({
      type: isCorrect ? 'success' : 'error',
      message: feedbackMessage
    });


    if (user?.role === 'aluno') {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}/submit_answer`, {
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
        if (!response.ok) {
          console.error("Falha ao salvar a resposta no backend.");
        } else {
          // Chama a função onAnswerCorrect para atualizar a UI imediatamente
          if (isCorrect && !isReplay) {
            onAnswerCorrect(points);
          }
        }
      } catch (error) {
        console.error("Erro de rede ao salvar resposta:", error);
      }
    }

    // Log de feedback
    if (isDebugMode) {
      console.log(`[QuizTab] Feedback: ${feedback.message}`);
    }

    setTimeout(() => {
      setFeedback({ type: '', message: '' });
      setSelectedAnswer(null);

      // Lógica de transição para próxima pergunta ou finalização
      if (currentIndex < questions.length - 1) {
        if (isDebugMode) {
          console.log(`[QuizTab] Avançando para pergunta ${currentIndex + 2}/${questions.length}`);
        }
        setCurrentIndex(prev => prev + 1);
      } else {
        if (isDebugMode) {
          console.log('[QuizTab] Quiz finalizado. Exibindo tela de conclusão');
        }
        logEvent("quiz_complete", {
          total_questions: questions.length
        });
        handleFinishQuiz();
      }
    }, 2000);
  };

  /**
   * Efeito para controle do temporizador
   * TODO: Extrair lógica do timer para um custom hook reutilizável
   */
  useEffect(() => {
    if (isDebugMode) {
      console.log(`[QuizTab] useEffect timer ativado | currentIndex: ${currentIndex} | isTimed: ${isTimed}`);
    }

    // O timer só será ativado se 'isTimed' for verdadeiro
    if (isFinished || !questions || !questions[currentIndex] || !isTimed) {
      // Log de condições que impedem o timer
      if (isDebugMode && isTimed) {
        console.log('[QuizTab] Timer não iniciado:', {
          isFinished,
          hasQuestion: !!questions[currentIndex]
        });
      }
      return;
    }

    // Configura tempo limite específico da pergunta ou padrão
    const timeLimit = questions[currentIndex].timeLimit || 30;
    setTimeLeft(timeLimit);

    if (isDebugMode) {
      console.log(`[QuizTab] Iniciando timer: ${timeLimit}s para pergunta ${currentIndex + 1}`);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);

          // Log de tempo esgotado
          if (isDebugMode) {
            console.log(`[QuizTab] Tempo esgotado na pergunta ${currentIndex + 1}`);
          }

          handleSubmit(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (isDebugMode) {
        console.log(`[QuizTab] Timer limpo para pergunta ${currentIndex + 1}`);
      }
    };
  }, [currentIndex, questions, isFinished, isTimed]);

  // 4. Efeito para registrar o início da questão e a taxa de abandono
  useEffect(() => {
    // Marca o tempo em que a pergunta atual foi exibida
    questionStartTime.current = Date.now();
    firstClickTimestamp.current = null; // Reseta o timestamp de clique

    // Função de limpeza (cleanup) que será executada quando o componente for desmontado
    return () => {
      // Se o componente for desmontado antes de o quiz terminar, registra o abandono
      if (!isFinished) {
        logEvent("quiz_abandon", {
          question_index: currentIndex,
          time_spent_on_question: (Date.now() - questionStartTime.current) / 1000
        });
      }
    };
  }, [currentIndex, isFinished, logEvent]);

  // Tela de finalização do quiz
  if (isFinished) {
    return (
      <div className="bg-gray-800 p-8 rounded-lg text-white text-center">
        <FaCheckCircle className="text-green-400 text-6xl mb-4" />
        <h2 className="text-3xl font-bold text-green-400 mb-4">Quiz Finalizado!</h2>
        <p className="text-lg text-gray-300">Retornando ao tabuleiro...</p>
        {/* O retorno agora é automático, mas poderia ter um botão se quisesse */}
      </div>
    );
  }

  // Fallback para quando não há perguntas
  if (!questions || questions.length === 0) {
    if (isDebugMode) {
      console.warn('[QuizTab] Nenhuma pergunta disponível');
    }
    return <div className="text-center text-gray-400 p-8">Nenhum quiz disponível para esta atividade.</div>;
  }

  const currentQuestion = questions[currentIndex];

  // Proteção adicional para perguntas indefinidas
  if (!currentQuestion) {
    const errorMsg = "Tentativa de renderizar pergunta indefinida";
    if (isDebugMode) {
      console.error(`[QuizTab] ${errorMsg} | Index: ${currentIndex}`);
    }
    handleFinishQuiz();
    return null;
  }

  // Log de renderização
  if (isDebugMode) {
    console.log(`[QuizTab] Renderizando pergunta ${currentIndex + 1}/${questions.length}`);
  }

  return (
    <div className="bg-gray-800 p-8 rounded-lg text-white relative"
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
      {/* Pop-up de feedback visual */}
      {feedback.message && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 p-4 rounded-b-lg text-xl font-bold animate-bounce ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {feedback.message}
        </div>
      )}

      {/* Temporizador (apenas quando ativo) */}
      {isTimed && currentQuestion.timeLimit && (
        <div className="absolute top-4 right-4 text-2xl font-bold flex items-center">
          <FaClock className="mr-2" /> {timeLeft}s
        </div>
      )}

      <h3 className="text-2xl mb-6">Pergunta {currentIndex + 1}/{questions.length}</h3>
      <p className="text-xl mb-8">{currentQuestion.text}</p>

      {/* Grid de opções de resposta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQuestion.options.map(option => (
          <button
            key={option}
            onClick={() => {
              // 7. Captura o timestamp do primeiro clique em uma opção
              if (!firstClickTimestamp.current) {
                firstClickTimestamp.current = Date.now();
              }

              setSelectedAnswer(option);
              if (isDebugMode) {
                console.log(`[QuizTab] Opção selecionada: ${option}`);
              }
            }}
            className={`p-4 rounded-lg text-left text-lg transition-all ${selectedAnswer === option ? 'bg-yellow-500 ring-4 ring-yellow-300' : 'bg-gray-700 hover:bg-gray-600'}`}>
            {option}
          </button>
        ))}
      </div>

      <button
        onClick={() => handleSubmit(selectedAnswer)}
        disabled={!selectedAnswer}
        className="mt-8 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-bold disabled:bg-gray-500 disabled:cursor-not-allowed">
        Confirmar Resposta
      </button>
    </div>
  );
};

// Validação de props ATUALIZADA
QuizTab.propTypes = {
  content: PropTypes.shape({
    step_id: PropTypes.string.isRequired, // O ID do passo que está sendo executado
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
  onAnswerCorrect: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired
};


export default QuizTab;