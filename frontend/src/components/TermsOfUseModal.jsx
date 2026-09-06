import React, { useState, useRef } from "react";
import { FaFileContract, FaCheckCircle } from "react-icons/fa";

/**
 * @component TermsOfUseModal
 * @description
 * Modal for displaying and accepting legal agreements.
 * 
 * Architectural Decisions:
 * - Interaction Enforcement: Utilizes a `scroll` event listener and a ref to mandate that the user reads (or scrolls through) the entire document before enabling the accept button.
 * - Content Injection: Expects `termsText` via props rather than hardcoding legal text, ensuring the modal remains a generic, reusable structural component.
 */
const TermsOfUseModal = ({ onClose, onAccept, termsText }) => {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Adicionamos uma pequena margem (5px) para garantir que funcione em todos os navegadores
    if (scrollHeight - scrollTop <= clientHeight + 5) {
      setHasScrolledToEnd(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity">
      <div className="bg-primary-bg p-6 sm:p-8 rounded-xl shadow-xl max-w-2xl w-full border border-border-color flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Cabeçalho */}
        <div className="flex items-center mb-4">
          <FaFileContract className="text-3xl text-accent-yellow mr-3 drop-shadow-md" />
          <h3 className="text-2xl font-bold text-primary-text">
            Termos de Uso e Serviço
          </h3>
        </div>

        {/* Conteúdo */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-grow overflow-y-auto pr-4 text-secondary-text space-y-4 text-sm leading-relaxed custom-scrollbar"
        >
          {termsText.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-border-color gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2 px-6 rounded-xl font-semibold shadow-md transition-all bg-primary-bg text-primary-text hover:bg-hover-bg-color focus:ring-2 focus:ring-accent-purple focus:outline-none"
          >
            Fechar
          </button>
          <button
            onClick={onAccept}
            disabled={!hasScrolledToEnd}
            className={`w-full sm:w-auto py-2 px-6 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2
              ${hasScrolledToEnd
                ? "bg-gradient-to-r from-accent-teal to-accent-purple text-primary-text hover:opacity-90 focus:ring-2 focus:ring-accent-yellow"
                : "bg-gray-600 text-secondary-text cursor-not-allowed"
              }`}
          >
            <FaCheckCircle />
            Li e Aceito os Termos
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUseModal;
