import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useAuthOperations() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleAuthResponse = useCallback(async (response, successMessage) => {
    const data = await response.json();
    
    if (response.ok) {
      login(data);
      const userRole = data.user?.role;
      setTimeout(() => {
        if (userRole === 'professor') {
          navigate('/professor/dashboard');
        } else if (userRole === 'aluno') {
          navigate('/aluno/dashboard');
        } else {
          navigate('/perfil'); // Redirecionamento padrão
        }
      }, 2000);
      return { success: true, message: successMessage };
    }
    return { success: false, message: data.message || 'Erro na operação' };
  }, [login, navigate]);

  const performAuthRequest = useCallback(async (url, method, body) => {
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await handleAuthResponse(response, 'Operação bem-sucedida!');
    } catch (error) {
      return { success: false, message: 'Erro de conexão' };
    }
  }, [handleAuthResponse]);

  return { performAuthRequest };
}