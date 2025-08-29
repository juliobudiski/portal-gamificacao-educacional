import React, { useState, useEffect, useCallback } from 'react';
import { FaGem, FaStar, FaTrophy, FaGift, FaSyncAlt, FaSpinner } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/SlotMachine.css'; // Criaremos este arquivo de CSS a seguir
import backgroundImage from '../../assets/slot-background.png';
import useAnalytics from '../../hooks/useAnalytics';
// --- Configuração dos Símbolos e Prêmios ---
// Adicione ou remova símbolos conforme desejar.
const symbols = [
  { name: 'gem', icon: <FaGem className="text-blue-400" />, prize: 'Pequeno Bônus de XP', value: 25, type: 'xp' },
  { name: 'star', icon: <FaStar className="text-yellow-400" />, prize: 'Bônus Médio de XP', value: 75, type: 'xp' },
  { name: 'trophy', icon: <FaTrophy className="text-orange-500" />, prize: 'Grande Bônus de XP', value: 200, type: 'xp' },
  { name: 'gift', icon: <FaGift className="text-red-500" />, prize: 'Prêmio Especial!', value: 1, type: 'special' },
];

// O componente agora recebe tudo o que precisa via props
const SlotMachineTab = ({ userCoins, onPrizeWon, winners, loadingWinners, onWin }) => {
  // Hooks são chamados aqui, no topo do componente.
  const { user } = useAuth();
  const { activityId } = useParams();
  const [reels, setReels] = useState([symbols[0], symbols[0], symbols[0]]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const spinCost = 0; // Custo para girar

  const { logEvent } = useAnalytics("slot_machine", user.token, activityId);

  // Função para lidar com o clique no botão de girar
  
  const handleSpinClick = async () => {
    // NENHUM hook (useState, useEffect, etc.) pode ser chamado aqui dentro.
    if (isSpinning || loading) return;
    if (userCoins < spinCost) {
      setError(`Você precisa de pelo menos ${spinCost} moedas para jogar.`);
      return;
    }

    setMessage('');
    setError('');
    setLoading(true);
    setIsSpinning(true);
    logEvent("slot_machine_attempt");

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/progress/${activityId}/play-slot`,
        { method: 'POST', headers: { Authorization: `Bearer ${user.token}` } }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Não foi possível jogar.');
      }

      const finalSymbols = result.result.map(symbolName =>
        symbols.find(s => s.name === symbolName)
      );

      setTimeout(() => {
        setReels(finalSymbols);
        setIsSpinning(false);

        if (result.prize) {
            setMessage(`Parabéns! Você ganhou: ${result.prize.description}`);
            if(result.prize.type === 'xp') {
                onPrizeWon(result.prize.value);
            }
            onWin(); // Avisa o componente pai para recarregar a lista de ganhadores
        } else {
            setMessage("Não foi dessa vez! Tente novamente.");
        }
      }, 3000);

    } catch (err) {
      setError(err.message);
      setIsSpinning(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl text-white flex flex-col items-center"
        style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
        color: 'white',
        width: '90%',
        maxWidth: '1200px',
        }}
    >
      <div className="flex items-center gap-3 mb-4">
        <h2 
          className="text-3xl font-bold text-yellow-400" 
          style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)' }}
        >
          Caça-Prêmios
        </h2>
      </div>
      <p 
        className="text-sm text-gray-200 mb-2 font-semibold" 
        style={{ textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)' }}
      >
        Use suas moedas para tentar a sorte e ganhar prêmios!
      </p>
      
      
      {/* Contêiner de altura fixa para as mensagens */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-center" style={{ minHeight: '72px' }}>
        { (error || message) && (
            <div className={`w-full p-4 rounded-xl text-center ${error ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
              {error || message}
            </div>
        )}
      </div>
      

      {/* A Máquina de Slot */}
      <div className="flex justify-center items-center gap-4 bg-gray-900 p-6 rounded-xl border-4 border-gray-700 mb-6">
        {reels.map((symbol, reelIndex) => (
          <div key={reelIndex} className="w-24 h-24 bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
            <div className={`reel ${isSpinning ? 'spinning' : ''}`}>
              {isSpinning ? (
                [...symbols, ...symbols].map((s, i) => (
                  <div key={i} className="text-6xl p-4 flex-shrink-0">{s.icon}</div>
                ))
              ) : (
                <div className="text-6xl p-4">{symbol.icon}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botão de Girar */}
      <button
        onClick={handleSpinClick}
        disabled={isSpinning || loading || userCoins < spinCost}
        className="py-3 px-8 rounded-xl text-lg font-semibold text-gray-900 bg-gradient-to-r from-[#ffbd30] to-[#69e8cb] hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg mb-4" // Adicionado margin-bottom
      >
        <div className="flex items-center justify-center gap-2">
          {isSpinning || loading ? (
            <><FaSyncAlt className="animate-spin" /><span>Girando...</span></>
          ) : (
            `Girar (${spinCost} moedas)`
          )}
        </div>
      </button>

      {/* Contagem de Moedas (na nova posição) */}
      <div className="text-lg font-bold text-yellow-300 bg-yellow-400/10 px-3 py-1 rounded-full" style={{ textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)' }}>
        Você tem: {userCoins} moedas
      </div>
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
                <p className="text-gray-500 italic">Nenhum prêmio ganho ainda.</p>
            </div>
          )}
        </div>
    </div>
  );
};

export default SlotMachineTab;