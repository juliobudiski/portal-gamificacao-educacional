import React from 'react';
import GameBoardViewer from '../components/activity/GameBoardViewer';

/**
 * Componente GameBoardTestPage
 * 
 * Página de ambiente de testes isolado (sandbox) para as mecânicas de tabuleiro e validação de lógica.
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