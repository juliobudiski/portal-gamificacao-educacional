// frontend/src/pages/LoginPage.jsx

// --- 1. IMPORTAÇÕES ---
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// --- 2. DEFINIÇÃO DO COMPONENTE ---
function LoginPage() {
  // --- 3. ESTADOS DO COMPONENTE (State Hooks) ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleButtonRef = useRef(null);


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
      const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
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
        
          const userRole = responseData.user?.role;
        setTimeout(() => {
          if (userRole === 'professor') {
            navigate('/professor/dashboard');
          } else if (userRole === 'aluno') {
            navigate('/aluno/dashboard');
          } else {
            navigate('/perfil'); // Redirecionamento padrão
          }
        }, 2000);
      }   else
      {
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
  // Efeito para carregar o Google Sign-In (atualizado)
  useEffect(() => {
    console.log('[useEffect] Montando o componente e carregando o script do Google.');
    
    const initGoogleSignIn = () => {
      if (window.google && window.google.accounts && googleButtonRef.current) {
        console.log('[useEffect] Inicializando o Google Identity Services (GSI).');
        window.google.accounts.id.initialize({
          client_id: "133837215411-f108mo4flmbqmtpofs2k1876kkrnl6tg.apps.googleusercontent.com",
          callback: handleGoogleSignInCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        console.log('[useEffect] Renderizando o botão de login do Google.');
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          { 
            theme: 'outline', 
            size: 'large', 
            text: 'signin_with',
            width: '360',
            logo_alignment: 'left'
          }
        );
        
        setGoogleLoaded(true);
      }
    };

    if (window.google) {
      initGoogleSignIn();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('[useEffect] Script do Google carregado com sucesso.');
      setTimeout(initGoogleSignIn, 500);
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#2c3135] to-[#1e2226] p-4">
      <div className="w-full max-w-md bg-[#343a40] rounded-2xl shadow-2xl overflow-hidden border border-[#3e4a52]">
        {/* Cabeçalho com gradiente */}
        <div className="bg-gradient-to-r from-[#ffbd30] to-[#ffa000] p-6 text-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 inline-block mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Bem-vindo de Volta!
          </h2>
          <p className="text-white/90 mt-2">
            Faça login para acessar seu portal de gamificação educacional
          </p>
        </div>

        <div className="p-8">
          {/* Mensagens de feedback */}
          {error && (
            <div className="bg-red-900/50 border border-red-600 text-red-100 px-4 py-3 rounded-xl mb-6 flex items-start" role="alert">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <strong className="font-bold">Erro!</strong>
                <span className="block"> {error}</span>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-900/50 border border-green-600 text-green-100 px-4 py-3 rounded-xl mb-6 flex items-start" role="alert">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <strong className="font-bold">Sucesso!</strong>
                <span className="block"> {success}</span>
              </div>
            </div>
          )}

          {/* Botão do Google no topo */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <p className="text-gray-300 mb-2">Faça login rapidamente com sua conta Google:</p>
              <div 
                ref={googleButtonRef} 
                className="w-full flex justify-center bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
              />
              
              {/* Placeholder enquanto o botão carrega */}
              {!googleLoaded && (
                <button className="w-full py-3 px-4 bg-gray-200 rounded-xl animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto"></div>
                </button>
              )}
            </div>
          </div>

          {/* Divisor */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3e4a52]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[#343a40] text-gray-500 text-sm">Ou com email</span>
            </div>
          </div>

          {/* Formulário de login */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Campo Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2c3135] border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30] text-white placeholder-gray-500 transition-all duration-200"
                  placeholder="seu@email.com"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Campo Senha */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2c3135] border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30] text-white placeholder-gray-500 transition-all duration-200"
                  placeholder="********"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Botão de Entrar */}
            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg text-lg font-bold text-[#2c3135] bg-gradient-to-r from-[#ffbd30] to-[#ffa000] hover:from-[#ffcc5c] hover:to-[#ffb140] transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffbd30]"
            >
              Entrar
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>

          {/* Links inferiores */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-gray-400">
              Não tem uma conta?{' '}
              <Link 
                to="/cadastro" 
                className="font-medium text-[#69e8cb] hover:text-[#ffbd30] transition-colors duration-200"
              >
                Cadastre-se aqui
              </Link>
            </p>
            <p className="text-sm text-gray-400">
              <Link 
                to="/recuperar-senha" 
                className="font-medium text-[#69e8cb] hover:text-[#ffbd30] transition-colors duration-200"
              >
                Esqueceu sua senha?
              </Link>
            </p>
          </div>
        </div>
        
        {/* Rodapé */}
        <div className="bg-[#2c3135] p-4 text-center border-t border-[#3e4a52]">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Portal de Gamificação Educacional. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;