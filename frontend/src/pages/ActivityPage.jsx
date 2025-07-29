import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext'; 

// Importando os componentes modulares
import StudentSidebar from '../components/activity/StudentSidebar';
import ProfessorSidebar from '../components/activity/ProfessorSidebar';
import StatsModal from '../components/activity/StatsModal';
import NarrativeTab from '../components/activity/NarrativeTab';
import QuizTab from '../components/activity/QuizTab';
import LeaderboardTab from '../components/activity/LeaderboardTab';
import ChatTab from '../components/activity/ChatTab';
import StoreTab from '../components/activity/StoreTab';

function ActivityPage() {
    const { activityId } = useParams();
    const { user } = useAuth(); // Corrigido para useAuth
    const navigate = useNavigate();
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
        if (!user?.token) {
            setError(prev => `${prev}\nUsuário não autenticado.`);
            return;
        }
        try {
            const response = await fetch(`http://127.0.0.1:5000${url}`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || `Erro ao buscar dados de ${url}`);
            setter(data);
        } catch (err) {
            console.error(`Falha ao buscar de ${url}:`, err);
            setError(prev => `${prev}\n${err.message}`);
        }
    }, [user?.token]); // Dependência no token

    useEffect(() => {
        if (!activityId || !user) return;

        const fetchAllData = async () => {
            setLoading(true);
            setError('');
            
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/activities/${activityId}`, { headers: { 'Authorization': `Bearer ${user.token}` } });
                const activityData = await response.json();
                if (!response.ok) throw new Error(activityData.message || "Não foi possível carregar a atividade.");
                setActivity(activityData);

                const elements = activityData.gameElements?.selectedElements || [];
                const dataPromises = [];

                if (user.role === 'aluno') {
                    dataPromises.push(fetchData(`/api/progress/${activityId}`, setUserProgress));
                    if (elements.includes("Sistema de classificação e ranking")) {
                        dataPromises.push(fetchData(`/api/progress/${activityId}/leaderboard`, setLeaderboard));
                    }
                    if (elements.includes("Economia (sistema monetário)")) {
                        dataPromises.push(fetchData(`/api/progress/${activityId}/store-items`, setStoreItems));
                    }
                } else if (user.role === 'professor') {
                    // Para professores, buscamos a análise da atividade
                    dataPromises.push(fetchData(`/api/progress/${activityId}/analytics`, setAnalytics));
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
                { key: 'leaderboard', condition: user.role === 'aluno' && elements.includes("Sistema de classificação e ranking") },
                { key: 'chat', condition: elements.includes("Chat ou sistema de mensagens") },
                { key: 'store', condition: user.role === 'aluno' && elements.includes("Economia (sistema monetário)") }
            ];
            const firstAvailableTab = tabOrder.find(tab => tab.condition);
            setActiveTab(firstAvailableTab ? firstAvailableTab.key : null);
        }
    }, [activity, user.role]); // Adicionado user.role como dependência

    const handlePointsEarned = useCallback(async (points) => {
        const numericPoints = parseInt(points, 10) || 0; // <<< CORREÇÃO AQUI

        // Atualiza o estado local imediatamente
        setUserProgress(prev => {
            const currentProgress = prev || { points_earned: 0, xp: 0 };
            return {
                ...currentProgress,
                points_earned: currentProgress.points_earned + numericPoints,
                xp: (currentProgress.xp || 0) + numericPoints
            };
        });
        
        // Envia os pontos para o backend
        try {
            console.log(`Enviando ${numericPoints} pontos para o backend...`);
            const response = await fetch(`http://127.0.0.1:5000/api/progress/${activityId}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ points: numericPoints }) // Envia como número
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Falha ao salvar o progresso no backend:", data.message);
                setError("Não foi possível salvar seu progresso. Tente novamente.");
            } else {
                console.log("Progresso salvo com sucesso:", data);
            }
        } catch (err) {
            console.error("Erro de rede ao salvar o progresso:", err);
            setError("Erro de conexão. Não foi possível salvar seu progresso.");
        }
    }, [activityId, user.token]);


    const handlePurchase = useCallback(async (item) => {
        // TODO: Enviar POST para o backend para registrar a compra
        alert(`Compra de ${item.name} a ser implementada!`);
    }, []);

    const renderContent = () => {
        if (!activity) return null;
        
        switch (activeTab) {
            case 'narrative':
                return (
                    <NarrativeTab
                        title={activity.gameElements?.narrativeTitle}
                        content={activity.gameElements?.narrativeContent}
                        objective="Complete os desafios para avançar na história!"
                        onStart={() => setActiveTab('quiz')} // Exemplo: A narrativa leva ao quiz
                    />
                );
            case 'quiz':
                // Passa as perguntas reais do objeto activity para o QuizTab
                const quizQuestions = activity.gameElements?.questions || [];
                return <QuizTab questions={quizQuestions} onAnswerCorrect={handlePointsEarned} />;
            case 'leaderboard':
                return <LeaderboardTab leaderboardData={leaderboard} />;
            case 'chat':
                return <ChatTab />;
            case 'store':
                return <StoreTab items={storeItems} userPoints={userProgress?.points_earned || 0} onPurchase={handlePurchase} />;
            default:
                return <div className="text-center text-gray-400 p-8">Esta atividade não possui elementos interativos ou nenhum foi selecionado.</div>;
        }
    };

    if (loading) return <div className="text-center p-10 text-white">Carregando dados da atividade...</div>;
    if (error) return <div className="text-center p-10 text-red-500">Erro: {error}</div>;
    if (!activity) return <div className="text-center p-10 text-white">Atividade não encontrada.</div>;

    const elements = activity.gameElements?.selectedElements || [];
    const hasNarrative = elements.includes("Narrativas envolventes");
    const hasQuiz = elements.includes("Quebra-cabeça");
    const hasLeaderboard = user.role === 'aluno' && elements.includes("Sistema de classificação e ranking");
    const hasChat = elements.includes("Chat ou sistema de mensagens");
    const hasStore = user.role === 'aluno' && elements.includes("Economia (sistema monetário)");
    
    return (
        <div className="flex min-h-screen bg-gray-900 text-white">
            <aside className="w-1/4 bg-gray-800 p-4 border-r border-gray-700">
                {user.role === 'aluno' && userProgress && (
                    <StudentSidebar progress={userProgress} onShowStats={() => setShowStatsModal(true)} />
                )}
                {user.role === 'professor' && analytics && (
                    <ProfessorSidebar 
                        analytics={analytics} 
                        onStudentClick={(student) => console.log('Clicked student:', student)} 
                        onOpenQuizEditor={() => navigate(`/professor/activity/${activityId}/quiz/edit`)}
                    />
                )}
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
                <StatsModal stats={userProgress.stats || {}} onClose={() => setShowStatsModal(false)} />
            )}
        </div>
    );
}

export default ActivityPage;