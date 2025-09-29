// frontend/src/components/activity/InteractionPanel.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import './InteractionPanel.css'; // Vamos criar este arquivo a seguir

const InteractionPanel = ({ isOpen, onClose, title, children }) => {
  return (
    <aside className={`interaction-panel ${isOpen ? 'is-open' : ''}`}>
      <div className="panel-content-wrapper">
        <header className="panel-header">
          <h2 className="panel-title">{title}</h2>
          <button onClick={onClose} className="panel-close-btn" aria-label="Fechar Painel">
            <FaTimes />
          </button>
        </header>
        <main className="panel-body">
          {children}
        </main>
      </div>
    </aside>
  );
};

export default InteractionPanel;