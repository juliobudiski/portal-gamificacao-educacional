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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider>
        <HelpModalProvider>
          {/* Envolvendo a aplicação com o ToastProvider */}
          <ToastProvider>
            <App />
          </ToastProvider>
        </HelpModalProvider>
      </ThemeProvider>
    </Router>
  </React.StrictMode>,
);