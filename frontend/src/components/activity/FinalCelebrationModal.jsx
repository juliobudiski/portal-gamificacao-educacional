import React from 'react';
import PropTypes from 'prop-types';
import { Trophy, Award, Coins, Star, ArrowRight } from 'lucide-react';
import { useConfetti } from '../../context/ConfettiContext';

/**
 * @component FinalCelebrationModal
 * @description
 * Animação épica de conclusão da trilha (Melhorias 95 & 99).
 * Revela a pontuação acumulada, moedas, medalhas conquistadas e baú comemorativo.
 */
export default function FinalCelebrationModal({ isOpen, onClose, score = 100, coins = 50, medalName = 'Medalha do Explorador' }) {
  const { triggerConfetti } = useConfetti();

  React.useEffect(() => {
    if (isOpen) {
      triggerConfetti();
    }
  }, [isOpen, triggerConfetti]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-secondary-bg border-2 border-yellow-400 rounded-3xl max-w-lg w-full p-8 shadow-[0_0_60px_rgba(250,204,21,0.4)] text-center relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Raios Dourados de Fundo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent pointer-events-none"></div>

        {/* Baú Dourado Animatrônico */}
        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-tr from-yellow-500 to-amber-300 rounded-3xl p-1 shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-500 animate-bounce">
          <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-5xl">
            🏆
          </div>
        </div>

        <span className="text-xs uppercase font-extrabold tracking-widest text-accent-yellow mb-1 block">
          Jornada Concluída com Sucesso!
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 tracking-tight">
          Parabéns, Herói do Conhecimento!
        </h2>

        {/* Grid de Recompensas Reveladas */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-primary-bg p-3 rounded-2xl border border-yellow-400/30 flex flex-col items-center">
            <Star className="text-yellow-400 mb-1" size={24} />
            <span className="text-xl font-extrabold text-white">+{score}</span>
            <span className="text-[10px] text-secondary-text uppercase font-semibold">Pontos XP</span>
          </div>

          <div className="bg-primary-bg p-3 rounded-2xl border border-amber-400/30 flex flex-col items-center">
            <Coins className="text-yellow-400 mb-1" size={24} />
            <span className="text-xl font-extrabold text-yellow-400">+{coins}</span>
            <span className="text-[10px] text-secondary-text uppercase font-semibold">Moedas de Ouro</span>
          </div>

          <div className="bg-primary-bg p-3 rounded-2xl border border-accent-teal/30 flex flex-col items-center">
            <Award className="text-accent-teal mb-1" size={24} />
            <span className="text-xs font-bold text-accent-teal line-clamp-1 mt-1">{medalName}</span>
            <span className="text-[10px] text-secondary-text uppercase font-semibold mt-1">Insígnia</span>
          </div>
        </div>

        <p className="text-sm text-secondary-text mb-6">
          Seu progresso foi registrado no ranking da turma e seu inventário foi atualizado.
        </p>

        <button
          onClick={onClose}
          className="w-full py-4 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 min-h-[44px]"
        >
          <span>Coletar Recompensas & Continuar</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

FinalCelebrationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  score: PropTypes.number,
  coins: PropTypes.number,
  medalName: PropTypes.string
};
