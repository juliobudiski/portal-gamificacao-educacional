// frontend/src/components/activity/StoreTab.jsx
import React, { useState } from 'react';
import { FaCoins, FaPlus, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import ItemCard from './ItemCard'; // Importa o novo componente de card
import { HexColorPicker } from 'react-colorful';
// --- LISTA DE ITENS PRÉ-DEFINIDOS ---
const PREDEFINED_COSMETICS = [
    {
        name: 'Nome Dourado (Neon)',
        description: 'Destaque seu nome no ranking com um brilho dourado.',
        price: 750,
        icon: '🌟',
        item_type: 'cosmetic',
        effect_id: { type: 'color', color: '#FBBF24', effect: 'neon' } // Formato JSON
    },
    {
        name: 'Nome Prateado (Neon)',
        description: 'Um visual elegante e prateado para o seu nome no ranking.',
        price: 500,
        icon: '✨',
        item_type: 'cosmetic',
        effect_id: { type: 'color', color: '#D1D5DB', effect: 'neon' } // Formato JSON
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
        effect_id: null // O backend irá gerar o effect_id dinamicamente
    }
];

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-primary-bg rounded-lg shadow-xl p-6 max-w-sm w-full border border-border-color">
                <h3 className="text-xl font-bold text-primary-text mb-4">{title}</h3>
                <p className="text-secondary-text mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="py-2 px-4 bg-gray-600 hover:bg-hover-bg-color0 rounded-lg font-semibold text-primary-text transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="py-2 px-4 bg-green-600 hover:bg-green-500 rounded-lg font-semibold text-primary-text transition-colors"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};


// Formulário para adicionar novos itens (visão do professor)
const AddItemForm = ({ onAddItem, onCancel }) => {
    // --- Estados do Formulário ---
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [itemType, setItemType] = useState('title');

    // --- Novos Estados para a "Oficina de Cosméticos" ---
    const [color, setColor] = useState('#ffffff');
    const [effect, setEffect] = useState('none'); // 'none', 'neon', 'pulsating'

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !description || !price) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        let finalEffectId = null;
        if (itemType === 'cosmetic') {
            finalEffectId = { type: 'color', color, effect }; // Monta o objeto JSON
        } else if (itemType === 'title') {
            const safe_name = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            finalEffectId = `TITLE_CUSTOM_${safe_name}`;
        }

        onAddItem({ name, description, price: parseInt(price, 10), icon: '👑', item_type: itemType, effect_id: finalEffectId });
        onCancel();
    };

    // Estilo dinâmico para o preview em tempo real
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

                {/* --- A "OFICINA DE COSMÉTICOS" (Condicional) --- */}
                {itemType === 'cosmetic' && (
                    <div className="bg-black/20 p-4 rounded-lg space-y-4">
                        <h4 className="font-bold">Editor de Efeito Cosmético</h4>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <HexColorPicker color={color} onChange={setColor} />
                            </div>
                            <div className="flex-1 space-y-2">
                                <label>Efeito Especial:</label>
                                <div>
                                    <button type="button" onClick={() => setEffect('none')} className={`px-3 py-1 rounded-full text-sm ${effect === 'none' ? 'bg-blue-500' : 'bg-gray-600'}`}>Nenhum</button>
                                    <button type="button" onClick={() => setEffect('neon')} className={`ml-2 px-3 py-1 rounded-full text-sm ${effect === 'neon' ? 'bg-blue-500' : 'bg-gray-600'}`}>Neon</button>
                                </div>
                                <div className="pt-4">
                                    <label>Preview:</label>
                                    <div className="p-4 bg-primary-bg rounded-lg text-center">
                                        <span style={previewStyle} className="text-2xl font-bold transition-all">Nome do Aluno</span>
                                    </div>
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
const StoreTab = ({ items, userPoints, onPurchase, onAddItem, onDeleteItem, onReturn, userRole }) => {
    // Estado para controlar a visibilidade do formulário de adição (para professores)
    const [showAddForm, setShowAddForm] = useState(false);
    const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    // --- NOVA FUNÇÃO PARA ABRIR O MODAL ---
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
        <div className="w-full max-w-5xl mx-auto p-4 text-primary-text">
            <button onClick={onReturn} className="absolute top-4 left-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200 transition-colors z-20">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" /></svg>
                Voltar
            </button>

            {/* Cabeçalho dinâmico baseado no papel do usuário */}
            <header className="flex justify-between items-center mb-8 pt-8">
                <h1 className="text-4xl font-bold">Loja</h1>
                {userRole === 'aluno' && (
                    <div className="text-2xl font-bold text-yellow-300 bg-black/30 px-4 py-2 rounded-full flex items-center gap-2">
                        <FaCoins />
                        <span>{userPoints}</span>
                    </div>
                )}
                {userRole === 'professor' && !showAddForm && (
                    <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold">
                        <FaPlus /> Adicionar Item
                    </button>
                )}
            </header>

            {/* Formulário de adição para professor (condicional) */}
            {userRole === 'professor' && (
                <>
                    {/* Formulário de adição (que vamos modificar no próximo passo) */}
                    {showAddForm && (
                        <AddItemForm onAddItem={onAddItem} onCancel={() => setShowAddForm(false)} />
                    )}

                    {/* Seção de Presets agora dividida */}
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
                                        <button
                                            onClick={() => onAddItem(preset)}
                                            disabled={isAlreadyAdded} // <-- Desabilita o botão se já foi adicionado
                                            className={`mt-auto w-full py-2 px-4 rounded font-bold text-sm transition-all
                            ${isAlreadyAdded
                                                    ? 'bg-gray-600 cursor-not-allowed'
                                                    : 'bg-indigo-600 hover:bg-indigo-500'
                                                }`
                                            }
                                        >
                                            {isAlreadyAdded ? 'Já Adicionado' : '+ Adicionar à Loja'}
                                        </button>
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
                                        <button
                                            onClick={() => onAddItem(preset)}
                                            disabled={isAlreadyAdded} // <-- Desabilita o botão se já foi adicionado
                                            className={`mt-auto w-full py-2 px-4 rounded font-bold text-sm transition-all
                            ${isAlreadyAdded
                                                    ? 'bg-gray-600 cursor-not-allowed'
                                                    : 'bg-indigo-600 hover:bg-indigo-500'
                                                }`
                                            }
                                        >
                                            {isAlreadyAdded ? 'Já Adicionado' : '+ Adicionar à Loja'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <h3 className="text-lg font-semibold text-secondary-text mt-4 mb-2">Avatares</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {PREDEFINED_AVATARS.map(preset => {
                                // Lógica para verificar se já foi adicionado
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
                                        <button
                                            onClick={() => onAddItem(preset)}
                                            disabled={isAlreadyAdded}
                                            className={`mt-auto w-full py-2 px-4 rounded font-bold text-sm transition-all mt-4 ${isAlreadyAdded ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                                        >
                                            {isAlreadyAdded ? 'Já Adicionado' : `+ Adicionar por ${preset.price} pts`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-4 border-b-2 border-border-color pb-2">Itens Atuais na Loja</h2>
                </>
            )}

            {/* Grid de Itens */}
            {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map(item => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            userRole={userRole}
                            userPoints={userPoints}
                            // PASSA A FUNÇÃO PARA ABRIR O MODAL EM VEZ DA AÇÃO DIRETA
                            onPurchaseRequest={(itemToBuy) => openConfirmationModal(
                                'Confirmar Compra',
                                `Você tem certeza que quer comprar "${itemToBuy.name}" por ${itemToBuy.price} pontos?`,
                                () => onPurchase(itemToBuy)
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
            {/* RENDERIZA O MODAL AQUI */}
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