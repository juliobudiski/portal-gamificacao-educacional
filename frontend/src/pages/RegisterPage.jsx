// frontend/src/pages/RegisterPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importa o hook useAuth para interagir com o contexto de autenticação
import useGoogleSignIn from '../hooks/useGoogleSignIn';
import { useAuthOperations } from '../hooks/useAuthOperations';
/**
 * Componente RegisterPage
 * Esta página renderiza um formulário de cadastro para novos usuários.
 * Permite o cadastro via email/senha e também via Google Sign-In.
 * Gerencia o estado do formulário, a validação, a comunicação com a API de registro
 * e o feedback para o usuário (sucesso ou erro).
 */
function RegisterPage() {
  // --- Hooks de Estado ---
  // Armazenam os dados inseridos pelo usuário no formulário.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('aluno'); // Estado para o tipo de perfil (aluno/professor)

  // Armazenam mensagens de feedback para o usuário.
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { googleButtonRef, googleLoaded } = useGoogleSignIn('signup_with');

  // --- Hooks de Navegação e Contexto ---
  // Hook do React Router para navegar programaticamente para outras rotas.
  const navigate = useNavigate();
  // Extrai a função 'login' do nosso AuthContext para autenticar o usuário após o cadastro.
  const { login } = useAuth();

  /**
   * handleGoogleSignInCallback: Função de callback para o Google Sign-In.
   * É chamada quando o usuário completa o login com a conta Google.
   * Envia o token recebido do Google para o backend para verificação e criação/login do usuário.
   * @param {object} response - O objeto de resposta da API do Google, contendo a credencial (id_token).
   */
  const handleGoogleSignInCallback = useCallback(async (response) => {
    console.log("handleGoogleSignInCallback: Resposta recebida do Google:", response);

    if (response.credential) {
      console.log("handleGoogleSignInCallback: Credencial recebida. Enviando para o backend com o perfil:", selectedRole);
      try {
        const backendResponse = await fetch('http://127.0.0.1:5000/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id_token: response.credential, role: selectedRole }), // Envia o token e o perfil
        });

        const data = await backendResponse.json();
        console.log("handleGoogleSignInCallback: Resposta do backend:", data);

        if (backendResponse.ok) {
          setSuccess('Login com Google bem-sucedido! Redirecionando...');
          console.log("handleGoogleSignInCallback: Login bem-sucedido. Chamando a função login do contexto.");
          login(data.access_token); // Salva o token no contexto e localStorage
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
          console.error("handleGoogleSignInCallback: Erro na resposta do backend:", data.message);
          setError(data.message || 'Erro ao fazer login com Google. Tente novamente.');
        }
      } catch (err) {
        console.error('handleGoogleSignInCallback: Erro de conexão ao tentar autenticar com Google:', err);
        setError('Erro de conexão ao tentar autenticar com Google. Verifique sua rede.');
      }
    } else {
      console.error('handleGoogleSignInCallback: Autenticação Google falhou. Nenhuma credencial recebida.');
      setError('Autenticação Google falhou. Nenhuma credencial recebida.');
    }
  }, [navigate, login, selectedRole]); // Dependências da função de callback

  

  
  const { performAuthRequest } = useAuthOperations();
  const handleRegister = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  if (password !== confirmPassword) {
    setError('As senhas não coincidem!');
    return;
  }

  const registrationData = { name, email, password, role: selectedRole };
  
  const result = await performAuthRequest(
    'http://127.0.0.1:5000/auth/register',
    'POST',
    registrationData
  );

  if (result.success) {
    setSuccess('Cadastro realizado com sucesso! Redirecionando para o perfil...');
  } else {
    setError(result.message || 'Erro ao cadastrar. Tente novamente.');
    console.error("[RegisterPage] Falha na requisição. Objeto de resultado:", result);
  }
};


  // --- Renderização do Componente ---
  // Retorna o JSX que compõe a página de cadastro.
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#2c3135] to-[#1e2226] p-4">
      <div className="w-full max-w-md bg-[#343a40] rounded-2xl shadow-2xl overflow-hidden border border-[#3e4a52]">
        {/* Cabeçalho com gradiente */}
        <div className="bg-gradient-to-r from-[#69e8cb] to-[#9570d9] p-6 text-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 inline-block mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Crie Sua Conta
          </h2>
          <p className="text-white/90 mt-2">
            Transforme sua experiência de aprendizado
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

          {/* Botão do Google - MOVIDO PARA O TOPO */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <p className="text-gray-300 mb-2">Cadastre-se rapidamente com sua conta Google:</p>
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
              <span className="px-3 bg-[#343a40] text-gray-500 text-sm">Ou cadastre com email</span>
            </div>
          </div>

          {/* Formulário de registro */}
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Campo Nome */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Nome Completo
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2c3135] border border-[#3e4a52] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd30] text-white placeholder-gray-500 transition-all duration-200"
                  placeholder="Seu nome completo"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

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

            {/* Campo Confirmar Senha */}
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">
                Confirme a Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirm-password"
                  name="confirm-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            {/* Seleção de Perfil */}
            <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tipo de Perfil
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Card para Aluno */}
              <div 
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedRole === 'aluno' 
                    ? 'border-[#69e8cb] bg-[#69e8cb]/10 shadow-lg' 
                    : 'border-[#3e4a52] hover:border-[#69e8cb]/50'
                }`}
                onClick={() => setSelectedRole('aluno')}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    selectedRole === 'aluno' 
                      ? 'bg-[#69e8cb] text-[#2c3135]' 
                      : 'bg-[#2c3135] text-[#69e8cb]'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-300">Aluno</span>
                </div>
                {selectedRole === 'aluno' && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-[#69e8cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Card para Professor */}
              <div 
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedRole === 'professor' 
                    ? 'border-[#ffbd30] bg-[#ffbd30]/10 shadow-lg' 
                    : 'border-[#3e4a52] hover:border-[#ffbd30]/50'
                }`}
                onClick={() => setSelectedRole('professor')}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    selectedRole === 'professor' 
                      ? 'bg-[#ffbd30] text-[#2c3135]' 
                      : 'bg-[#2c3135] text-[#ffbd30]'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-300">Professor</span>
                </div>
                {selectedRole === 'professor' && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-[#ffbd30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* Botão de Cadastro */}
            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg text-lg font-bold text-[#2c3135] bg-gradient-to-r from-[#ffbd30] to-[#ffa000] hover:from-[#ffcc5c] hover:to-[#ffb140] transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffbd30]"
            >
              Cadastrar
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </form>

          {/* Link para Login */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Já tem uma conta?{' '}
              <Link 
                to="/login" 
                className="font-medium text-[#69e8cb] hover:text-[#ffbd30] transition-colors duration-200"
              >
                Faça login aqui
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

export default RegisterPage;