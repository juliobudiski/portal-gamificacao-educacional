// frontend/src/components/activity/CustomizationTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaSpinner, FaCrown, FaPaintBrush, FaUserCircle } from 'react-icons/fa';

// Componente de preview reutilizável para aplicar estilos cosméticos
const CosmeticPreview = ({ text, cosmetic, defaultText, className }) => {
    const style = {};
    if (cosmetic?.type === 'color') {
        style.color = cosmetic.color;
        if (cosmetic.effect === 'neon') {
            style.textShadow = `0 0 5px ${cosmetic.color}, 0 0 7px ${cosmetic.color}`;
        }
    }
    return <span style={style} className={`transition-all duration-300 ${className}`}>{text || defaultText}</span>;
};


const CustomizationTab = ({ activityId, onReturn, onCustomizationChange }) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Dados da API
    const [unlockedTitles, setUnlockedTitles] = useState([]);
    const [unlockedCosmetics, setUnlockedCosmetics] = useState([]);
    const [unlockedAvatars, setUnlockedAvatars] = useState([]);

    // Estado local para os itens equipados (para feedback instantâneo na UI)
    const [equipped, setEquipped] = useState({
        avatarUrl: null,
        titleId: null,
        nameCosmeticId: null,
        titleCosmeticId: null,
    });

    // Estado para o modo de seleção de cosmético
    const [selectedCosmetic, setSelectedCosmetic] = useState(null);

    // Carrega todos os dados de customização do backend
    useEffect(() => {
        const loadAllData = async () => {
            setIsLoading(true);
            try {
                const fetchApi = (endpoint) => fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, { headers: { 'Authorization': `Bearer ${user.token}` } }).then(res => {
                    if (!res.ok) throw new Error(`Falha na requisição para ${endpoint}`);
                    return res.json();
                });

                const [progressData, titlesData, cosmeticsData] = await Promise.all([
                    fetchApi(`/api/progress/${activityId}`),
                    fetchApi(`/api/progress/${activityId}/unlocked-titles`),
                    fetchApi(`/api/progress/${activityId}/unlocked-cosmetics`)
                ]);

                setUnlockedTitles(titlesData || []);
                setUnlockedCosmetics(cosmeticsData || []);
                setUnlockedAvatars(progressData.unlocked_activity_avatars || []);

                // --- CORREÇÃO PRINCIPAL: Inicializa o estado 'equipped' com os dados da API ---
                // Este bloco corrige o preview e a seleção inicial dos itens.
                setEquipped({
                    avatarUrl: progressData.equipped_activity_avatar_url,
                    titleId: progressData.equipped_title_id,
                    nameCosmeticId: progressData.equipped_name_cosmetic_id,
                    titleCosmeticId: progressData.equipped_title_cosmetic_id,
                });

            } catch (err) {
                setError('Não foi possível carregar seus itens de customização.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadAllData();
    }, [activityId, user.token]);

    // Função genérica para equipar um item
    const handleEquip = useCallback(async (endpoint, body, successCallback) => {
        setIsSaving(true);
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/progress/${activityId}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify(body),
            });
            successCallback();
            onCustomizationChange?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    }, [activityId, user.token, onCustomizationChange]);

    const handleEquipCosmetic = (slot) => {
        if (!selectedCosmetic) return;
        const currentEquippedId = slot === 'name' ? equipped.nameCosmeticId : equipped.titleCosmeticId;
        const itemIdToEquip = selectedCosmetic.id === currentEquippedId ? null : selectedCosmetic.id;

        handleEquip('/equip-cosmetic', { item_id: itemIdToEquip, slot }, () => {
            setEquipped(prev => ({ ...prev, [`${slot}CosmeticId`]: itemIdToEquip }));
            setSelectedCosmetic(null);
        });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><FaSpinner className="animate-spin text-4xl text-yellow-400" /></div>;
    }

    const findCosmetic = (id) => unlockedCosmetics.find(c => c.id === id);
    const findTitle = (id) => unlockedTitles.find(t => t.id === id);

    return (
        <div className="relative pt-16 w-full max-w-6xl mx-auto p-8 mb-12 text-primary-text animate-fade-in bg-gray-900 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden">
            {/* Efeitos de luz ao fundo */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

            <div className='flex-shrink-0 relative z-20'>
                <button
                    onClick={onReturn}
                    className="absolute top-0 left-0 flex items-center gap-2 py-2 px-4 
                                bg-black/50 text-gray-300 font-bold backdrop-blur-md
                                border border-white/10 rounded-full shadow-lg 
                                hover:bg-white/10 hover:text-white hover:scale-105 transition-all"
                >
                    <FaArrowLeft /> Voltar ao Tabuleiro
                </button>
            </div>
            <header className="text-center mb-10 pt-4 relative z-10">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">Meu Estilo</h1>
                <p className="text-gray-400 mt-2">Personalize sua identidade e exiba suas conquistas.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {isSaving && <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 rounded-2xl"><FaSpinner className="animate-spin text-4xl text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" /></div>}

                {/* Coluna da Esquerda: Preview */}
                <div className="lg:col-span-1 bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 self-start shadow-inner">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-200 flex items-center justify-center gap-2">
                        <FaUserCircle className="text-cyan-400" /> Preview
                    </h2>
                    <div className="bg-gradient-to-b from-gray-800 to-black p-6 rounded-xl flex flex-col items-center gap-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                        {/* Brilho interativo no card de preview */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>

                        <div className="relative">
                            <div className="absolute inset-0 rounded-full blur-md bg-cyan-500/30"></div>
                            <img src={equipped.avatarUrl || user.profile_picture || '/avatars/default_avatar.webp'} alt="Avatar" className="relative w-32 h-32 rounded-full object-cover border-4 border-gray-700 shadow-[0_0_20px_rgba(0,0,0,0.8)] z-10" />
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <CosmeticPreview text={user.name} cosmetic={findCosmetic(equipped.nameCosmeticId)?.effect_id} defaultText="Seu Nome" className="text-2xl font-extrabold tracking-tight mb-1" />
                            <CosmeticPreview text={findTitle(equipped.titleId)?.displayText} cosmetic={findCosmetic(equipped.titleCosmeticId)?.effect_id} defaultText="Sem Título" className="text-sm font-semibold uppercase tracking-widest opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Seleção */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Avatares */}
                    <div className="bg-black/30 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-lg">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-gray-200">
                            <div className="p-2 bg-purple-500/20 rounded-lg"><FaUserCircle className="text-purple-400" /></div> 
                            Avatares Desbloqueados
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            {unlockedAvatars.map(avatar => (
                                <button key={avatar.url} onClick={() => handleEquip('/avatar', { avatar_url: avatar.url }, () => setEquipped(p => ({ ...p, avatarUrl: avatar.url })))}
                                    className={`relative w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-110 shadow-lg ${equipped.avatarUrl === avatar.url ? 'ring-4 ring-purple-500 ring-offset-2 ring-offset-black scale-105 shadow-[0_0_20px_rgba(168,85,247,0.6)]' : 'border border-gray-700 opacity-80 hover:opacity-100 hover:border-gray-500'}`}>
                                    <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                                </button>
                            ))}
                            {unlockedAvatars.length === 0 && <p className="text-gray-500 text-sm italic">Nenhum avatar desbloqueado.</p>}
                        </div>
                    </div>

                    {/* Títulos */}
                    <div className="bg-black/30 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-lg">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-gray-200">
                            <div className="p-2 bg-yellow-500/20 rounded-lg"><FaCrown className="text-yellow-400" /></div> 
                            Títulos de Prestígio
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={() => handleEquip('/equip-title', { title_id: null }, () => setEquipped(p => ({ ...p, titleId: null })))}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${!equipped.titleId ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}>
                                Sem Título
                            </button>
                            {unlockedTitles.map(title => (
                                <button key={title.id} onClick={() => handleEquip('/equip-title', { title_id: title.id }, () => setEquipped(p => ({ ...p, titleId: title.id })))}
                                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-md ${equipped.titleId === title.id ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}>
                                    {title.displayText}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Efeitos Cosméticos */}
                    <div className="bg-black/30 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-lg">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-gray-200">
                            <div className="p-2 bg-pink-500/20 rounded-lg"><FaPaintBrush className="text-pink-400" /></div> 
                            Efeitos Visuais
                        </h3>
                        <p className="text-sm text-gray-400 mb-6 font-medium bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                            {selectedCosmetic ? <span className="text-pink-400">Excelente! Agora clique em "Aplicar" no bloco abaixo onde deseja usar <strong>{selectedCosmetic.name}</strong>.</span> : 'Selecione um efeito da lista abaixo e depois escolha onde aplicá-lo (Nome ou Título).'}
                        </p>

                        <div className="flex flex-wrap gap-4 border-b border-gray-800 pb-6 mb-6">
                            {unlockedCosmetics.map(cosmetic => (
                                <button key={cosmetic.id} onClick={() => setSelectedCosmetic(cosmetic)}
                                    className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 font-bold tracking-wide shadow-md ${selectedCosmetic?.id === cosmetic.id ? 'border-pink-500 bg-pink-500/10 scale-105 shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'}`}>
                                    <CosmeticPreview text={cosmetic.name} cosmetic={cosmetic.effect_id} />
                                </button>
                            ))}
                            {unlockedCosmetics.length === 0 && <p className="text-gray-500 text-sm italic">Nenhum efeito cosmético desbloqueado.</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Aplicar ao Nome */}
                            <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-700/50 shadow-inner flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-300 mb-2 uppercase text-xs tracking-wider">Aplicar ao Nome</h4>
                                    <div className="my-4 h-20 flex items-center justify-center bg-black/60 rounded-xl border border-black shadow-inner overflow-hidden">
                                        <CosmeticPreview text={user.name} cosmetic={findCosmetic(equipped.nameCosmeticId)?.effect_id} defaultText="Seu Nome" className="text-2xl font-bold truncate px-4" />
                                    </div>
                                </div>
                                <button onClick={() => handleEquipCosmetic('name')} disabled={!selectedCosmetic || isSaving}
                                    className={`w-full py-3 mt-4 rounded-xl font-bold transition-all duration-300 shadow-lg ${selectedCosmetic?.id === equipped.nameCosmeticId 
                                        ? 'bg-red-900/30 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white' 
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-gray-800 disabled:text-gray-600 disabled:border-none border border-emerald-400/50'}`}>
                                    {selectedCosmetic?.id === equipped.nameCosmeticId ? 'Remover Efeito' : 'Aplicar Efeito'}
                                </button>
                            </div>
                            
                            {/* Aplicar ao Título */}
                            <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-700/50 shadow-inner flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-300 mb-2 uppercase text-xs tracking-wider">Aplicar ao Título</h4>
                                    <div className="my-4 h-20 flex items-center justify-center bg-black/60 rounded-xl border border-black shadow-inner overflow-hidden">
                                        <CosmeticPreview text={findTitle(equipped.titleId)?.displayText} cosmetic={findCosmetic(equipped.titleCosmeticId)?.effect_id} defaultText="Sem Título" className="text-lg font-bold truncate px-4" />
                                    </div>
                                </div>
                                <button onClick={() => handleEquipCosmetic('title')} disabled={!selectedCosmetic || isSaving}
                                    className={`w-full py-3 mt-4 rounded-xl font-bold transition-all duration-300 shadow-lg ${selectedCosmetic?.id === equipped.titleCosmeticId 
                                        ? 'bg-red-900/30 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white' 
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-gray-800 disabled:text-gray-600 disabled:border-none border border-emerald-400/50'}`}>
                                    {selectedCosmetic?.id === equipped.titleCosmeticId ? 'Remover Efeito' : 'Aplicar Efeito'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomizationTab;