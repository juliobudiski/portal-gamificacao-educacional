import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { HelpModalProvider } from './context/HelpModalContext.jsx';
import 'react-roulette-pro/dist/index.css';
// Importação do Provider
import { ToastProvider } from './context/ToastContext';
import { ConfettiProvider } from './context/ConfettiContext';

/**
 * Main Entry Point
 * 
 * Architectural intent: Acts as the application's entry point, mounting the React component tree to the DOM.
 * It is responsible for injecting foundational global providers (Router, Contexts) into the application lifecycle,
 * maintaining strict separation between app initialization and routing logic.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider>
        <HelpModalProvider>
          {/* Envolvendo a aplicação com o ToastProvider */}
          <ToastProvider>
            <ConfettiProvider>
              <App />
            </ConfettiProvider>
          </ToastProvider>
        </HelpModalProvider>
      </ThemeProvider>
    </Router>
  </React.StrictMode>,
);