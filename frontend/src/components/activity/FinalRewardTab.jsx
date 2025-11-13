// frontend/src/components/activity/FinalRewardTab.jsx
import React, { useState, useContext } from 'react';
import { FaTrophy, FaCheckCircle, FaSpinner, FaStar } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext'; // Importe para ter o token

const FinalRewardTab = ({ activityId, reward, onCollect, onReturnToBoard }) => {
    const [isCollecting, setIsCollecting] = useState(false);
    const [rating, setRating] = useState(0); // Estado para a nota (0 a 5)
    const [hover, setHover] = useState(null); // Estado para o efeito visual de passar o mouse
    const { user } = useContext(AuthContext); // Pega o token do contexto

    // Função para enviar a avaliação para o Backend
    const submitRating = async () => {
        if (rating === 0) return; // Se não avaliou, segue sem enviar ou pode forçar (opcional)

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ score: rating })
            });
            console.log("Avaliação enviada com sucesso!");
        } catch (error) {
            console.error("Erro ao enviar avaliação:", error);
            // Não bloqueamos a coleta se a avaliação falhar
        }
    };

    const handleCollect = async () => {
        console.log("[FinalRewardTab] Coletando recompensa...");
        setIsCollecting(true);

        try {
            // 1. Envia a avaliação (se houver)
            if (rating > 0) {
                await submitRating();
            }

            // 2. Coleta a recompensa (XP, Moedas)
            await onCollect();

        } catch (error) {
            console.error("Falha no processo final:", error);
            setIsCollecting(false);
        }
    };

    return (
        <div className="text-center text-primary-text p-4 animate-fade-in flex flex-col items-center">
            <FaTrophy className="text-6xl text-yellow-400 mb-4 drop-shadow-lg animate-bounce" />

            <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                Parabéns!
            </h2>
            <p className="text-lg text-secondary-text mb-6">
                Você completou a atividade com sucesso.
            </p>

            {/* --- SEÇÃO DE AVALIAÇÃO --- */}
            <div className="bg-primary-bg/50 p-4 rounded-xl border border-border-color mb-6 w-full max-w-xs">
                <p className="text-sm font-bold mb-2">O que achou desta atividade?</p>
                <div className="flex justify-center space-x-2">
                    {[...Array(5)].map((star, index) => {
                        const ratingValue = index + 1;
                        return (
                            <label key={index} className="cursor-pointer transition-transform hover:scale-110">
                                <input
                                    type="radio"
                                    name="rating"
                                    value={ratingValue}
                                    onClick={() => setRating(ratingValue)}
                                    className="hidden"
                                />
                                <FaStar
                                    size={32}
                                    className="transition-colors duration-200"
                                    color={ratingValue <= (hover || rating) ? "#ffc107" : "#4b5563"}
                                    onMouseEnter={() => setHover(ratingValue)}
                                    onMouseLeave={() => setHover(null)}
                                />
                            </label>
                        );
                    })}
                </div>
                <p className="text-xs text-secondary-text mt-2 h-4">
                    {rating > 0 ? ['Péssima', 'Ruim', 'Regular', 'Boa', 'Excelente'][rating - 1] : 'Toque para avaliar'}
                </p>
            </div>
            {/* --------------------------- */}

            <button
                onClick={handleCollect}
                disabled={isCollecting}
                className="w-full max-w-xs py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isCollecting ? (
                    <>
                        <FaSpinner className="inline mr-2 animate-spin" /> Processando...
                    </>
                ) : (
                    <>
                        <FaCheckCircle className="inline mr-2" /> Coletar Recompensa
                    </>
                )}
            </button>
        </div>
    );
};

export default FinalRewardTab;