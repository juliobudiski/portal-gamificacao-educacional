// frontend/src/components/activity/InteractionPanel.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';

/**
 * @component InteractionPanel
 * @description
 * Slide-out side panel for displaying interactive content (e.g., quizzes, forms) alongside the game board.
 * 
 * Architectural Decisions:
 * - Layout Abstraction: Acts as a pure wrapper component, rendering `children` to keep the layout concern separate from the specific interaction logic (SRP).
 * - Responsive Transitions: Uses CSS transforms (`translate-x-full`) and transitions for smooth sliding animations, falling back to a fixed overlay on mobile while remaining relative on desktop.
 */

const InteractionPanel = ({ isOpen, onClose, title, children }) => {
  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 w-full lg:w-[450px] lg:relative lg:flex-shrink-0 flex flex-col 
      bg-gradient-to-b from-primary-bg/95 to-secondary-bg/95 backdrop-blur-xl border-l border-accent-yellow/20 
      shadow-[-10px_0_30px_rgba(0,0,0,0.5)] dark:shadow-[-10px_0_30px_rgba(0,0,0,0.8)]
      transform transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <header className="flex justify-between items-center px-6 py-4 bg-black/10 dark:bg-black/30 border-b border-accent-yellow/10 flex-shrink-0">
          <h2 className="text-2xl font-bold text-accent-yellow drop-shadow-sm">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-transparent hover:bg-white/10 p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-yellow/50"
            aria-label="Fechar Painel"
          >
            <FaTimes size={18} />
          </button>
        </header>
        <main className="p-6 overflow-y-auto flex-grow custom-scrollbar">
          {children}
        </main>
      </div>
    </aside>
  );
};

export default InteractionPanel;