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
        <div className="w-full max-w-6xl mx-auto p-4 text-primary-text animate-fade-in">
            <button onClick={onReturn} className="absolute top-4 left-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200">
                <FaArrowLeft /> Voltar
            </button>
            <header className="text-center mb-8 pt-8">
                <h1 className="text-4xl font-bold text-yellow-300">Meu Estilo</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                {isSaving && <div className="absolute inset-0 bg-black/50 flex justify-center items-center z-10 rounded-xl"><FaSpinner className="animate-spin text-3xl" /></div>}

                <div className="lg:col-span-1 bg-primary-bg/50 p-6 rounded-xl border border-border-color self-start">
                    <h2 className="text-2xl font-semibold mb-4 text-center">Preview no Ranking</h2>
                    <div className="bg-primary-bg p-4 rounded-lg flex items-center gap-4">
                        <img src={equipped.avatarUrl || user.profile_picture || '/avatars/default_avatar.webp'} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" />
                        {/* --- CORREÇÃO DE LAYOUT: Adicionado 'flex flex-col' para o título ficar abaixo do nome --- */}
                        <div className="flex flex-col">
                            <CosmeticPreview text={user.name} cosmetic={findCosmetic(equipped.nameCosmeticId)?.effect_id} defaultText="Seu Nome" className="text-lg font-bold" />
                            <CosmeticPreview text={findTitle(equipped.titleId)?.displayText} cosmetic={findCosmetic(equipped.titleCosmeticId)?.effect_id} defaultText="Sem Título" className="text-sm" />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3"><FaUserCircle /> Avatares</h3>
                        <div className="flex flex-wrap gap-4 bg-primary-bg/50 p-4 rounded-lg">
                            {unlockedAvatars.map(avatar => (
                                <button key={avatar.url} onClick={() => handleEquip('/avatar', { avatar_url: avatar.url }, () => setEquipped(p => ({ ...p, avatarUrl: avatar.url })))}
                                    className={`w-20 h-20 rounded-lg border-4 overflow-hidden transition-all ${equipped.avatarUrl === avatar.url ? 'border-yellow-400 scale-110' : 'border-gray-600'}`}>
                                    <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3"><FaCrown /> Títulos</h3>
                        <div className="flex flex-wrap gap-2 bg-primary-bg/50 p-4 rounded-lg">
                            <button onClick={() => handleEquip('/equip-title', { title_id: null }, () => setEquipped(p => ({ ...p, titleId: null })))}
                                className={`px-4 py-2 rounded-md text-sm ${!equipped.titleId ? 'bg-blue-600 text-primary-text' : 'bg-border-color hover:bg-hover-bg-color'}`}>
                                Nenhum Título
                            </button>
                            {unlockedTitles.map(title => (
                                <button key={title.id} onClick={() => handleEquip('/equip-title', { title_id: title.id }, () => setEquipped(p => ({ ...p, titleId: title.id })))}
                                    className={`px-4 py-2 rounded-md text-sm ${equipped.titleId === title.id ? 'bg-blue-600 text-primary-text' : 'bg-border-color hover:bg-hover-bg-color'}`}>
                                    {title.displayText}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3"><FaPaintBrush /> Efeitos Cosméticos</h3>
                        <div className="bg-primary-bg/50 p-4 rounded-lg">
                            <p className="text-sm text-secondary-text mb-4">{selectedCosmetic ? `Clique em um dos botões "Aplicar Efeito" para usar ${selectedCosmetic.name}.` : 'Selecione um efeito abaixo e depois escolha onde aplicá-lo.'}</p>

                            <div className="flex flex-wrap gap-4 border-b border-border-color pb-4 mb-4">
                                {unlockedCosmetics.map(cosmetic => (
                                    <button key={cosmetic.id} onClick={() => setSelectedCosmetic(cosmetic)}
                                        className={`p-2 rounded-lg border-2 transition-all ${selectedCosmetic?.id === cosmetic.id ? 'border-yellow-400 scale-110' : 'border-gray-600'}`}>
                                        <CosmeticPreview text={cosmetic.name} cosmetic={cosmetic.effect_id} />
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-primary-bg/50 p-4 rounded-lg">
                                    <h4 className="font-bold">Nome de Jogador</h4>
                                    <div className="my-2 h-16 flex items-center justify-center bg-primary-bg rounded">
                                        <CosmeticPreview text={user.name} cosmetic={findCosmetic(equipped.nameCosmeticId)?.effect_id} defaultText="Seu Nome" className="text-2xl" />
                                    </div>
                                    <button onClick={() => handleEquipCosmetic('name')} disabled={!selectedCosmetic || isSaving}
                                        className="w-full py-2 bg-green-600 rounded disabled:bg-gray-600 hover:bg-green-500">
                                        {selectedCosmetic?.id === equipped.nameCosmeticId ? 'Remover Efeito' : 'Aplicar Efeito'}
                                    </button>
                                </div>
                                <div className="bg-primary-bg/50 p-4 rounded-lg">
                                    <h4 className="font-bold">Título</h4>
                                    <div className="my-2 h-16 flex items-center justify-center bg-primary-bg rounded">
                                        <CosmeticPreview text={findTitle(equipped.titleId)?.displayText} cosmetic={findCosmetic(equipped.titleCosmeticId)?.effect_id} defaultText="Sem Título" className="text-lg" />
                                    </div>
                                    <button onClick={() => handleEquipCosmetic('title')} disabled={!selectedCosmetic || isSaving}
                                        className="w-full py-2 bg-green-600 rounded disabled:bg-gray-600 hover:bg-green-500">
                                        {selectedCosmetic?.id === equipped.titleCosmeticId ? 'Remover Efeito' : 'Aplicar Efeito'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomizationTab;