import React, { useState, useRef } from 'react';
import { FaFileContract, FaCheckCircle } from 'react-icons/fa';

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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center mb-4">
          <FaFileContract className="text-2xl text-yellow-400 mr-3" />
          <h3 className="text-2xl font-bold text-white">Termos de Uso e Serviço</h3>
        </div>
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-grow overflow-y-auto pr-4 text-gray-300 space-y-4 text-sm"
        >
          {/* O texto dos termos será inserido aqui */}
          {termsText.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full sm:w-auto mb-2 sm:mb-0 py-2 px-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={onAccept}
            disabled={!hasScrolledToEnd}
            className="w-full sm:w-auto py-2 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <FaCheckCircle className="mr-2" />
            Li e Aceito os Termos
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUseModal;