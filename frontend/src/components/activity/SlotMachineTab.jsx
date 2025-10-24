import React, { useState, useEffect, useCallback } from 'react';
import { FaGem, FaStar, FaTrophy, FaGift, FaSyncAlt, FaSpinner, FaCoins } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ====================================================================
// 1. ESTILOS CSS PARA ANIMAÇÕES E LAYOUT 'CLEAN'
//    (Pode ser movido para um arquivo .css se preferir)
// ====================================================================
const style = `
  @keyframes spinAnimation {
    from { transform: translateY(-75%); }
    to { transform: translateY(0%); }
  }

  @keyframes prizeReveal {
    0% { opacity: 0; transform: scale(0.5) translateY(50px); }
    60% { opacity: 1; transform: scale(1.1) translateY(0); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px 5px rgba(251, 191, 36, 0.4); }
    50% { box-shadow: 0 0 35px 12px rgba(251, 191, 36, 0.7); }
  }

  .reel-strip {
    transition: transform 3s cubic-bezier(0.33, 1, 0.68, 1);
  }
  
  .is-spinning .reel-strip {
    transform: translateY(calc(-100% + 96px)); /* 96px é a altura de um item (h-24) */
    animation: spinAnimation 0.5s linear infinite;
  }

  .result-win {
    animation: glow 1.5s ease-in-out;
  }
`;

// ====================================================================
// 2. CONFIGURAÇÃO DE SÍMBOLOS
// ====================================================================
const symbols = [
  { name: 'gem', icon: <FaGem className="text-blue-400" />, value: 25 },
  { name: 'star', icon: <FaStar className="text-yellow-400" />, value: 75 },
  { name: 'trophy', icon: <FaTrophy className="text-orange-500" />, value: 200 },
  { name: 'gift', icon: <FaGift className="text-red-500" />, value: 1, type: 'special' },
];

// ====================================================================
// 3. SUB-COMPONENTE 'REEL' PARA CADA COLUNA
//    (Encapsula a lógica de animação de uma única coluna)
// ====================================================================
const Reel = ({ finalSymbol, isSpinning, delay }) => {
  // Cria uma lista longa e embaralhada de símbolos para a animação de "blur"
  const reelSymbols = React.useMemo(() =>
    [...Array(10)].flatMap(() => [...symbols].sort(() => Math.random() - 0.5)),
    []);

  return (
    <div className="w-24 h-24 bg-primary-bg/50 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
      <div
        className={`reel-strip ${isSpinning ? 'is-spinning' : ''}`}
        style={{ transitionDelay: isSpinning ? '0s' : delay }}
      >
        {isSpinning ? (
          reelSymbols.map((s, i) => (
            <div key={i} className="text-6xl h-24 flex-shrink-0 flex items-center justify-center">{s.icon}</div>
          ))
        ) : (
          <div className="text-6xl h-24 flex-shrink-0 flex items-center justify-center">{finalSymbol.icon}</div>
        )}
      </div>
    </div>
  );
};

// ====================================================================
// 4. COMPONENTE PRINCIPAL 'SlotMachineTab' COM A CORREÇÃO
// ====================================================================
const SlotMachineTab = ({ userCoins, onPrizeWon, onWin, onReturn }) => {
  const { user } = useAuth();
  const { activityId } = useParams();

  // --- Estados do Componente ---
  const [reels, setReels] = useState([symbols[0], symbols[1], symbols[2]]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultState, setResultState] = useState(null);
  const [prizeMessage, setPrizeMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const spinCost = 0;

  // --- INÍCIO DA CORREÇÃO: Estados e lógica para buscar ganhadores ---
  const [winners, setWinners] = useState([]);
  const [loadingWinners, setLoadingWinners] = useState(true);

  // Função para buscar os últimos ganhadores no backend
  const fetchWinners = useCallback(async () => {
    setLoadingWinners(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/progress/${activityId}/slot-winners`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.ok) {
        setWinners(await response.json());
      } else {
        console.error("Falha ao buscar ganhadores do caça-níquel.");
      }
    } catch (err) {
      console.error("Erro de rede ao buscar ganhadores:", err);
    } finally {
      setLoadingWinners(false);
    }
  }, [activityId, user.token]);

  // useEffect para chamar a busca de ganhadores quando o componente carregar
  useEffect(() => {
    fetchWinners();
  }, [fetchWinners]);
  // --- FIM DA CORREÇÃO ---


  const handleSpinClick = async () => {
    if (userCoins < spinCost) {
      setError(`Moedas insuficientes. Custo: ${spinCost}`);
      return;
    }

    setError('');
    setPrizeMessage('');
    setResultState(null);
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/progress/${activityId}/play-slot`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Não foi possível jogar.');

      setIsSpinning(true);
      setLoading(false);

      const finalSymbols = result.result.map(symbolName => symbols.find(s => s.name === symbolName));

      setTimeout(() => {
        setReels(finalSymbols);
        setIsSpinning(false);

        if (result.prize) {
          setResultState('win');
          setPrizeMessage(result.prize.description);
          if (result.prize.type === 'xp') {
            onPrizeWon(result.prize.value);
          }
          // --- CORREÇÃO: Chama fetchWinners após ganhar ---
          fetchWinners(); // Atualiza a lista de ganhadores
        } else {
          setResultState('lose');
          setPrizeMessage("Não foi dessa vez!");
        }
        // Chama onWin para que o componente pai possa atualizar o saldo de moedas, se necessário
        onWin?.();
      }, 3000);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center p-4 text-primary-text">
      <style>{style}</style>
      <button onClick={onReturn} className="absolute top-4 left-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200 transition-colors z-20">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" /></svg>
        Voltar
      </button>

      {/* Layout principal com duas colunas em telas grandes */}
      <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">

        {/* Coluna Principal: A Máquina */}
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold">Caça-Níquel</h1>
            <div className="mt-2 flex items-center justify-center gap-2 text-lg font-bold text-yellow-300 bg-yellow-400/10 px-4 py-2 rounded-full">
              <FaCoins />
              <span>Você tem: {userCoins} moedas</span>
            </div>
          </div>

          {/* A Máquina em si */}
          <div className={`flex justify-center items-center gap-4 bg-primary-bg p-6 rounded-xl border-4 border-border-color transition-shadow ${resultState === 'win' ? 'result-win' : ''}`}>
            {reels.map((symbol, i) => (
              <Reel key={i} finalSymbol={symbol} isSpinning={isSpinning} delay={`${i * 0.2}s`} />
            ))}
          </div>

          {/* Feedback de Resultado */}
          <div className="h-10 text-center">
            {prizeMessage && (
              <div className={`text-2xl font-bold ${resultState === 'win' ? 'text-yellow-400' : 'text-secondary-text'}`} style={{ animation: 'prizeReveal 0.5s ease-out' }}>
                {prizeMessage}
              </div>
            )}
            {error && <div className="text-lg text-red-400">{error}</div>}
          </div>

          {/* Botão de Ação */}
          <button
            onClick={handleSpinClick}
            disabled={isSpinning || loading || userCoins < spinCost}
            className="w-full max-w-xs py-4 px-8 rounded-xl text-xl font-bold text-primary-text bg-gradient-to-r from-[#ffbd30] to-[#69e8cb] hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
          >
            <div className="flex items-center justify-center gap-3">
              {loading ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
              <span>{isSpinning || loading ? "Girando..." : `Girar (${spinCost} moedas)`}</span>
            </div>
          </button>
        </div>

        {/* Coluna Secundária: Ganhadores */}
        <div className="w-full max-w-sm bg-primary-bg/50 backdrop-blur-sm p-4 rounded-2xl border border-border-color flex flex-col lg:mt-12">
          <h3 className="text-xl font-bold text-center mb-4 text-[#69e8cb]">Últimos Ganhadores</h3>
          {loadingWinners ? (<div className="flex-grow flex items-center justify-center py-8"><FaSpinner className="animate-spin text-2xl" /></div>
          ) : winners.length > 0 ? (
            <div className="space-y-3">
              {winners.map((winner, index) => (
                <div key={index} className="bg-border-color p-3 rounded-lg flex justify-between items-center animate-fadeIn">
                  <span className="font-semibold text-secondary-text">{winner.userName}</span>
                  <span className="font-bold text-yellow-400 px-2 py-1 bg-yellow-400/10 rounded-md text-sm">{winner.prize}</span>
                </div>
              ))}
            </div>
          ) : (<p className="text-secondary-text text-center italic py-8">Ainda não houve ganhadores.</p>)}
        </div>
      </div>
    </div>
  );
};

export default SlotMachineTab;