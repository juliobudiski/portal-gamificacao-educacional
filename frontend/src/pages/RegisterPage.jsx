// frontend/src/pages/RegisterPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importe o hook useAuth

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(''); // Adicione esta linha para o estado do nome
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRole, setSelectedRole] = useState('aluno'); // <--- ADICIONE ESTA LINHA
  const navigate = useNavigate();
  const { login } = useAuth(); // Use o hook para acessar a função de login do contexto

  const handleGoogleSignInCallback = useCallback(async (response) => {
    if (response.credential) {
      try {
        const backendResponse = await fetch('http://127.0.0.1:5000/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
                    body: JSON.stringify({ id_token: response.credential, role: selectedRole }), // Inclua o role selecionado
        });

        const data = await backendResponse.json();

        if (backendResponse.ok) {
          setSuccess('Login com Google bem-sucedido! Redirecionando para o perfil...');
          login(data.user); // Salva os dados do usuário no contexto
          setTimeout(() => navigate('/perfil'), 2000);
        } else {
          setError(data.message || 'Erro ao fazer login com Google. Tente novamente.');
        }
      } catch (err) {
        setError('Erro de conexão ao tentar autenticar com Google. Verifique sua rede.');
        console.error('Erro de Google Sign-In:', err);
      }
    } else {
      setError('Autenticação Google falhou. Nenhuma credencial recebida.');
    }
  }, [navigate, login]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "133837215411-f108mo4flmbqmtpofs2k1876kkrnl6tg.apps.googleusercontent.com",
          callback: handleGoogleSignInCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInDiv'),
          { theme: 'outline', size: 'large', text: 'signup_with' }
        );
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      if (window.google && window.google.accounts.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [handleGoogleSignInCallback]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Adicione 'name' ao corpo da requisição
                body: JSON.stringify({ name, email, password, role: selectedRole }), // Inclua o role selecionado
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Cadastro realizado com sucesso! Redirecionando para o perfil...');
        // ADICIONE ESTA LINHA:
        login(data.user); // Assume que 'data.user' contém o JWT ou as informações para o login
        setTimeout(() => navigate('/perfil'), 2000);
      } else {
        setError(data.message || 'Erro ao cadastrar. Tente novamente.');
      }

    } catch (err) {
      setError('Erro de conexão. Verifique sua rede.');
      console.error('Erro de cadastro:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800 dark:text-gray-100"> {/* Fundo do card no modo escuro */}
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 dark:text-white">
        Crie Sua Conta
      </h2>
      <p className="text-gray-600 text-lg mb-8 text-center max-w-md dark:text-gray-300">
        Junte-se ao Portal de Gamificação Educacional e comece a transformar sua experiência de aprendizado!
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 w-full max-w-sm dark:bg-red-900 dark:border-red-700 dark:text-red-100" role="alert">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 w-full max-w-sm dark:bg-green-900 dark:border-green-700 dark:text-green-100" role="alert">
          <strong className="font-bold">Sucesso!</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-6">
        {/* Campo de Nome */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Nome Completo
          </label>
          <input
            type="text" // Tipo 'text' para nome
            id="name"
            name="name"
            required // Torna o campo obrigatório
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="Seu nome completo"
          />
        </div>
        {/* Fim do Campo de Nome */}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Senha
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="********"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Confirme a Senha
          </label>
          <input
            type="password"
            id="confirm-password"
            name="confirm-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="********"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Tipo de Perfil
          </label>
          <div className="mt-1 flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="role"
                value="aluno"
                checked={selectedRole === 'aluno'}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-500"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-200">Aluno</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="role"
                value="professor"
                checked={selectedRole === 'professor'}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-500"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-200">Professor</span>
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-blue-600"
        >
          Cadastrar
        </button>
      </form>

      <div className="relative my-6 w-full max-w-sm">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400">Ou</span>
        </div>
      </div>

      <div id="googleSignInDiv" className="w-full max-w-sm flex justify-center"></div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600  dark:text-gray-300">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Faça login aqui
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;