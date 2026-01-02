import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaSave, FaTrash, FaEdit, FaQuestion, FaList, FaCheck, FaClock, FaStar, FaGem } from 'react-icons/fa';
import { useActivityCreation } from '../context/ActivityCreationContext';
import ConfirmationModal from '../components/ConfirmationModal';

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
        <div className="min-h-screen bg-primary-bg text-primary-text p-4 md:p-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                {/* Cabeçalho */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-accent-yellow p-3 rounded-xl shadow-lg">
                        {/* Ajuste de cor do ícone para garantir contraste no amarelo */}
                        <FaQuestion className="text-xl text-white dark:text-primary-bg" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Editor de Quiz</h1>
                        <h2 className="text-lg md:text-xl text-accent-yellow font-medium">{activityTitle}</h2>
                    </div>
                </div>

                {/* Formulário de Edição/Criação */}
                <div className="bg-secondary-bg p-6 rounded-2xl shadow-xl mb-8 border border-[var(--border-color)]">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary-text">
                        <FaEdit className="text-accent-teal" />
                        {editingIndex !== null ? 'Editando Pergunta' : 'Nova Pergunta'}
                    </h3>

                    <div className="space-y-5">
                        {/* Campo Pergunta */}
                        <div>
                            <label className="block text-sm text-secondary-text mb-1 flex items-center gap-1">
                                <FaQuestion className="text-accent-teal" /> Pergunta
                            </label>
                            <textarea
                                name="text"
                                value={currentQuestion.text}
                                onChange={handleInputChange}
                                placeholder="Digite o texto da pergunta..."
                                className="w-full p-3 bg-primary-bg text-primary-text rounded-xl border border-[var(--border-color)] focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow outline-none transition-all duration-300 placeholder-secondary-text"
                            />
                        </div>

                        {/* Opções de Resposta */}
                        <div>
                            <label className="block text-sm text-secondary-text mb-1 flex items-center gap-1">
                                <FaList className="text-accent-teal" /> Opções de Resposta
                            </label>
                            {currentQuestion.options.map((option, index) => (
                                <div key={index} className="flex items-center mb-2">
                                    <div className="mr-3 text-secondary-text font-bold">{index + 1}.</div>
                                    <input
                                        name="options"
                                        value={option}
                                        onChange={(e) => handleInputChange(e, index)}
                                        placeholder={`Opção ${index + 1}`}
                                        className="flex-1 p-3 bg-primary-bg text-primary-text rounded-xl border border-[var(--border-color)] focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow outline-none transition-all duration-300 placeholder-secondary-text"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Grid de Configurações */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-secondary-text mb-1 flex items-center gap-1">
                                    <FaCheck className="text-accent-teal" /> Resposta Correta
                                </label>
                                <select
                                    name="correct_option"
                                    value={currentQuestion.correct_option}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-primary-bg text-primary-text rounded-xl border border-[var(--border-color)] focus:border-accent-yellow outline-none transition-all duration-300"
                                >
                                    <option value="">Selecione a resposta correta</option>
                                    {currentQuestion.options.map((opt, i) => (opt && <option key={`${opt}-${i}`} value={opt}>{opt}</option>))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-secondary-text mb-1 flex items-center gap-1">
                                    <FaStar className="text-accent-teal" /> Pontos
                                </label>
                                <input
                                    type="number"
                                    name="points"
                                    value={currentQuestion.points}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-primary-bg text-primary-text rounded-xl border border-[var(--border-color)] focus:border-accent-yellow outline-none transition-all duration-300"
                                />
                            </div>

                            {/* Campo Moedas */}
                            <div>
                                <label className="block text-sm text-secondary-text mb-1 flex items-center gap-1">
                                    <FaGem className="text-accent-yellow" /> Moedas
                                </label>
                                <input
                                    type="number"
                                    name="coins"
                                    value={currentQuestion.coins}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-primary-bg text-primary-text rounded-xl border border-[var(--border-color)] focus:border-accent-yellow outline-none transition-all duration-300"
                                />
                            </div>

                            {/* Tempo Limite */}
                            {isTimed && (
                                <div>
                                    <label className="block text-sm text-secondary-text mb-1 flex items-center gap-1">
                                        <FaClock className="text-accent-teal" /> Tempo Limite (s)
                                    </label>
                                    <input
                                        type="number"
                                        name="timeLimit"
                                        value={currentQuestion.timeLimit}
                                        onChange={handleInputChange}
                                        className="w-full p-3 bg-primary-bg text-primary-text rounded-xl border border-[var(--border-color)] focus:border-accent-yellow outline-none transition-all duration-300"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Botão Adicionar/Atualizar */}
                        <div className="pt-2">
                            <button
                                onClick={handleAddOrUpdateQuestion}
                                className="w-full md:w-auto bg-accent-yellow hover:brightness-110 text-white dark:text-primary-bg font-bold py-3 px-6 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group"
                            >
                                <FaPlus className="mr-2 transform group-hover:scale-110 transition-transform" />
                                {editingIndex !== null ? 'Atualizar Pergunta' : 'Adicionar Pergunta'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lista de Perguntas */}
                {questions.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary-text">
                            <FaList className="text-accent-teal" />
                            Perguntas do Quiz ({questions.length})
                        </h3>

                        <div className="space-y-4">
                            {questions.map((q, index) => (
                                <div
                                    key={index}
                                    // Card da pergunta usa secondary-bg
                                    className="bg-secondary-bg p-4 rounded-xl flex justify-between items-center border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-start">
                                            {/* Badge numérico roxo */}
                                            <div className="bg-accent-purple w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-white">
                                                <span className="font-bold text-sm">{index + 1}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-primary-text">{q.text}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="bg-primary-bg border border-[var(--border-color)] px-2 py-1 rounded-lg text-xs flex items-center text-secondary-text">
                                                        <FaCheck className="mr-1 text-success" />
                                                        {q.correct_option}
                                                    </span>
                                                    <span className="bg-primary-bg border border-[var(--border-color)] px-2 py-1 rounded-lg text-xs flex items-center text-secondary-text">
                                                        <FaStar className="mr-1 text-accent-teal" />
                                                        {q.points} pontos
                                                    </span>
                                                    <span className="bg-primary-bg border border-[var(--border-color)] px-2 py-1 rounded-lg text-xs flex items-center text-secondary-text">
                                                        <FaGem className="mr-1 text-accent-yellow" />
                                                        {q.coins || 0} moedas
                                                    </span>
                                                    {isTimed && (
                                                        <span className="bg-primary-bg border border-[var(--border-color)] px-2 py-1 rounded-lg text-xs flex items-center text-secondary-text">
                                                            <FaClock className="mr-1 text-accent-teal" />
                                                            {q.timeLimit}s
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        {/* Botão Editar: Roxo */}
                                        <button
                                            onClick={() => handleEditQuestion(index)}
                                            className="p-3 bg-accent-purple hover:brightness-110 text-white rounded-xl transition-all duration-300 shadow-sm"
                                            aria-label="Editar pergunta"
                                        >
                                            <FaEdit />
                                        </button>
                                        {/* Botão Excluir: Estilo Ghost Vermelho */}
                                        <button
                                            onClick={() => handleDeleteQuestionClick(index)}
                                            className="p-3 text-danger hover:bg-danger-bg rounded-xl transition-colors duration-300"
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
                    <div className="mt-8 pt-4 border-t border-[var(--border-color)]">
                        <button
                            onClick={handleSaveChanges}
                            className="bg-accent-teal hover:brightness-110 text-white dark:text-primary-bg font-bold text-lg py-3 px-6 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 w-full md:w-auto group disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            <FaSave className="mr-2 transform group-hover:scale-110 transition-transform" />
                            {loading ? 'Salvando...' : 'Salvar Quiz Completo'}
                        </button>
                        {message && (
                            <div className="mt-4 p-3 bg-success-bg border border-success/20 rounded-xl text-success flex items-center">
                                <span className="font-bold mr-2">✓</span> {message}
                            </div>
                        )}
                        {error && (
                            <div className="mt-4 p-3 bg-danger-bg border border-danger/20 rounded-xl text-danger flex items-center">
                                <span className="font-bold mr-2">!</span> Erro: {error}
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