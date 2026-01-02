// src/components/ConfirmationModal.jsx (ou no mesmo arquivo se preferir)
import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", isDangerous = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-secondary-bg border border-[#3e4a52] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                {/* Cabeçalho */}
                <div className={`p-4 border-b border-[#3e4a52] ${isDangerous ? 'bg-red-900/20' : 'bg-[#ffbd30]/10'}`}>
                    <h3 className="text-xl font-bold text-primary-text flex items-center gap-2">
                        {isDangerous && <span className="text-red-500">⚠️</span>}
                        {title}
                    </h3>
                </div>

                {/* Corpo */}
                <div className="p-6">
                    <p className="text-secondary-text text-lg leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Rodapé / Botões */}
                <div className="p-4 bg-primary-bg flex justify-end gap-3 border-t border-[#3e4a52]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-primary-text hover:bg-[#3e4a52] transition-colors font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-4 py-2 rounded-lg font-bold shadow-lg transition-all transform hover:scale-105 ${isDangerous
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;