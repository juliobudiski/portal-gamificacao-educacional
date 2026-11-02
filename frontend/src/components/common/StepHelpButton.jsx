import React from 'react';
import { FaQuestionCircle, FaLightbulb } from 'react-icons/fa';
import { useHelpModal } from '../../context/HelpModalContext';

/**
 * StepHelpButton
 * Componente unificado e de alta visibilidade para os botões de ajuda dos passos de criação de atividade.
 * Resolve o problema de botões de ajuda 'escondidos' ou pouco evidentes:
 * - Destaque visual com badge e texto explícito 'Guia & Dicas'.
 * - Micro-animação suave (glow/pulse sutil) e gradiente interativo.
 * - Suporte a modo claro e escuro.
 * - Integração direta com HelpModalContext via contentKey.
 */
export default function StepHelpButton({ 
  contentKey, 
  title = "Guia do Passo",
  subtitle = "Ver dicas pedagógicas e exemplos",
  variant = "prominent"
}) {
  const { openHelp } = useHelpModal();

  if (!contentKey) return null;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => openHelp(contentKey)}
        className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-teal/10 hover:bg-accent-teal/20 border border-accent-teal/40 hover:border-accent-teal text-accent-teal font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-[0_0_12px_rgba(20,184,166,0.3)] active:scale-95"
        title="Clique para abrir as orientações pedagógicas deste passo"
        aria-label="Abrir ajuda deste passo"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-teal opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-teal"></span>
        </span>
        <FaQuestionCircle className="text-sm transition-transform group-hover:scale-110" />
        <span>Dicas do Passo</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openHelp(contentKey)}
      className="group relative flex items-center gap-3.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-primary-bg via-secondary-bg to-primary-bg border-2 border-accent-teal/40 hover:border-accent-teal text-primary-text hover:text-accent-teal transition-all duration-300 shadow-md hover:shadow-[0_4px_20px_rgba(20,184,166,0.25)] transform hover:-translate-y-0.5 active:scale-95 text-left"
      title="Clique para abrir as orientações pedagógicas, literatura e dicas deste passo"
      aria-label="Abrir orientações pedagógicas e dicas deste passo"
    >
      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-accent-teal/20 to-accent-yellow/20 border border-accent-teal/40 group-hover:border-accent-teal text-accent-teal group-hover:scale-105 transition-all shadow-inner">
        <FaLightbulb className="text-lg text-accent-yellow group-hover:text-accent-teal transition-colors" />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-teal opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-teal"></span>
        </span>
      </div>

      <div className="flex flex-col pr-1">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-sm text-primary-text group-hover:text-accent-teal transition-colors tracking-tight">
            {title}
          </span>
          <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-full bg-accent-teal/20 text-accent-teal border border-accent-teal/40">
            Ajuda
          </span>
        </div>
        <span className="text-xs text-secondary-text font-medium group-hover:text-primary-text/90 transition-colors">
          {subtitle}
        </span>
      </div>
    </button>
  );
}
