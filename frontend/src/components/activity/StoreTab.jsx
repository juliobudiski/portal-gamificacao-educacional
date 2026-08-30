// frontend/src/components/activity/StoreTab.jsx
import React, { useState } from 'react';
import { FaCoins, FaPlus, FaTimes, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import ItemCard from './ItemCard';
import { HexColorPicker } from 'react-colorful';
import { useAuth } from '../../context/AuthContext'; // <-- IMPORTADO
import { useParams } from 'react-router-dom'; // <-- IMPORTADO
import { useToast } from '../../context/ToastContext';

// --- LISTA DE ITENS PRÉ-DEFINIDOS (sem alterações) ---
const PREDEFINED_COSMETICS = [
    {
        name: 'Nome Dourado (Neon)',
        description: 'Destaque seu nome no ranking com um brilho dourado.',
        price: 750,
        icon: '🌟',
        item_type: 'cosmetic',
        effect_id: { type: 'color', color: '#FBBF24', effect: 'neon' }
    },
    {
        name: 'Nome Prateado (Neon)',
        description: 'Um visual elegante e prateado para o seu nome no ranking.',
        price: 500,
        icon: '✨',
        item_type: 'cosmetic',
        effect_id: { type: 'color', color: '#D1D5DB', effect: 'neon' }
    }
];
const PREDEFINED_AVATARS = [
    {
        name: 'Gato Mago',
        description: 'Um companheiro místico para suas aventuras.',
        price: 300,
        icon: '😺',
        item_type: 'avatar',
        effect_id: { url: '/avatars/wizard_cat.webp', name: 'Gato Mago', promotable: true }
    },
    {
        name: 'Robô Futurista',
        description: 'Tecnologia de ponta para o aluno moderno.',
        price: 300,
        icon: '🤖',
        item_type: 'avatar',
        effect_id: { url: '/avatars/robot.webp', name: 'Robô Futurista', promotable: false }
    }
];
const PREDEFINED_TITLES = [
    {
        name: 'O Grande Comprador',
        description: 'Um título para aqueles que investem em seu sucesso na loja.',
        price: 1200,
        icon: '👑',
        item_type: 'title',
        effect_id: null
    }
];

// --- MODAIS E FORMULÁRIOS (sem alterações) ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-primary-bg rounded-lg shadow-xl p-6 max-w-sm w-full border border-border-color">
                <h3 className="text-xl font-bold text-primary-text mb-4">{title}</h3>
                <p className="text-secondary-text mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onCancel} className="py-2 px-4 bg-gray-600 hover:bg-hover-bg-color0 rounded-lg font-semibold text-primary-text transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className="py-2 px-4 bg-green-600 hover:bg-green-500 rounded-lg font-semibold text-primary-text transition-colors">Confirmar</button>
                </div>
            </div>
        </div>
    );
};
const AddItemForm = ({ onAddItem, onCancel }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [itemType, setItemType] = useState('title');
    const [color, setColor] = useState('#ffffff');
    const [effect, setEffect] = useState('none');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !description || !price) {
            showToast('Por favor, preencha todos os campos.');
            return;
        }
        let finalEffectId = null;
        if (itemType === 'cosmetic') {
            finalEffectId = { type: 'color', color, effect };
        } else if (itemType === 'title') {
            const safe_name = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            finalEffectId = `TITLE_CUSTOM_${safe_name}`;
        }
        onAddItem({ name, description, price: parseInt(price, 10), icon: '👑', item_type: itemType, effect_id: finalEffectId });
        onCancel();
    };
    const previewStyle = {};
    if (itemType === 'cosmetic') {
        previewStyle.color = color;
        if (effect === 'neon') {
            previewStyle.textShadow = `0 0 8px ${color}, 0 0 12px ${color}`;
        }
    }
    return (
        <div className="bg-secondary-bg/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-primary-text">Criar Item Personalizado</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <select value={itemType} onChange={e => setItemType(e.target.value)} className="w-full bg-border-color p-2 rounded">
                    <option value="title">Título</option>
                    <option value="cosmetic">Cosmético (Cor de Nome)</option>
                    <option value="utility">Utilitário</option>
                </select>
                <input type="text" placeholder={itemType === 'title' ? "Texto do Título (ex: Mestre da Atividade)" : "Nome do Item"} value={name} onChange={e => setName(e.target.value)} className="w-full bg-border-color p-2 rounded" required />
                <input type="text" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-border-color p-2 rounded" required />
                <input type="number" placeholder="Preço em pontos" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-border-color p-2 rounded" required />
                {itemType === 'cosmetic' && (
                    <div className="bg-black/20 p-4 rounded-lg space-y-4">
                        <h4 className="font-bold">Editor de Efeito Cosmético</h4>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1"><HexColorPicker color={color} onChange={setColor} /></div>
                            <div className="flex-1 space-y-2">
                                <label>Efeito Especial:</label>
                                <div>
                                    <button type="button" onClick={() => setEffect('none')} className={`px-3 py-1 rounded-full text-sm ${effect === 'none' ? 'bg-blue-500' : 'bg-gray-600'}`}>Nenhum</button>
                                    <button type="button" onClick={() => setEffect('neon')} className={`ml-2 px-3 py-1 rounded-full text-sm ${effect === 'neon' ? 'bg-blue-500' : 'bg-gray-600'}`}>Neon</button>
                                </div>
                                <div className="pt-4">
                                    <label>Preview:</label>
                                    <div className="p-4 bg-primary-bg rounded-lg text-center"><span style={previewStyle} className="text-2xl font-bold transition-all">Nome do Aluno</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded font-bold">Salvar Item</button>
                    <button type="button" onClick={onCancel} className="py-2 px-4 bg-gray-600 hover:bg-hover-bg-color0 rounded">Cancelar</button>
                </div>
            </form>
        </div>
    );
};

// Componente principal da Loja
const StoreTab = ({ items, userPoints, onPurchaseSuccess, onAddItem, onDeleteItem, onReturn, userRole }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const { showToast } = useToast();
    // --- INÍCIO DA CORREÇÃO ---
    const { user } = useAuth();
    const { activityId } = useParams();
    const { token } = useAuth();
    // Nova função que realiza a compra no backend
    const handlePurchaseItem = async (itemToBuy) => {
        try {
            // 2. Garanta que o endpoint está correto (sem '-item')
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/progress/${activityId}/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ item_id: itemToBuy.id }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Não foi possível completar a compra.");
            }

            showToast("Compra realizada com sucesso!");
            console.log("[StoreTab] Compra realizada com sucesso!Resposta do servidor:", data);


            // 3. CHAME A FUNÇÃO CORRETA ('onPurchaseSuccess') que veio pela prop
            onPurchaseSuccess(data.updated_progress);
        } catch (err) {
            showToast(`Erro: ${err.message}`);
        }
    };

    const openConfirmationModal = (title, message, onConfirm) => {
        setModalState({ isOpen: true, title, message, onConfirm });
    };

    const closeConfirmationModal = () => {
        setModalState({ isOpen: false, title: '', message: '', onConfirm: null });
    };

    const handleConfirm = () => {
        if (modalState.onConfirm) {
            modalState.onConfirm();
        }
        closeConfirmationModal();
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-8 relative mt-8 mb-8 text-primary-text bg-gray-900 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 min-h-[70vh]">
            {/* Efeito de luz de fundo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className='flex-shrink-0'>
                <button
                    onClick={onReturn}
                    className="absolute top-6 left-6 z-20 flex items-center gap-2 py-2.5 px-5 
                           bg-black/50 text-gray-300 font-bold backdrop-blur-md
                           border border-white/10 rounded-full shadow-lg 
                           hover:bg-white/10 hover:text-white hover:scale-105 transition-all"
                >
                    <FaArrowLeft /> Voltar ao Tabuleiro
                </button>
            </div>

            <header className="flex flex-col sm:flex-row justify-between items-center mb-12 pt-16 relative z-10">
                <div className="flex flex-col items-center sm:items-start">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] uppercase tracking-tight mb-2">Loja Virtual</h1>
                    <p className="text-gray-400 font-medium">Equipe-se para a sua jornada de aprendizado</p>
                </div>
                
                <div className="mt-6 sm:mt-0">
                    {userRole === 'aluno' && (
                        <div className="text-2xl font-black text-yellow-400 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 border border-yellow-500/30 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                            <FaCoins className="drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] text-3xl" />
                            <span className="drop-shadow-lg tracking-widest">{userPoints}</span>
                        </div>
                    )}
                    {userRole === 'professor' && !showAddForm && (
                        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)] transform hover:-translate-y-1 transition-all text-white">
                            <FaPlus /> Adicionar Novo Item
                        </button>
                    )}
                </div>
            </header>

            {userRole === 'professor' && (
                <>
                    {showAddForm && (
                        <AddItemForm onAddItem={onAddItem} onCancel={() => setShowAddForm(false)} />
                    )}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 border-b-2 border-border-color pb-2">Itens Rápidos (Presets)</h2>
                        <h3 className="text-lg font-semibold text-secondary-text mt-4 mb-2">Títulos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {PREDEFINED_TITLES.map(preset => {
                                const isAlreadyAdded = items.some(item => item.name === preset.name);
                                return (
                                    <div key={preset.name} className="bg-primary-bg p-4 rounded-lg flex flex-col">
                                        <h3 className="font-bold text-lg">{preset.name}</h3>
                                        <p className="text-sm text-secondary-text flex-grow my-2">{preset.description}</p>
                                        <button onClick={() => onAddItem(preset)} disabled={isAlreadyAdded} className={`mt-auto w-full py-2 px-4 rounded font-bold text-sm transition-all ${isAlreadyAdded ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'}`}>{isAlreadyAdded ? 'Já Adicionado' : '+ Adicionar à Loja'}</button>
                                    </div>
                                );
                            })}
                        </div>
                        <h3 className="text-lg font-semibold text-secondary-text mt-4 mb-2">Cosméticos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {PREDEFINED_COSMETICS.map(preset => {
                                const isAlreadyAdded = items.some(item => item.name === preset.name);
                                return (
                                    <div key={preset.name} className="bg-primary-bg p-4 rounded-lg flex flex-col">
                                        <h3 className="font-bold text-lg">{preset.name}</h3>
                                        <p className="text-sm text-secondary-text flex-grow my-2">{preset.description}</p>
                                        <button onClick={() => onAddItem(preset)} disabled={isAlreadyAdded} className={`mt-auto w-full py-2 px-4 rounded font-bold text-sm transition-all ${isAlreadyAdded ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'}`}>{isAlreadyAdded ? 'Já Adicionado' : '+ Adicionar à Loja'}</button>
                                    </div>
                                );
                            })}
                        </div>
                        <h3 className="text-lg font-semibold text-secondary-text mt-4 mb-2">Avatares</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {PREDEFINED_AVATARS.map(preset => {
                                const isAlreadyAdded = items.some(item => item.name === preset.name);
                                return (
                                    <div key={preset.name} className="bg-primary-bg p-4 rounded-lg flex flex-col">
                                        <div className="flex items-start gap-4">
                                            <img src={preset.effect_id.url} alt={preset.name} className="w-12 h-12 rounded-full bg-border-color" />
                                            <div>
                                                <h3 className="font-bold text-lg">{preset.name}</h3>
                                                <p className="text-sm text-secondary-text flex-grow my-1">{preset.description}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => onAddItem(preset)} disabled={isAlreadyAdded} className={`mt-auto w-full py-2 px-4 rounded font-bold text-sm transition-all mt-4 ${isAlreadyAdded ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'}`}>{isAlreadyAdded ? 'Já Adicionado' : `+ Adicionar por ${preset.price} pts`}</button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-4 border-b-2 border-border-color pb-2">Itens Atuais na Loja</h2>
                </>
            )}

            {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-10 p-4">
                    {items.map(item => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            userRole={userRole}
                            userPoints={userPoints}
                            // --- CORREÇÃO: Chama a nova função de compra ---
                            onPurchaseRequest={(itemToBuy) => openConfirmationModal(
                                'Confirmar Compra',
                                `Você tem certeza que quer comprar "${itemToBuy.name}" por ${itemToBuy.price} pontos?`,
                                () => handlePurchaseItem(itemToBuy)
                            )}
                            onDeleteRequest={(itemId, itemName) => openConfirmationModal(
                                'Confirmar Remoção',
                                `Você tem certeza que quer remover o item "${itemName}" da loja?`,
                                () => onDeleteItem(itemId)
                            )}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-black/20 rounded-lg">
                    <FaExclamationTriangle className="mx-auto text-5xl text-yellow-500 mb-4" />
                    <p className="text-secondary-text">
                        {userRole === 'aluno' ? 'A loja para esta atividade ainda está vazia.' : 'Nenhum item adicionado ainda. Clique em "Adicionar Item" para começar.'}
                    </p>
                </div>
            )}
            <ConfirmationModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                onConfirm={handleConfirm}
                onCancel={closeConfirmationModal}
            />
        </div>
    );
};

export default StoreTab;