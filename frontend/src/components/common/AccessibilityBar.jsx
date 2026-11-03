import React, { useState } from 'react';
import { Eye, Type, Pause, Play, Palette, Sparkles, X } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

/**
 * AccessibilityBar (Melhorias 65, 67, 69, 72: Painel Rápido de Acessibilidade WCAG 2.2 AA)
 */
export default function AccessibilityBar() {
    const [isOpen, setIsOpen] = useState(false);
    const {
        highContrast,
        toggleHighContrast,
        fontScale,
        cycleFontScale,
        colorblindMode,
        setColorblindMode,
        animationsPaused,
        toggleAnimationsPaused
    } = useAccessibility();

    return (
        <aside aria-label="Menu de Acessibilidade" className="fixed top-24 left-4 z-40">
            {/* Botão Gatilho Discreto */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2.5 rounded-full bg-secondary-bg/90 backdrop-blur-md border border-accent-teal/40 text-accent-teal hover:bg-accent-teal hover:text-gray-950 shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-teal"
                    title="Opções de Acessibilidade (WCAG 2.2)"
                    aria-label="Abrir Painel de Acessibilidade"
                >
                    <Eye size={20} />
                </button>
            )}

            {/* Caixa Flutuante com Controles */}
            {isOpen && (
                <div 
                    role="region" 
                    aria-label="Controles de Acessibilidade"
                    className="w-64 bg-secondary-bg/95 backdrop-blur-xl border border-accent-teal/40 rounded-2xl shadow-2xl p-4 space-y-3 animate-fade-in"
                >
                    <div className="flex items-center justify-between border-b border-border-color pb-2">
                        <span className="text-xs font-extrabold text-primary-text flex items-center gap-1.5">
                            <Eye size={16} className="text-accent-teal" /> Acessibilidade
                        </span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-secondary-text hover:text-primary-text p-1 rounded-lg"
                            aria-label="Fechar Painel de Acessibilidade"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* 1. Alto Contraste Extremo (Melhoria 65) */}
                    <button
                        onClick={toggleHighContrast}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                            highContrast
                                ? 'bg-yellow-400 text-black border-yellow-300 shadow-md'
                                : 'bg-primary-bg/70 text-primary-text border-border-color hover:border-accent-teal/40'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Sparkles size={14} /> Alto Contraste
                        </span>
                        <span>{highContrast ? 'Ativo' : 'Padrão'}</span>
                    </button>

                    {/* 2. Escala de Fonte (Melhoria 69) */}
                    <button
                        onClick={cycleFontScale}
                        className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-primary-bg/70 text-primary-text border border-border-color hover:border-accent-teal/40 flex items-center justify-between transition-all"
                    >
                        <span className="flex items-center gap-2">
                            <Type size={14} /> Tamanho da Fonte
                        </span>
                        <span className="font-mono text-accent-teal">
                            {fontScale === 'normal' ? '100%' : fontScale === 'medium' ? '115%' : '130%'}
                        </span>
                    </button>

                    {/* 3. Pausar Animações (Melhoria 72) */}
                    <button
                        onClick={toggleAnimationsPaused}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                            animationsPaused
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : 'bg-primary-bg/70 text-primary-text border-border-color hover:border-accent-teal/40'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            {animationsPaused ? <Play size={14} /> : <Pause size={14} />} Animações
                        </span>
                        <span>{animationsPaused ? 'Pausadas' : 'Ativas'}</span>
                    </button>

                    {/* 4. Modo Daltônico (Melhoria 67) */}
                    <div className="space-y-1 pt-1">
                        <label className="text-[11px] font-semibold text-secondary-text flex items-center gap-1.5">
                            <Palette size={12} /> Filtro para Daltonismo
                        </label>
                        <select
                            value={colorblindMode}
                            onChange={(e) => setColorblindMode(e.target.value)}
                            className="w-full bg-primary-bg text-primary-text border border-border-color rounded-xl p-2 text-xs focus:outline-none focus:border-accent-teal"
                        >
                            <option value="none">Desativado (Normal)</option>
                            <option value="protanopia">Protanopia (Sem Vermelho)</option>
                            <option value="deuteranopia">Deuteranopia (Sem Verde)</option>
                            <option value="tritanopia">Tritanopia (Sem Azul)</option>
                        </select>
                    </div>
                </div>
            )}
        </aside>
    );
}