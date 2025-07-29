import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function useProfileManagement() {
  const { user, updateUserData, logout } = useAuth();
  const [messages, setMessages] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const updateProfile = useCallback(async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok) {
        updateUserData(result.user);
        setMessages({ success: 'Perfil atualizado com sucesso!' });
        return true;
      } else {
        setMessages({ error: result.message || 'Erro ao atualizar perfil' });
        return false;
      }
    } catch (error) {
      setMessages({ error: 'Erro de conexão' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateUserData]);

  const updateAvatar = useCallback(async (avatarUrl) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/select-avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ avatar_url: avatarUrl })
      });

      const result = await response.json();
      
      if (response.ok) {
        updateUserData(result.user);
        setMessages({ success: 'Avatar atualizado com sucesso!' });
        return true;
      } else {
        setMessages({ error: result.message || 'Erro ao atualizar avatar' });
        return false;
      }
    } catch (error) {
      setMessages({ error: 'Erro de conexão' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateUserData]);

  const deleteAccount = useCallback(async (password) => {
    setIsLoading(true);
    setMessages({}); // Limpa mensagens anteriores
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/delete_account`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ password })
        });

        const result = await response.json();

        if (response.ok) {
            setMessages({ success: 'Conta excluída com sucesso! Você será deslogado.' });
            setTimeout(() => {
                logout(); // Desloga o usuário
            }, 2000);
            return { success: true, message: result.message };
        } else {
            setMessages({ error: result.message || 'Erro ao excluir a conta.' });
            return { success: false, message: result.message };
        }
    } catch (error) {
        setMessages({ error: 'Erro de conexão ao tentar excluir a conta.' });
        return { success: false, message: 'Erro de conexão' };
    } finally {
        setIsLoading(false);
    }
  }, [logout]);

  return {
    user,
    messages,
    isLoading,
    updateProfile,
    updateAvatar,
    deleteAccount
  };
}