import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaSave, FaTrash, FaEdit, FaQuestion, FaList, FaCheck, FaClock, FaStar, FaGem } from 'react-icons/fa';
import { useActivityCreation } from '../context/ActivityCreationContext';
import ConfirmationModal from '../components/ConfirmationModal';

/**
 * QuizEditorPage
 * 
 * Architectural intent: Provides a specialized editor view for creating and managing multiple-choice questions
 * within the activity creation wizard. It orchestrates the local state of the question bank before syncing
 * with the backend API, decoupling the form validation and question lifecycle from the main activity context.
 */
function QuizEditorPage({ initialData, onSave, onCancel, isOfflineMode = false }) {
    const { activityId, stepId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();
    const { activityData } = useActivityCreation();
    // Estado para controlar o Modal de Confirmação
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: null,      // 'student' ou 'activity'
        itemId: null,    // ID do item a ser removido
        title: '',
        message: ''
    });
    // INICIALIZAÇÃO DO ESTADO: Prioriza initialData (Modo Offline), depois tenta Contexto, depois array vazio
    const [questions, setQuestions] = useState(() => {
        if (initialData) return initialData;
        // Fallback para modo legado (URL)
        const stepContent = activityData?.gamificationDesign?.progression_path?.find(p => p.id === stepId)?.content;
        return stepContent?.questions || [];
    });
    // O título também pode vir do contexto para consistência
    const [activityTitle, setActivityTitle] = useState(activityData.title || 'Nova Atividade');
    const [loading, setLoading] = useState(false); // Não precisa mais carregar no modo criação
    const [gameElements, setGameElements] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({ text: '', options: ['', '', '', ''], correct_option: '', points: 10, coins: 5, timeLimit: 30 });
    const [editingIndex, setEditingIndex] = useState(null);


    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    // --- FETCH DE DADOS (Apenas no modo Online/Edição via URL) ---
    const fetchContent = useCallback(async () => {
        if (isOfflineMode) return; // Não busca nada se for offline/modal

        if (!activityId || !stepId || !user?.token) return;

        setLoading(true);
        try {
            const activityResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            if (activityResponse.ok) {
                const actData = await activityResponse.json();
                setActivityTitle(actData.title);
            }

            const contentResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/content_editor/activity/${activityId}/step/${stepId}/content?type=quiz`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const contentData = await contentResponse.json();
            if (contentResponse.ok && contentData.questions) {
                setQuestions(contentData.questions);
            }
        } catch (err) {
            console.error(err);
            // Não bloqueia se falhar, apenas segue com vazio
        } finally {
            setLoading(false);
        }
    }, [activityId, stepId, user?.token, isOfflineMode]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const isTimed = gameElements.includes("Pressão de tempo");

    const handleInputChange = (e, index) => {
        const { name, value } = e.target;
        if (name === "options") {
            const newOptions = [...currentQuestion.options];
            newOptions[index] = value;
            setCurrentQuestion({ ...currentQuestion, options: newOptions });
        } else {
            setCurrentQuestion({ ...currentQuestion, [name]: value });
        }
    };

    const handleAddOrUpdateQuestion = () => {
        if (currentQuestion.options.some(opt => opt.trim() === '') || !currentQuestion.correct_option) {
            alert('Preencha todas as opções e selecione a resposta correta.');
            return;
        }

        const uniqueOptions = new Set(currentQuestion.options.map(opt => opt.trim()));
        if (uniqueOptions.size < currentQuestion.options.length) {
            alert('Não é permitido ter duas ou mais opções de resposta com o mesmo texto.');
            return; // Impede a função de continuar
        }

        if (editingIndex !== null) {
            const updatedQuestions = [...questions];
            updatedQuestions[editingIndex] = currentQuestion;
            setQuestions(updatedQuestions);
            setEditingIndex(null);
        } else {
            setQuestions([...questions, currentQuestion]);
        }
        setCurrentQuestion({ text: '', options: ['', '', '', ''], correct_option: '', points: 10, coins: 5, timeLimit: 30 });
    };

    const handleEditQuestion = (index) => {
        setEditingIndex(index);
        setCurrentQuestion(questions[index]);
    };

    const handleDeleteQuestionClick = (index) => {
        setModalConfig({
            isOpen: true,
            type: 'delete_question',
            itemId: index, // Aqui o ID é o índice do array
            title: 'Remover Pergunta',
            message: 'Tem certeza que deseja remover esta pergunta do quiz?'
        });
    };

    const executeDeleteQuestion = () => {
        const indexToDelete = modalConfig.itemId;
        const updatedQuestions = questions.filter((_, i) => i !== indexToDelete);
        setQuestions(updatedQuestions);
        setModalConfig({ ...modalConfig, isOpen: false });
    };

    const handleSaveChanges = async () => {
        // 1. MODO OFFLINE (MODAL)
        if (isOfflineMode) {
            console.log("Salvando Quiz localmente...");
            if (onSave) onSave(questions); // Devolve os dados para o pai
            return;
        }

        // 2. MODO ONLINE (API DIRECT)
        setLoading(true);
        setMessage('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content_editor/activity/${activityId}/step/${stepId}/content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ type: 'quiz', questions })
            });
            if (!response.ok) throw new Error('Falha ao salvar quiz.');
            setMessage('Quiz salvo com sucesso!');
            setTimeout(() => navigate(`/professor/atividades/${activityId}/edit`, { state: { fromStep: 5 } }), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <div className="text-center text-primary-text p-10">Carregando editor de quiz...</div>;
    if (error) return <div className="text-center text-red-500 p-10">Erro: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 md:p-8 transition-colors duration-300 relative overflow-hidden">
            {/* Efeitos de luz ao fundo */}
            <div className="fixed top-1/4 left-0 w-[400px] h-[400px] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[400px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Cabeçalho */}
                <div className="flex items-center gap-3 mb-6 bg-white/80 dark:bg-black/30 p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-xl backdrop-blur-md">
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-2xl shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                        <FaQuestion className="text-2xl text-gray-900" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 drop-shadow-md">Editor de Quiz</h1>
                        <h2 className="text-lg md:text-xl text-gray-400 font-medium tracking-wide mt-1">{activityTitle}</h2>
                    </div>
                </div>

                {/* Formulário de Edição/Criação */}
                <div className="bg-white/80 dark:bg-black/40 backdrop-blur-lg p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-8 border border-gray-300 dark:border-white/10">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
                        <div className="bg-teal-500/20 p-2 rounded-lg">
                             <FaEdit className="text-teal-400" />
                        </div>
                        {editingIndex !== null ? 'Editando Pergunta Holográfica' : 'Nova Pergunta Holográfica'}
                    </h3>

                    <div className="space-y-6">
                        {/* Campo Pergunta */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
                                <FaQuestion className="text-teal-400" /> Pergunta
                            </label>
                            <textarea
                                name="text"
                                value={currentQuestion.text}
                                onChange={handleInputChange}
                                placeholder="Digite o texto da pergunta..."
                                className="w-full p-4 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-white rounded-2xl border border-gray-300 dark:border-white/10 focus:border-teal-400/70 focus:bg-gray-800/80 outline-none transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-600 shadow-inner"
                                rows="3"
                            />
                        </div>

                        {/* Opções de Resposta */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
                                <FaList className="text-purple-400" /> Opções de Resposta
                            </label>
                            {currentQuestion.options.map((option, index) => (
                                <div key={index} className="flex items-center mb-3">
                                    <div className="mr-3 text-purple-400 font-extrabold bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-xl border border-purple-500/20">{index + 1}</div>
                                    <input
                                        name="options"
                                        value={option}
                                        onChange={(e) => handleInputChange(e, index)}
                                        placeholder={`Opção ${index + 1}`}
                                        className="flex-1 p-4 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-white rounded-2xl border border-gray-300 dark:border-white/10 focus:border-purple-400/70 focus:bg-gray-800/80 outline-none transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-600 shadow-inner"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Grid de Configurações */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="lg:col-span-2">
                                <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <FaCheck className="text-green-400" /> Resposta Correta
                                </label>
                                <select
                                    name="correct_option"
                                    value={currentQuestion.correct_option}
                                    onChange={handleInputChange}
                                    className="w-full p-4 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-white rounded-2xl border border-gray-300 dark:border-white/10 focus:border-green-400/70 outline-none transition-all duration-300 appearance-none"
                                >
                                    <option value="" className="bg-gray-50 dark:bg-gray-900">Selecione a resposta correta</option>
                                    {currentQuestion.options.map((opt, i) => (opt && <option key={`${opt}-${i}`} value={opt} className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">{opt}</option>))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <FaStar className="text-yellow-400" /> Pontos
                                </label>
                                <input
                                    type="number"
                                    name="points"
                                    value={currentQuestion.points}
                                    onChange={handleInputChange}
                                    className="w-full p-4 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-white rounded-2xl border border-gray-300 dark:border-white/10 focus:border-yellow-400/70 outline-none transition-all duration-300 text-center font-bold text-lg"
                                />
                            </div>

                            {/* Campo Moedas */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <FaGem className="text-blue-400" /> Moedas
                                </label>
                                <input
                                    type="number"
                                    name="coins"
                                    value={currentQuestion.coins}
                                    onChange={handleInputChange}
                                    className="w-full p-4 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-white rounded-2xl border border-gray-300 dark:border-white/10 focus:border-blue-400/70 outline-none transition-all duration-300 text-center font-bold text-lg"
                                />
                            </div>

                            {/* Tempo Limite */}
                            {isTimed && (
                                <div className="lg:col-span-4">
                                    <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
                                        <FaClock className="text-red-400" /> Tempo Limite (s)
                                    </label>
                                    <input
                                        type="number"
                                        name="timeLimit"
                                        value={currentQuestion.timeLimit}
                                        onChange={handleInputChange}
                                        className="w-full p-4 bg-white dark:bg-gray-900/60 text-gray-900 dark:text-white rounded-2xl border border-gray-300 dark:border-white/10 focus:border-red-400/70 outline-none transition-all duration-300 text-center font-bold text-lg"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Botão Adicionar/Atualizar */}
                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleAddOrUpdateQuestion}
                                className="w-full md:w-auto bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-gray-900 dark:text-white font-bold py-4 px-8 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 group uppercase tracking-widest text-sm"
                            >
                                <FaPlus className="mr-2 transform group-hover:scale-110 group-hover:rotate-90 transition-all duration-500" />
                                {editingIndex !== null ? 'Salvar Edição' : 'Adicionar ao Banco'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lista de Perguntas */}
                {questions.length > 0 && (
                    <div className="mb-10 bg-black/20 p-8 rounded-3xl border border-gray-200 dark:border-white/5 backdrop-blur-md">
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
                            <div className="bg-purple-500/20 p-2 rounded-lg">
                                <FaList className="text-purple-400" />
                            </div>
                            Banco de Perguntas <span className="bg-purple-600 text-gray-900 dark:text-white text-sm py-1 px-3 rounded-full ml-2">{questions.length}</span>
                        </h3>

                        <div className="space-y-4">
                            {questions.map((q, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-50 dark:bg-gray-900/70 p-5 rounded-2xl flex justify-between items-center border border-gray-200 dark:border-white/5 hover:border-purple-500/30 shadow-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-300 group"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-start">
                                            {/* Badge numérico */}
                                            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center mr-4 mt-1 flex-shrink-0 text-gray-900 dark:text-white shadow-md">
                                                <span className="font-extrabold">{index + 1}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-2">{q.text}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center text-green-400 shadow-inner">
                                                        <FaCheck className="mr-1.5" />
                                                        {q.correct_option}
                                                    </span>
                                                    <span className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center text-yellow-400 shadow-inner">
                                                        <FaStar className="mr-1.5" />
                                                        {q.points} XP
                                                    </span>
                                                    <span className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center text-blue-400 shadow-inner">
                                                        <FaGem className="mr-1.5" />
                                                        {q.coins || 0}
                                                    </span>
                                                    {isTimed && (
                                                        <span className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center text-red-400 shadow-inner">
                                                            <FaClock className="mr-1.5" />
                                                            {q.timeLimit}s
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 ml-6 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditQuestion(index)}
                                            className="p-3.5 bg-gray-200 dark:bg-gray-800 hover:bg-teal-600/20 hover:text-teal-400 text-gray-400 rounded-xl border border-gray-200 dark:border-white/5 hover:border-teal-500/30 transition-all duration-300"
                                            aria-label="Editar pergunta"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteQuestionClick(index)}
                                            className="p-3.5 bg-gray-200 dark:bg-gray-800 hover:bg-red-600/20 hover:text-red-400 text-gray-400 rounded-xl border border-gray-200 dark:border-white/5 hover:border-red-500/30 transition-all duration-300"
                                            aria-label="Excluir pergunta"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Salvar Alterações */}
                {questions.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-300 dark:border-white/10 flex flex-col items-center">
                        <button
                            onClick={handleSaveChanges}
                            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-gray-900 dark:text-white font-extrabold text-lg py-4 px-12 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.5)] hover:shadow-[0_0_40px_rgba(20,184,166,0.7)] transition-all duration-300 hover:scale-105 active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto group"
                            disabled={loading}
                        >
                            <FaSave className="mr-3 transform group-hover:scale-125 transition-transform" />
                            {loading ? 'Sincronizando...' : 'Publicar Módulo de Quiz'}
                        </button>
                        {message && (
                            <div className="mt-6 p-4 bg-green-900/30 border border-green-500/50 rounded-xl text-green-400 flex items-center font-bold shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                                <span className="mr-3 text-xl">✓</span> {message}
                            </div>
                        )}
                        {error && (
                            <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 flex items-center font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                <span className="mr-3 text-xl">!</span> Erro: {error}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={executeDeleteQuestion}
                title={modalConfig.title}
                message={modalConfig.message}
                isDangerous={true}
                confirmText="Remover"
            />
        </div>
    );
}

export default QuizEditorPage;