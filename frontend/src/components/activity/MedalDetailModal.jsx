// frontend/src/components/activity/MedalDetailModal.jsx
import React from 'react';

const MedalDetailModal = ({ medal, isUnlocked, onClose }) => {
    if (!medal) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn"
            onClick={onClose} // Fecha o modal ao clicar no fundo
        >
            <div
                className="bg-primary-bg border-2 border-yellow-400 p-8 rounded-xl shadow-2xl text-center max-w-md w-full relative"
                onClick={e => e.stopPropagation()} // Impede que o clique dentro do modal o feche
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-secondary-text hover:text-primary-text text-2xl">&times;</button>

                <img
                    src={medal.imageUrl}
                    alt={medal.name}
                    className={`w-48 h-48 mx-auto mb-4 transition-all duration-500 ${isUnlocked ? '' : 'filter grayscale'}`}
                />

                <h2 className={`text-3xl font-bold ${isUnlocked ? 'text-yellow-300' : 'text-secondary-text'}`}>{medal.name}</h2>

                <p className="text-sm text-secondary-text mt-4 border-t border-gray-600 pt-4">
                    <span className="font-bold text-secondary-text">Como obter:</span> {medal.description}
                </p>

                {medal.notes && (
                    <p className="text-xs text-purple-300 italic mt-2">
                        {medal.notes}
                    </p>
                )}
            </div>
        </div>
    );
};

export default MedalDetailModal;