// ARQUIVO CORRIGIDO: src/components/activity/GameBoardViewer.jsx

import React, { lazy, Suspense, useRef, useState, useLayoutEffect, useMemo } from 'react';

// Importação dos temas
const VilaDaAventuraTheme = lazy(() => import('./themes/VilaDaAventuraTheme'));
const FlowchartTheme = lazy(() => import('./themes/FlowchartTheme'));

const themeMap = {
    vila_da_aventura: VilaDaAventuraTheme,
    fluxograma: FlowchartTheme,
};

// ========================================================================
// COMPONENTE PRINCIPAL
// Este componente agora atua como um roteador de props para o tema correto.
// ========================================================================

function GameBoardViewer({ gamificationDesign, ...props }) {
    const { theme = 'vila_da_aventura' } = gamificationDesign;
    const ThemeComponent = themeMap[theme] || VilaDaAventuraTheme;

    // ...props contém todas as outras props passadas do ActivityPage,
    // como getStepStatus, onStepClick, onReturnToBoard, etc.
    // Elas serão repassadas diretamente para o componente de tema.
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ThemeComponent
                gamificationDesign={gamificationDesign}
                {...props}
            />
        </Suspense>
    );
}

export default GameBoardViewer;
