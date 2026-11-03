// frontend/src/components/activity/ItemCard.jsx
import React from 'react';
import { FaShoppingCart, FaTrash, FaCoins } from 'react-icons/fa';

/**
 * @component ItemCard
 * @description
 * Reusable card displaying an individual item in the virtual store.
 * 
 * Architectural Decisions:
 * - Dumb Component: Receives all data and interaction callbacks via props, keeping it unaware of API context.
 * - Role-Based Actions: Conditionally renders purchase vs. delete buttons depending on `userRole`.
 */
// Ícones pré-definidos que o professor pode escolher. Adicione mais conforme necessário.
const iconMap = {
  '🌟': <span className="text-4xl">🌟</span>,
  '🌈': <span className="text-4xl">🌈</span>,
  '👑': <span className="text-4xl">👑</span>,
  '💡': <span className="text-4xl">💡</span>,
};

const ItemCard = ({ item, userRole, userPoints, onPurchaseRequest, onDeleteRequest }) => {
  const isAffordable = userPoints >= item.price;
  const [showConfirm, setShowConfirm] = React.useState(false); // Melhoria 62: Confirmação em 2 etapas para itens caros
  const [showPreview, setShowPreview] = React.useState(false); // Melhoria 55: Provador Virtual de Avatar

  const isExpensive = item.price >= 150;

  const handleBuyClick = () => {
    if (isExpensive && !showConfirm) {
      setShowConfirm(true);
    } else {
      setShowConfirm(false);
      onPurchaseRequest(item);
    }
  };

  return (
    // Card com efeito de "vidro fosco" premium e hover states
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col h-full shadow-2xl relative overflow-hidden group transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_0_40px_rgba(56,189,248,0.4)] hover:border-white/30">
      
      {/* Fundo gradiente que aparece no hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>

      {/* Ícone e Nome */}
      <div className="flex flex-col items-center text-center mb-6 relative z-10">
        <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500 mb-4 relative">
          {iconMap[item.icon] || <span className="text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{item.icon}</span>}
          {item.type === 'avatar' && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="absolute -bottom-2 -right-2 bg-accent-teal text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md hover:scale-105"
              title="Testar como fica no seu perfil"
            >
              👁️ Provar
            </button>
          )}
        </div>
        <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{item.name}</h3>
      </div>

      {/* Provador Virtual de Avatar (Melhoria 55) */}
      {showPreview && (
        <div className="mb-4 p-3 bg-accent-teal/10 border border-accent-teal/30 rounded-2xl text-center animate-fadeIn relative z-10">
          <span className="text-[11px] font-bold text-accent-teal uppercase tracking-wider block mb-1">Prévia do Avatar</span>
          <div className="w-14 h-14 mx-auto rounded-full border-2 border-accent-teal flex items-center justify-center bg-black/60 overflow-hidden shadow-lg mb-1">
            <span className="text-3xl">{item.icon}</span>
          </div>
          <span className="text-xs text-gray-300 italic">Combina perfeitamente com sua moldura atual!</span>
        </div>
      )}

      {/* Descrição */}
      <p className="text-secondary-text text-sm text-center flex-grow relative z-10 leading-relaxed">{item.description}</p>

      {/* Preço e Comparativo de Saldo (Melhoria 58) */}
      <div className="flex flex-col items-center justify-center my-6 relative z-10 bg-black/30 py-3 px-4 rounded-2xl border border-white/5">
        <div className="flex items-center justify-center gap-2 text-3xl font-bold text-yellow-400">
          <FaCoins className="drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          <span className="drop-shadow-lg">{item.price}</span>
        </div>
        {userRole === 'aluno' && !isAffordable && (
          <span className="text-[11px] font-semibold text-rose-400 mt-1">
            Faltam {item.price - (userPoints || 0)} moedas
          </span>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="mt-auto relative z-10">
        {userRole === 'aluno' && (
          <div>
            {showConfirm ? (
              <div className="flex flex-col gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                <span className="text-xs font-bold text-amber-300">Item raro! Confirmar compra por {item.price} moedas?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/20 text-xs rounded-lg text-white font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleBuyClick}
                    className="flex-1 py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-xs rounded-lg text-black font-bold"
                  >
                    Sim, Comprar!
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleBuyClick}
                disabled={!isAffordable}
                className={`w-full flex items-center justify-center gap-3 py-4 px-4 rounded-xl font-bold transition-all duration-300 uppercase tracking-wide text-sm
                            ${isAffordable
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.8)] transform hover:scale-105'
                    : 'bg-secondary-bg text-gray-500 cursor-not-allowed border border-[var(--border-color)]'}`}
              >
                <FaShoppingCart className="text-lg" />
                {isAffordable ? 'Comprar Item' : `Faltam ${item.price - (userPoints || 0)} 🪙`}
              </button>
            )}
          </div>
        )}
        {userRole === 'professor' && (
          <button
            onClick={() => onDeleteRequest(item.id, item.name)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white transition-colors border border-red-900 hover:border-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]"
          >
            <FaTrash />
            Remover da Loja
          </button>
        )}
      </div>
    </div>
  );
};

export default ItemCard;