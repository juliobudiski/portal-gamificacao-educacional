import React from 'react';

// Os estilos CSS que estavam no arquivo HTML são colocados aqui
const GameBoardStyles = `
    @keyframes pulse-glow {
        0%, 100% {
            box-shadow: 0 0 15px 0px rgba(56, 189, 248, 0.4);
            transform: scale(1);
        }
        50% {
            box-shadow: 0 0 25px 8px rgba(56, 189, 248, 0.7);
            transform: scale(1.02);
        }
    }

    .game-board-container {
        width: 100%;
        max-width: 800px;
        margin: auto;
        padding: 2rem;
        font-family: 'Inter', sans-serif;
    }

    .game-board {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        position: relative;
    }

    .game-board::before {
        content: '';
        position: absolute;
        top: 2.5rem;
        bottom: 2.5rem;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        background-image: linear-gradient(to bottom, #4a525a 60%, transparent 40%);
        background-size: 4px 15px;
        z-index: 1;
    }

    .step {
        display: flex;
        align-items: center;
        width: 100%;
        position: relative;
        z-index: 2;
        background-color: #3a4046;
        border-radius: 1rem;
        padding: 1rem;
        border: 2px solid transparent;
        transition: all 0.3s ease;
    }

    .step-icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 1rem;
        flex-shrink: 0;
        transition: all 0.3s ease;
    }

    .step-icon svg {
        width: 24px;
        height: 24px;
    }

    .step-label {
        font-weight: 600;
        font-family: 'Poppins', sans-serif;
        color: #e5e7eb;
    }
    
    .step-checkmark {
        margin-left: auto;
        color: #f59e0b;
    }
    .step-checkmark svg {
        width: 24px;
        height: 24px;
    }

    /* Estados Visuais */
    .step--locked { cursor: not-allowed; }
    .step--locked .step-icon { background-color: #2c3135; color: #5a626a; }
    .step--locked .step-label { color: #5a626a; }

    .step--completed { border-color: #f59e0b; }
    .step--completed .step-icon { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .step--completed .step-label { text-decoration: line-through; color: #9ca3af; }
    
    .step--active {
        cursor: pointer;
        border-color: #38bdf8;
        background-color: #1e40af;
        animation: pulse-glow 2s infinite ease-in-out;
    }
    .step--active .step-icon { background-color: rgba(56, 189, 248, 0.2); color: #38bdf8; }
    .step--active .step-label { color: #ffffff; }
    
    /* Layout Desktop */
    @media (min-width: 768px) {
        .game-board { gap: 0; }
        .game-board::before { left: 50%; transform: translateX(-50%); }
        .step { width: 45%; margin-bottom: 2rem; }
        .step:nth-child(even) { align-self: flex-end; }
        .step:nth-child(odd) { align-self: flex-start; }
        .step::after {
            content: '';
            position: absolute;
            top: 2.5rem;
            height: 4px;
            width: 55%;
            background-image: linear-gradient(to right, #4a525a 60%, transparent 40%);
            background-size: 15px 4px;
            z-index: -1;
        }
        .step:nth-child(odd)::after { right: -55%; }
        .step:nth-child(even)::after {
            left: -55%;
            background-image: linear-gradient(to left, #4a525a 60%, transparent 40%);
        }
        .step:last-child::after { display: none; }
    }
`;

function GameBoardViewer() {
  return (
    <>
      {/* A tag style injeta todo o nosso CSS na página */}
      <style>{GameBoardStyles}</style>
      
      {/* O HTML do tabuleiro, convertido para JSX */}
      <div className="game-board-container">
        <div className="game-board">
          
          {/* 1. Casa concluída */}
          <div className="step step--completed">
            <div className="step-icon">
              <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
            </div>
            <div className="step-label">Introdução à Saga</div>
            <div className="step-checkmark">
              <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
          </div>

          {/* 2. Casa concluída */}
          <div className="step step--completed">
            <div className="step-icon">
              <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
            </div>
            <div className="step-label">Quiz dos Verbos</div>
            <div className="step-checkmark">
              <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
          </div>

          {/* 3. Casa ativa */}
          <div className="step step--active">
            <div className="step-icon">
              <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" /></svg>
            </div>
            <div className="step-label">Roleta da Sorte</div>
          </div>

          {/* 4. Casa bloqueada */}
          <div className="step step--locked">
             <div className="step-icon">
                <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9 9 0 119 0zM16.5 18.75v-6.75a4.5 4.5 0 00-9 0v6.75a9 9 0 009 0zM16.5 18.75h-9" /></svg>
             </div>
             <div className="step-label">Caça-níquel</div>
          </div>
          
           {/* 5. Casa bloqueada */}
          <div className="step step--locked">
             <div className="step-icon">
                 <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9 9 0 119 0zM16.5 18.75v-6.75a4.5 4.5 0 00-9 0v6.75a9 9 0 009 0zM16.5 18.75h-9" /></svg>
             </div>
             <div className="step-label">Desafio Final</div>
          </div>

        </div>
      </div>
    </>
  );
}

export default GameBoardViewer;