import React, { useState, useRef, useEffect } from 'react';
import { FaMagic, FaTimes, FaRobot, FaBook, FaUsers, FaPlus, FaTrash, FaSlidersH, FaBullseye, FaGraduationCap, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { useToast } from '../../context/ToastContext';

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
    const { showToast } = useToast();
    // Refs para garantir que o socket não reconecte se as funções do pai mudarem (evita desconexões no log)
    const onSuccessRef = useRef(onSuccess);
    const onCloseRef = useRef(onClose);
    useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

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

    // Consolida toda a lógica de socket em um único useEffect.
    useEffect(() => {
        // Se o modal não estiver aberto, não faz nada.
        if (!isOpen) {
            return;
        }

        // 1. Reset de Estado Inicial ao abrir o modal
        setLoading(false);
        setProgress(0);
        setProgressMessage("Aguardando configuração...");

        // Pre-preencher dados se disponíveis no contexto (template)
        if (contextData) {
            setConfig(prev => ({
                ...prev,
                teachingFocus: prev.teachingFocus || contextData.title || "",
                narrativeGoal: prev.narrativeGoal || contextData.description || ""
            }));
        }

        // 2. Conexão com o Socket
        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socket = io(socketUrl, {
            transports: ['websocket'], // Força WebSocket (evita polling em túneis)
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 60000, // Aumenta timeout de conexão para 60s
            forceNew: true
        });
        socketRef.current = socket;

        // 3. Lógica de Conexão e Inscrição na Sala
        socket.on('connect', () => {
            console.log("Socket Conectado. ID:", socket.id);
            // Emite o evento 'join' para a sala específica do usuário
            socket.emit('join', `user_ai_${user.id}`);
        });

        // 4. Listeners para os eventos de progresso da IA
        socket.on('ai_progress', (data) => {
            // Garante que o progresso não ultrapasse 100% ou seja inválido
            const safePercent = Math.min(Math.max(data.percent || 0, 0), 99);
            setProgress(safePercent);
            setProgressMessage(data.message || "Processando...");
        });

        socket.on('ai_complete', (data) => {
            const contentMap = data.result || data;

            if (!contentMap || typeof contentMap !== 'object' || Object.keys(contentMap).length === 0) {
                showToast("A IA não conseguiu gerar o conteúdo. Tente novamente.");
                setLoading(false);
                return;
            }

            setProgress(100);
            setProgressMessage("Roteiro concluído!");
            setTimeout(() => {
                if (onSuccessRef.current) onSuccessRef.current(contentMap);
                if (onCloseRef.current) onCloseRef.current();
            }, 1500);
        });

        socket.on('ai_error', (data) => {
            showToast(`Erro na geração: ${data.message}`);
            setLoading(false); // Libera o botão para nova tentativa
        });

        // 5. Função de Cleanup: Roda quando o modal fecha (isOpen se torna false)
        return () => {
            if (socket) {
                console.log("Desconectando socket...");
                socket.disconnect();
            }
        };
    }, [isOpen, user.id]); // Removido onSuccess e onClose das dependências para estabilizar conexão

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
            return showToast("Por favor, defina o Tópico de Ensino (ex: 'Ponteiros em C', 'Loop For'). A IA precisa disso para criar as questões.");
        }
        if (!config.narrativeGoal.trim()) return showToast("Descreva o enredo.");

        setLoading(true);
        setProgress(2);
        setProgressMessage("Conectando ao servidor...");

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content_editor/orchestrate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structure,
                    config,
                    context: contextData
                    // O socket_id não é mais necessário, o backend usará o room_id derivado do JWT
                })
            });
            if (response.status === 202) {
                // Sucesso no início. Não fazemos nada aqui, 
                // apenas esperamos os eventos 'ai_progress' e 'ai_complete'.
                console.log("Geração assíncrona iniciada...");
            } else {
                const errorData = await response.json();
                showToast(`Erro ao iniciar: ${errorData.message}`);
                setLoading(false);
            }
        } catch (error) {
            showToast("Erro de conexão com o servidor.");
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
                                    <label className="block font-bold text-sm mb-2 text-gray-600 dark:text-gray-300">Personalidade da Historia</label>
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
                        {/* O conteúdo do botão muda, mas o elemento <button> permanece no DOM */}
                        {loading && (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                Criando Roteiro...
                            </span>
                        )}
                        {!loading && step === 1 && 'Continuar para Personagens'}
                        {!loading && step === 2 && <><FaMagic /> Gerar História</>}

                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIConfigModal;