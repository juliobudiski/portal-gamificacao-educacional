// frontend/src/components/activity/ActivityViewOverlay.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';

const ActivityViewOverlay = ({ isOpen, onClose, title, backgroundImage, children }) => {
  // Se não estiver aberto, não renderiza nada.
  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop semi-transparente que cobre a tela inteira
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose} // Permite fechar clicando fora do conteúdo
    >
      {/* Container do conteúdo que não fecha ao ser clicado */}
      <div
        className="relative w-full max-w-4xl h-auto max-h-[90vh] bg-gray-800 rounded-2xl shadow-2xl border-4 border-yellow-400/50 overflow-hidden flex flex-col"
        style={{
          backgroundImage: `linear-gradient(rgba(31, 41, 55, 0.85), rgba(31, 41, 55, 0.95)), url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={(e) => e.stopPropagation()} // Impede que o clique no conteúdo feche o overlay
      >
        {/* Botão de Fechar Universal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Voltar ao Tabuleiro"
        >
          <FaTimes size={24} />
        </button>

        {/* Título da Visão */}
        <h2 className="text-3xl font-bold text-yellow-400 p-6 text-center border-b border-gray-700/50">
          {title}
        </h2>

        {/* Conteúdo dinâmico (aqui entrarão seus componentes Tab) */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ActivityViewOverlay;