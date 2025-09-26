// frontend/src/components/activity/GameBoardViewer.jsx
import React from 'react';

// Importa apenas a configuração de ícones, pois é o que ele precisa para renderizar os nomes e imagens dos passos.
import { elementConfig } from './GameBoardConfig';
import useAssetLoader from '../../hooks/useAssetLoader';
import './GameBoard.css';
// --- TELA DE CARREGAMENTO (SUB-COMPONENTE) ---
const LoadingScreen = ({ progress, etr }) => (
    <div style={{
        width: '100%',
        height: '500px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'var(--font-family-main)'
    }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Carregando o mundo da atividade...</div>
        <div style={{ width: '80%', backgroundColor: '#2d3748', borderRadius: '8px', overflow: 'hidden', border: '1px solid #4a5568' }}>
            <div style={{
                width: `${progress}%`,
                height: '20px',
                backgroundColor: 'var(--color-active-glow)',
                transition: 'width 0.3s ease-in-out',
                borderRadius: '8px'
            }}></div>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>{progress}%</div>
        {etr && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#a0aec0' }}>
                {etr}
            </div>
        )}
    </div>
);





function GameBoardViewer({ onHubIconClick, gamificationDesign, studentProgress, onStepClick, userRole, renderedDecorations, generateStepCoordinates }) {    
    // A lógica de progresso, coordenadas e SVG permanece aqui.
    const completedStepsSet = userRole === 'aluno' ? new Set(studentProgress?.completed_steps || []) : new Set();
    
    let activeStepId = null;
    if (userRole === 'aluno' && gamificationDesign.progression_path) {
        for (const step of gamificationDesign.progression_path) {
            if (!completedStepsSet.has(step.id)) {
                activeStepId = step.id;
                break;
            }
        }
    }

    const getStepStatus = (step) => {
        if (userRole === 'professor') return 'active';
        if (completedStepsSet.has(step.id)) return 'completed';
        if (step.id === activeStepId) return 'active';
        return 'locked';
    };

    const stepCoordinates = generateStepCoordinates(gamificationDesign.progression_path?.length || 0);


    const generateSvgPath = () => {
        const pathPoints = stepCoordinates;
        if (pathPoints.length < 2) return '';
        
        const boardWidth = 900;
        const boardHeight = 500;
        const absolutePoints = pathPoints.map(p => ({
            x: parseFloat(p.x) / 100 * boardWidth,
            y: parseFloat(p.y) / 100 * boardHeight,
        }));

        let pathString = `M ${absolutePoints[0].x} ${absolutePoints[0].y}`;
        for (let i = 1; i < absolutePoints.length; i++) {
            pathString += ` L ${absolutePoints[i].x} ${absolutePoints[i].y}`;
        }
        return pathString;
    };

    // O return agora é direto, sem tela de carregamento.
    return (
        <>
            
            <div className="rpg-map-board">
                <div className="progress-path-area">
                    {/* Renderiza as decorações calculadas pelo pai */}
                    {renderedDecorations.map(deco => (
                        <img 
                            key={deco.id} 
                            src={deco.src} 
                            alt="Decoração do tabuleiro" 
                            className={`board-decoration ${deco.className}`} 
                            style={deco.style} 
                        />
                    ))}
                    <svg className="path-svg" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid meet">
                        <path d={generateSvgPath()} className="path-line" />
                    </svg>
                    {(gamificationDesign.progression_path || []).map((step, index) => {
                        const status = getStepStatus(step);
                        const config = elementConfig.path[step.type];
                        if (!config) return null;
                        const position = stepCoordinates[index % stepCoordinates.length];
                        return (
                            <div key={step.id} className="path-node-wrapper" style={{ top: position.y, left: position.x }} onClick={() => status === 'active' && onStepClick(step)}>
                                <div className={`path-node path-node--${status}`}>
                                    <img className="path-node-image" src={config.icon} alt={config.name} />
                                    {status === 'completed' && <div className="path-node--completed"></div>}
                                </div>
                                <div className="path-label">{step.content?.title || config.name}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="hub-village">
                    {(gamificationDesign.hub_elements || []).map(hubElement => {
                        if (!hubElement.enabled) return null;
                        const config = elementConfig.hub[hubElement.type];
                        if (!config) return null;
                        return (
                            <div 
                            key={hubElement.id} 
                            className="hub-building hub-building--animated" 
                            title={config.name}
                            onClick={() => onHubIconClick(hubElement.type)}
                            >
                                <img src={config.icon} alt={config.name} />
                                <div className="hub-label">{config.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

export default GameBoardViewer;

