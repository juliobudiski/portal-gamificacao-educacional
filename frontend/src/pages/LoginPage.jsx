// frontend/src/pages/LoginPage.jsx

// --- 1. IMPORTAÇÕES ---
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import adicionado

// --- 2. DEFINIÇÃO DO COMPONENTE ---
/**
 * Componente LoginPage
 * 
 * Página de autenticação de usuários (login) via credenciais locais ou Google OAuth.
 */
function LoginPage() {
  // --- 3. ESTADOS DO COMPONENTE (State Hooks) ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para o olho da senha
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleButtonRef = useRef(null);



  // --- 4. HOOKS DE NAVEGAÇÃO E CONTEXTO ---
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // --- 5. FUNÇÃO DE CALLBACK PARA O LOGIN COM GOOGLE ---
  const handleGoogleSignInCallback = useCallback(async (response) => {
    if (response.credential) {
      try {
        const backendResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_token: response.credential,
            is_registration: false // Indica que a intenção é apenas LOGIN
          }),
        });

        const data = await backendResponse.json();

        if (backendResponse.status === 404) {
          // Usuário não existe: manda para o registro com a mensagem de erro
          navigate('/cadastro', {
            state: { message: "Conta não encontrada. Selecione seu perfil e aceite os termos para se cadastrar com o Google." }
          });
        } else if (backendResponse.ok) {
          login(data.access_token);
          const userRole = data.user?.role;
          navigate(userRole === 'professor' ? '/professor/dashboard' : '/aluno/dashboard');
        } else {
          setError(data.message || 'Erro ao realizar login.');
        }
      } catch (err) {
        setError('Erro de conexão com o servidor.');
      }
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-primary-bg p-4 transition-colors duration-300">
      
      {/* Background Animado (Blobs) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent-teal/20 blur-[100px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent-purple/20 blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-[20%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-accent-yellow/10 blur-[80px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-secondary-bg/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-border-color/50 transform transition-all hover:border-accent-teal/30">
          
          {/* Cabeçalho */}
          <div className="p-8 text-center border-b border-border-color/30">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent-yellow to-accent-teal mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-primary-text tracking-tight mb-2">
              Bem-vindo de Volta!
            </h2>
            <p className="text-secondary-text text-sm">
              Faça login para acessar seu portal educacional
            </p>
          </div>

          <div className="p-8">
            {/* Mensagens de feedback */}
            {error && (
              <div className="bg-danger-bg/50 border border-danger/50 text-danger px-4 py-3 rounded-xl mb-6 flex items-start animate-fade-in backdrop-blur-sm" role="alert">
                <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <strong className="font-bold block mb-0.5">Erro de Autenticação</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-success-bg/50 border border-success/50 text-success px-4 py-3 rounded-xl mb-6 flex items-start animate-fade-in backdrop-blur-sm" role="alert">
                <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <strong className="font-bold block mb-0.5">Sucesso!</strong>
                  <span>{success}</span>
                </div>
              </div>
            )}

            {/* Formulário de login */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Campo Email */}
              <div className="space-y-1.5 group">
                <label htmlFor="email" className="block text-sm font-semibold text-secondary-text group-focus-within:text-accent-teal transition-colors">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500 group-focus-within:text-accent-teal transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-primary-bg/50 border border-border-color rounded-xl focus:outline-none focus:border-accent-teal focus:ring-1 focus:ring-accent-teal text-primary-text placeholder-gray-500 transition-all duration-300 shadow-sm"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-1.5 group">
                <label htmlFor="password" className="block text-sm font-semibold text-secondary-text group-focus-within:text-accent-teal transition-colors">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500 group-focus-within:text-accent-teal transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-primary-bg/50 border border-border-color rounded-xl focus:outline-none focus:border-accent-teal focus:ring-1 focus:ring-accent-teal text-primary-text placeholder-gray-500 transition-all duration-300 shadow-sm"
                    placeholder="********"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-accent-teal transition-colors focus:outline-none p-2 rounded-lg hover:bg-secondary-bg"
                      title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end pt-1">
                  <Link
                    to="/recuperar-senha"
                    className="text-xs font-medium text-secondary-text hover:text-accent-teal transition-colors duration-200"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
              </div>

              {/* Botão de Entrar */}
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3.5 px-4 mt-4 rounded-xl shadow-lg text-lg font-bold text-primary-bg bg-gradient-to-r from-accent-yellow to-accent-teal hover:brightness-110 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-teal group"
              >
                <span>Entrar no Portal</span>
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>

            {/* Links inferiores */}
            <div className="mt-8 pt-6 border-t border-border-color/30 text-center">
              <p className="text-sm text-secondary-text">
                Ainda não tem uma conta?{' '}
                <Link
                  to="/cadastro"
                  className="font-bold text-accent-teal hover:text-accent-yellow transition-colors duration-200"
                >
                  Cadastre-se aqui
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-6 text-center">
          <p className="text-xs text-secondary-text/70">
            © {new Date().getFullYear()} Portal de Gamificação Educacional.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;