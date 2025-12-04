import React, { useState, useRef, useEffect } from 'react';
import { FaMagic, FaTimes, FaRobot, FaBook, FaUsers, FaPlus, FaTrash, FaSlidersH, FaBullseye, FaGraduationCap, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
const PERSONALITIES = [
    { id: 'Socrático', label: 'Mestre Socrático (Faz pensar)', desc: 'Foca em perguntas reflexivas e aprendizado guiado.' },
    { id: 'Hardcore', label: 'Desafiador (Hardcore)', desc: 'Perguntas difíceis, tom sério de urgência.' },
    { id: 'Divertido', label: 'Colega Divertido', desc: 'Usa humor, gírias leves e analogias engraçadas.' },
    { id: 'Storyteller', label: 'Narrador Épico', desc: 'Foco total na imersão e dramatismo da história.' }
];

const AUDIENCE_LEVELS = [
    { id: 'Iniciante', label: 'Iniciante / Curioso', desc: 'Explicações simples, sem jargão pesado.' },
    { id: 'Junior', label: 'Estudante (Graduação/Técnico)', desc: 'Termos técnicos corretos, foco em fundamentos.' },
    { id: 'Pleno', label: 'Profissional / Prático', desc: 'Foco em resolução de problemas reais e clean code.' },
    { id: 'Senior', label: 'Especialista / Avançado', desc: 'Discussões arquiteturais e otimização.' }
];


const AIConfigModal = ({ isOpen, onClose, onSuccess, activityId, structure, contextData }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1 = Config Básica, 2 = Personagens/Avançado
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState("Iniciando...");
    const socketRef = useRef(null); // Referência para o socket
    const progressInterval = useRef(null); // Referência para o intervalo de progresso
    // Estado complexo de configuração
    const [config, setConfig] = useState({
        narrativeGoal: "", // O enredo
        teachingFocus: "", // NOVO: O que ensinar especificamente
        targetAudience: "Junior", // NOVO: Nível
        tone: "aventura",
        personality: "Socrático",
        questionsPerQuiz: 4,
        linesPerNarrative: 6,
        charactersList: [
            { role: "Mentor Técnico", type: "Mentor" },
            { role: "Estagiário Curioso", type: "Aluno" }
        ]
    });
    // 1. CORREÇÃO DO BUG DE ESTADO (Adicione este useEffect)
    // Isso garante que sempre que a modal fechar ou abrir, o estado seja resetado
    useEffect(() => {
        if (!isOpen) {
            setLoading(false);
            setProgress(0);
            setProgressMessage("Iniciando...");
            // Opcional: Se quiser resetar o passo ou config, faça aqui também
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            // Reset inicial
            setLoading(false);
            setProgress(0);
            setProgressMessage("Iniciando...");

            // --- LÓGICA DE PRIORIDADE DO TÓPICO ---
            // 1. O Preset tem prioridade máxima (ex: template "Log de Erros")
            const presetFocus = contextData?.ai_preset?.teachingFocus;

            // Definimos o valor inicial
            const initialFocus = presetFocus || "";

            setConfig(prev => ({
                ...prev,
                // Mantém o que o usuário já digitou se ele fechou e abriu o modal rapidamente,
                // a menos que esteja vazio.
                teachingFocus: (prev.teachingFocus && !contextData.ai_preset) ? prev.teachingFocus : initialFocus,

                // Demais campos seguem a lógica de preset ou fallback
                targetAudience: contextData?.ai_preset?.targetAudience || prev.targetAudience || "Junior",
                narrativeGoal: contextData?.ai_preset?.narrativeGoal || prev.narrativeGoal || "",
                tone: contextData?.ai_preset?.tone || prev.tone || "aventura",
                personality: contextData?.ai_preset?.personality || prev.personality || "Socrático",
                charactersList: contextData?.ai_preset?.charactersList || prev.charactersList
            }));

            // Conexão Socket (código existente)
            const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            socketRef.current = io(socketUrl, { transports: ['websocket'], reconnectionAttempts: 3 });

            socketRef.current.on('ai_progress', (data) => {
                setProgress(data.percent);
                if (data.message) setProgressMessage(data.message);
            });
        }
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [isOpen, contextData]); // Dependência contextData é importante aqui

    if (!isOpen) return null;

    // Handlers para lista de personagens
    const addCharacter = () => {
        if (config.charactersList.length < 4) {
            setConfig(prev => ({
                ...prev,
                charactersList: [...prev.charactersList, { role: "", type: "Aluno" }]
            }));
        }
    };

    const removeCharacter = (index) => {
        if (config.charactersList.length > 1) {
            setConfig(prev => ({
                ...prev,
                charactersList: prev.charactersList.filter((_, i) => i !== index)
            }));
        }
    };

    const updateCharacter = (index, field, value) => {
        const newList = [...config.charactersList];
        newList[index][field] = value;
        setConfig({ ...config, charactersList: newList });
    };

    const handleOrchestrate = async () => {
        if (!config.teachingFocus.trim()) {
            return alert("Por favor, defina o Tópico de Ensino (ex: 'Ponteiros em C', 'Loop For'). A IA precisa disso para criar as questões.");
        }
        if (!config.narrativeGoal.trim()) return alert("Descreva o enredo.");

        setLoading(true);
        setProgress(0);
        // REMOVIDO: setInterval e cálculos falsos de tempo.

        try {
            const skeletonPath = structure.map(step => ({ id: step.id, type: step.type }))
                .filter(s => ['quiz', 'narrative', 'content'].includes(s.type));

            const socketId = socketRef.current?.id;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content_editor/orchestrate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structure: skeletonPath,
                    config: config,
                    context: contextData,
                    socket_id: socketId
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Força 100% no sucesso, caso o último evento de socket tenha se perdido
                setProgress(100);
                setTimeout(() => {
                    onSuccess(data);
                    onClose();
                }, 600);
            } else {
                alert(`Erro na IA: ${data.message}`);
                setLoading(false);
            }

        } catch (error) {
            console.error(error);
            alert("Erro de conexão.");
            setLoading(false);
        }
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-purple-500/30 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-6 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <FaRobot className="text-2xl" />
                        <div>
                            <h3 className="text-xl font-bold">Roteirista Virtual</h3>
                            <p className="text-xs text-purple-200 opacity-80">Configuração passo {step}/2</p>
                        </div>
                    </div>
                    {!loading && <button onClick={onClose}><FaTimes /></button>}
                </div>

                {/* Body com Scroll */}
                <div className="p-6 overflow-y-auto flex-grow">
                    {/* BARRA DE PROGRESSO REAL */}
                    {loading && (
                        <div className="mb-8 animate-pulse">
                            <div className="flex justify-between text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                                <span>{progressMessage}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-5 dark:bg-gray-700 overflow-hidden shadow-inner">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-5 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2" style={{ width: `${progress}%` }}>
                                    {progress > 5 && <FaMagic className="text-white text-xs animate-spin-slow" />}
                                </div>
                            </div>
                            <p className="text-xs text-center mt-3 text-gray-500 dark:text-gray-400">A IA está pensando...</p>
                        </div>
                    )}
                    {!loading && step === 1 ? (
                        <div className="space-y-6">
                            {/* BLOCO PEDAGÓGICO (NOVO) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <FaBullseye className="text-red-500" /> Tópico de Ensino (Obrigatório)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm focus:ring-2 focus:ring-purple-500"
                                        placeholder="Ex: Diferença entre Git Merge e Rebase"
                                        value={config.teachingFocus}
                                        onChange={e => setConfig({ ...config, teachingFocus: e.target.value })}
                                    />

                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <FaGraduationCap className="text-blue-500" /> Nível da Turma
                                    </label>
                                    <select
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm"
                                        value={config.targetAudience}
                                        onChange={e => setConfig({ ...config, targetAudience: e.target.value })}
                                    >
                                        {AUDIENCE_LEVELS.map(lvl => (
                                            <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {/* Enredo */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                                    <FaBook className="text-purple-500" /> Contexto da História
                                </label>
                                <textarea
                                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm focus:ring-2 focus:ring-purple-500"
                                    rows="3"
                                    placeholder="Ex: O servidor caiu e a equipe precisa analisar os logs para achar o erro de memória..."
                                    value={config.narrativeGoal}
                                    onChange={e => setConfig({ ...config, narrativeGoal: e.target.value })}
                                />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-200 border border-blue-100 dark:border-blue-800">
                                <strong>Dica:</strong> O "Tópico Central" define o conteúdo das aulas. O "Contexto da História" define o cenário onde esse conteúdo será aplicado.
                            </div>

                            {/* Tom e Personalidade */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-sm mb-2 text-gray-600 dark:text-gray-300">Gênero / Tom</label>
                                    <select
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border dark:border-gray-600"
                                        value={config.tone}
                                        onChange={e => setConfig({ ...config, tone: e.target.value })}
                                    >
                                        <option value="aventura">Aventura Épica</option>
                                        <option value="mistério">Investigação / Mistério</option>
                                        <option value="scifi">Ficção Científica</option>
                                        <option value="humor">Comédia / Descontraído</option>
                                        <option value="corporativo">Corporativo / Realista</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-sm mb-2 text-gray-600 dark:text-gray-300">Personalidade da IA</label>
                                    <select
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border dark:border-gray-600"
                                        value={config.personality}
                                        onChange={e => setConfig({ ...config, personality: e.target.value })}
                                    >
                                        {PERSONALITIES.map(p => (
                                            <option key={p.id} value={p.id}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Descrição da Personalidade */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-200">
                                {PERSONALITIES.find(p => p.id === config.personality)?.desc}
                            </div>
                        </div>
                    ) : !loading && (
                        <div className="space-y-6">
                            {/* Gestão de Personagens */}
                            <div>
                                <label className="block font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                    <FaUsers className="text-purple-500" /> Elenco (Máx 4)
                                </label>
                                <div className="space-y-3">
                                    {config.charactersList.map((char, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <div className="bg-gray-200 dark:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-500">
                                                {index + 1}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Nome (ex: Ana)"
                                                className="flex-1 p-2 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                                value={char.role}
                                                onChange={(e) => updateCharacter(index, 'role', e.target.value)}
                                            />
                                            <select
                                                className="p-2 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm"
                                                value={char.type}
                                                onChange={(e) => updateCharacter(index, 'type', e.target.value)}
                                            >
                                                <option value="Mentor">Mentor (Instrutor)</option>
                                                <option value="Aluno">Aluno (Jovem)</option>
                                            </select>
                                            {config.charactersList.length > 1 && (
                                                <button onClick={() => removeCharacter(index)} className="text-red-500 hover:bg-red-100 p-2 rounded">
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {config.charactersList.length < 4 && (
                                    <button onClick={addCharacter} className="mt-3 text-sm text-purple-600 font-bold flex items-center gap-1 hover:underline">
                                        <FaPlus /> Adicionar Personagem
                                    </button>
                                )}
                            </div>

                            <hr className="border-gray-200 dark:border-gray-700" />

                            {/* Sliders de Controle */}
                            <div>
                                <label className="block font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                                    <FaSlidersH className="text-purple-500" /> Ajustes Finos
                                </label>

                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Perguntas por Quiz</span>
                                        <span className="font-bold text-purple-600">{config.questionsPerQuiz}</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="10"
                                        value={config.questionsPerQuiz}
                                        onChange={e => setConfig({ ...config, questionsPerQuiz: parseInt(e.target.value) })}
                                        className="w-full accent-purple-600"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Linhas de Diálogo (aprox.)</span>
                                        <span className="font-bold text-purple-600">{config.linesPerNarrative}</span>
                                    </div>
                                    <input
                                        type="range" min="3" max="12"
                                        value={config.linesPerNarrative}
                                        onChange={e => setConfig({ ...config, linesPerNarrative: parseInt(e.target.value) })}
                                        className="w-full accent-purple-600"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                    {step === 2 && (
                        <button
                            onClick={() => setStep(1)}
                            disabled={loading}
                            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold"
                        >
                            Voltar
                        </button>
                    )}

                    <button
                        onClick={step === 1 ? () => setStep(2) : handleOrchestrate}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                Criando Roteiro...
                            </>
                        ) : (
                            step === 1 ? 'Continuar para Personagens' : <><FaMagic /> Gerar História</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIConfigModal;