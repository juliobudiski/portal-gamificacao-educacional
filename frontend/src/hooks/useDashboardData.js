// src/hooks/useDashboardData.js
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useDashboardData
 * 
 * Architectural intent: Encapsulates the data fetching logic and state management for the dashboard.
 * Acts as an anti-corruption layer between the API and the UI components, ensuring the presentation
 * layer remains decoupled from network protocols, loading states, and error handling.
 */
const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (import.meta.env.VITE_DEBUG_MODE) {
        console.debug('[useDashboardData] Iniciando busca de dados...');
      }

      setLoading(true);
      setError('');
      
      try {
        const token = localStorage.getItem('token');
        if (!token || !user) {
          throw new Error("Usuário não autenticado");
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro na resposta da API");
        }

        const data = await response.json();
        setDashboardData(data);
        
        if (import.meta.env.VITE_DEBUG_MODE) {
          console.debug('[useDashboardData] Dados recebidos:', data);
        }
      } catch (err) {
        console.error('[useDashboardData] Erro:', err);
        setError(err.message || "Erro ao carregar dashboard");
        
        // TODO: Integrar com serviço de monitoramento (Sentry/Rollbar)
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return { dashboardData, loading, error };
};

export default useDashboardData;