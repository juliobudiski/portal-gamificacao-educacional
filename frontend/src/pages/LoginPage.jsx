// frontend/src/pages/LoginPage.jsx

// --- 1. IMPORTAÇÕES ---
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// --- 2. DEFINIÇÃO DO COMPONENTE ---
function LoginPage() {
  // --- 3. ESTADOS DO COMPONENTE (State Hooks) ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- 4. HOOKS DE NAVEGAÇÃO E CONTEXTO ---
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // --- 5. FUNÇÃO DE CALLBACK PARA O LOGIN COM GOOGLE ---
  const handleGoogleSignInCallback = useCallback(async (response) => {
    console.log('[Google Callback] Resposta recebida do Google:', response);

    if (response.credential) {
      console.log('[Google Callback] Credencial (ID Token) encontrada. Enviando para o backend...');
      try {
        const backendResponse = await fetch('http://127.0.0.1:5000/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id_token: response.credential }),
        });

        console.log('[Google Callback] Resposta bruta do backend:', backendResponse);
        const data = await backendResponse.json();
        console.log('[Google Callback] Dados recebidos do backend:', data);

        if (backendResponse.ok) {
          setSuccess('Login com Google bem-sucedido! Redirecionando para o perfil...');
          console.log('[Google Callback] Login bem-sucedido. Token de acesso:', data.access_token);
          
          // CORREÇÃO AQUI: Passe o objeto 'data' completo, não apenas o token.
          login(data); // Agora está correto para o AuthContext
          
          setTimeout(() => navigate('/perfil'), 2000);
        } else {
          setError(data.message || 'Erro ao fazer login com Google. Tente novamente.');
          console.error('[Google Callback] Erro do backend:', data.message);
          console.error('Detalhes do erro (vindo do data):', data);
        }
      } catch (err) {
        setError('Erro de conexão ao tentar autenticar com Google. Verifique sua rede.');
        console.error('[Google Callback] Erro de fetch:', err);
      }
    } else {
      setError('Autenticação Google falhou. Nenhuma credencial recebida.');
      console.error('[Google Callback] Nenhuma credencial recebida na resposta.');
    }
  }, [navigate, login]);

  // --- 6. FUNÇÃO PARA LOGIN PADRÃO (EMAIL E SENHA) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('[Login Padrão] Tentativa de login iniciada.');
    
    setError('');
    setSuccess('');

    console.log('[Login Padrão] Dados do formulário:', { email, password });

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[Login Padrão] Resposta bruta do backend:', response);
      
      // CORREÇÃO AQUI: Use 'responseData' consistentemente após ler o JSON
      const responseData = await response.json(); 
      console.log('[Login Padrão] Dados recebidos do backend:', responseData); // Corrigido de 'data' para 'responseData'

      if (response.ok) {
        setSuccess('Login bem-sucedido! Redirecionando para o perfil...');
        console.log('[Login Padrão] Login bem-sucedido. Token de acesso:', responseData.access_token);
        
        // Esta chamada já estava correta, pois 'responseData' é o objeto completo
        login(responseData); 
        
        setTimeout(() => navigate('/perfil'), 2000);
      } else {
        // Se houver um erro, use os 'responseData' que já foram lidos.
        setError(responseData.message || 'Credenciais inválidas. Tente novamente.');
        console.error('[Login Padrão] Erro do backend:', responseData.message);
        console.error('Detalhes do erro (vindo do responseData):', responseData);
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua rede.');
      console.error('[Login Padrão] Erro de fetch:', err);
    }
  };

  // --- 7. EFEITO PARA CARREGAR E INICIALIZAR O GOOGLE SIGN-IN (useEffect) ---
  useEffect(() => {
    console.log('[useEffect] Montando o componente e carregando o script do Google.');
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('[useEffect] Script do Google carregado com sucesso.');
      if (window.google && window.google.accounts) {
        console.log('[useEffect] Inicializando o Google Identity Services (GSI).');
        window.google.accounts.id.initialize({
          client_id: "133837215411-f108mo4flmbqmtpofs2k1876kkrnl6tg.apps.googleusercontent.com",
          callback: handleGoogleSignInCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        console.log('[useEffect] Renderizando o botão de login do Google.');
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInDivLogin'),
          { theme: 'outline', size: 'large', text: 'signin_with' }
        );
      } else {
        console.error('[useEffect] Objeto "google.accounts" não encontrado após carregar o script.');
      }
    };

    document.body.appendChild(script);

    return () => {
      console.log('[useEffect Cleanup] Desmontando o componente e limpando o script do Google.');
      document.body.removeChild(script);
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [handleGoogleSignInCallback]);

  // --- 8. RENDERIZAÇÃO DO COMPONENTE (JSX) ---
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

      <div id="googleSignInDivLogin" className="w-full max-w-sm flex justify-center">
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