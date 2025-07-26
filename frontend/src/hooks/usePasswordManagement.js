import { useState } from 'react';

export function usePasswordManagement() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('As senhas não coincidem');
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    return true;
  };

  const changePassword = async () => {
    if (!validatePassword()) return false;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Senha alterada com sucesso!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        return true;
      } else {
        setMessage(data.message || 'Erro ao alterar senha');
        return false;
      }
    } catch (error) {
      setMessage('Erro de conexão');
      return false;
    }
  };

  return {
    passwordData,
    message,
    handleChange,
    changePassword
  };
}