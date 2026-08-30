// frontend/src/components/activity/RouletteTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import CustomWheel from './CustomWheel';
import { FaTrophy, FaGift, FaSyncAlt, FaExclamationTriangle, FaArrowLeft, FaSpinner } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Estilo para animações e layout
const style = `
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes prize-reveal { 
  from { opacity: 0; transform: scale(0.8); } 
  to { opacity: 1; transform: scale(1); } 
}
.animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
.prize-reveal-box { animation: prize-reveal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
`;

const basePrizes = [
  { id: "prize-1", text: "50 Moedas", icon: FaGift, type: "coins", value: 50 }, // Mudou Icone e Texto
  { id: "prize-2", text: "100 Moedas", icon: FaGift, type: "coins", value: 100 },
  { id: "prize-3", text: "Título: O Sortudo", icon: FaTrophy, type: "title" },
  { id: "prize-4", text: "150 Moedas", icon: FaGift, type: "coins", value: 150 },
  { id: "prize-5", text: "Avatar Raro!", icon: FaTrophy, type: "avatar" },
  { id: "prize-6", text: "200 Moedas!", icon: FaGift, type: "coins", value: 200 }, // Repeti para preencher 6 slots
];

const RouletteTab = ({ onReturn, onSpin }) => {
  const { user } = useAuth();
  const { activityId } = useParams();
  const [retryAvailable, setRetryAvailable] = useState(false);

  const [isSpinning, setIsSpinning] = useState(false);
  const [winningPrizeIndex, setWinningPrizeIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revealedPrize, setRevealedPrize] = useState(null);
  const [error, setError] = useState("");
  const [winners, setWinners] = useState([]);
  const [loadingWinners, setLoadingWinners] = useState(true);
  const [apiPrize, setApiPrize] = useState(null);
  const segments = basePrizes.map((p) => p.text);

  const fetchWinners = useCallback(async () => {
    setLoadingWinners(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/progress/${activityId}/roulette-winners`, { headers: { Authorization: `Bearer ${user.token}` } });
      if (response.ok) setWinners(await response.json());
    } catch (err) { console.error("Erro ao buscar vencedores:", err); }
    finally { setLoadingWinners(false); }
  }, [activityId, user.token]);

  useEffect(() => { fetchWinners(); }, [fetchWinners]);

  const handleSpinClick = async () => {
    if (isSpinning || loading) return;
    setError("");
    setRevealedPrize(null);
    setLoading(true);

    try {
      // Passamos para a função onSpin se é um retry ou não
      // O backend deve esperar um payload { is_retry: true/false }
      const result = await onSpin(retryAvailable);

      if (result && result.prize) {
        setApiPrize(result.prize);

        // Mapeia o nome do prêmio para o índice da roleta
        const prizeText = result.prize.label.trim();
        const prizeIndex = segments.findIndex(s => s.trim() === prizeText);

        if (prizeIndex !== -1) {
          setIsSpinning(true);
          setWinningPrizeIndex(prizeIndex);
        } else {
          setWinningPrizeIndex(0);
        }
      }
    } catch (err) {
      // --- TRATAMENTO DE ERRO AMIGÁVEL ---
      let msg = err.message || "Não foi possível girar.";

      // 1. Tenta limpar se vier como JSON string (aquele erro feio)
      try {
        if (msg.includes('{')) {
          const parsed = JSON.parse(msg.substring(msg.indexOf('{')));
          if (parsed.message) msg = parsed.message;
        }
      } catch (e) { /* Se falhar o parse, usa a mensagem original */ }

      // 2. Traduz para algo mais instrucional
      if (msg.includes("já girou") || msg.includes("hoje")) {
        msg = "⏳ Você já tentou sua sorte hoje! Volte amanhã para mais prêmios.";
      }

      setError(msg);
      setLoading(false);
    }
  };

  // --- 3. ATUALIZE A FUNÇÃO handleWheelStop ---
  const handleWheelStop = () => {
    setLoading(false); // Libera o botão
    setIsSpinning(false); // Para animação visual

    if (!apiPrize) return;

    // LÓGICA PRINCIPAL DE RETRY
    if (apiPrize.is_duplicate) {
      setRetryAvailable(true);
      setWinningPrizeIndex(null); // Reseta posição visual suavemente
      // Feedback visual rápido sem modal intrusivo
      setError(null); // Limpa erros antigos
    } else {
      // Sucesso Real (XP ou Item Novo)
      setRetryAvailable(false);
      setRevealedPrize(apiPrize); // Mostra o Modal de Vitória

      setTimeout(() => {
        setRevealedPrize(null);
        setWinningPrizeIndex(null);
        setApiPrize(null);
        fetchWinners();
      }, 3000);
    }
  };


  return (
    <div className="w-full max-w-6xl mx-auto relative pt-16 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 p-8 bg-primary-bg rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-white/10 min-h-[70vh] mt-8 mb-8 overflow-hidden">
      {/* Luz de fundo estilo Neon */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <style>{style}</style>

      <button
        onClick={onReturn}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 py-2.5 px-5 
                    bg-black/50 text-secondary-text font-bold backdrop-blur-md
                    border border-white/10 rounded-full shadow-lg 
                    hover:bg-white/10 hover:text-white hover:scale-105 transition-all"
      >
        <FaArrowLeft /> Voltar ao Tabuleiro
      </button>

      {/* Coluna da Roleta */}
      <div className="flex flex-col items-center gap-6 flex-shrink-0 relative z-10 w-full lg:w-[60%]">
        <div className="text-center">
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] uppercase tracking-widest mb-3">Roda da Fortuna</h2>
          
          {/* Texto dinâmico de status */}
          {!retryAvailable ? (
            <p className="text-secondary-text font-medium text-lg bg-black/30 px-6 py-2 rounded-full border border-white/5 inline-block">Teste sua sorte uma vez por dia!</p>
          ) : (
            <p className="text-yellow-400 font-bold text-lg animate-pulse flex items-center gap-3 bg-yellow-900/30 px-6 py-2 rounded-full border border-yellow-500/50 inline-flex">
              <FaRedo className="text-2xl" /> Ops! Item repetido. Gire novamente GRÁTIS!
            </p>
          )}
        </div>

        {/* CONTAINER COM POSICIONAMENTO RELATIVO (O segredo está aqui) */}
        <div className="relative flex justify-center items-center">

          {/* A Roleta fica no fundo */}
          <div className={`${error ? 'opacity-50 blur-sm pointer-events-none' : ''} transition-all duration-500`}>
            <CustomWheel
              segments={segments}
              winningSegmentIndex={winningPrizeIndex}
              onFinished={handleWheelStop}
              onSpin={handleSpinClick}
              isSpinning={isSpinning}
              isLoading={loading}
            />
          </div>

          {/* MENSAGEM DE ERRO (SOBREPOSTA) */}
          {error && (
            <div className="absolute inset-0 z-50 flex items-center justify-center animate-fadeIn">
              <div className="bg-primary-bg/90 backdrop-blur-md border-2 border-red-500 p-6 rounded-2xl shadow-2xl max-w-xs text-center transform scale-100 hover:scale-105 transition-transform">
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-red-500/20 p-4 rounded-full">
                    <FaExclamationTriangle className="text-4xl text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-red-100">Ops!</h3>
                  <p className="text-red-200 text-sm leading-relaxed font-medium">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MENSAGEM DE DUPLICATA (Também pode ser sobreposta se quiser, mas deixei abaixo por enquanto) */}
        </div>

        {retryAvailable && !isSpinning && (
          <div className="mt-[-20px] z-10 bg-yellow-500/20 border border-yellow-500 text-yellow-200 px-6 py-3 rounded-full animate-fadeIn text-center shadow-lg backdrop-blur-sm">
            Você caiu em <strong>{apiPrize?.label}</strong>, mas já possui este item.<br />
            <strong className="uppercase tracking-wide text-yellow-400">Gire de novo!</strong>
          </div>
        )}
      </div>

      {/* Coluna de Vencedores */}
      <div className="w-full max-w-sm bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col mt-8 lg:mt-24 shadow-2xl relative z-10">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2 rounded-full shadow-lg border border-cyan-400/30">
          <h3 className="text-xl font-black text-white whitespace-nowrap drop-shadow-md">Últimos Ganhadores</h3>
        </div>
        
        <div className="mt-4 flex-grow">
          {loadingWinners ? (<div className="flex-grow flex items-center justify-center py-12"><FaSpinner className="animate-spin text-4xl text-cyan-500" /></div>
          ) : winners.length > 0 ? (
            <div className="space-y-4">
              {winners.map((winner, index) => (
                <div key={index} className="bg-white/5 p-4 rounded-xl flex justify-between items-center animate-fadeIn border border-white/5 hover:bg-white/10 transition-colors group">
                  <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{winner.userName}</span>
                  <span className="font-bold text-yellow-300 px-3 py-1.5 bg-yellow-400/10 rounded-lg text-sm border border-yellow-500/20 shadow-inner whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={winner.prize}>{winner.prize}</span>
                </div>
              ))}
            </div>
          ) : (<p className="text-secondary-text text-center italic py-12">Seja o primeiro a ganhar!</p>)}
        </div>
      </div>

      {/* Modal de Revelação de Prêmio */}
      {revealedPrize && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-yellow-900 to-black border-2 border-yellow-400 p-12 rounded-3xl shadow-[0_0_80px_rgba(250,204,21,0.4)] text-center prize-reveal-box flex flex-col items-center">
            <FaGift className="text-7xl text-yellow-400 mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-bounce" />
            <h2 className="text-3xl font-medium text-yellow-100 mb-4 tracking-wide uppercase">Você ganhou:</h2>
            <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 drop-shadow-lg">{revealedPrize.label}</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default RouletteTab;