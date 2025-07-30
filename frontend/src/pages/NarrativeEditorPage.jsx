import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaImage, FaUserCircle, FaSave, FaPlus, FaTrash, FaBookOpen } from 'react-icons/fa';

// --- Listas de recursos visuais disponíveis ---
const SCENARIOS = [
    '/narrativa/cenarios/cenario1.png',
    '/narrativa/cenarios/cenario2.png',
    '/narrativa/cenarios/cenario3.png',
    '/narrativa/cenarios/cenario4.png',
];

const CHARACTERS = [
    '/narrativa/personagens/instrutor1.png',
    '/narrativa/personagens/instrutor2.png',
    '/narrativa/personagens/aluno1.png',
    '/narrativa/personagens/aluno2.png',
];

function NarrativeEditorPage() {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // --- Estados do Componente ---
    const [activityTitle, setActivityTitle] = useState('');
    const [narrativeConfig, setNarrativeConfig] = useState({
        scenario: '',
        characters: [], // Ex: [{ role: 'Instrutor 1', image: '/path/to/img.png' }]
        dialogue: [],   // Ex: [{ characterRole: 'Instrutor 1', text: 'Olá!' }]
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // --- Busca os dados da atividade ---
    const fetchActivity = useCallback(async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/activities/${activityId}`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setActivityTitle(data.title);
            // Preenche o estado com a configuração de narrativa existente ou valores padrão
            if (data.gameElements?.narrativeConfig) {
                setNarrativeConfig(data.gameElements.narrativeConfig);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [activityId, user.token]);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    // --- Handlers para as mudanças no formulário ---

    const handleSelectScenario = (scenarioUrl) => {
        setNarrativeConfig(prev => ({ ...prev, scenario: scenarioUrl }));
    };

    const handleToggleCharacter = (charUrl) => {
        setNarrativeConfig(prev => {
            const isSelected = prev.characters.some(c => c.image === charUrl);
            if (isSelected) {
                return { ...prev, characters: prev.characters.filter(c => c.image !== charUrl) };
            } else {
                // Adiciona o personagem com um papel padrão
                const newCharacter = { role: `Personagem ${prev.characters.length + 1}`, image: charUrl };
                return { ...prev, characters: [...prev.characters, newCharacter] };
            }
        });
    };
    
    const handleRoleChange = (index, newRole) => {
        setNarrativeConfig(prev => {
            const updatedCharacters = [...prev.characters];
            updatedCharacters[index].role = newRole;
            return { ...prev, characters: updatedCharacters };
        });
    };

    const handleDialogueChange = (index, field, value) => {
        setNarrativeConfig(prev => {
            const updatedDialogue = [...prev.dialogue];
            updatedDialogue[index][field] = value;
            return { ...prev, dialogue: updatedDialogue };
        });
    };

    const handleAddDialogueLine = () => {
        setNarrativeConfig(prev => ({
            ...prev,
            dialogue: [...prev.dialogue, { characterRole: '', text: '' }]
        }));
    };

    const handleRemoveDialogueLine = (index) => {
        setNarrativeConfig(prev => ({
            ...prev,
            dialogue: prev.dialogue.filter((_, i) => i !== index)
        }));
    };

    // --- Handler para Salvar ---
    const handleSaveChanges = async () => {
        setLoading(true);
        setMessage('');
        setError('');
        try {
            // Primeiro, busca a atividade completa para não sobrescrever outros gameElements
            const activityRes = await fetch(`http://127.0.0.1:5000/api/activities/${activityId}`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            if (!activityRes.ok) throw new Error('Falha ao buscar dados atuais da atividade.');
            const activityData = await activityRes.json();

            // Atualiza apenas a parte da configuração da narrativa
            const updatedGameElements = {
                ...activityData.gameElements,
                narrativeConfig: narrativeConfig
            };

            const response = await fetch(`http://127.0.0.1:5000/api/activities/${activityId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ ...activityData, gameElements: updatedGameElements })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            setMessage('Narrativa salva com sucesso!');
            setTimeout(() => navigate(`/activities/${activityId}`), 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <div className="text-center text-white p-10">Carregando editor de narrativa...</div>;
    if (error) return <div className="text-center text-red-500 p-10">Erro: {error}</div>;

    return (
        <div className="min-h-screen bg-[#2c3135] text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-gradient-to-r from-[#ffbd30] to-[#ff9d00] p-3 rounded-xl">
                        <FaBookOpen className="text-xl text-gray-900" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Editor de Narrativa</h1>
                        <h2 className="text-lg md:text-xl text-[#ffbd30]">{activityTitle}</h2>
                    </div>
                </div>

                {/* Seção de Cenário */}
                <div className="bg-gray-800 p-6 rounded-2xl shadow-xl mb-8">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FaImage /> Selecionar Cenário</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {SCENARIOS.map(url => (
                            <div key={url} onClick={() => handleSelectScenario(url)}
                                className={`rounded-lg overflow-hidden border-4 cursor-pointer transition-all duration-300 ${narrativeConfig.scenario === url ? 'border-yellow-400 scale-105' : 'border-transparent hover:border-yellow-400/50'}`}>
                                <img src={url} alt={`Cenário ${url}`} className="w-full h-32 object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seção de Personagens */}
                <div className="bg-gray-800 p-6 rounded-2xl shadow-xl mb-8">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FaUserCircle /> Selecionar e Nomear Personagens</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {CHARACTERS.map(url => (
                            <div key={url} onClick={() => handleToggleCharacter(url)}
                                className={`rounded-full border-4 cursor-pointer transition-all duration-300 ${narrativeConfig.characters.some(c => c.image === url) ? 'border-green-400 scale-105' : 'border-transparent hover:border-green-400/50'}`}>
                                <img src={url} alt={`Personagem ${url}`} className="w-32 h-32 object-contain rounded-full bg-gray-700/50" />
                            </div>
                        ))}
                    </div>
                    {narrativeConfig.characters.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-4">
                            {narrativeConfig.characters.map((char, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <img src={char.image} alt="" className="w-16 h-16 rounded-full bg-gray-700"/>
                                    <input
                                        type="text"
                                        value={char.role}
                                        onChange={(e) => handleRoleChange(index, e.target.value)}
                                        placeholder="Nome do Papel (ex: Instrutor)"
                                        className="w-full p-2 bg-gray-700 rounded-xl border border-gray-600"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Seção de Diálogo */}
                <div className="bg-gray-800 p-6 rounded-2xl shadow-xl mb-8">
                    <h3 className="text-xl font-bold mb-4">Criar Diálogo</h3>
                    <div className="space-y-4">
                        {narrativeConfig.dialogue.map((line, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                                <select
                                    value={line.characterRole}
                                    onChange={(e) => handleDialogueChange(index, 'characterRole', e.target.value)}
                                    className="p-2 bg-gray-600 rounded-xl border border-gray-500 w-1/4"
                                >
                                    <option value="">Selecione...</option>
                                    {narrativeConfig.characters.map(c => <option key={c.role} value={c.role}>{c.role}</option>)}
                                </select>
                                <input
                                    type="text"
                                    value={line.text}
                                    onChange={(e) => handleDialogueChange(index, 'text', e.target.value)}
                                    placeholder="Escreva a fala do personagem aqui..."
                                    className="w-full p-2 bg-gray-600 rounded-xl border border-gray-500"
                                />
                                <button onClick={() => handleRemoveDialogueLine(index)} className="p-2 bg-red-600 hover:bg-red-700 rounded-full">
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddDialogueLine} className="mt-4 flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg">
                        <FaPlus /> Adicionar Fala
                    </button>
                </div>
                
                {/* Salvar */}
                <div className="mt-8 pt-4 border-t border-gray-700">
                    <button onClick={handleSaveChanges} disabled={loading}
                        className="bg-gradient-to-r from-[#69e8cb] to-[#49d0b0] text-gray-900 font-bold text-lg py-3 px-6 rounded-xl flex items-center">
                        <FaSave className="mr-2" /> {loading ? 'Salvando...' : 'Salvar Narrativa'}
                    </button>
                    {message && <div className="mt-4 p-3 bg-green-900/30 text-green-400 rounded-xl">{message}</div>}
                    {error && <div className="mt-4 p-3 bg-red-900/30 text-red-400 rounded-xl">{error}</div>}
                </div>
            </div>
        </div>
    );
}

export default NarrativeEditorPage;