// src/components/activity/RouletteTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Roulette } from 'react-roulette-pro';
import { FaDice, FaTrophy, FaGift, FaSyncAlt, FaExclamationTriangle, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

  // Estados da roleta
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // --- NOVO: Estados para a lista de vencedores ---
  const [winners, setWinners] = useState([]);
  const [loadingWinners, setLoadingWinners] = useState(true);

  const wheelData = basePrizes.map((p) => ({ option: p.text }));

  // --- NOVO: Função para buscar os vencedores ---
  const fetchWinners = useCallback(async () => {
    setLoadingWinners(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/progress/${activityId}/roulette-winners`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setWinners(data);
      }
    } catch (err) {
      console.error("Erro ao buscar vencedores:", err);
    } finally {
      setLoadingWinners(false);
    }
  }, [activityId, user.token]);

  // --- NOVO: Efeito para buscar os vencedores na montagem do componente ---
  useEffect(() => {
    fetchWinners();
  }, [fetchWinners]);


  const handleSpinClick = async () => {
    if (mustSpin || loading) return;
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/progress/${activityId}/spin`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      const result = await response.json();

      console.log("Resposta do servidor (spin):", result);

      if (response.ok) {
        const normalizeText = (text) => text.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        const prizeText = normalizeText(result.prize.label);
        
        const prizeIndex = basePrizes.findIndex(
          (p) => normalizeText(p.text) === prizeText
        );

        if (prizeIndex !== -1) {
          setPrizeNumber(prizeIndex);
          setMustSpin(true);
          
        } else {
          setError("Prêmio inesperado recebido do servidor.");
        }
      } else {
        setError(result.message || "Não foi possível girar a roleta.");
      }
    } catch (err) {
      console.error("Erro no fetch da roleta:", err);
      setError("Erro de conexão ao tentar girar a roleta.");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    setMustSpin(false);
    const won = basePrizes[prizeNumber];
    const msg = `Parabéns! Você ganhou: ${won?.text ?? "um prêmio"}`;
    setMessage(msg);
    console.log("Prêmio definido pelo Wheel (onStop):", won);
    
    if (won && won.type === "xp") {
        onPrizeWon && onPrizeWon(won.value);
    }

    // --- NOVO: Atualiza a lista de vencedores após o giro ---
    fetchWinners();
  };

return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl text-white flex flex-col items-center relative overflow-hidden">
      <style>{style}</style>
      
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ffbd30] opacity-10 rounded-full blur-xl"></div>
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#69e8cb] opacity-10 rounded-full blur-xl"></div>
      
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd30] to-[#ff8c30] rounded-full blur-md opacity-70"></div>
          <FaDice className="text-4xl text-[#ffbd30] relative z-10" />
        </div>
        <h2 className="text-3xl font-bold text-yellow-400">
          Roleta da Sorte
        </h2>
      </div>
      
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

      {/* --- Container Principal com Layout Flexível --- */}
      <div className="flex flex-col items-center justify-center w-full max-w-6xl">

        {/* Seção da Roleta */}
        <div className="w-full max-w-[480px] aspect-square mb-6 relative z-10">
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#ffbd30]/10 via-[#69e8cb]/5 to-[#9570d9]/10 rounded-full blur-lg"></div>
            
            <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                data={wheelData}
                backgroundColors={["#374151", "#4B5563", "#374151", "#4B5563", "#374151", "#4B5563"]}
                textColors={["#ffffff"]}
                outerBorderWidth={8}
                outerBorderColor={"#111827"}
                innerBorderWidth={8}
                innerBorderColor={"rgba(255,189,48,0.15)"}
                radiusLineColor={"rgba(255,189,48,0.1)"}
                radiusLineWidth={2}
                textDistance={60}
                spinDuration={0.5}
                onStopSpinning={handleStop}
                fontSize={14}
                fontWeight={700}
                perpendicularText={false}
            />
            
            <div className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-[#ffbd30] to-[#ff8c30] shadow-lg border-2 border-amber-200 z-20 flex items-center justify-center">
                <div className="w-2 h-2 bg-amber-100 rounded-full"></div>
            </div>
            
            
          </div>
        </div>

        <button
            onClick={handleSpinClick}
            disabled={loading || mustSpin}
            className="mt-2 py-3 px-8 rounded-xl text-lg font-semibold text-gray-900 bg-gradient-to-r from-[#ffbd30] to-[#69e8cb] hover:from-[#ffc540] hover:to-[#79f8db] transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group shadow-lg hover:shadow-xl"
        >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <div className="flex items-center justify-center gap-2 relative z-10">
            {loading || mustSpin ? (
                <><FaSyncAlt className="animate-spin" /><span>{loading ? "Processando..." : "Girando..."}</span></>
            ) : (
                <><FaDice /><span>Girar a Roleta!</span></>
            )}
            </div>
        </button>
        
        {/* Seção dos Vencedores (Agora abaixo da roleta) */}
        <div className="w-full max-w-lg mt-12 bg-gray-900/50 p-4 rounded-2xl border border-gray-700 flex flex-col">
          <h3 className="text-xl font-bold text-center mb-4 text-[#69e8cb]">
            Últimos Ganhadores
          </h3>
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