import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaGem, FaShoppingCart, FaPlus, FaTrash, FaExclamationTriangle, FaPalette, FaCrown } from 'react-icons/fa';
import backgroundImage from '../../assets/store-background.png';
import useAnalytics from "../../hooks/useAnalytics";
// Lista de ícones que o professor pode escolher

const PREDEFINED_ITEMS = [
    { name: 'Nome Dourado no Ranking', description: 'Destaque seu nome por 7 dias.', price: 500, icon: '🌟', item_type: 'cosmetic', effect_id: 'RANKING_COLOR_GOLD', duration_days: 7 },
    { name: 'Nome com Gradiente no Ranking', description: 'Seu nome brilhará com um gradiente por 3 dias.', price: 1500, icon: '🌈', item_type: 'cosmetic', effect_id: 'RANKING_GRADIENT_RAINBOW', duration_days: 3 },
    { name: 'Título: Mestre da Turma', description: 'Exiba o título "Mestre da Turma" no ranking.', price: 1000, icon: '👑', item_type: 'cosmetic', effect_id: 'RANKING_TITLE_MASTER' },
    { name: 'Dica Extra para Quiz', description: 'Receba uma ajuda em uma questão difícil.', price: 150, icon: '💡', item_type: 'utility', effect_id: 'UTILITY_QUIZ_HINT' },
];
// Componente para um único item da loja (visão do aluno)
const StoreItemCard = ({ item, userPoints, onPurchase }) => (
    <div className="bg-gray-700 p-4 rounded-lg flex justify-between items-center transition-all duration-200 hover:bg-gray-600">
        <div className="flex items-center">
            {/* SOLUÇÃO DO ERRO: Renderiza o ícone como texto dentro de um span */}
            <span className="text-4xl mr-4">{item.icon}</span>
            <div>
                <p className="font-bold text-lg text-white">{item.name}</p>
                <p className="text-sm text-yellow-400">{item.price} Pontos</p>
            </div>
        </div>
        <button 
            onClick={() => onPurchase(item)} 
            className="py-2 px-4 bg-green-600 rounded-lg font-bold flex items-center disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors" 
            disabled={userPoints < item.price}
        >
            <FaShoppingCart className="mr-2"/> Comprar
        </button>
    </div>
);

// Componente para gerenciar um item (visão do professor)
const ManageItemCard = ({ item, onDelete }) => (
    <div className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
        <div className="flex items-center">
            <span className="text-3xl mr-3">{item.icon}</span>
            <div>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-xs text-yellow-400">{item.price} Pontos</p>
            </div>
        </div>
        <button onClick={() => onDelete(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-500/10 rounded-full transition-colors">
            <FaTrash />
        </button>
    </div>
);



// Componente principal da Loja
const StoreTab = ({ items, userPoints, onPurchase, onAddItem, onDeleteItem }) => {
    const { user } = useAuth();
    const { logEvent } = useAnalytics("store", user.token); // Inicializa o hook
    // Estado para o item pré-definido selecionado pelo professor
    const [selectedPredefinedItem, setSelectedPredefinedItem] = useState(PREDEFINED_ITEMS[0]);

    const handleAddItem = () => {
        if (selectedPredefinedItem) {
            onAddItem(selectedPredefinedItem);
        }
    };

    // VISÃO DO ALUNO (sem mudanças)
    if (user.role === 'aluno') {
        return (
            <div className="bg-gray-800 p-8 rounded-lg text-white"
            style={{
                
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                minHeight: '600px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem',
                borderRadius: '1rem',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
                color: 'white',
                width: '90%',
                maxWidth: '1200px',
                }}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-green-400">Loja de Recompensas</h2>
                    <div className="text-xl font-bold text-yellow-400 flex items-center">
                        <FaGem className="mr-2" /> {userPoints} Pontos
                    </div>
                </div>
                {items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {items.map(item => (
                            <StoreItemCard key={item.id} item={item} userPoints={userPoints} onPurchase={onPurchase} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-700/50 rounded-lg">
                        <FaExclamationTriangle className="mx-auto text-4xl text-yellow-400 mb-4" />
                        <p className="text-gray-300">A loja para esta atividade ainda está vazia.</p>
                    </div>
                )}
            </div>
        );
    }
    
    // VISÃO DO PROFESSOR (MODIFICADA)
    if (user.role === 'professor') {
        return (
            <div className="bg-gray-800 p-8 rounded-lg text-white"
            style={{
                
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                minHeight: '600px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem',
                borderRadius: '1rem',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
                color: 'white',
                width: '90%',
                maxWidth: '1200px',
                }}>
                <h2 className="text-3xl font-bold text-green-400 mb-6">Gerenciar Itens da Loja</h2>
                
                {/* Formulário para adicionar item pré-definido */}
                <div className="mb-8 bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Adicionar um item pré-definido:</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <select 
                            onChange={(e) => setSelectedPredefinedItem(PREDEFINED_ITEMS.find(item => item.effect_id === e.target.value))}
                            className="flex-grow p-3 bg-gray-600 rounded-lg border-2 border-gray-500 focus:border-blue-500 focus:outline-none"
                        >
                            {PREDEFINED_ITEMS.map(item => (
                                <option key={item.effect_id} value={item.effect_id}>
                                    {item.name} ({item.price} pts)
                                </option>
                            ))}
                        </select>
                        <button onClick={handleAddItem} className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">
                            <FaPlus /> Adicionar à Loja
                        </button>
                    </div>
                </div>

                {/* Lista de itens existentes (sem mudanças) */}
                <h3 className="text-xl font-semibold mb-4">Itens Atuais na Loja</h3>
                {items.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map(item => <ManageItemCard key={item.id} item={item} onDelete={onDeleteItem} />)}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-4">Nenhum item adicionado ainda.</p>
                )}
            </div>
        );
    }

    return null;
};

export default StoreTab;