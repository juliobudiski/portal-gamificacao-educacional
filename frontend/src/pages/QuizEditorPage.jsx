import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaSave, FaTrash, FaEdit, FaQuestion, FaList, FaCheck, FaClock, FaStar, FaGem } from 'react-icons/fa';

function QuizEditorPage() {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [activityTitle, setActivityTitle] = useState('');
    const [questions, setQuestions] = useState([]);
    // NOVO ESTADO: para armazenar os elementos de jogo da atividade
    const [gameElements, setGameElements] = useState([]); 
    const [currentQuestion, setCurrentQuestion] = useState({ text: '', options: ['', '', '', ''], correct_option: '', points: 10, coins: 5, timeLimit: 30 });
    const [editingIndex, setEditingIndex] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Busca os dados da atividade, incluindo os elementos de jogo
    const fetchActivity = useCallback(async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/activities/${activityId}`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setActivityTitle(data.title);
            setQuestions(data.gameElements?.questions || []);
            // ATUALIZADO: Salva os elementos de jogo no novo estado
            setGameElements(data.gameElements?.selectedElements || []); 
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [activityId, user.token]);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);
    
    // NOVO: Variável para verificar se o modo de tempo está ativo
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

    const handleDeleteQuestion = (index) => {
        if (window.confirm('Tem certeza que deseja remover esta pergunta?')) {
            const updatedQuestions = questions.filter((_, i) => i !== index);
            setQuestions(updatedQuestions);
        }
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/activities/${activityId}/quiz`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ questions: questions })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setMessage('Quiz salvo com sucesso!');
            setTimeout(() => navigate(`/activities/${activityId}`), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <div className="text-center text-white p-10">Carregando editor de quiz...</div>;
    if (error) return <div className="text-center text-red-500 p-10">Erro: {error}</div>;

    return (
        <div className="min-h-screen bg-[#2c3135] text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-[#ffbd30] to-[#ff9d00] p-3 rounded-xl">
                        <FaQuestion className="text-xl text-gray-900" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Editor de Quiz</h1>
                        <h2 className="text-lg md:text-xl text-[#ffbd30]">{activityTitle}</h2>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-2xl shadow-xl shadow-gray-900/50 mb-8 border border-gray-700">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <FaEdit />
                        {editingIndex !== null ? 'Editando Pergunta' : 'Nova Pergunta'}
                    </h3>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                                <FaQuestion className="text-[#69e8cb]" /> Pergunta
                            </label>
                            <textarea 
                                name="text" 
                                value={currentQuestion.text} 
                                onChange={handleInputChange} 
                                placeholder="Digite o texto da pergunta..." 
                                className="w-full p-3 bg-gray-700 rounded-xl border border-gray-600 focus:border-[#ffbd30] focus:ring-2 focus:ring-[#ffbd30]/30 transition-all duration-300" 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                                <FaList className="text-[#69e8cb]" /> Opções de Resposta
                            </label>
                            {currentQuestion.options.map((option, index) => (
                                <div key={index} className="flex items-center mb-2">
                                    <div className="mr-3 text-gray-400">{index + 1}.</div>
                                    <input 
                                        name="options" 
                                        value={option} 
                                        onChange={(e) => handleInputChange(e, index)} 
                                        placeholder={`Opção ${index + 1}`} 
                                        className="flex-1 p-3 bg-gray-700 rounded-xl border border-gray-600 focus:border-[#ffbd30] focus:ring-2 focus:ring-[#ffbd30]/30 transition-all duration-300" 
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                                    <FaCheck className="text-[#69e8cb]" /> Resposta Correta
                                </label>
                                <select 
                                    name="correct_option" 
                                    value={currentQuestion.correct_option} 
                                    onChange={handleInputChange} 
                                    className="w-full p-3 bg-gray-700 rounded-xl border border-gray-600 focus:border-[#ffbd30] focus:ring-2 focus:ring-[#ffbd30]/30 transition-all duration-300"
                                >
                                    <option value="">Selecione a resposta correta</option>
                                    {currentQuestion.options.map((opt, i) => (opt && <option key={`${opt}-${i}`} value={opt}>{opt}</option>))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                                    <FaStar className="text-[#69e8cb]" /> Pontos
                                </label>
                                <input 
                                    type="number" 
                                    name="points" 
                                    value={currentQuestion.points} 
                                    onChange={handleInputChange} 
                                    className="w-full p-3 bg-gray-700 rounded-xl border border-gray-600 focus:border-[#ffbd30] focus:ring-2 focus:ring-[#ffbd30]/30 transition-all duration-300" 
                                />
                            </div>

                            {/* NOVO CAMPO PARA MOEDAS */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                                    <FaGem className="text-[#ffbd30]" /> Moedas
                                </label>
                                <input 
                                    type="number" 
                                    name="coins" 
                                    value={currentQuestion.coins} 
                                    onChange={handleInputChange} 
                                    className="w-full p-3 bg-gray-700 rounded-xl border border-gray-600 focus:border-[#ffbd30] focus:ring-2 focus:ring-[#ffbd30]/30 transition-all duration-300" 
                                />
                            </div>
                            
                            {/* ATUALIZADO: Renderização condicional do campo de tempo */}
                            {isTimed && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                                        <FaClock className="text-[#69e8cb]" /> Tempo Limite (s)
                                    </label>
                                    <input 
                                        type="number" 
                                        name="timeLimit" 
                                        value={currentQuestion.timeLimit} 
                                        onChange={handleInputChange} 
                                        className="w-full p-3 bg-gray-700 rounded-xl border border-gray-600 focus:border-[#ffbd30] focus:ring-2 focus:ring-[#ffbd30]/30 transition-all duration-300" 
                                    />
                                </div>
                            )}
                        </div>
                        
                        <div className="pt-2">
                            <button 
                                onClick={handleAddOrUpdateQuestion} 
                                className="bg-gradient-to-r from-[#ffbd30] to-[#ff9d00] hover:from-[#ff9d00] hover:to-[#ffbd30] text-gray-900 font-bold py-3 px-6 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group"
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
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FaList className="text-[#69e8cb]" />
                            Perguntas do Quiz ({questions.length})
                        </h3>
                        
                        <div className="space-y-4">
                            {questions.map((q, index) => (
                                <div 
                                    key={index} 
                                    className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-start">
                                            <div className="bg-[#9570d9] w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                                <span className="font-bold text-sm">{index + 1}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{q.text}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="bg-gray-700 px-2 py-1 rounded-lg text-xs flex items-center">
                                                        <FaCheck className="mr-1 text-[#69e8cb]" /> 
                                                        {q.correct_option}
                                                    </span>
                                                    <span className="bg-gray-700 px-2 py-1 rounded-lg text-xs flex items-center">
                                                        <FaStar className="mr-1 text-[#69e8cb]" /> 
                                                        {q.points} pontos
                                                    </span>
                                                    <span className="bg-gray-700 px-2 py-1 rounded-lg text-xs flex items-center">
                                                        <FaGem className="mr-1 text-[#ffbd30]" /> 
                                                        {q.coins || 0} moedas
                                                    </span>
                                                    {/* ATUALIZADO: Mostra o tempo limite apenas se for relevante */}
                                                    {isTimed && (
                                                        <span className="bg-gray-700 px-2 py-1 rounded-lg text-xs flex items-center">
                                                            <FaClock className="mr-1 text-[#69e8cb]" /> 
                                                            {q.timeLimit}s
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button 
                                            onClick={() => handleEditQuestion(index)} 
                                            className="p-3 bg-[#9570d9] hover:bg-[#7a55c4] rounded-xl transition-colors duration-300"
                                            aria-label="Editar pergunta"
                                        >
                                            <FaEdit className="text-white" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteQuestion(index)} 
                                            className="p-3 bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-300"
                                            aria-label="Excluir pergunta"
                                        >
                                            <FaTrash className="text-white" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Salvar Alterações */}
                {questions.length > 0 && (
                    <div className="mt-8 pt-4 border-t border-gray-700">
                        <button 
                            onClick={handleSaveChanges} 
                            className="bg-gradient-to-r from-[#69e8cb] to-[#49d0b0] hover:from-[#49d0b0] hover:to-[#69e8cb] text-gray-900 font-bold text-lg py-3 px-6 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 w-full md:w-auto group"
                            disabled={loading}
                        >
                            <FaSave className="mr-2 transform group-hover:scale-110 transition-transform" /> 
                            {loading ? 'Salvando...' : 'Salvar Quiz Completo'}
                        </button>
                        {message && (
                            <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-xl text-green-400">
                                {message}
                            </div>
                        )}
                        {error && (
                            <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-xl text-red-400">
                                Erro: {error}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default QuizEditorPage;