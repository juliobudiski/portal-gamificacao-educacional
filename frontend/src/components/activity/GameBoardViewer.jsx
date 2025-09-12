import React from 'react';

// Os estilos CSS que estavam no arquivo HTML são colocados aqui
const GameBoardStyles = `
    @keyframes pulse-glow {
        0%, 100% {
            filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.7));
            transform: scale(1);
        }
        50% {
            filter: drop-shadow(0 0 16px rgba(251, 191, 36, 1));
            transform: scale(1.05);
        }
    }

    .game-board-container {
        width: 100%;
        max-width: 900px;
        margin: auto;
        padding: 4rem 2rem;
        font-family: 'Inter', sans-serif;
        background-color: #3a5444; 
        background-image: url('/board/background_board.png');
        background-size: cover; /* Cobre todo o espaço */
        background-position: center;
        border-radius: 2rem;
        border: 8px solid #4a2c2a; /* Borda de madeira */
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        position: relative;
        overflow: hidden;
    }
    
    .decoration {
        position: absolute;
        z-index: 1;
        pointer-events: none;
    }
    .tree-1 { top: 5%; left: 5%; width: 100px; }
    .rock-1 { bottom: 20%; left: 15%; width: 70px; }

    .game-board {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        position: relative;
        z-index: 2;
    }

    .game-board::before {
        content: '';
        position: absolute;
        top: 45px;
        bottom: 45px;
        left: 50%;
        transform: translateX(-50%);
        width: 8px;
        background-color: #a16207;
        background-image: linear-gradient(135deg, #78350f 25%, transparent 25%, transparent 50%, #78350f 50%, #78350f 75%, transparent 75%, transparent);
        background-size: 20px 20px;
        border-radius: 4px;
        z-index: 1;
        box-shadow: inset 0 0 5px rgba(0,0,0,0.4);
    }

    .step {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 2;
        width: 100px;
        height: 100px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        transition: all 0.3s ease;
        filter: drop-shadow(3px 5px 4px rgba(0,0,0,0.4));
    }
    
    /* Mapeando os PNGs para as casas */
    .step[data-type="start"] { background-image: url('/board/start_board.png'); }
    .step[data-type="narrative"] { background-image: url('/board/narrative_board.png'); }
    .step[data-type="quiz"] { background-image: url('/board/quizz_board.png'); }
    .step[data-type="store"] { background-image: url('/board/store_board.png'); }
    /* Adicione mais tipos conforme necessário */

    .step-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }
    
    .step-label {
        font-size: 0.8rem;
        font-weight: 700;
        color: #ffffff;
        margin-top: 55px; /* Ajuste para posicionar o texto abaixo da casa */
        background-color: rgba(0, 0, 0, 0.5);
        padding: 2px 8px;
        border-radius: 10px;
    }
    
    .step-checkmark {
        position: absolute;
        top: -8px;
        right: -8px;
        background-color: #16a34a;
        color: white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .step-checkmark svg { width: 18px; height: 18px; }

    .step--locked {
        cursor: not-allowed;
        filter: grayscale(80%) opacity(60%) drop-shadow(3px 5px 4px rgba(0,0,0,0.4));
    }
    
    .step--active {
        cursor: pointer;
        animation: pulse-glow 2s infinite ease-in-out;
    }
    
    @media (min-width: 768px) {
        .game-board { gap: 0; }
        .step { margin: 0 auto 2rem auto; }
        .step:nth-child(even) { transform: translateX(120px); }
        .step:nth-child(odd) { transform: translateX(-120px); }
        .step:first-child { transform: translateX(0); }
    }
`;

function GameBoardViewer() {
  return (
    <>
      <style>{GameBoardStyles}</style>
      
      <div className="game-board-container">
        <img src="/board/tree_board.png" alt="Decoração de árvore" className="decoration tree-1" />
        <img src="/board/rock_board.png" alt="Decoração de pedra" className="decoration rock-1" />

        <div className="game-board">
          
          <div className="step step--completed" data-type="start">
            <div className="step-content">
              <div className="step-label">Início</div>
            </div>
            <div className="step-checkmark">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
          </div>

          <div className="step step--active" data-type="narrative">
            <div className="step-content">
              <div className="step-label">A Lenda</div>
            </div>
          </div>

          <div className="step step--locked" data-type="quiz">
             <div className="step-content">
              <div className="step-label">Primeiro Desafio</div>
            </div>
          </div>
          
          <div className="step step--locked" data-type="quiz">
             <div className="step-content">
              <div className="step-label">Enigma da Floresta</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default GameBoardViewer;

