import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Copy, Check, Share2, X } from 'lucide-react';

/**
 * @component ClassShareModal
 * @description
 * Modal de compartilhamento ágil de turma (Melhorias 82 & 83).
 * Inclui cópia com feedback visual de 2 segundos e envio direto para WhatsApp e Google Classroom.
 */
export default function ClassShareModal({ isOpen, onClose, classCode, className }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `Olá! Junte-se à nossa turma gamificada "${className}" no GamificaEdu com o código: ${classCode}! Acesse: https://gamificaedu.salasmart.com.br/`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(classCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para seleção de texto
    }
  };

  const shareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareClassroom = () => {
    const url = `https://classroom.google.com/share?url=${encodeURIComponent('https://gamificaedu.salasmart.com.br/')}&title=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-secondary-bg border border-border-color rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary-text hover:text-primary-text p-2 rounded-xl"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="w-16 h-16 bg-accent-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent-teal border border-accent-teal/30">
          <Share2 size={28} />
        </div>

        <h3 className="text-2xl font-bold text-primary-text mb-1">Compartilhar Turma</h3>
        <p className="text-sm text-secondary-text mb-6">Convide seus alunos enviando o código oficial da turma</p>

        {/* Caixa de Código com Cópia Rápida (Melhoria 82) */}
        <div className="flex items-center justify-between bg-primary-bg p-3.5 rounded-2xl border border-border-color mb-6">
          <span className="font-mono text-2xl font-extrabold tracking-widest text-accent-teal ml-2">
            {classCode}
          </span>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all min-h-[44px] min-w-[44px] ${
              copied
                ? 'bg-emerald-500 text-black shadow-lg scale-105'
                : 'bg-accent-teal hover:bg-teal-600 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check size={16} /> Copiado!
              </>
            ) : (
              <>
                <Copy size={16} /> Copiar
              </>
            )}
          </button>
        </div>

        {/* Compartilhamento Direto (Melhoria 83) */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-color/40">
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-bold text-xs rounded-xl transition-all min-h-[44px]"
          >
            <span>💬 WhatsApp</span>
          </button>
          <button
            onClick={shareClassroom}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 font-bold text-xs rounded-xl transition-all min-h-[44px]"
          >
            <span>🏫 Classroom</span>
          </button>
        </div>
      </div>
    </div>
  );
}

ClassShareModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  classCode: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired
};
