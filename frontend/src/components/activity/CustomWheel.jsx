import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const CustomWheel = ({ segments, winningSegmentIndex, onFinished }) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (winningSegmentIndex === null || isSpinning) {
      return;
    }

    const segmentAngle = 360 / segments.length;
    const stopAngle = (360 * 10) - (winningSegmentIndex * segmentAngle) - (segmentAngle / 2);
    
    setRotation(stopAngle);
    setIsSpinning(true);

  }, [winningSegmentIndex, segments, isSpinning]);

  const handleTransitionEnd = () => {
    setIsSpinning(false);
    if (typeof onFinished === 'function') {
        onFinished(segments[winningSegmentIndex]);
    }
    
    const finalRotation = rotation % 360;
    setRotation(finalRotation);
  };

  const getConicGradient = () => {
    const colors = ['#374151', '#4B5563'];
    const segmentPercentage = 100 / segments.length;
    let gradientString = '';

    segments.forEach((_, i) => {
      const start = i * segmentPercentage;
      const end = (i + 1) * segmentPercentage;
      gradientString += `${colors[i % 2]} ${start}% ${end}%, `;
    });

    return `conic-gradient(${gradientString.slice(0, -2)})`;
  };

  return (
    <div style={{ 
        position: 'relative', 
        width: '450px', 
        height: '450px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        // Garante que o texto não seja cortado se sair um pouco da borda
        overflow: 'visible' 
    }}>
      {/* Ponteiro da roleta */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '20px solid transparent',
        borderRight: '20px solid transparent',
        borderTop: '30px solid #ffbd30',
        zIndex: 10,
        filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))'
      }} />

      {/* Roda principal */}
      <div
        onTransitionEnd={handleTransitionEnd}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: getConicGradient(),
          border: '10px solid #111827',
          position: 'relative',
          transition: isSpinning ? 'transform 7s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {/* Container para os textos */}
        <div style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
        }}>
            {segments.map((segment, index) => {
                const angleForPositioning = (360 / segments.length) * index;

                // ================================================================= //
                // =====> VOCÊ PODE EDITAR O NÚMERO NA LINHA ABAIXO <===== //
                // Rotação manual para o texto (em seu próprio eixo)
                const manualTextRotation = 0; // 0 para reto, 90 para "deitado", etc.
                // ================================================================= //

                return (
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '180px', // Largura do container do texto
                            textAlign: 'center',
                            // 1. Gira o container para a POSIÇÃO correta na roleta
                            transform: `
                                rotate(${angleForPositioning}deg) 
                                translateX(65px)
                            `,
                            transformOrigin: '0 0',
                        }}
                    >
                        <span style={{
                            display: 'inline-block',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            // 2. Gira o texto no seu PRÓPRIO EIXO para endireitá-lo e aplicar o ajuste manual
                            transform: `rotate(${-angleForPositioning + manualTextRotation}deg)`,
                        }}>
                            {segment.toUpperCase()}
                        </span>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

CustomWheel.propTypes = {
  segments: PropTypes.arrayOf(PropTypes.string).isRequired,
  winningSegmentIndex: PropTypes.number,
  onFinished: PropTypes.func,
};

export default CustomWheel;