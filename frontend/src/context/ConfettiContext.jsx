import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

/**
 * ConfettiContext
 * 
 * Architectural intent: Provides a globally accessible mechanism to trigger gamified feedback.
 * By moving the Confetti component and its state to the root level, we decouple UI components
 * from the presentation logic of the confetti library. This maintains High Cohesion for feedback
 * actions and Low Coupling between disparate UI components.
 */
const ConfettiContext = createContext();

export const ConfettiProvider = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const { width, height } = useWindowSize();

  const triggerConfetti = useCallback((duration = 5000) => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), duration);
  }, []);

  return (
    <ConfettiContext.Provider value={{ triggerConfetti }}>
      {isActive && (
        <Confetti
          width={width}
          height={height}
          recycle={true}
          numberOfPieces={500}
          gravity={0.3}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 99999, pointerEvents: 'none' }}
        />
      )}
      {children}
    </ConfettiContext.Provider>
  );
};

export const useConfetti = () => useContext(ConfettiContext);
