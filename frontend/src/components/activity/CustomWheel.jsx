// frontend/src/components/activity/CustomWheel.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaDice } from 'react-icons/fa';

const CustomWheel = ({ segments, winningSegmentIndex, onFinished, onSpin, isSpinning, isLoading }) => {
  const [rotation, setRotation] = useState(0);
  const [internalSpin, setInternalSpin] = useState(false);

  useEffect(() => {
    // A animação só deve começar quando o componente pai (RouletteTab)
    // nos envia um novo índice para parar (diferente de null).
    if (winningSegmentIndex !== null) {
      const segmentAngle = 360 / segments.length;
      const fullSpins = 10; // Para um giro longo e satisfatório
      const stopAngle = (360 * fullSpins) - (winningSegmentIndex * segmentAngle) - (segmentAngle / 2);

      setRotation(stopAngle);
      setInternalSpin(true); // Usa o estado interno para controlar a transição
    }
  }, [winningSegmentIndex]);

  const handleTransitionEnd = () => {
    setInternalSpin(false);
    if (typeof onFinished === 'function') {
      onFinished(segments[winningSegmentIndex]);
    }
    // "Normaliza" a rotação para evitar números gigantes, mantendo a posição final
    const finalRotation = rotation % 360;
    setRotation(finalRotation);
  };

  const getConicGradient = () => {
    const colors = ['#374151', '#4B5563']; // Cinzas escuros e modernos
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
    <div style={{ position: 'relative', width: '450px', height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Ponteiro Neon */}
      <div style={{
        position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '20px solid transparent', borderRight: '20px solid transparent',
        borderTop: '30px solid #ffbd30', zIndex: 10,
        filter: 'drop-shadow(0px -2px 10px #ffbd30)'
      }} />

      {/* Anel Externo Fixo (para dar profundidade) */}
      <div style={{
        position: 'absolute', width: '100%', height: '100%',
        borderRadius: '50%', border: '5px solid #1f2937',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)'
      }} />

      {/* Roda Principal (que gira) */}
      <div
        onTransitionEnd={handleTransitionEnd}
        style={{
          width: 'calc(100% - 30px)', height: 'calc(100% - 30px)',
          borderRadius: '50%', background: getConicGradient(),
          border: '5px solid #111827',
          position: 'relative',
          transition: internalSpin ? 'transform 7s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          transform: `rotate(${rotation}deg)`,
          boxShadow: '0 0 25px rgba(105, 232, 203, 0.3)', // Brilho Neon
        }}
      >
        {/* Textos dos Segmentos */}
        {segments.map((segment, index) => {
          const angle = (360 / segments.length) * index + (360 / segments.length / 2);
          return (
            <div key={index} style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              transform: `rotate(${angle}deg)`,
            }}>
              <span style={{
                display: 'block', color: 'white', fontWeight: 'bold', fontSize: '16px',
                position: 'absolute', top: '25px', left: '50%',
                transform: 'translateX(-50%)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
              }}>
                {segment.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Botão de Giro Central */}
      <div style={{
        position: 'absolute', width: '100px', height: '100px',
        borderRadius: '50%', background: '#111827',
        border: '5px solid #ffbd30',
        boxShadow: '0 0 15px #ffbd30, inset 0 0 10px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 5
      }}>
        <button
          onClick={onSpin}
          disabled={isSpinning || isLoading}
          style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: '#374151', border: 'none', color: 'white',
            cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem'
          }}
        >
          <FaDice />
        </button>
      </div>
    </div>
  );
};

CustomWheel.propTypes = {
  segments: PropTypes.arrayOf(PropTypes.string).isRequired,
  winningSegmentIndex: PropTypes.number,
  onFinished: PropTypes.func,
  onSpin: PropTypes.func.isRequired,
  isSpinning: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default CustomWheel;