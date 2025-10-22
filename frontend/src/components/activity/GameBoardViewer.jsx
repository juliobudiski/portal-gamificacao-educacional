import React, { lazy, Suspense } from 'react';
import { useActivity } from '../../context/ActivityContext';

// Importação dos temas
const VilaDaAventuraTheme = lazy(() => import('./themes/VilaDaAventuraTheme'));
const FlowchartTheme = lazy(() => import('./themes/FlowchartTheme'));
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
const debugLog = (message, ...optionalParams) => {
    if (DEBUG_MODE) {
        console.debug(`[GameBoardViewer] ${message}`, ...optionalParams);
    }
};
const themeMap = {
    vila_da_aventura: VilaDaAventuraTheme,
    fluxograma: FlowchartTheme,
};

function GameBoardViewer({ children }) {
    const { activity } = useActivity();
    debugLog('GameBoardViewer renderizado. Valor de activity do contexto:', activity);
    const themeName = activity?.gamificationDesign?.theme || 'vila_da_aventura';
    debugLog('Tema selecionado:', themeName);
    const ThemeComponent = themeMap[themeName] || VilaDaAventuraTheme;

    return (
        <Suspense fallback={<div>Carregando tema do tabuleiro...</div>}>
            {debugLog('Renderizando componente de tema:', ThemeComponent.displayName || ThemeComponent.name || 'UnknownTheme')}
            <ThemeComponent>
                {debugLog('Renderizando children dentro do tema:', children)}
                {children}
            </ThemeComponent>
        </Suspense>
    );
}

export default GameBoardViewer;