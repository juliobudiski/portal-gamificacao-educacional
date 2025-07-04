// frontend/src/pages/LoginPage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // <--- Modifique esta linha!
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importe o hook useAuth


function LoginPage() {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Use o hook para acessar a função de login do contexto
  // Callback para o Google Sign-In após a autenticação
  // Usamos useCallback para memoizar a função, evitando recriações desnecessárias
  const handleGoogleSignInCallback = useCallback(async (response) => {
    if (response.credential) {
      try {
        // Envia o ID token para o seu backend para verificação e processamento
        const backendResponse = await fetch('http://127.0.0.1:5000/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id_token: response.credential }), // Correção para id_token
        });

        const data = await backendResponse.json();

        if (backendResponse.ok) {
          setSuccess('Login com Google bem-sucedido! Redirecionando para o perfil...');
          login(data.user); // Salva os dados do usuário e o token no contexto
          setTimeout(() => navigate('/perfil'), 2000); // Redireciona para /perfil
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
  }, [navigate, login]); // navigate e login são dependências de useCallback

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Login bem-sucedido! Redirecionando para o perfil...');
        // Salva o usuário no contexto (agora incluindo o token JWT!)
        login(data.user); // data.user deve conter o token JWT retornado pelo backend
        
        // Redireciona para o perfil após 2 segundos
        setTimeout(() => navigate('/perfil'), 2000);
      } else {
        setError(data.message || 'Credenciais inválidas. Tente novamente.');
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua rede.');
      console.error('Erro de login:', err);
    }
  };
  // Carrega o script da API do Google e inicializa o botão
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    // A inicialização e renderização do botão ocorrem APÓS o script carregar
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "133837215411-f108mo4flmbqmtpofs2k1876kkrnl6tg.apps.googleusercontent.com", // Seu GOOGLE_CLIENT_ID
          callback: handleGoogleSignInCallback,
          auto_select: false, // Não seleciona automaticamente uma conta
          cancel_on_tap_outside: true, // Permite fechar clicando fora
        });

        // Renderiza o botão "Sign in with Google"
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInDivLogin'), // ID do elemento onde o botão será renderizado
          { theme: 'outline', size: 'large', text: 'signin_with' } // Opções de tema e tamanho
        );
        // O modo "one tap" pode ser útil mas precisa de mais consideração de UX
        // window.google.accounts.id.prompt(); // Para mostrar o "One Tap" automaticamente
      }
    };

    document.body.appendChild(script);

    return () => {
      // Limpeza: remove o script quando o componente é desmontado
      document.body.removeChild(script);
      // Opcional: Desinicializar o GSI se houver um método para isso
      if (window.google && window.google.accounts.id) {
        window.google.accounts.id.cancel(); // Cancela qualquer prompt ou sessão GSI ativa
      }
    };
  }, [handleGoogleSignInCallback]);
  
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 dark:text-white">
        Bem-vindo de Volta!
      </h2>
      <p className="text-gray-600 text-lg mb-8 text-center max-w-md dark:text-gray-300">
        Faça login para acessar seu portal de gamificação educacional.
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

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
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
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-blue-600"
        >
          Entrar
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

      {/* Div onde o botão do Google será renderizado */}
      {/* Aqui você pode renderizar o botão do Google Sign-In, similar ao RegisterPage */}
      {/* Para simplificar, não vou adicionar a lógica do Google aqui, mas é o mesmo pattern do RegisterPage */}
      <div id="googleSignInDivLogin" className="w-full max-w-sm flex justify-center">
        {/* Futuramente, lógica do botão Google Sign-In */}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Cadastre-se aqui
          </Link>
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          <Link to="/recuperar-senha" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Esqueceu sua senha?
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
