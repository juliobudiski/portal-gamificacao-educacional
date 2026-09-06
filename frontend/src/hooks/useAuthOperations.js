import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * useAuthOperations
 * 
 * Architectural intent: Encapsulates authentication-related API calls and subsequent routing side-effects.
 * This prevents the AuthContext from becoming bloated with routing logic and HTTP request handling,
 * promoting Separation of Concerns and keeping the context focused purely on state.
 */
export function useAuthOperations() {
  const navigate = useNavigate();
  const { login, token } = useAuth();

  const handleAuthResponse = useCallback(async (response, successMessage) => {
    // Tenta fazer o parse do JSON. Se falhar (ex: erro 500 html), evita quebrar a app.
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { message: 'Erro inesperado do servidor.' };
    }

    if (response.ok) {
      // Se a resposta trouxer um novo token/login, atualiza (útil para login/registro)
      if (data.access_token || data.user) {
        login(data);
        const userRole = data.user?.role;
        setTimeout(() => {
          if (userRole === 'professor') {
            navigate('/professor/dashboard');
          } else if (userRole === 'aluno') {
            navigate('/aluno/dashboard');
          } else {
            navigate('/perfil');
          }
        }, 2000);
      }
      return { success: true, message: successMessage, data };
    }
    return { success: false, message: data.message || 'Erro na operação' };
  }, [login, navigate]);

  const performAuthRequest = useCallback(async (url, method, body) => {
    try {
      console.log(`[useAuthOperations] ${method} para: ${url}`);

      // 2. Monta os cabeçalhos com o Token
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        // 3. Só envia body se ele existir (evita erro em GET)
        body: body ? JSON.stringify(body) : undefined
      });

      return await handleAuthResponse(response, 'Operação bem-sucedida!');
    } catch (error) {
      console.error("Erro na requisição:", error);
      return { success: false, message: 'Erro de conexão' };
    }
  }, [handleAuthResponse, token]);

  return { performAuthRequest };
}