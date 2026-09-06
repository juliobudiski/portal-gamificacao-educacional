import React, { useState, useRef, useEffect } from 'react';
import { FaMagic, FaTimes, FaRobot, FaBook, FaUsers, FaPlus, FaTrash, FaSlidersH, FaBullseye, FaGraduationCap, FaToggleOn, FaToggleOff, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

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

/**
 * @component AIConfigModal
 * @description
 * Configuration interface for generating AI-driven narrative content via WebSocket.
 * 
 * Architectural Decisions:
 * - Real-time Communication: Establishes a Socket.io connection scoped to this component's lifecycle to handle long-running asynchronous AI generation tasks gracefully.
 * - Fallback Mechanisms: Implements client-side timeouts (`deadlockTimeoutRef`) to recover from silent WebSocket failures, ensuring robust UX.
 * - Complex State Encapsulation: Groups multiple AI configuration parameters (tone, characters, etc.) into a single `config` state object to simplify the final API payload structure.
 */
const AIConfigModal = ({ isOpen, onClose, onSuccess, activityId, structure, contextData }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(true);
    const [step, setStep] = useState(1); // 1 = Config Básica, 2 = Personagens/Avançado
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState("Iniciando...");
    const socketRef = useRef(null); // Referência para o socket
    const progressInterval = useRef(null); // Referência para o intervalo de progresso
    const deadlockTimeoutRef = useRef(null); // Referência para o timeout de fallback de comunicação
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

        // Buscar status da chave de API
        const fetchApiKey = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/api-keys`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setHasApiKey(!!data.gemini_api_key);
                }
            } catch (error) {
                console.error("Erro ao buscar chaves de API:", error);
            }
        };
        fetchApiKey();

        // Pre-preencher dados se disponíveis no contexto (template)
        if (contextData) {
            setConfig(prev => ({
                ...prev,
                teachingFocus: prev.teachingFocus || contextData.title || "",
                narrativeGoal: prev.narrativeGoal || contextData.description || ""
            }));
        }

        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socket = io(socketUrl, {
            // Removendo transports: ['websocket'] para permitir o long-polling do Cloudflare Tunnel
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            timeout: 120000, // Aumenta timeout de conexão para 120s (2 min) para tolerar IA lenta
            forceNew: true
        });
        socketRef.current = socket;

        // 3. Lógica de Conexão e Inscrição na Sala
        socket.on('connect', () => {
            console.log("Socket Conectado. ID:", socket.id);
            // Continua emitindo join para manter compatibilidade, mas o backend enviará broadcast
            socket.emit('join', `user_ai_${user.id}`);
        });

        // 4. Listeners para os eventos de progresso da IA
        socket.onAny((eventName, ...args) => {
            console.log(`[SOCKET DEBUG] Evento Recebido: ${eventName}`, args);
        });

        socket.on('ai_progress', (data) => {
            if (data.room_id !== `user_ai_${user.id}`) return;
            // Se recebeu evento, significa que a comunicação está viva, podemos dar um "reset" no timeout se quisermos
            const safePercent = Math.min(Math.max(data.percent || 0, 0), 99);
            setProgress(safePercent);
            setProgressMessage(data.message || "Processando...");
        });

        socket.on('ai_complete', (data) => {
            if (data.room_id !== `user_ai_${user.id}`) return;
            if (deadlockTimeoutRef.current) clearTimeout(deadlockTimeoutRef.current);
            const contentMap = data.result || data;

            if (!contentMap || typeof contentMap !== 'object' || Object.keys(contentMap).length === 0) {
                showToast("A IA não conseguiu gerar o conteúdo. O formato retornado é inválido. Tente novamente.", "error");
                setLoading(false);
                setProgressMessage("Falha na geração.");
                return;
            }

            setProgress(100);
            setProgressMessage("Roteiro concluído com sucesso!");
            setTimeout(() => {
                if (onSuccessRef.current) onSuccessRef.current(contentMap);
                if (onCloseRef.current) onCloseRef.current();
            }, 2000);
        });

        socket.on('ai_error', (data) => {
            if (deadlockTimeoutRef.current) clearTimeout(deadlockTimeoutRef.current);
            showToast(`Falha da IA: ${data.message || 'Erro desconhecido'}`, "error");
            setLoading(false); // Libera o botão para nova tentativa
            setProgressMessage("Falha na geração.");
            setProgress(0);
        });

        // Caso ocorra desconexão antes da conclusão (timeout da thread)
        socket.on('disconnect', (reason) => {
            console.warn("Socket Desconectado:", reason);
            // Se desconectou enquanto carregava e a razão foi timeout ou erro de rede
            if (['transport error', 'transport close', 'ping timeout'].includes(reason)) {
                 // Apenas avisar se o loading não estava concluído
            }
        });

        // 5. Função de Cleanup: Roda quando o modal fecha (isOpen se torna false)
        return () => {
            if (deadlockTimeoutRef.current) clearTimeout(deadlockTimeoutRef.current);
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
            return showToast("Por favor, defina o Tópico de Ensino (ex: 'Ponteiros em C', 'Loop For'). A IA precisa disso para criar as questões.", "warning");
        }
        if (!config.narrativeGoal.trim()) return showToast("Descreva o contexto da história.", "warning");

        setLoading(true);
        setProgress(5);
        setProgressMessage("Estabelecendo conexão neural...");

        // Safety fallback: se a IA demorar mais de 120 segundos sem emitir complete/error
        if (deadlockTimeoutRef.current) clearTimeout(deadlockTimeoutRef.current);
        deadlockTimeoutRef.current = setTimeout(() => {
            showToast("A conexão com o Roteirista Virtual expirou ou falhou de forma silenciosa. Tente novamente.", "error");
            setLoading(false);
            setProgressMessage("Falha de Comunicação.");
            setProgress(0);
        }, 120000);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content_editor/orchestrate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structure,
                    config,
                    context: contextData
                })
            });
            if (response.status === 202) {
                console.log("Geração assíncrona iniciada. Aguardando WebSocket...");
            } else {
                const errorData = await response.json();
                showToast(`Erro ao iniciar: ${errorData.message}`, "error");
                setLoading(false);
                setProgressMessage("");
            }
        } catch (error) {
            showToast("Erro de conexão com o servidor. Verifique sua rede.", "error");
            setLoading(false);
            setProgressMessage("");
        }
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">

            <div className="bg-secondary-bg rounded-2xl shadow-2xl w-full max-w-2xl border border-purple-500/30 overflow-hidden flex flex-col max-h-[90vh]">

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
                            <div className="w-full bg-gray-200 rounded-full h-5 dark:bg-hover-bg-color0 overflow-hidden shadow-inner">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-5 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2" style={{ width: `${progress}%` }}>
                                    {progress > 5 && <FaMagic className="text-white text-xs animate-spin-slow" />}
                                </div>
                            </div>
                            <p className="text-xs text-center mt-3 text-secondary-text">A IA está pensando...</p>
                        </div>
                    )}
                    {!loading && step === 1 ? (
                        <div className="space-y-6">
                            {/* BLOCO PEDAGÓGICO (NOVO) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-primary-text mb-2 flex items-center gap-2">
                                        <FaBullseye className="text-red-500" /> Tópico de Ensino (Obrigatório)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-xl bg-primary-bg dark:bg-hover-bg-color0 border border-border-color text-sm text-primary-text focus:ring-2 focus:ring-purple-500"
                                        placeholder="Ex: Diferença entre Git Merge e Rebase"
                                        value={config.teachingFocus}
                                        onChange={e => setConfig({ ...config, teachingFocus: e.target.value })}
                                    />

                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-primary-text mb-2 flex items-center gap-2">
                                        <FaGraduationCap className="text-blue-500" /> Nível da Turma
                                    </label>
                                    <select
                                        className="w-full p-3 rounded-xl bg-primary-bg dark:bg-hover-bg-color0 border border-border-color text-sm text-primary-text"
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
                                <label className="block text-sm font-bold text-primary-text mb-2 flex items-center gap-2">
                                    <FaBook className="text-purple-500" /> Contexto da História
                                </label>
                                <textarea
                                    className="w-full p-3 rounded-xl bg-primary-bg dark:bg-hover-bg-color0 border border-border-color text-sm text-primary-text focus:ring-2 focus:ring-purple-500"
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
                                    <label className="block font-bold text-sm mb-2 text-secondary-text">Gênero / Tom</label>
                                    <select
                                        className="w-full p-3 rounded-xl bg-primary-bg dark:bg-hover-bg-color0 border border-border-color text-primary-text"
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
                                    <label className="block font-bold text-sm mb-2 text-secondary-text">Personalidade da Historia</label>
                                    <select
                                        className="w-full p-3 rounded-xl bg-primary-bg dark:bg-hover-bg-color0 border border-border-color text-primary-text"
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
                                <label className="block font-bold text-primary-text mb-3 flex items-center gap-2">
                                    <FaUsers className="text-purple-500" /> Elenco (Máx 4)
                                </label>
                                <div className="space-y-3">
                                    {config.charactersList.map((char, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <div className="bg-border-color w-8 h-8 rounded-full flex items-center justify-center font-bold text-secondary-text">
                                                {index + 1}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Nome (ex: Ana)"
                                                className="flex-1 p-2 rounded-lg border bg-primary-bg border-border-color text-primary-text"
                                                value={char.role}
                                                onChange={(e) => updateCharacter(index, 'role', e.target.value)}
                                            />
                                            <select
                                                className="p-2 rounded-lg border bg-primary-bg border-border-color text-primary-text text-sm"
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

                            <hr className="border-border-color" />

                            {/* Sliders de Controle */}
                            <div>
                                <label className="block font-bold text-primary-text mb-4 flex items-center gap-2">
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
                <div className="p-6 bg-primary-bg/50 border-t border-border-color flex flex-col gap-3">
                    {!hasApiKey && step === 2 && (
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm flex items-start gap-2 mb-2">
                            <FaExclamationTriangle className="mt-1 flex-shrink-0" />
                            <div>
                                <strong>Aviso:</strong> Você não possui uma chave de API configurada. O sistema usará a cota compartilhada, o que pode causar lentidão. 
                                <button onClick={() => navigate('/profile')} className="ml-1 underline font-bold hover:text-yellow-600">Configurar Chave no Perfil</button>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 w-full">
                        {step === 2 && (
                            <button
                                onClick={() => setStep(1)}
                                disabled={loading}
                                className="px-6 py-3 rounded-xl border border-border-color text-primary-text hover:bg-hover-bg-color0 font-bold"
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
                            {!loading && step === 2 && <span className="flex items-center gap-2"><FaMagic /> Gerar História</span>}

                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIConfigModal;