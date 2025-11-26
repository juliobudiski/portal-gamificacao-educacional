import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
// 1. Importamos o Provider do nosso novo contexto
import { HelpModalProvider } from './context/HelpModalContext.jsx';
import 'react-roulette-pro/dist/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider>
        {/* 2. Envolvemos a aplicação com o HelpModalProvider */}
        {/* Assim, qualquer tela dentro do App poderá chamar o modal */}
        <HelpModalProvider>
          <App />
        </HelpModalProvider>
      </ThemeProvider>
    </Router>
  </React.StrictMode>,
);