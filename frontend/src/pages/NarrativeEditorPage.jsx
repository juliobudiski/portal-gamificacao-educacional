import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaImage, FaUserCircle, FaSave, FaPlus, FaTrash, FaBookOpen } from 'react-icons/fa';
import { useActivityCreation } from '../context/ActivityCreationContext';
// Debug mode control
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

// --- Listas de recursos visuais disponíveis ---
const SCENARIOS = [
    '/narrativa/cenarios/cenario1.webp',
    '/narrativa/cenarios/cenario2.webp',
    '/narrativa/cenarios/cenario3.webp',
    '/narrativa/cenarios/cenario4.webp',
];

const CHARACTERS = [
    '/narrativa/personagens/instrutor1.webp',
    '/narrativa/personagens/instrutor2.webp',
    '/narrativa/personagens/aluno1.webp',
    '/narrativa/personagens/aluno2.webp',
];

/**
 * @component
 * @desc Página de edição de narrativa para atividades gamificadas
 * Permite configurar cenários, personagens e diálogos para atividades
 */
/**
 * Componente NarrativeEditorPage
 * 
 * Página focada na configuração da camada narrativa/storytelling de uma atividade gamificada.
 */
function NarrativeEditorPage({ initialData, onSave, onCancel, isOfflineMode = false }) {
    const { activityId, stepId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { activityData } = useActivityCreation();

    // ESTADO HÍBRIDO
    const [narrativeConfig, setNarrativeConfig] = useState(() => {
        if (initialData && Object.keys(initialData).length > 0) return initialData;
        // Fallback
        const stepContent = activityData?.gamificationDesign?.progression_path?.find(p => p.id === stepId)?.content;
        return stepContent || { scenario: '', characters: [], dialogue: [] };
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // FETCH (Apenas Online)
    const fetchContent = useCallback(async () => {
        if (isOfflineMode || !activityId || !stepId || !user?.token) return;

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content_editor/activity/${activityId}/step/${stepId}/content?type=narrative`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await response.json();
            if (response.ok && data) {
                setNarrativeConfig({
                    scenario: data.scenario || '',
                    characters: data.characters || [],
                    dialogue: data.dialogue || [],
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activityId, stepId, user?.token, isOfflineMode]);

    useEffect(() => { fetchContent(); }, [fetchContent]);

    // --- Handlers para as mudanças no formulário ---

    const handleSelectScenario = (scenarioUrl) => {
        if (isDebugMode) {
            console.log('[NarrativeEditorPage] Cenário selecionado:', scenarioUrl);
        }
        setNarrativeConfig(prev => ({ ...prev, scenario: scenarioUrl }));
    };

    const handleToggleCharacter = (charUrl) => {
        if (isDebugMode) {
            console.log('[NarrativeEditorPage] Alternando personagem:', charUrl);
        }
        setNarrativeConfig(prev => {
            const isSelected = prev.characters.some(c => c.image === charUrl);
            if (isSelected) {
                return { ...prev, characters: prev.characters.filter(c => c.image !== charUrl) };
            } else {
                const newCharacter = {
                    role: `Personagem ${prev.characters.length + 1}`,
                    image: charUrl
                };
                return { ...prev, characters: [...prev.characters, newCharacter] };
            }
        });
    };

    const handleRoleChange = (index, newRole) => {
        if (isDebugMode) {
            console.log(`[NarrativeEditorPage] Alterando papel do personagem ${index} para: ${newRole}`);
        }
        setNarrativeConfig(prev => {
            const updatedCharacters = [...prev.characters];
            updatedCharacters[index].role = newRole;
            return { ...prev, characters: updatedCharacters };
        });
    };

    const handleDialogueChange = (index, field, value) => {
        if (isDebugMode) {
            console.log(`[NarrativeEditorPage] Alterando diálogo ${index}.${field}: ${value.substring(0, 20)}...`);
        }
        setNarrativeConfig(prev => {
            const updatedDialogue = [...prev.dialogue];
            updatedDialogue[index][field] = value;
            return { ...prev, dialogue: updatedDialogue };
        });
    };

    const handleAddDialogueLine = () => {
        if (isDebugMode) {
            console.log('[NarrativeEditorPage] Adicionando linha de diálogo');
        }
        setNarrativeConfig(prev => ({
            ...prev,
            dialogue: [...prev.dialogue, { characterRole: '', text: '' }]
        }));
    };

    const handleRemoveDialogueLine = (index) => {
        if (isDebugMode) {
            console.log(`[NarrativeEditorPage] Removendo linha de diálogo ${index}`);
        }
        setNarrativeConfig(prev => ({
            ...prev,
            dialogue: prev.dialogue.filter((_, i) => i !== index)
        }));
    };

    // --- Handler para Salvar ---
    const handleSaveChanges = async () => {
        // 1. OFFLINE
        if (isOfflineMode) {
            if (onSave) onSave(narrativeConfig);
            return;
        }

        // 2. ONLINE
        setLoading(true);
        try {
            const payload = { type: 'narrative', ...narrativeConfig };
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/content_editor/activity/${activityId}/step/${stepId}/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Falha ao salvar');
            setMessage('Salvo com sucesso!');
            setTimeout(() => navigate(`/professor/atividades/${activityId}/edit`, { state: { fromStep: 5 } }), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Carregando...</div>;

    // Renderização condicional para estados de UI
    const renderContent = () => {
        if (loading) {
            return <div className="text-center text-primary-text p-10">Carregando editor de narrativa...</div>;
        }

        if (error) {
            return <div className="text-center text-red-500 p-10">Erro: {error}</div>;
        }

        return (
            <>
                {/* Seção de Cenário */}
                <div className="bg-black/40 backdrop-blur-lg p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-8 border border-white/10">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                        <div className="bg-teal-500/20 p-2 rounded-lg">
                             <FaImage className="text-teal-400" />
                        </div>
                        Selecionar Cenário Holográfico
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {SCENARIOS.map(url => (
                            <div key={url} onClick={() => handleSelectScenario(url)}
                                className={`rounded-2xl overflow-hidden border-4 cursor-pointer transition-all duration-300 shadow-lg relative group
                            ${narrativeConfig.scenario === url
                                        ? 'border-yellow-400 scale-105 shadow-[0_0_25px_rgba(250,204,21,0.5)]'
                                        : 'border-white/10 hover:border-yellow-400/50'}`}>
                                <img src={url} alt={`Cenário ${url}`} className="w-full h-32 md:h-40 object-cover group-hover:scale-110 transition-transform duration-700" />
                                {narrativeConfig.scenario === url && (
                                    <div className="absolute inset-0 bg-yellow-400/20 mix-blend-overlay"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seção de Personagens */}
                <div className="bg-black/40 backdrop-blur-lg p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-8 border border-white/10">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                        <div className="bg-purple-500/20 p-2 rounded-lg">
                            <FaUserCircle className="text-purple-400" />
                        </div>
                        Recrutar Personagens
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        {CHARACTERS.map(url => (
                            <div key={url} onClick={() => handleToggleCharacter(url)}
                                className={`rounded-full border-4 cursor-pointer transition-all duration-300 flex justify-center p-2 relative group
                            ${narrativeConfig.characters.some(c => c.image === url)
                                        ? 'border-green-400 scale-105 shadow-[0_0_25px_rgba(74,222,128,0.5)] bg-green-400/10'
                                        : 'border-white/10 hover:border-green-400/50 bg-black/50'}`}>
                                <img src={url} alt={`Personagem ${url}`} className="w-28 h-28 md:w-36 md:h-36 object-contain rounded-full drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                            </div>
                        ))}
                    </div>
                    {narrativeConfig.characters.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/10 pt-8">
                            {narrativeConfig.characters.map((char, index) => (
                                <div key={index} className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-2xl border border-white/5">
                                    <div className="bg-black/50 rounded-full border border-white/10 p-1">
                                        <img src={char.image} alt="" className="w-16 h-16 rounded-full object-cover" />
                                    </div>
                                    <input
                                        type="text"
                                        value={char.role}
                                        onChange={(e) => handleRoleChange(index, e.target.value)}
                                        placeholder="Nome do Papel (ex: Instrutor)"
                                        className="w-full p-3 bg-black/40 text-white font-bold rounded-xl border border-white/10 focus:border-green-400/50 outline-none placeholder-gray-500 transition-colors shadow-inner"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Seção de Diálogo */}
                <div className="bg-black/40 backdrop-blur-lg p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-8 border border-white/10">
                    <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                            <FaBookOpen className="text-blue-400" />
                        </div>
                        Roteiro de Diálogos
                    </h3>
                    <div className="space-y-4">
                        {narrativeConfig.dialogue.map((line, index) => (
                            <div key={index} className="flex flex-col md:flex-row items-center gap-3 p-4 bg-gray-900/60 rounded-2xl border border-white/5 shadow-sm group hover:border-blue-500/30 transition-colors">
                                <select
                                    value={line.characterRole}
                                    onChange={(e) => handleDialogueChange(index, 'characterRole', e.target.value)}
                                    className="p-3 bg-black/60 text-white font-bold rounded-xl border border-white/10 focus:border-blue-400/50 outline-none w-full md:w-1/4 shadow-inner appearance-none"
                                >
                                    <option value="" className="bg-gray-900">Personagem...</option>
                                    {narrativeConfig.characters.map(c =>
                                        <option key={c.role} value={c.role} className="bg-gray-900">{c.role}</option>
                                    )}
                                </select>
                                <input
                                    type="text"
                                    value={line.text}
                                    onChange={(e) => handleDialogueChange(index, 'text', e.target.value)}
                                    placeholder="Escreva a fala do personagem aqui..."
                                    className="w-full p-3 bg-black/40 text-gray-200 rounded-xl border border-white/10 focus:border-blue-400/50 outline-none placeholder-gray-600 shadow-inner"
                                />
                                <button onClick={() => handleRemoveDialogueLine(index)}
                                    className="p-3 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl border border-white/5 hover:border-red-500/30 transition-all opacity-70 group-hover:opacity-100"
                                    title="Remover fala">
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddDialogueLine}
                        className="mt-6 flex items-center gap-2 py-3 px-6 bg-gray-800 hover:bg-blue-600/20 hover:text-blue-400 text-gray-300 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all uppercase tracking-wider text-sm font-bold shadow-md">
                        <FaPlus /> Inserir Nova Fala
                    </button>
                </div>

                {/* Salvar */}
                <div className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center">
                    <button onClick={handleSaveChanges} disabled={loading}
                        className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-extrabold text-lg py-4 px-12 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.5)] hover:shadow-[0_0_40px_rgba(20,184,166,0.7)] transition-all duration-300 hover:scale-105 active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto group">
                        <FaSave className="mr-3 transform group-hover:scale-125 transition-transform" /> 
                        {loading ? 'Processando...' : 'Publicar Narrativa'}
                    </button>

                    {/* Mensagens de Feedback */}
                    {message && (
                        <div className="mt-6 p-4 bg-green-900/30 text-green-400 border border-green-500/50 rounded-xl flex items-center font-bold shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                            <span className="text-xl mr-3">✓</span> {message}
                        </div>
                    )}
                    {error && (
                        <div className="mt-6 p-4 bg-red-900/30 text-red-400 border border-red-500/50 rounded-xl flex items-center font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <span className="text-xl mr-3">!</span> {error}
                        </div>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-8 transition-colors duration-300 relative overflow-hidden">
            {/* Luzes holográficas ao fundo */}
            <div className="fixed top-1/4 -left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-0 -right-20 w-[600px] h-[400px] bg-teal-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="flex items-center gap-3 mb-8 bg-black/30 p-6 rounded-3xl border border-white/5 shadow-xl backdrop-blur-md">
                    <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-4 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                        <FaBookOpen className="text-2xl text-gray-900" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 drop-shadow-md">Editor de Narrativa</h1>
                    </div>
                </div>

                {renderContent()}
            </div>
        </div>
    );
}

export default NarrativeEditorPage;