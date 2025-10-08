import React, { useState, useRef } from "react";
import { FaFileContract, FaCheckCircle } from "react-icons/fa";

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
      <div className="bg-[#2c3135] p-6 sm:p-8 rounded-xl shadow-xl max-w-2xl w-full border border-gray-700 flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Cabeçalho */}
        <div className="flex items-center mb-4">
          <FaFileContract className="text-3xl text-accent-yellow mr-3 drop-shadow-md" />
          <h3 className="text-2xl font-bold text-white">
            Termos de Uso e Serviço
          </h3>
        </div>

        {/* Conteúdo */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-grow overflow-y-auto pr-4 text-gray-300 space-y-4 text-sm leading-relaxed custom-scrollbar"
        >
          {termsText.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-700 gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2 px-6 rounded-xl font-semibold shadow-md transition-all bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-500 hover:to-gray-600 focus:ring-2 focus:ring-accent-purple focus:outline-none"
          >
            Fechar
          </button>
          <button
            onClick={onAccept}
            disabled={!hasScrolledToEnd}
            className={`w-full sm:w-auto py-2 px-6 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2
              ${hasScrolledToEnd
                ? "bg-gradient-to-r from-accent-teal to-accent-purple text-black hover:opacity-90 focus:ring-2 focus:ring-accent-yellow"
                : "bg-gray-600 text-gray-300 cursor-not-allowed"
              }`}
          >
            <FaCheckCircle />
            Li e Aceito os Termos
          </button>
        </div>s
      </div>
    </div>
  );
};

export default TermsOfUseModal;
