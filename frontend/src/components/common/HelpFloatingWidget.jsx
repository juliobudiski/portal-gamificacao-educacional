import React, { useState } from 'react';
import { HelpCircle, X, Search, BookOpen, Compass, RotateCcw } from 'lucide-react';
import { useTutorial } from '../../context/TutorialContext';
import { useAuth } from '../../context/AuthContext';
import { STUDENT_DASHBOARD_STEPS, TEACHER_DASHBOARD_STEPS } from '../../data/tutorialSteps';

/**
 * HelpFloatingWidget (Melhoria 04: Central de Ajuda Flutuante com Busca Rápida)
 * Fornece acesso persistente ao guia passo-a-passo, FAQs e atalhos rápidos de navegação.
 */
export default function HelpFloatingWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { startTour } = useTutorial();
    const { user } = useAuth();

    const faqItems = [
        {
            q: 'Como ganho moedas e XP?',
            a: 'Resolva quizzes nos nós do tabuleiro com rapidez e precisão, gire a roleta diária e conclua trilhas completas.'
        },
        {
            q: 'O que fazer se um desafio estiver bloqueado?',
            a: 'Você precisa concluir com sucesso os nós anteriores na ordem da trilha para liberar os passos subsequentes.'
        },
        {
            q: 'Como alterar meu avatar ou título?',
            a: 'Visite a Loja de Itens ou vá ao seu Perfil para equipar cosméticos e medalhas desbloqueadas.'
        },
        {
            q: 'Como o professor cria uma turma?',
            a: 'No Painel do Professor, clique em "Minhas Turmas" -> "Criar Nova Turma" e compartilhe o código alfanumérico.'
        }
    ];

    const filteredFaqs = faqItems.filter(item =>
        item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.a.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRestartTour = () => {
        if (user?.role === 'professor') {
            startTour(TEACHER_DASHBOARD_STEPS, 'teacher_dashboard_v1', true);
        } else {
            startTour(STUDENT_DASHBOARD_STEPS, 'student_dashboard_v1', true);
        }
        setIsOpen(false);
    };

    return (
        <aside aria-label="Central de Ajuda e Suporte" className="fixed bottom-6 right-6 z-40">
            {/* Botão Flutuante */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gradient-to-r from-accent-teal to-cyan-500 hover:from-accent-teal/90 hover:to-cyan-400 text-gray-900 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-accent-teal/50"
                    title="Central de Ajuda"
                    aria-label="Abrir Central de Ajuda"
                >
                    <HelpCircle size={28} className="text-gray-950 transition-transform group-hover:rotate-12" />
                </button>
            )}

            {/* Painel Flutuante Aberto */}
            {isOpen && (
                <div className="w-80 sm:w-96 bg-secondary-bg/95 backdrop-blur-xl border border-accent-teal/30 rounded-3xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[500px]">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-accent-teal/20 to-accent-purple/20 border-b border-border-color flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Compass className="text-accent-teal" size={20} />
                            <h3 className="font-bold text-primary-text text-base">Central de Ajuda</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-secondary-text hover:text-primary-text p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Ação de Reiniciar Tutorial */}
                    <div className="p-3 bg-accent-teal/10 border-b border-border-color/50 flex items-center justify-between">
                        <span className="text-xs text-primary-text font-medium flex items-center gap-1.5">
                            <RotateCcw size={14} className="text-accent-teal" /> Deseja rever o tutorial guiado?
                        </span>
                        <button
                            onClick={handleRestartTour}
                            className="text-xs bg-accent-teal hover:bg-accent-teal/80 text-gray-950 font-bold px-3 py-1.5 rounded-lg transition-transform active:scale-95 shadow-sm"
                        >
                            Reiniciar Tour
                        </button>
                    </div>

                    {/* Barra de Pesquisa Rápida */}
                    <div className="p-3 border-b border-border-color/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-secondary-text" size={16} />
                            <input
                                type="text"
                                placeholder="Pesquisar dúvidas e guias..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-primary-bg/70 border border-border-color rounded-xl pl-9 pr-3 py-2 text-xs text-primary-text placeholder-secondary-text focus:outline-none focus:border-accent-teal"
                            />
                        </div>
                    </div>

                    {/* Lista de FAQs */}
                    <div className="p-3 overflow-y-auto space-y-3 flex-1">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, idx) => (
                                <div key={idx} className="bg-primary-bg/40 p-3 rounded-xl border border-border-color/40">
                                    <p className="text-xs font-bold text-primary-text mb-1 flex items-start gap-1.5">
                                        <BookOpen size={13} className="text-accent-purple flex-shrink-0 mt-0.5" />
                                        {faq.q}
                                    </p>
                                    <p className="text-[11px] text-secondary-text leading-relaxed pl-4">
                                        {faq.a}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-secondary-text text-center py-4">
                                Nenhuma resposta encontrada para "{searchTerm}".
                            </p>
                        )}
                    </div>
                </div>
            )}
        </aside>
    );
}
