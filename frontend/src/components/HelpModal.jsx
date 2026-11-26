import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaLightbulb, FaExternalLinkAlt, FaBookOpen } from 'react-icons/fa'; // Ícones para fechar e ilustrar ajuda
import { helpContent } from '../data/helpContent';
import { teacherDocsEngine } from '../domain/teacherDocs';

/**
 * @component HelpModal
 * @description
 * Contextual help modal rendering dynamic content based on a provided key.
 * 
 * Architectural Decisions:
 * - Content Decoupling: Imports `helpContent` dictionary statically, separating large text blocks from the UI layout structure.
 * - Side Effects Management: Uses `useEffect` strictly for DOM/Window manipulation, cleaning up on unmount to prevent memory leaks.
 * - Deep-Linking to Teacher Docs (US-26): Resolves `contentKey` against `WIZARD_HELP_TO_DOCS_MAP` and opens in a new tab when inside the Wizard/Editor to protect unsaved draft state.
 */
const HelpModal = ({ isOpen, contentKey, onClose }) => {
    const location = useLocation();
    // Se não estiver aberto ou não tiver chave válida, não renderiza nada no DOM
    const data = contentKey ? helpContent[contentKey] : null;
    const docsDeepLink = contentKey ? teacherDocsEngine.resolveWizardHelpLink(contentKey) : null;
    const isInsideEditorOrWizard =
        location.pathname.includes('/criar-atividade') || location.pathname.includes('/edit');

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
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-color bg-primary-bg/30">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-teal/15 text-accent-teal border border-accent-teal/30 shadow-sm">
                            <FaLightbulb className="text-xl text-accent-yellow" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-extrabold text-primary-text tracking-tight">
                                    {data.title}
                                </h3>
                                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-accent-teal/15 text-accent-teal border border-accent-teal/30">
                                    Pedagogia & Design
                                </span>
                            </div>
                            <p className="text-xs text-secondary-text mt-0.5">
                                Recomendações fundamentadas na literatura científica e boas práticas de gamificação
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="
                            group rounded-xl p-2.5 transition-all duration-200
                            hover:bg-danger/10 hover:text-danger
                            text-secondary-text border border-transparent hover:border-danger/30
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

                {/* Rodapé com Deep-Link Contextual para a Documentação Docente (US-26) */}
                <div className="px-6 py-5 bg-primary-bg/50 border-t border-border-color rounded-b-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {docsDeepLink ? (
                        isInsideEditorOrWizard ? (
                            <a
                                href={docsDeepLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-accent-purple/15 hover:bg-accent-purple/25 text-accent-purple border border-accent-purple/30 transition-all"
                                title={`Abre "${docsDeepLink.label}" em nova aba sem perder seu rascunho`}
                            >
                                <FaBookOpen className="w-3.5 h-3.5" />
                                <span>Ler na Documentação Completa</span>
                                <FaExternalLinkAlt className="w-3 h-3 opacity-80" />
                            </a>
                        ) : (
                            <Link
                                to={docsDeepLink.url}
                                onClick={onClose}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-accent-purple/15 hover:bg-accent-purple/25 text-accent-purple border border-accent-purple/30 transition-all"
                            >
                                <FaBookOpen className="w-3.5 h-3.5" />
                                <span>Ler na Documentação Completa</span>
                            </Link>
                        )
                    ) : (
                        <div />
                    )}

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

HelpModal.propTypes = {
    isOpen: PropTypes.bool,
    contentKey: PropTypes.string,
    onClose: PropTypes.func.isRequired
};

export default HelpModal;