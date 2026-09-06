import React from 'react';
import GameBoardViewer from '../components/activity/GameBoardViewer';

/**
 * GameBoardTestPage
 * 
 * Architectural intent: Provides an isolated sandbox environment (Test/Debug View) for rendering and
 * validating the GameBoardViewer component independently. This ensures that complex UI mechanics can be
 * tested without the overhead of the full activity state machine.
 */
function GameBoardTestPage() {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#2c3135' }}>
      <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '2rem' }}>
        Teste Visual do Tabuleiro
      </h1>
      <GameBoardViewer />
    </div>
  );
}

export default GameBoardTestPage;