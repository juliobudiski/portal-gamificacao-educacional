import React, { lazy, Suspense } from 'react';
import { useActivity } from '../../context/ActivityContext';
import { FaSpinner } from 'react-icons/fa'; // Certifique-se de ter react-icons ou use outro ícone

// Importação dos temas
const VilaDaAventuraTheme = lazy(() => import('./themes/VilaDaAventuraTheme'));
const FlowchartTheme = lazy(() => import('./themes/FlowchartTheme'));

const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

const themeMap = {
    vila_da_aventura: VilaDaAventuraTheme,
    fluxograma: FlowchartTheme,
};

function GameBoardViewer({ children }) {
    // 1. Consumimos os estados de carregamento do hook useAssetLoader (via Contexto)
    const {
        activity,
        loading,
        assetsProgress,
        estimatedTimeRemaining
    } = useActivity();

    const themeName = activity?.gamificationDesign?.theme || 'vila_da_aventura';
    const ThemeComponent = themeMap[themeName] || VilaDaAventuraTheme;

    // 2. Tela de Carregamento Otimizada (Aparece enquanto baixa as imagens)
    if (loading) {
        return (
            <div className="w-full min-h-[600px] flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-white/10 shadow-inner">
                {/* Ícone Spinner */}
                <FaSpinner className="text-4xl text-blue-500 animate-spin mb-4" />

                <h3 className="text-xl font-bold text-white mb-2">Preparando o Tabuleiro...</h3>

                {/* Barra de Progresso Real */}
                <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${assetsProgress || 0}%` }}
                    />
                </div>

                {/* Texto de Status */}
                <p className="text-sm text-gray-400">
                    {assetsProgress}% carregado
                    {estimatedTimeRemaining && ` • ${estimatedTimeRemaining}`}
                </p>
            </div>
        );
    }

    // 3. Renderização do Tabuleiro (Só acontece quando LOADING = FALSE)
    return (
        <div className="animate-fade-in w-full">
            <Suspense fallback={<div className="text-center text-white p-10">Carregando lógica do tema...</div>}>
                <ThemeComponent>
                    {children}
                </ThemeComponent>
            </Suspense>

            {/* Estilo inline para garantir a animação de entrada sem arquivos CSS extras */}
            <style>{`
                @keyframes fadeInBoard {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fadeInBoard 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}

export default GameBoardViewer;