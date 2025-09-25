import React, { useState, useEffect, useCallback } from "react";
import CustomWheel from './CustomWheel'; // <-- Importando nosso novo componente
import { FaDice, FaTrophy, FaGift, FaSyncAlt, FaExclamationTriangle, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import backgroundImage from '../../assets/roulette-wallpaper.png';
import useAnalytics from '../../hooks/useAnalytics';

const style = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}
`;

const basePrizes = [
  { id: "prize-1", text: "50 XP", icon: FaTrophy, type: "xp", value: 50 },
  { id: "prize-2", text: "200 XP", icon: FaTrophy, type: "xp", value: 200 },
  { id: "prize-3", text: "Título: Sortudo", icon: FaGift, type: "title" },
  { id: "prize-4", text: "100 XP", icon: FaTrophy, type: "xp", value: 100 },
  { id: "prize-5", text: "Avatar Raro!", icon: FaGift, type: "avatar" },
  { id: "prize-6", text: "150 XP", icon: FaTrophy, type: "xp", value: 150 },
];

const RouletteTab = ({ onPrizeWon }) => {
  const { user } = useAuth();
  const { activityId } = useParams();

  const [isSpinning, setIsSpinning] = useState(false);
  const [winningPrizeIndex, setWinningPrizeIndex] = useState(null); // Índice do prêmio
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [winners, setWinners] = useState([]);
  const [loadingWinners, setLoadingWinners] = useState(true);
  const { logEvent } = useAnalytics("roulette", user.token, activityId);

  // Os segmentos agora são apenas um array de strings
  const segments = basePrizes.map((p) => p.text);

  const fetchWinners = useCallback(async () => {
    setLoadingWinners(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/progress/${activityId}/roulette-winners`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.ok) setWinners(await response.json());
    } catch (err) {
      console.error("Erro ao buscar vencedores:", err);
    } finally {
      setLoadingWinners(false);
    }
  }, [activityId, user.token]);

  useEffect(() => {
    fetchWinners();
  }, [fetchWinners]);

  const handleSpinClick = async () => {
    if (isSpinning || loading) return;
    setMessage("");
    setError("");
    setLoading(true);
    setWinningPrizeIndex(null);

    logEvent("roulette_spin_attempt");


    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/progress/${activityId}/spin`,
        { method: "POST", headers: { Authorization: `Bearer ${user.token}` } }
      );
      const result = await response.json();

      if (response.ok) {
        const normalizeText = (text) => text.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        const prizeText = normalizeText(result.prize.label);
        const prizeIndex = basePrizes.findIndex(p => normalizeText(p.text) === prizeText);

        if (prizeIndex !== -1) {
          setIsSpinning(true);
          setWinningPrizeIndex(prizeIndex); // Apenas definimos o índice do prêmio
        } else {
          setError("Prêmio inesperado recebido do servidor.");
        }
      } else {
        setError(result.message || "Não foi possível girar a roleta.");
      }
    } catch (err) {
      setError("Erro de conexão ao tentar girar a roleta.");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = (winnerText) => {
    setIsSpinning(false);
    setWinningPrizeIndex(null); // Reseta para permitir novo giro
    
    const won = basePrizes.find(p => p.text === winnerText);
    const msg = `Parabéns! Você ganhou: ${winnerText}`;
    setMessage(msg);
    
    if (won && won.type === "xp") {
      onPrizeWon?.(won.value);
    }
    fetchWinners();
  };

  return (
    // 2. ADICIONE O ESTILO DE FUNDO AO DIV PRINCIPAL
    <div className="w-full max-w-4xl mx-auto">
      <style>{style}</style>
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ffbd30] opacity-10 rounded-full blur-xl"></div>
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#69e8cb] opacity-10 rounded-full blur-xl"></div>
      
      
      
      <p className="text-sm text-gray-400 mb-6 text-center max-w-md relative z-10">
        Gire uma vez para ganhar prêmios extras e aumentar sua pontuação!
      </p>

      {error && (
        <div className="w-full max-w-lg mb-4 p-4 rounded-xl bg-gradient-to-r from-red-900/30 to-rose-900/20 border border-rose-700/50 flex items-center gap-3 animate-fadeIn relative z-10">
          <FaExclamationTriangle className="text-rose-400 flex-shrink-0" />
          <span className="text-rose-200">{error}</span>
        </div>
      )}
      
      {message && (
        <div className="w-full max-w-lg mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-900/30 to-teal-900/20 border border-emerald-700/50 flex items-center gap-3 animate-fadeIn relative z-10">
          <FaCheckCircle className="text-emerald-400 flex-shrink-0" />
          <span className="text-emerald-200">{message}</span>
        </div>
      )}

      <div className="flex flex-col items-center justify-center w-full max-w-6xl">
        <div className="w-full max-w-[480px] aspect-square mb-6 relative z-10">
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#ffbd30]/10 via-[#69e8cb]/5 to-[#9570d9]/10 rounded-full blur-lg"></div>
            {/* Usando nosso componente CustomWheel */}
            <CustomWheel
              segments={segments}
              winningSegmentIndex={winningPrizeIndex}
              onFinished={handleStop}
            />
          </div>
        </div>

        <button
            onClick={handleSpinClick}
            disabled={loading || isSpinning}
            className="mt-2 py-3 px-8 rounded-xl text-lg font-semibold text-gray-900 bg-gradient-to-r from-[#ffbd30] to-[#69e8cb] hover:from-[#ffc540] hover:to-[#79f8db] transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group shadow-lg hover:shadow-xl"
        >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <div className="flex items-center justify-center gap-2 relative z-10">
            {loading || isSpinning ? (
                <><FaSyncAlt className="animate-spin" /><span>{loading ? "Processando..." : "Girando..."}</span></>
            ) : (
                <><FaDice /><span>Girar a Roleta!</span></>
            )}
            </div>
        </button>
        
        <div className="w-full max-w-lg mt-12 bg-gray-900/50 p-4 rounded-2xl border border-gray-700 flex flex-col">
          <h3 className="text-xl font-bold text-center mb-4 text-[#69e8cb]">Últimos Ganhadores</h3>
          {loadingWinners ? (
            <div className="flex-grow flex items-center justify-center py-8">
                <FaSpinner className="animate-spin text-2xl text-gray-400" />
            </div>
          ) : winners.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2">
              {winners.map((winner, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center animate-fadeIn">
                    <span className="font-semibold text-gray-200">{winner.userName}</span>
                    <span className="font-bold text-yellow-400 px-2 py-1 bg-yellow-400/10 rounded-md text-sm">{winner.prize}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center py-8">
                <p className="text-gray-500 italic">Nenhum prêmio sorteado ainda.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-700 w-full text-center">
        <p className="flex justify-center items-center gap-2 text-xs text-gray-400 italic">
          <FaTrophy className="text-yellow-500" />
          <span>A sorte favorece os corajosos! Gire para ganhar XP, títulos e avatares.</span>
          <FaGift className="text-purple-400" />
        </p>
      </div>
    </div>
  );
};

export default RouletteTab;