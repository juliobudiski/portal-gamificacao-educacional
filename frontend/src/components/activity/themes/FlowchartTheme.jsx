import React from 'react';

const getNodeStyle = (type) => {
    switch (type) {
        case 'narrative':
            return { shape: 'rect', className: 'fill-blue-500 stroke-blue-700' };
        case 'quiz':
            return { shape: 'circle', className: 'fill-green-500 stroke-green-700' };
        default:
            return { shape: 'rect', className: 'fill-gray-500 stroke-gray-700' };
    }
};

const FlowchartTheme = ({
    gamificationDesign,
    getStepStatus,
    onStepClick,
    boardRef,
    boardSize,
    stepCoordinates, // Adicionada
    generateSvgPath, // Adicionada
    currentView, // Adicionada
    children, // Adicionado
}) => {
    const path = gamificationDesign.progression_path || [];

    // Se a view não for 'board', renderiza o conteúdo (Quiz, etc.)
    if (currentView !== 'board') {
        return <div className="game-content-area-flowchart p-4">{children}</div>;
    }

    // Se não houver dados, mostra uma mensagem
    if (!boardSize || !stepCoordinates || stepCoordinates.length === 0) {
        return <div className="flex items-center justify-center h-full">Carregando visualização do fluxograma...</div>;
    }

    return (
        <div ref={boardRef} className="w-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4" style={{ aspectRatio: '16 / 9' }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${boardSize.width} ${boardSize.height}`}>
                {/* Linhas de Conexão */}
                <path d={generateSvgPath()} stroke="#9ca3af" strokeWidth="3" fill="none" />

                {/* Nós (Círculos e Retângulos) */}
                {path.map((step, index) => {
                    const position = stepCoordinates[index % stepCoordinates.length];
                    if (!position) return null; // Segurança

                    const { x, y } = position; // Pega as coordenadas
                    const { shape, className } = getNodeStyle(step.type);
                    const status = getStepStatus(step);
                    const isClickable = status === 'active' || status === 'completed';
                    const opacity = (status === 'locked') ? 0.4 : 1;

                    return (
                        <g
                            key={step.id}
                            transform={`translate(${x}, ${y})`}
                            onClick={() => isClickable && onStepClick(step)}
                            style={{ cursor: isClickable ? 'pointer' : 'default', opacity }}
                        >
                            {shape === 'circle' ? (
                                <circle cx="0" cy="0" r="30" className={className} />
                            ) : (
                                <rect x="-45" y="-22.5" width="90" height="45" rx="8" className={className} />
                            )}
                            <text x="0" y="0" textAnchor="middle" dy=".3em" fill="#fff" fontSize="12px" fontWeight="bold">
                                {step.content?.title || step.type}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default FlowchartTheme;