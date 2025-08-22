// frontend/src/main.jsx
import React from 'react'; // Importe React
import ReactDOM from 'react-dom/client'; // Importe ReactDOM
import { BrowserRouter as Router } from 'react-router-dom'; // Importe BrowserRouter e renomeie para Router para consistência
import './index.css'; // Mantenha a importação do seu CSS principal
import App from './App.jsx'; // Importe seu componente App
import { AuthProvider } from './context/AuthContext.jsx'; // Importe o AuthProvider
import 'react-roulette-pro/dist/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router> 
      <AuthProvider> 
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);
