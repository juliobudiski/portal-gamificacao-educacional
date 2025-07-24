// backup/src/pages/ActivityPage.jsx

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    FaGamepad, FaClock, FaGem, FaLevelUpAlt, FaTrophy, FaChartBar, FaUserGraduate, 
    FaChalkboardTeacher, FaUsers, FaStar, FaShieldAlt, FaStore, FaComments, FaPaperPlane,
    FaCrown, FaShoppingCart, FaPlusCircle
} from 'react-icons/fa';


// --- Componentes Modulares da Página ---

// ===================================================================
// GRUPO 1: PROGRESSÃO E FEEDBACK (Sidebars e Modais)
// ===================================================================

const StudentSidebar = ({ progress, onShowStats }) => {
    if (!progress) return <div className="p-4 text-gray-400">Carregando progresso...</div>;
    const xpPercentage = progress.xpForNextLevel > 0 ? (progress.xp / progress.xpForNextLevel) * 100 : 0;
    return (
        <div className="p-4 bg-gray-900 rounded-lg space-y-6 sticky top-4">
            <div>
                <h4 className="text-lg font-bold text-yellow-400 flex items-center"><FaGem className="mr-2" /> Pontuação</h4>
                <p className="text-4xl font-bold text-white">{progress.points} Pontos</p>
            </div>
            <div>
                <h4 className="text-lg font-bold text-green-400 flex items-center"><FaLevelUpAlt className="mr-2" /> Nível</h4>
                <p className="text-2xl font-bold text-white">Nível {progress.level}</p>
                <div className="w-full bg-gray-700 rounded-full h-4 mt-2"><div className="bg-green-500 h-4 rounded-full" style={{ width: `${xpPercentage}%` }}></div></div>
                <p className="text-sm text-gray-400 mt-1 text-right">{progress.xp} / {progress.xpForNextLevel} XP</p>
            </div>
            <button onClick={onShowStats} className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg">Ver Estatísticas</button>
        </div>
    );
};

const ProfessorSidebar = ({ analytics, onStudentClick, onOpenQuizEditor }) => (
    <div className="p-4 bg-gray-900 rounded-lg space-y-6 sticky top-4">
        <div>
            <h4 className="text-lg font-bold text-blue-400 flex items-center"><FaChartBar className="mr-2" /> Analytics da Turma</h4>
            <p className="text-white">Taxa de Conclusão: <span className="font-bold">{analytics.completionRate}%</span></p>
            <p className="text-white">Pontuação Média: <span className="font-bold">{analytics.averageScore}</span></p>
        </div>
        <div>
            <h4 className="text-lg font-bold text-green-400 flex items-center"><FaUsers className="mr-2" /> Alunos</h4>
            <ul className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {analytics.students.map(student => (
                    <li key={student.id} onClick={() => onStudentClick(student)} className="flex justify-between items-center p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                        <span className="text-white">{student.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${student.status === 'Concluído' ? 'bg-green-500' : student.status === 'Em Andamento' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                            {student.status}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
        <button onClick={onOpenQuizEditor} className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center">
            <FaPlusCircle className="mr-2" /> Gerenciar Quiz
        </button>
    </div>
);

const StatsModal = ({ stats, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-4">Minhas Estatísticas</h3>
            <p>Perguntas Corretas: {stats.correctAnswers}/{stats.totalQuestions}</p>
            <p>Tempo Médio: {stats.averageTime}s / pergunta</p>
            <p>Conquistas Desbloqueadas: {stats.achievements}</p>
            <button onClick={onClose} className="mt-6 w-full py-2 bg-blue-600 rounded-lg">Fechar</button>
        </div>
    </div>
);


// ===================================================================
// GRUPO 2: NARRATIVA E IMERSÃO
// ===================================================================

const NarrativeTab = ({ title, content, objective, onStart }) => (
    <div className="bg-gray-800 p-8 rounded-lg text-white animate-fade-in">
        <h2 className="text-4xl font-bold text-yellow-400 mb-4">{title}</h2>
        <p className="text-lg leading-relaxed mb-6">{content}</p>
        <div className="p-4 border-l-4 border-green-500 bg-gray-700 rounded-r-lg">
            <h3 className="text-xl font-bold text-green-400 flex items-center"><FaGamepad className="mr-2" /> Sua Missão</h3>
            <p className="text-lg mt-2">{objective}</p>
        </div>
        <button onClick={onStart} className="mt-8 w-full py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-bold flex items-center justify-center">
            Iniciar Desafio!
        </button>
    </div>
);

// ===================================================================
// GRUPO 3: DESAFIOS E MECÂNICAS INTERATIVAS
// ===================================================================

const QuizTab = ({ questions = [], onAnswerCorrect }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 30);

    useEffect(() => {
        if (questions.length > 0 && questions[currentIndex]?.timeLimit) {
            setTimeLeft(questions[currentIndex].timeLimit);
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmit(null);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [currentIndex, questions]);

    if (!questions || questions.length === 0) {
        return <div className="text-center text-gray-400 p-8">Nenhum quiz disponível para esta atividade.</div>;
    }

    const currentQuestion = questions[currentIndex];

    const handleSubmit = (answer) => {
        const isCorrect = answer === currentQuestion.correct_option;
        const points = isCorrect ? currentQuestion.points : 0;
        setFeedback({
            type: isCorrect ? 'success' : 'error',
            message: isCorrect ? `+${points} Pontos!` : 'Resposta Incorreta!'
        });
        
        if (isCorrect) onAnswerCorrect(points);

        setTimeout(() => {
            setFeedback({ type: '', message: '' });
            setSelectedAnswer(null);
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                alert("Quiz finalizado!");
            }
        }, 2000);
    };

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

// ===================================================================
// GRUPO 4: INTERAÇÃO SOCIAL E COMPETIÇÃO
// ===================================================================

const LeaderboardTab = ({ leaderboardData }) => (
    <div className="bg-gray-800 p-8 rounded-lg text-white">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Ranking da Atividade</h2>
        <div className="space-y-4">
            {leaderboardData.map(player => (
                <div key={player.rank} className={`p-4 rounded-lg flex items-center justify-between border-2 ${player.name.includes('(Você)') ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent bg-gray-700'}`}>
                    <div className="flex items-center">
                        <span className="text-2xl font-bold w-10">{player.rank === 1 ? <FaCrown className="text-yellow-400" /> : player.rank}</span>
                        <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full mx-4" />
                        <span className="font-semibold text-lg">{player.name}</span>
                    </div>
                    <span className="font-bold text-xl text-yellow-400">{player.points} Pontos</span>
                </div>
            ))}
        </div>
    </div>
);

const ChatTab = () => {
    const [messages, setMessages] = useState([
        { id: 1, user: 'Alice', text: 'Alguém na questão 2? Achei difícil!' },
        { id: 2, user: 'Beto', text: 'Também! A dica é pensar em herança.' }
    ]);
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            setMessages([...messages, { id: Date.now(), user: 'Você', text: newMessage }]);
            setNewMessage('');
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg text-white flex flex-col h-96">
            <h2 className="text-2xl font-bold text-teal-400 mb-4">Chat da Atividade</h2>
            <div className="flex-grow bg-gray-900 p-4 rounded-lg overflow-y-auto mb-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`p-2 rounded-lg ${msg.user === 'Você' ? 'bg-blue-600 self-end' : 'bg-gray-700 self-start'}`}>
                        <span className="font-bold text-sm">{msg.user}: </span>
                        <span>{msg.text}</span>
                    </div>
                ))}
            </div>
            <div className="flex">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-grow bg-gray-700 p-2 rounded-l-lg focus:outline-none" />
                <button onClick={handleSendMessage} className="bg-teal-600 p-2 rounded-r-lg"><FaPaperPlane /></button>
            </div>
        </div>
    );
};

// ===================================================================
// GRUPO 5: RECOMPENSAS E ECONOMIA
// ===================================================================

const StoreTab = ({ items, userPoints, onPurchase }) => (
    <div className="bg-gray-800 p-8 rounded-lg text-white">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-green-400">Loja de Recompensas</h2>
            <div className="text-xl font-bold text-yellow-400 flex items-center">
                <FaGem className="mr-2" /> {userPoints} Pontos
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map(item => (
                <div key={item.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                    <div className="flex items-center">
                        <item.icon className="text-2xl text-green-400 mr-4" />
                        <div>
                            <p className="font-bold text-lg">{item.name}</p>
                            <p className="text-sm text-yellow-400">{item.price} Pontos</p>
                        </div>
                    </div>
                    <button onClick={() => onPurchase(item)} className="py-2 px-4 bg-green-600 rounded-lg font-bold flex items-center" disabled={userPoints < item.price}>
                        <FaShoppingCart className="mr-2"/> Comprar
                    </button>
                </div>
            ))}
        </div>
    </div>
);

// ===================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// ===================================================================

function ActivityPage() {
    const { activityId } = useParams();
    const { user } = useContext(AuthContext); 
    
    const [activity, setActivity] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [storeItems, setStoreItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(null);
    const [showStatsModal, setShowStatsModal] = useState(false);

    const fetchData = useCallback(async (url, setter) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError(prev => `${prev}\nUsuário não autenticado.`);
            return;
        }
        try {
            const response = await fetch(`http://127.0.0.1:5000${url}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || `Erro ao buscar dados de ${url}`);
            setter(data);
        } catch (err) {
            console.error(`Falha ao buscar de ${url}:`, err);
            setError(prev => `${prev}\n${err.message}`);
        }
    }, []);

    useEffect(() => {
        if (!activityId || !user) return;

        const fetchAllData = async () => {
            setLoading(true);
            setError('');
            
            // Busca os dados principais da atividade PRIMEIRO
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/activities/${activityId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const activityData = await response.json();
                if (!response.ok) throw new Error(activityData.message || "Não foi possível carregar a atividade.");
                setActivity(activityData);

                // AGORA, com os dados da atividade, busca o resto em paralelo
                const elements = activityData.gameElements?.selectedElements || [];
                const dataPromises = [];

                if (user.role === 'aluno') {
                    dataPromises.push(fetchData(`/api/activities/${activityId}/progress`, setUserProgress));
                    if (elements.includes("Sistema de classificação e ranking")) {
                        dataPromises.push(fetchData(`/api/activities/${activityId}/leaderboard`, setLeaderboard));
                    }
                    if (elements.includes("Economia (sistema monetário)")) {
                        dataPromises.push(fetchData(`/api/activities/${activityId}/store-items`, setStoreItems));
                    }
                } else if (user.role === 'professor') {
                    dataPromises.push(fetchData(`/api/activities/${activityId}/analytics`, setAnalytics));
                }
                await Promise.all(dataPromises);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [activityId, user, fetchData]);

    useEffect(() => {
        if (activity) {
            const elements = activity.gameElements?.selectedElements || [];
            const tabOrder = [
                { key: 'narrative', condition: elements.includes("Narrativas envolventes") },
                { key: 'quiz', condition: elements.includes("Quebra-cabeça") },
                { key: 'leaderboard', condition: elements.includes("Sistema de classificação e ranking") },
                { key: 'chat', condition: elements.includes("Chat ou sistema de mensagens") },
                { key: 'store', condition: elements.includes("Economia (sistema monetário)") }
            ];
            const firstAvailableTab = tabOrder.find(tab => tab.condition);
            setActiveTab(firstAvailableTab ? firstAvailableTab.key : null);
        }
    }, [activity]);

    // --- Handlers para interações ---

    const handlePointsEarned = useCallback(async (points) => {
        setUserProgress(prev => ({ ...prev, points: prev.points + points, xp: prev.xp + points }));
        // TODO: Enviar POST para o backend para salvar os pontos
    }, []);

    const handlePurchase = useCallback(async (item) => {
        // TODO: Enviar POST para o backend para registrar a compra
        alert(`Compra de ${item.name} a ser implementada!`);
    }, []);


    if (loading) return <div>Carregando...</div>;
    if (error) return <div>{error}</div>;
    if (!activity) return <div>Atividade não encontrada.</div>;

    // Lógica de renderização dinâmica CORRIGIDA
    const elements = activity.gameElements?.selectedElements || [];
    const hasNarrative = elements.includes("Narrativas envolventes");
    const hasQuiz = elements.includes("Quebra-cabeça"); // Mapeado de "Quebra-cabeça"
    const hasLeaderboard = elements.includes("Sistema de classificação e ranking");
    const hasChat = elements.includes("Chat ou sistema de mensagens");
    const hasStore = elements.includes("Economia (sistema monetário)");
    
    return (
        <div className="flex min-h-screen bg-gray-900 text-white">
            <aside className="w-1/4 bg-gray-800 p-4 border-r border-gray-700">
                {/* ... (código da sidebar) ... */}
            </aside>
            <main className="w-3/4 p-8">
                <h1 className="text-5xl font-extrabold mb-2">{activity.title}</h1>
                <p className="mb-8 text-lg text-gray-400">{activity.description}</p>
                
                <div className="flex border-b border-gray-700 mb-6">
                    {hasNarrative && <button onClick={() => setActiveTab('narrative')} className={`py-2 px-4 ${activeTab === 'narrative' ? 'border-b-2 border-yellow-400' : ''}`}>Missão</button>}
                    {hasQuiz && <button onClick={() => setActiveTab('quiz')} className={`py-2 px-4 ${activeTab === 'quiz' ? 'border-b-2 border-yellow-400' : ''}`}>Desafio</button>}
                    {hasLeaderboard && <button onClick={() => setActiveTab('leaderboard')} className={`py-2 px-4 ${activeTab === 'leaderboard' ? 'border-b-2 border-yellow-400' : ''}`}>Ranking</button>}
                    {hasChat && <button onClick={() => setActiveTab('chat')} className={`py-2 px-4 ${activeTab === 'chat' ? 'border-b-2 border-yellow-400' : ''}`}>Chat</button>}
                    {hasStore && <button onClick={() => setActiveTab('store')} className={`py-2 px-4 ${activeTab === 'store' ? 'border-b-2 border-yellow-400' : ''}`}>Loja</button>}
                </div>
                <div>{renderContent()}</div>
            </main>
            {showStatsModal && userProgress && (
                <StatsModal stats={userProgress.stats} onClose={() => setShowStatsModal(false)} />
            )}
        </div>
    );
}

export default ActivityPage;