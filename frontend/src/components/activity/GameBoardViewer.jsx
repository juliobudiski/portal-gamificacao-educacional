import React, { lazy, Suspense, useState } from 'react';
import { useActivity } from '../../context/ActivityContext';
import { FaSpinner, FaList, FaMapMarkedAlt, FaCheckCircle, FaLock, FaPlay } from 'react-icons/fa';

// Importação dos temas
const VilaDaAventuraTheme = lazy(() => import('./themes/VilaDaAventuraTheme'));
const FlowchartTheme = lazy(() => import('./themes/FlowchartTheme'));

/**
 * @component GameBoardViewer
 * @description
 * Container component responsible for rendering the correct visual theme for the game board,
 * with an accessible linear list fallback for students with visual impairments or slow connections.
 */
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

const themeMap = {
    vila_da_aventura: VilaDaAventuraTheme,
    fluxograma: FlowchartTheme,
};

function GameBoardViewer({ children }) {
    const [isListView, setIsListView] = useState(false); // Melhoria 18: Modo Compacto em Lista
    const {
        activity,
        isAssetsLoading,
        assetsProgress,
        estimatedTimeRemaining,
        currentView,
        getStepStatus,
        handleStepClick
    } = useActivity();

    const themeName = activity?.gamificationDesign?.theme || 'vila_da_aventura';
    const ThemeComponent = themeMap[themeName] || VilaDaAventuraTheme;

    // 2. Tela de Carregamento Otimizada (Aparece enquanto baixa as imagens)
    if (isAssetsLoading) {
        return (
            <div className="w-full min-h-[600px] flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-white/10 shadow-inner">
                {/* Ícone Spinner */}
                <FaSpinner className="text-4xl text-blue-500 animate-spin mb-4" />

                <h3 className="text-xl font-bold text-white mb-2">Preparando o Tabuleiro...</h3>

                {/* Barra de Progresso Real */}
                <div className="w-64 h-2 bg-hover-bg-color0 rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${assetsProgress || 0}%` }}
                    />
                </div>

                {/* Texto de Status */}
                <p className="text-sm text-secondary-text">
                    {assetsProgress}% carregado
                    {estimatedTimeRemaining && ` • ${estimatedTimeRemaining}`}
                </p>
            </div>
        );
    }

    const steps = activity?.gamificationDesign?.progression_path || [];

    // 3. Renderização do Tabuleiro (Gráfico ou Lista Acessível)
    return (
        <div className="animate-fade-in w-full space-y-4">
            {/* Barra de Acessibilidade / Alternância de Modo */}
            {currentView === 'board' && (
                <div className="flex justify-end items-center gap-2">
                    <button
                        onClick={() => setIsListView(!isListView)}
                        className="px-4 py-2 bg-secondary-bg/90 hover:bg-secondary-bg border border-border-color text-primary-text rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
                        title="Alternar entre mapa gráfico e lista acessível"
                        aria-label="Alternar modo de visualização"
                    >
                        {isListView ? (
                            <><FaMapMarkedAlt className="text-accent-teal text-sm" /> Ver Mapa Gráfico</>
                        ) : (
                            <><FaList className="text-accent-yellow text-sm" /> Modo Lista Acessível</>
                        )}
                    </button>
                </div>
            )}

            {isListView && currentView === 'board' ? (
                <div className="bg-secondary-bg border border-border-color rounded-3xl p-6 shadow-xl max-w-4xl mx-auto space-y-4">
                    <div className="border-b border-border-color pb-3">
                        <h2 className="text-2xl font-bold text-primary-text">Lista Linear de Desafios</h2>
                        <p className="text-sm text-secondary-text">Modo acessível de alto contraste e navegação direta.</p>
                    </div>

                    <div className="space-y-3">
                        {steps.map((step, idx) => {
                            const status = getStepStatus(step);
                            const isClickable = status === 'active' || status === 'completed';

                            return (
                                <div
                                    key={step.id || idx}
                                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                        status === 'completed'
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : status === 'active'
                                            ? 'bg-accent-yellow/10 border-accent-yellow/40 shadow-md'
                                            : 'bg-primary-bg/40 border-border-color/40 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm bg-primary-bg border border-border-color">
                                            {status === 'completed' ? (
                                                <FaCheckCircle className="text-green-400" />
                                            ) : status === 'active' ? (
                                                <FaPlay className="text-accent-yellow text-xs ml-0.5" />
                                            ) : (
                                                <FaLock className="text-gray-400 text-xs" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-primary-text text-base">
                                                {idx + 1}. {step.content?.title || step.type}
                                            </h3>
                                            <p className="text-xs text-secondary-text capitalize">
                                                Tipo: {step.type} • Recompensa: +{step.content?.points || 10} XP
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => isClickable && handleStepClick(step)}
                                        disabled={!isClickable}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-transform active:scale-95 ${
                                            isClickable
                                                ? 'bg-accent-teal hover:bg-teal-600 text-white shadow'
                                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {status === 'completed' ? 'Revisar' : status === 'active' ? 'Iniciar' : 'Bloqueado'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <Suspense fallback={<div className="text-center text-white p-10">Carregando lógica do tema...</div>}>
                    <ThemeComponent>
                        {children}
                    </ThemeComponent>
                </Suspense>
            )}

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