// frontend/src/components/activity/StoreTab.jsx
import React, { useState } from 'react';
import { FaCoins, FaPlus, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import ItemCard from './ItemCard'; // Importa o novo componente de card

// Formulário para adicionar novos itens (visão do professor)
const AddItemForm = ({ onAddItem, onCancel }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [icon, setIcon] = useState('🌟');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !description || !price) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        onAddItem({ name, description, price: parseInt(price, 10), icon, item_type: 'utility', effect_id: `CUSTOM_${name.replace(/\s+/g, '_').toUpperCase()}` });
        onCancel(); // Fecha o formulário após adicionar
    };

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-white">Adicionar Novo Item</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Nome do item" value={name} onChange={e => setName(e.target.value)} className="bg-gray-700 p-2 rounded" />
                <input type="number" placeholder="Preço em pontos" value={price} onChange={e => setPrice(e.target.value)} className="bg-gray-700 p-2 rounded" />
                <input type="text" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} className="bg-gray-700 p-2 rounded md:col-span-2" />
                <select value={icon} onChange={e => setIcon(e.target.value)} className="bg-gray-700 p-2 rounded">
                    <option value="🌟">🌟 Estrela</option>
                    <option value="🌈">🌈 Arco-íris</option>
                    <option value="👑">👑 Coroa</option>
                    <option value="💡">💡 Lâmpada</option>
                </select>
                <div className="flex gap-4 md:col-span-2">
                    <button type="submit" className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded font-bold">Salvar Item</button>
                    <button type="button" onClick={onCancel} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                </div>
            </form>
        </div>
    );
};


// Componente principal da Loja
const StoreTab = ({ items, userPoints, onPurchase, onAddItem, onDeleteItem, onReturn, userRole }) => {
    // Estado para controlar a visibilidade do formulário de adição (para professores)
    const [showAddForm, setShowAddForm] = useState(false);

    return (
        <div className="w-full max-w-5xl mx-auto p-4 text-white">
            <button onClick={onReturn} className="absolute top-4 left-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200 transition-colors z-20">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/></svg>
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
            {userRole === 'professor' && showAddForm && (
                <AddItemForm onAddItem={onAddItem} onCancel={() => setShowAddForm(false)} />
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
                            onPurchase={onPurchase}
                            onDelete={onDeleteItem}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-black/20 rounded-lg">
                    <FaExclamationTriangle className="mx-auto text-5xl text-yellow-500 mb-4" />
                    <p className="text-gray-400">
                        {userRole === 'aluno' ? 'A loja para esta atividade ainda está vazia.' : 'Nenhum item adicionado ainda. Clique em "Adicionar Item" para começar.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default StoreTab;