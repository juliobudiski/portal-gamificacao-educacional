import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaArrowLeft, FaCoins, FaInfoCircle, FaBolt, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import { useConfetti } from '../../context/ConfettiContext';

// --- CONFIGURAÇÃO VISUAL DOS SÍMBOLOS ---
const SYMBOL_MAP = {
  "orange": { icon: "🍊", color: "bg-orange-500/20 border-orange-500" },
  "bell": { icon: "🔔", color: "bg-yellow-500/20 border-yellow-500" },
  "diamond": { icon: "💎", color: "bg-cyan-500/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" },
  "wild": { icon: "🐯", color: "bg-red-600/30 border-red-500 shadow-[0_0_25px_rgba(220,38,38,0.8)] scale-110" },
  "bomb": { icon: "💣", color: "bg-gray-800/50 border-[var(--border-color)] grayscale opacity-80" },
};

// Altura de cada célula para cálculo da animação (em rem ou px)
const CELL_HEIGHT = 96; // 6rem = 96px

const SlotMachineTab = ({ userCoins, onReturn, onPlay }) => {
  const { user } = useAuth();
  const { activityId } = useParams();
  const { triggerConfetti } = useConfetti();

  // Estados
  const [matrix, setMatrix] = useState([
    ['orange', 'bell', 'diamond'],
    ['wild', 'orange', 'bomb'],
    ['bell', 'diamond', 'orange']
  ]);
  const [spinning, setSpinning] = useState(false);
  const [winData, setWinData] = useState(null); // Dados da vitória (linhas, valor)
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Refs para controlar animações individuais de colunas
  const colRefs = [useRef(null), useRef(null), useRef(null)];

  // --- FUNÇÃO DE GIRO (CORE) ---
  const handleSpin = async () => {
    if (spinning) return;
    if (userCoins < 10) {
      setError("Saldo insuficiente! Custo: 10 Moedas.");
      return;
    }

    setSpinning(true);
    setError('');
    setWinData(null);

    // 1. Toca som de giro (simulado)
    if (soundEnabled) playSound('spin');

    try {
      // 2. Chama Backend (Enquanto animação começa)
      const data = await onPlay();
      // data contém: { matrix, total_win, winning_lines, updated_progress }

      // 3. Processa a resposta mas MANTÉM o giro visual por um tempo mínimo (ex: 2s)
      setTimeout(() => {
        finishSpin(data);
      }, 2000);

    } catch (err) {
      setError(err.message || "Erro ao girar.");
      setSpinning(false);
    }
  };

  const finishSpin = (data) => {
    // Atualiza a matriz visualmente
    setMatrix(data.matrix);
    setSpinning(false);

    if (data.total_win > 0) {
      if (soundEnabled) playSound(data.is_jackpot ? 'jackpot' : 'win');
      setWinData(data);
      if (data.total_win >= 100) {
          triggerConfetti(6000);
      } else {
          triggerConfetti(3000);
      }
    }
  };

  // --- EFEITOS SONOROS SIMPLES ---
  const playSound = (type) => {
    // Aqui você implementaria Audio() real.
    // Ex: const audio = new Audio('/sounds/spin.mp3'); audio.play();
  };

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* BACKGROUND ESTILO CASSINO/NEON */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-gray-900 to-black -z-10" />

      {/* BOTÃO VOLTAR */}
      <button onClick={onReturn} className="absolute top-4 left-4 z-20 flex items-center gap-2 py-2 px-4 bg-gray-800/80 text-white rounded-full hover:bg-hover-bg-color0 transition-all border border-[var(--border-color)]">
        <FaArrowLeft /> Sair
      </button>

      {/* CABEÇALHO */}
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)]">
          TIGER FORTUNE
        </h1>
        <div className="mt-4 inline-flex items-center gap-3 bg-black/60 px-6 py-2 rounded-full border border-yellow-500/50 backdrop-blur-md">
          <FaCoins className="text-yellow-400 text-xl animate-pulse" />
          <span className="text-2xl font-mono font-bold text-white">{userCoins}</span>
        </div>
      </div>

      {/* --- A MÁQUINA (GRID 3x3) --- */}
      <div className="relative p-4 bg-gradient-to-b from-red-900 to-red-950 rounded-[2rem] border-4 border-yellow-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]">

        {/* Decorativo Topo */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-600 px-8 py-1 rounded-b-xl shadow-lg border-b border-yellow-400">
          <span className="text-xs font-bold text-red-950 uppercase tracking-widest">Multiplier x50</span>
        </div>

        <div className="flex gap-2 sm:gap-4 bg-black/40 p-4 rounded-xl overflow-hidden relative">

          {/* RENDERIZAÇÃO DAS 3 COLUNAS */}
          {[0, 1, 2].map((colIndex) => (
            <div key={colIndex} className="flex flex-col gap-2 sm:gap-4 w-20 sm:w-24 relative">
              {/* Blur Overlay durante o giro */}
              {spinning && (
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/0 via-white/10 to-black/0 backdrop-blur-[2px] animate-pulse" />
              )}

              {/* Células da Coluna */}
              {[0, 1, 2].map((rowIndex) => {
                const symbolKey = matrix[rowIndex][colIndex];
                const symbolData = SYMBOL_MAP[symbolKey];

                // Verifica se esta célula faz parte da linha vencedora
                const isWinner = winData?.winning_lines.some(line => {
                  const coords = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2], [0, 0], [1, 1], [2, 2], [2, 0], [1, 1], [0, 2]];
                  // Nota: A lógica visual de linha exata requer mapear coords do backend.
                  // Simplificação: Se ganhou, destaca todos os símbolos vencedores ou pisca a tela.
                  return winData && symbolKey !== 'bomb'; // Highlight simples
                });

                return (
                  <div
                    key={rowIndex}
                    className={`
                      h-20 sm:h-24 rounded-lg flex items-center justify-center text-4 sm:text-5xl 
                      border-2 shadow-inner transition-all duration-300
                      ${symbolData.color}
                      ${spinning ? 'animate-slot-spin blur-[1px]' : ''}
                      ${winData && !spinning && isWinner ? 'animate-bounce brightness-125 z-10' : ''}
                    `}
                    style={{
                      animationDelay: spinning ? `${colIndex * 0.1}s` : '0s',
                      transform: spinning ? 'translateY(0)' : 'none'
                    }}
                  >
                    {symbolData.icon}
                  </div>
                );
              })}
            </div>
          ))}

          {/* LINHAS DE VITÓRIA (OVERLAY SVG) - Opcional para efeito visual de linha */}
          {winData && !spinning && (
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-center items-center">
              <h2 className="text-4xl font-black text-yellow-300 drop-shadow-[0_0_10px_rgba(0,0,0,1)] animate-scale-in">
                +{winData.total_win}
              </h2>
            </div>
          )}
        </div>

        {/* ALAVANCA / BOTÃO DE GIRO */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSpin}
            disabled={spinning}
            className={`
                relative group px-12 py-4 rounded-full text-2xl font-black uppercase tracking-wider text-white shadow-xl
                ${spinning ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-green-700 hover:scale-105 hover:shadow-green-500/50'}
                transition-all duration-200 active:scale-95
              `}
          >
            <div className="absolute inset-0 rounded-full bg-white/20 group-hover:animate-ping opacity-0 group-hover:opacity-100" />
            <span className="flex items-center gap-3 drop-shadow-md">
              {spinning ? <FaBolt className="animate-spin" /> : <FaBolt />}
              {spinning ? 'Girando...' : 'GIRAR (10)'}
            </span>
          </button>
        </div>

        {/* MENSAGEM DE ERRO */}
        {error && (
          <div className="mt-4 text-center bg-red-900/80 text-red-200 px-4 py-2 rounded-lg border border-red-500 animate-fadeIn">
            {error}
          </div>
        )}
      </div>

      {/* INFO / PAYTABLE */}
      <div className="mt-8 text-secondary-text text-sm flex gap-4">
        <div className="flex items-center gap-2"><span className="text-2xl">🍊</span> x2</div>
        <div className="flex items-center gap-2"><span className="text-2xl">🔔</span> x5</div>
        <div className="flex items-center gap-2"><span className="text-2xl">💎</span> x10</div>
        <div className="flex items-center gap-2"><span className="text-2xl">🐯</span> x50 (Wild)</div>
      </div>

      {/* CSS CUSTOMIZADO PARA ANIMAÇÃO DE BLUR VERTICAL */}
      <style>{`
        @keyframes slot-spin {
          0% { transform: translateY(-10px); filter: blur(1px); }
          50% { transform: translateY(10px); filter: blur(3px); }
          100% { transform: translateY(-10px); filter: blur(1px); }
        }
        .animate-slot-spin {
          animation: slot-spin 0.2s linear infinite;
        }
        @keyframes scale-in {
            0% { transform: scale(0); opacity: 0; }
            80% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default SlotMachineTab;