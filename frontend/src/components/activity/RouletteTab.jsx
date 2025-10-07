// frontend/src/components/activity/RouletteTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import CustomWheel from './CustomWheel';
import { FaTrophy, FaGift, FaSyncAlt, FaExclamationTriangle, FaCheckCircle, FaSpinner } from "react-icons/fa";
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
  //{"type": "avatar", "value": {"url": "/images/avatars/wizard_cat.png", "name": "Gato Mago", "promotable": True}, "label": "Avatar Raro: Gato Mago!"},
  { id: "prize-1", text: "50 XP", icon: FaTrophy, type: "xp", value: 50 },
  { id: "prize-2", text: "200 XP", icon: FaTrophy, type: "xp", value: 200 },
  { id: "prize-3", text: "Título: O Sortudo", icon: FaGift, type: "title" },
  { id: "prize-4", text: "100 XP", icon: FaTrophy, type: "xp", value: 100 },
  { id: "prize-5", text: "Avatar Raro!", icon: FaGift, type: "avatar" },
  { id: "prize-6", text: "150 XP", icon: FaTrophy, type: "xp", value: 150 },
];

const RouletteTab = ({ onPrizeWon, onReturn, onPrizeUnlocked }) => {
  const { user } = useAuth();
  const { activityId } = useParams();

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/progress/${activityId}/spin`, { method: "POST", headers: { Authorization: `Bearer ${user.token}` } });
      const result = await response.json();

      if (response.ok) {
        setApiPrize(result.prize);
        const prizeText = result.prize.label.trim();
        const prizeIndex = segments.findIndex(s => s.trim() === prizeText);

        if (prizeIndex !== -1) {
          setIsSpinning(true);
          setWinningPrizeIndex(prizeIndex);
        } else {
          setError(`Prêmio inesperado: ${prizeText}`);
        }
      } else {
        setError(result.message || "Não foi possível girar.");
      }
    } catch (err) {
      setError("Erro de conexão ao tentar girar a roleta.");
    } finally {
      setLoading(false);
    }
  };



  const handleWheelStop = () => {
    // A Causa Raiz nº 2 está aqui: Em vez de buscar em um array local,
    // usamos o estado 'apiPrize', que contém a resposta exata do servidor.
    // Isso evita problemas com divergência de texto.
    if (!apiPrize) {
      console.error("O prêmio da API não foi definido. A exibição falhou.");
      return;
    }

    // O objeto 'apiPrize' tem o formato: { type, value, label }
    setRevealedPrize(apiPrize); // Mostra o modal de prêmio

    // Agora, tratamos o prêmio de XP aqui, com base na resposta da API
    if (apiPrize.type === "xp") {
      onPrizeWon?.(apiPrize.value);
    }

    // Fecha o modal e atualiza a lista após alguns segundos
    setTimeout(() => {
      setRevealedPrize(null);
      setIsSpinning(false);
      setWinningPrizeIndex(null);
      setApiPrize(null);
      onPrizeUnlocked?.();
      fetchWinners();
    }, 3000);
  };


  return (
    <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 p-4">
      <style>{style}</style>
      <button onClick={onReturn} className="absolute top-4 left-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200 transition-colors z-20">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" /></svg>
        Voltar
      </button>

      {/* Coluna da Roleta */}
      <div className="flex flex-col items-center gap-4 flex-shrink-0">
        <h2 className="text-3xl font-bold text-white">Roda da Fortuna</h2>
        <p className="text-gray-400">Teste sua sorte uma vez por dia!</p>
        <CustomWheel
          segments={segments}
          winningSegmentIndex={winningPrizeIndex}
          onFinished={handleWheelStop}
          onSpin={handleSpinClick}
          isSpinning={isSpinning}
          isLoading={loading}
        />
        {error && <div className="mt-4 text-red-400 animate-fadeIn">{error}</div>}
      </div>

      {/* Coluna de Vencedores */}
      <div className="w-full max-w-sm bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex flex-col mt-8 lg:mt-16">
        <h3 className="text-xl font-bold text-center mb-4 text-[#69e8cb]">Últimos Ganhadores</h3>
        {loadingWinners ? (<div className="flex-grow flex items-center justify-center py-8"><FaSpinner className="animate-spin text-2xl" /></div>
        ) : winners.length > 0 ? (
          <div className="space-y-3">
            {winners.map((winner, index) => (
              <div key={index} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center animate-fadeIn">
                <span className="font-semibold text-gray-200">{winner.userName}</span>
                <span className="font-bold text-yellow-400 px-2 py-1 bg-yellow-400/10 rounded-md text-sm">{winner.prize}</span>
              </div>
            ))}
          </div>
        ) : (<p className="text-gray-500 text-center italic py-8">Seja o primeiro a ganhar!</p>)}
      </div>

      {/* Modal de Revelação de Prêmio */}
      {revealedPrize && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-800 border-2 border-yellow-400 p-8 rounded-xl shadow-2xl text-center prize-reveal-box">
            <h2 className="text-2xl font-light text-gray-300 mb-2">Você ganhou:</h2>
            <p className="text-4xl font-bold text-yellow-400">{revealedPrize.label}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouletteTab;