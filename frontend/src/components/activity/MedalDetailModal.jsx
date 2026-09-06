// frontend/src/components/activity/MedalDetailModal.jsx
import React from 'react';
import { createPortal } from 'react-dom'; // Opcional, mas recomendado (leia nota abaixo)

/**
 * @component MedalDetailModal
 * @description
 * Modal showing details of a specific medal, including its unlocked status and obtaining criteria.
 * 
 * Architectural Decisions:
 * - React Portals: Renders the modal content directly into `document.body` via `createPortal`, avoiding z-index or overflow clipping issues from parent containers.
 * - Conditional Visuals: Applies CSS filters (`grayscale`, `opacity`) dynamically based on the `isUnlocked` prop to visually distinguish earned vs unearned medals.
 */
const MedalDetailModal = ({ medal, isUnlocked, onClose }) => {
    if (!medal) return null;

    // Conteúdo do Modal
    const modalContent = (
        <div
            // AJUSTE 1: Z-Index altíssimo para garantir sobreposição total
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn p-4"
            onClick={onClose}
        >
            <div
                // AJUSTE 2: max-h-[90vh] e overflow-y-auto impedem o corte no topo
                className="bg-primary-bg border-2 border-yellow-400 p-8 rounded-xl shadow-2xl text-center max-w-md w-full relative max-h-[90vh] overflow-y-auto custom-scrollbar"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-secondary-text hover:text-red-500 transition-colors text-2xl z-10"
                    aria-label="Fechar"
                >
                    &times;
                </button>

                {/* Imagem com container para evitar layout shift */}
                <div className="flex justify-center mb-6">
                    <img
                        src={medal.imageUrl}
                        alt={medal.name}
                        className={`w-48 h-48 object-contain transition-all duration-500 drop-shadow-lg ${isUnlocked ? 'filter-none' : 'filter grayscale opacity-70'}`}
                    />
                </div>

                <h2 className={`text-3xl font-bold mb-2 ${isUnlocked ? 'text-yellow-400 drop-shadow-md' : 'text-secondary-text'}`}>
                    {medal.name}
                </h2>

                {/* Badge de Status */}
                <div className="mb-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isUnlocked ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50' : 'bg-hover-bg-color0 text-secondary-text border border-[var(--border-color)]'}`}>
                        {isUnlocked ? 'Desbloqueada' : 'Bloqueada'}
                    </span>
                </div>

                <div className="text-left bg-black/20 p-4 rounded-lg border border-white/5">
                    <p className="text-sm text-secondary-text">
                        <span className="font-bold text-primary-text block mb-1">Como obter:</span>
                        {medal.description}
                    </p>

                    {medal.notes && (
                        <p className="text-xs text-purple-300 italic mt-3 pt-3 border-t border-white/10 flex items-start gap-2">
                            <span>💡</span>
                            <span>{medal.notes}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    // Renderiza via Portal no body para escapar de qualquer overflow do componente pai
    return createPortal(modalContent, document.body);
};

export default MedalDetailModal;