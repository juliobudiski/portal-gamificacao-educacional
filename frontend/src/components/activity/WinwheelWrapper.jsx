import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Winwheel from 'winwheel';

// Usamos forwardRef para que o componente pai (RouletteTab) possa acessar métodos deste componente
const WinwheelWrapper = forwardRef(({ segments }, ref) => {
  const canvasRef = useRef(null);
  const wheelRef = useRef(null);

  // useEffect para inicializar a roleta quando o componente é montado
  useEffect(() => {
    if (canvasRef.current && segments.length > 0) {
      const wheel = new Winwheel({
        canvasId: 'winwheel-canvas',
        numSegments: segments.length,
        segments: segments,
        textAlignment: 'center',
        textMargin: 5,
        animation: {
          type: 'spinToStop',
          duration: 7, // Duração em segundos
          spins: 8,    // Número de giros
        },
      });
      wheelRef.current = wheel; // Armazena a instância da roleta na ref
    }
  }, [segments]); // Roda novamente se os segmentos mudarem

  // useImperativeHandle expõe funções específicas para o componente pai
  useImperativeHandle(ref, () => ({
    spinTo: (prizeIndex, onFinishedCallback) => {
      if (!wheelRef.current) return;

      const wheel = wheelRef.current;
      
      // Calcula o ângulo para parar no prêmio correto
      const segmentAngle = 360 / wheel.numSegments;
      // Adiciona um pouco de variação para não parar sempre no mesmo ponto
      const randomOffset = (segmentAngle * 0.8) - (Math.random() * (segmentAngle * 0.6));
      const stopAtAngle = (prizeIndex * segmentAngle) + randomOffset;

      wheel.animation.stopAngle = stopAtAngle;
      
      // Define a função a ser chamada quando a animação terminar
      wheel.animation.callbackFinished = () => onFinishedCallback(wheel.getIndicatedSegment());
      
      // Reseta e inicia a animação
      wheel.stopAnimation(false);
      wheel.rotationAngle = 0;
      wheel.draw();
      wheel.startAnimation();
    },
  }));

  // O componente renderiza apenas o elemento <canvas> que a Winwheel.js usará
  return (
    <canvas 
        ref={canvasRef}
        id="winwheel-canvas" 
        width="450" 
        height="450"
    >
        Canvas not supported, use another browser.
    </canvas>
  );
});

export default WinwheelWrapper;