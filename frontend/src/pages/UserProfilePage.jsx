// frontend/src/pages/UserProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importe o hook useAuth

function UserProfilePage() {
  const { user, logout } = useAuth(); // Obtenha o usuário logado e a função de logout do contexto
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState(''); // Para mensagens de sucesso/erro na alteração de senha

  useEffect(() => {
    // Se não houver usuário logado, redireciona para o login
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Ou um spinner de carregamento, enquanto o redirecionamento acontece
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(''); // Limpa mensagens anteriores

    if (newPassword !== confirmNewPassword) {
      setMessage('Erro: A nova senha e a confirmação não coincidem.');
      return;
    }
    if (newPassword.length < 6) { // Exemplo de validação de senha
      setMessage('Erro: A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/change-password', { // Nova rota no backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Inclua um token de autorização aqui se você tiver um JWT (futuramente)
          // 'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id, // ID do usuário logado
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Senha alterada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setMessage(data.message || 'Erro ao alterar a senha.');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setMessage('Erro de conexão ao tentar alterar a senha.');
    }
  };

  const handleLogout = () => {
    logout(); // Chama a função de logout do contexto
    navigate('/login'); // Redireciona para a página de login após o logout
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 dark:text-white">
        Meu Perfil
      </h2>
      <div className="w-full max-w-md space-y-4 text-center">
        <p className="text-gray-700 dark:text-gray-200 text-lg">
          <span className="font-semibold">Nome:</span> {user.name || 'Não informado'}
        </p>
        <p className="text-gray-700 dark:text-gray-200 text-lg">
          <span className="font-semibold">Email:</span> {user.email}
        </p>
        <p className="text-gray-700 dark:text-gray-200 text-lg">
          <span className="font-semibold">Tipo de Perfil:</span> {user.role === 'aluno' ? 'Aluno' : 'Professor'}
        </p>

        {user.profile_picture && user.google_id && (
          <div className="mb-4">
            <img
              src={user.profile_picture}
              alt="Foto de Perfil do Google"
              className="w-24 h-24 rounded-full mx-auto border-2 border-blue-500"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Logado com Google</p>
          </div>
        )}

        <hr className="my-8 border-t border-gray-300 dark:border-gray-600" />

        <h3 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">Alterar Senha</h3>
        {user.google_id && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Você fez login usando o Google. Não é possível alterar a senha diretamente por aqui. Gerencie sua senha através da sua conta Google.
          </p>
        )}
        {!user.google_id && (
          <form onSubmit={handleChangePassword} className="w-full space-y-4">
            {message && (
              <div className={`px-4 py-3 rounded relative ${message.startsWith('Erro') ? 'bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-100' : 'bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-100'}`} role="alert">
                <span className="block sm:inline">{message}</span>
              </div>
            )}
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 text-left dark:text-gray-200">
                Senha Atual
              </label>
              <input
                type="password"
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 text-left dark:text-gray-200">
                Nova Senha
              </label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 text-left dark:text-gray-200">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                id="confirm-new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-blue-600"
            >
              Alterar Senha
            </button>
          </form>
        )}

        <button
          onClick={handleLogout}
          className="mt-8 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-600"
        >
          Sair
        </button>
      </div>
    </div>
  );
}

export default UserProfilePage;