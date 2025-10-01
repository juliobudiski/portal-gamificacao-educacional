// frontend/src/components/activity/ItemCard.jsx
import React from 'react';
import { FaShoppingCart, FaTrash, FaCoins } from 'react-icons/fa';

// Ícones pré-definidos que o professor pode escolher. Adicione mais conforme necessário.
const iconMap = {
  '🌟': <span className="text-4xl">🌟</span>,
  '🌈': <span className="text-4xl">🌈</span>,
  '👑': <span className="text-4xl">👑</span>,
  '💡': <span className="text-4xl">💡</span>,
};

const ItemCard = ({ item, userRole, userPoints, onPurchase, onDelete }) => {
  const isAffordable = userPoints >= item.price;

  // Handler para confirmar a compra
  const handlePurchaseClick = () => {
    if (window.confirm(`Você tem certeza que quer comprar "${item.name}" por ${item.price} pontos?`)) {
      onPurchase(item);
    }
  };

  // Handler para confirmar a remoção
  const handleDeleteClick = () => {
    if (window.confirm(`Você tem certeza que quer remover o item "${item.name}" da loja?`)) {
      onDelete(item.id);
    }
  };

  return (
    // Card com efeito de "vidro fosco" (Glassmorphism)
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col h-full shadow-lg">
      
      {/* Ícone e Nome */}
      <div className="flex flex-col items-center text-center mb-4">
        {iconMap[item.icon] || <span className="text-4xl">{item.icon}</span>}
        <h3 className="text-xl font-bold mt-3 text-white">{item.name}</h3>
      </div>
      
      {/* Descrição */}
      <p className="text-gray-300 text-sm text-center flex-grow">{item.description}</p>
      
      {/* Preço */}
      <div className="flex items-center justify-center gap-2 my-4 text-2xl font-bold text-yellow-300">
        <FaCoins />
        <span>{item.price}</span>
      </div>

      {/* Botões de Ação (condicionais ao papel do usuário) */}
      <div className="mt-auto">
        {userRole === 'aluno' && (
          <button
            onClick={handlePurchaseClick}
            disabled={!isAffordable}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all duration-300
                        ${isAffordable 
                          ? 'bg-green-600 hover:bg-green-500 text-white' 
                          : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
          >
            <FaShoppingCart />
            Comprar
          </button>
        )}
        {userRole === 'professor' && (
          <button
            onClick={handleDeleteClick}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold bg-red-800/50 hover:bg-red-700/70 text-red-200 transition-colors"
          >
            <FaTrash />
            Remover
          </button>
        )}
      </div>
    </div>
  );
};

export default ItemCard;