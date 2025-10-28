// frontend/src/components/activity/FinalRewardTab.jsx
// No início do componente, importe o useState e o ícone de Spinner
import React, { useState } from 'react';
import { FaTrophy, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const FinalRewardTab = ({ reward, onCollect, onReturnToBoard }) => {
    // Adicione o estado de carregamento
    const [isCollecting, setIsCollecting] = useState(false);

    // Crie uma função para encapsular a lógica de coleta
    const handleCollect = async () => {
        console.log("[FinalRewardTab] Botão 'Coletar Recompensa' clicado. Acionando onCollect..."); // <-- ADICIONE ESTA LINHA
        setIsCollecting(true);
        try {
            await onCollect();
            // Não é necessário setar isCollecting(false), pois a tela mudará
        } catch (error) {
            console.error("Falha ao coletar recompensa:", error);
            setIsCollecting(false); // Libera o botão em caso de erro
        }
    };

    return (
        <div className="text-center text-primary-text p-4 animate-fade-in">
            {/* ... restante do JSX do componente ... */}

            {/* Altere o botão para usar o novo estado e handler */}
            <button
                onClick={handleCollect}
                disabled={isCollecting}
                className="w-full max-w-xs py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-bold text-primary-text shadow-lg transition-all transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isCollecting ? (
                    <FaSpinner className="inline mr-2 animate-spin" />
                ) : (
                    <FaCheckCircle className="inline mr-2" />
                )}
                {isCollecting ? 'Coletando...' : 'Coletar Recompensa'}
            </button>
        </div>
    );
};

export default FinalRewardTab;