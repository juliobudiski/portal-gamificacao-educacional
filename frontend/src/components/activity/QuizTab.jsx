import React, { useState, useEffect } from 'react';
import { FaClock, FaCheckCircle } from 'react-icons/fa';
import PropTypes from 'prop-types'; // Import adicionado para validação de props
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
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
const QuizTab = ({ questions = [], onAnswerCorrect, gameElements = [] }) => { 
  // Log de inicialização do componente
  if (isDebugMode) {
    console.log('[QuizTab] Componente inicializado', {
      questionCount: questions.length,
      timedMode: gameElements.includes("Pressão de tempo")
    });
  }

  const { user } = useAuth();
  const { activityId } = useParams();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);

  // Verifica se "Pressão de tempo" está habilitado
  const isTimed = gameElements.includes("Pressão de tempo");

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

  /**
   * @function handleSubmit
   * @desc Processa resposta do usuário e fornece feedback
   * @param {string|null} answer - Resposta selecionada (null para tempo esgotado)
   * @returns {void}
   */
  const handleSubmit = async (answer) => {
    const currentQuestion = questions[currentIndex];
    
    if (isDebugMode) {
      console.log(`[QuizTab] Resposta submetida para pergunta ${currentIndex + 1}:`, {
        selected: answer,
        correct: questions[currentIndex].correct_option
      });
    }

    const isCorrect = answer === questions[currentIndex].correct_option;
    const points = isCorrect ? questions[currentIndex].points : 0;
    setFeedback({
      type: isCorrect ? 'success' : 'error',
      message: isCorrect ? `+${points} Pontos!` : 'Resposta Incorreta!'
    });
    
    if (user?.role === 'aluno') {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/activities/${activityId}/submit_answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            question_text: currentQuestion.text,
            selected_option: answer,
            is_correct: isCorrect,
            points_earned: points
          })
        });
        if (!response.ok) {
          console.error("Falha ao salvar a resposta no backend.");
        } else {
           // Chama a função onAnswerCorrect para atualizar a UI imediatamente
           if (isCorrect) onAnswerCorrect(points);
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
        setIsFinished(true);
      }
    }, 2000);
  };

  // Tela de finalização do quiz
  if (isFinished) {
    return (
      <div className="bg-gray-800 p-8 rounded-lg text-white text-center flex flex-col items-center justify-center animate-fade-in">
        <FaCheckCircle className="text-green-400 text-6xl mb-4" />
        <h2 className="text-3xl font-bold text-green-400 mb-4">Quiz Finalizado!</h2>
        <p className="text-lg text-gray-300">Parabéns por completar o desafio.</p>
        {/* TODO: Adicionar botões para "Ver resultados detalhados" */}
        {/* TODO: Implementar compartilhamento de conquistas */}
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
    setIsFinished(true);
    return null;
  }

  // Log de renderização
  if (isDebugMode) {
    console.log(`[QuizTab] Renderizando pergunta ${currentIndex + 1}/${questions.length}`);
  }

  return (
    <div className="bg-gray-800 p-8 rounded-lg text-white relative">
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

// Validação de props
QuizTab.propTypes = {
  questions: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(PropTypes.string).isRequired,
      correct_option: PropTypes.string.isRequired,
      points: PropTypes.number.isRequired,
      timeLimit: PropTypes.number
    })
  ),
  onAnswerCorrect: PropTypes.func.isRequired,
  gameElements: PropTypes.arrayOf(PropTypes.string)
};

export default QuizTab;