import React, { useState } from 'react';
import { FaMagic, FaTimes, FaRobot, FaBook, FaUsers, FaPlus, FaTrash, FaSlidersH } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const PERSONALITIES = [
    { id: 'Socrático', label: 'Mestre Socrático (Faz pensar)', desc: 'Foca em perguntas reflexivas e aprendizado guiado.' },
    { id: 'Hardcore', label: 'Desafiador (Hardcore)', desc: 'Perguntas difíceis, tom sério de urgência.' },
    { id: 'Divertido', label: 'Colega Divertido', desc: 'Usa humor, gírias leves e analogias engraçadas.' },
    { id: 'Storyteller', label: 'Narrador Épico', desc: 'Foco total na imersão e dramatismo da história.' }
];

const AIConfigModal = ({ isOpen, onClose, onSuccess, activityId, structure, contextData }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1 = Config Básica, 2 = Personagens/Avançado

    // Estado complexo de configuração
    const [config, setConfig] = useState({
        narrativeGoal: "",
        tone: "aventura",
        personality: "Socrático",
        questionsPerQuiz: 4,
        linesPerNarrative: 6,
        charactersList: [
            { role: "Capitã Debug", type: "Mentor" },
            { role: "Recruta Zero", type: "Aluno" }
        ]
    });

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
        if (!config.narrativeGoal.trim()) return alert("Descreva o enredo.");
        if (config.charactersList.some(c => !c.role.trim())) return alert("Dê nomes a todos os personagens.");

        setLoading(true);

        try {
            const skeletonPath = structure.map(step => ({ id: step.id, type: step.type }))
                .filter(s => ['quiz', 'narrative'].includes(s.type));

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content_editor/orchestrate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structure: skeletonPath,
                    config: config, // Envia o objeto config completo e expandido
                    context: contextData
                })
            });

            const data = await response.json();
            if (response.ok) {
                onSuccess(data);
                onClose();
            } else {
                alert(`Erro na IA: ${data.message}`);
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

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

                    {step === 1 ? (
                        <div className="space-y-6">
                            {/* Enredo */}
                            <div>
                                <label className="block font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                                    <FaBook className="text-purple-500" /> Sobre o que é a história?
                                </label>
                                <textarea
                                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
                                    rows="3"
                                    placeholder="Ex: O servidor caiu e precisamos usar comandos SQL para restaurar o backup antes que os dados sejam perdidos..."
                                    value={config.narrativeGoal}
                                    onChange={e => setConfig({ ...config, narrativeGoal: e.target.value })}
                                />
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
                    ) : (
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