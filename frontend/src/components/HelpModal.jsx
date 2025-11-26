import React, { useEffect } from 'react';
import { FaTimes, FaLightbulb } from 'react-icons/fa'; // Ícones para fechar e ilustrar ajuda
import { helpContent } from '../data/helpContent';

const HelpModal = ({ isOpen, contentKey, onClose }) => {
    // Se não estiver aberto ou não tiver chave válida, não renderiza nada no DOM
    const data = contentKey ? helpContent[contentKey] : null;

    // Fecha com a tecla ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            // Bloqueia o scroll do body quando aberto
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleEsc);
            // Libera o scroll ao desmontar/fechar
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop Escuro com Blur (Foco no Modal) */}
            <div
                className="absolute inset-0 bg-[#000000]/70 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Card do Modal */}
            <div
                className="
                    relative w-full max-w-2xl max-h-[90vh] flex flex-col
                    bg-secondary-bg text-primary-text
                    rounded-xl shadow-2xl border border-border-color
                    transform transition-all animate-fade-in-up
                    dark:border-gray-700
                "
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()} // Clicar no card não fecha o modal
            >
                {/* Detalhe visual de Gamificação (Barra superior colorida) */}
                <div className="h-1.5 w-full rounded-t-xl bg-gradient-to-r from-accent-purple via-accent-teal to-accent-purple" />

                {/* Cabeçalho */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-color dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-purple/10 text-accent-purple">
                            <FaLightbulb />
                        </div>
                        <h3 className="text-xl font-bold text-primary-text tracking-tight">
                            {data.title}
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="
                            group rounded-lg p-2 transition-all duration-200
                            hover:bg-danger-bg/10 hover:text-danger
                            text-secondary-text
                        "
                        aria-label="Fechar ajuda"
                    >
                        <FaTimes className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    </button>
                </div>

                {/* Corpo com Scroll */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">

                    <div className="text-base leading-relaxed text-gray-800 dark:text-gray-100 [&_*]:dark:text-gray-100 space-y-4">
                        {data.content}
                    </div>
                </div>

                {/* Rodapé */}
                <div className="px-6 py-5 bg-primary-bg/50 border-t border-border-color dark:border-gray-700 rounded-b-xl flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            inline-flex items-center justify-center px-6 py-2.5 
                            text-sm font-bold uppercase tracking-wide
                            bg-accent-teal text-[#2c3135] 
                            rounded-lg shadow-lg shadow-accent-teal/20
                            hover:bg-[#57dcc0] hover:scale-105 hover:shadow-accent-teal/40
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-teal focus:ring-offset-secondary-bg
                            transition-all duration-200
                        "
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;