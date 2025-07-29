import React, { useState, useEffect } from 'react';
import { FaClock, FaCheckCircle } from 'react-icons/fa';

const QuizTab = ({ questions = [], onAnswerCorrect }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [timeLeft, setTimeLeft] = useState(30);
    const [isFinished, setIsFinished] = useState(false); // NOVO: Estado para controlar o fim do quiz

    useEffect(() => {
        // Adiciona uma "guarda" para não iniciar o timer se o quiz acabou ou a pergunta não existe
        if (isFinished || !questions || !questions[currentIndex]) {
            return;
        }

        setTimeLeft(questions[currentIndex].timeLimit || 30);
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(null); // Considera resposta errada se o tempo acabar
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [currentIndex, questions, isFinished]); // Adiciona isFinished como dependência

    const handleSubmit = (answer) => {
        const isCorrect = answer === questions[currentIndex].correct_option;
        const points = isCorrect ? questions[currentIndex].points : 0;
        setFeedback({
            type: isCorrect ? 'success' : 'error',
            message: isCorrect ? `+${points} Pontos!` : 'Resposta Incorreta!'
        });
        
        if (isCorrect) onAnswerCorrect(points);

        setTimeout(() => {
            setFeedback({ type: '', message: '' });
            setSelectedAnswer(null);
            // Lógica de transição corrigida
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setIsFinished(true); // NOVO: Em vez de um alert, atualiza o estado
            }
        }, 2000);
    };

    // NOVO: Renderiza uma tela de finalização
    if (isFinished) {
        return (
            <div className="bg-gray-800 p-8 rounded-lg text-white text-center flex flex-col items-center justify-center animate-fade-in">
                <FaCheckCircle className="text-green-400 text-6xl mb-4" />
                <h2 className="text-3xl font-bold text-green-400 mb-4">Quiz Finalizado!</h2>
                <p className="text-lg text-gray-300">Parabéns por completar o desafio.</p>
                {/* Futuramente, você pode adicionar botões para "Ver resultados" ou "Voltar" */}
            </div>
        );
    }
    
    // Proteção adicional para caso as perguntas não carreguem corretamente
    if (!questions || questions.length === 0) {
        return <div className="text-center text-gray-400 p-8">Nenhum quiz disponível para esta atividade.</div>;
    }

    const currentQuestion = questions[currentIndex];
    
    // Adiciona uma verificação final para evitar o erro caso algo dê muito errado
    if (!currentQuestion) {
        console.error("Tentativa de renderizar uma pergunta indefinida. Finalizando o quiz.");
        setIsFinished(true);
        return null;
    }

    return (
        <div className="bg-gray-800 p-8 rounded-lg text-white relative">
            {/* Feedback Pop-up */}
            {feedback.message && (
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 p-4 rounded-b-lg text-xl font-bold animate-bounce ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {feedback.message}
                </div>
            )}
            {/* Timer */}
            {currentQuestion.timeLimit && (
                <div className="absolute top-4 right-4 text-2xl font-bold flex items-center">
                    <FaClock className="mr-2" /> {timeLeft}s
                </div>
            )}
            <h3 className="text-2xl mb-6">Pergunta {currentIndex + 1}/{questions.length}</h3>
            <p className="text-xl mb-8">{currentQuestion.text}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map(option => (
                    <button key={option} onClick={() => setSelectedAnswer(option)}
                        className={`p-4 rounded-lg text-left text-lg transition-all ${selectedAnswer === option ? 'bg-yellow-500 ring-4 ring-yellow-300' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        {option}
                    </button>
                ))}
            </div>
            <button onClick={() => handleSubmit(selectedAnswer)} disabled={!selectedAnswer}
                className="mt-8 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-bold disabled:bg-gray-500 disabled:cursor-not-allowed">
                Confirmar Resposta
            </button>
        </div>
    );
};

export default QuizTab;