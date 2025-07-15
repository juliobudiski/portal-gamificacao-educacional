// frontend/src/pages/RegisterPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importa o hook useAuth para interagir com o contexto de autenticação

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
        const backendResponse = await fetch('http://127.0.0.1:5000/api/auth/google', {
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
          setTimeout(() => navigate('/perfil'), 2000); // Redireciona para a página de perfil
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

  /**
   * useEffect para inicializar o Google Sign-In.
   * Este efeito carrega o script da API do Google, inicializa o serviço de identidade
   * e renderiza o botão de login do Google na div especificada.
   * Também inclui uma função de limpeza para remover o script e cancelar processos pendentes.
   */
  useEffect(() => {
    console.log("useEffect: Montando o script do Google Sign-In.");
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("useEffect: Script do Google carregado com sucesso.");
      if (window.google) {
        console.log("useEffect: Inicializando Google Accounts ID.");
        window.google.accounts.id.initialize({
          client_id: "133837215411-f108mo4flmbqmtpofs2k1876kkrnl6tg.apps.googleusercontent.com",
          callback: handleGoogleSignInCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        console.log("useEffect: Renderizando o botão do Google Sign-In.");
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInDiv'),
          { theme: 'outline', size: 'large', text: 'signup_with', width: '360' }
        );
      } else {
        console.error("useEffect: Objeto 'window.google' não encontrado após o carregamento do script.");
      }
    };

    document.body.appendChild(script);

    // Função de limpeza: executada quando o componente é desmontado.
    return () => {
      console.log("useEffect: Desmontando o componente e limpando o script do Google.");
      document.body.removeChild(script);
      if (window.google && window.google.accounts.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [handleGoogleSignInCallback]); // A dependência garante que a função de callback esteja sempre atualizada.

  /**
   * handleRegister: Função para lidar com o envio do formulário de cadastro padrão (email/senha).
   * @param {React.FormEvent<HTMLFormElement>} e - O evento de submissão do formulário.
   */
  const handleRegister = async (e) => {
    e.preventDefault(); // Previne o recarregamento da página
    console.log("handleRegister: Tentativa de cadastro iniciada.");
    setError('');
    setSuccess('');

    // Validação simples: verifica se as senhas coincidem.
    if (password !== confirmPassword) {
      console.error("handleRegister: As senhas não coincidem.");
      setError('As senhas não coincidem!');
      return;
    }

    const registrationData = { name, email, password, role: selectedRole };
    console.log("handleRegister: Enviando dados de cadastro para a API:", registrationData);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();
      console.log("handleRegister: Resposta recebida da API de registro:", data);

      if (response.ok) {
        setSuccess('Cadastro realizado com sucesso! Redirecionando para o perfil...');
        console.log("handleRegister: Cadastro bem-sucedido. Chamando a função login do contexto.");
        login(data.access_token); // Autentica o usuário no contexto
        setTimeout(() => navigate('/perfil'), 2000); // Redireciona após um pequeno atraso
      } else {
        console.error("handleRegister: Erro da API de registro:", data.message);
        setError(data.message || 'Erro ao cadastrar. Tente novamente.');
      }

    } catch (err) {
      console.error('handleRegister: Erro de conexão durante o cadastro:', err);
      setError('Erro de conexão. Verifique sua rede.');
    }
  };

  // --- Renderização do Componente ---
  // Retorna o JSX que compõe a página de cadastro.
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 dark:text-white">
        Crie Sua Conta
      </h2>
      <p className="text-gray-600 text-lg mb-8 text-center max-w-md dark:text-gray-300">
        Junte-se ao Portal de Gamificação Educacional e comece a transformar sua experiência de aprendizado!
      </p>

      {/* Exibição condicional de mensagens de erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 w-full max-w-sm dark:bg-red-900 dark:border-red-700 dark:text-red-100" role="alert">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      {/* Exibição condicional de mensagens de sucesso */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 w-full max-w-sm dark:bg-green-900 dark:border-green-700 dark:text-green-100" role="alert">
          <strong className="font-bold">Sucesso!</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}

      {/* Formulário de Cadastro */}
      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-6">
        {/* Campo de Nome */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Nome Completo</label>
          <input type="text" id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Seu nome completo" />
        </div>
        
        {/* Campo de Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
          <input type="email" id="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="seu@email.com" />
        </div>

        {/* Campo de Senha */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Senha</label>
          <input type="password" id="password" name="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="********" />
        </div>

        {/* Campo de Confirmação de Senha */}
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Confirme a Senha</label>
          <input type="password" id="confirm-password" name="confirm-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="********" />
        </div>

        {/* Seleção de Perfil (Role) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Tipo de Perfil</label>
          <div className="mt-1 flex space-x-4">
            <label className="inline-flex items-center">
              <input type="radio" name="role" value="aluno" checked={selectedRole === 'aluno'} onChange={(e) => { console.log("Perfil selecionado: aluno"); setSelectedRole(e.target.value); }} className="form-radio h-4 w-4 text-blue-600" />
              <span className="ml-2 text-gray-700 dark:text-gray-200">Aluno</span>
            </label>
            <label className="inline-flex items-center">
              <input type="radio" name="role" value="professor" checked={selectedRole === 'professor'} onChange={(e) => { console.log("Perfil selecionado: professor"); setSelectedRole(e.target.value); }} className="form-radio h-4 w-4 text-blue-600" />
              <span className="ml-2 text-gray-700 dark:text-gray-200">Professor</span>
            </label>
          </div>
        </div>

        {/* Botão de Submissão do Formulário */}
        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Cadastrar
        </button>
      </form>

      {/* Divisor "Ou" */}
      <div className="relative my-6 w-full max-w-sm">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400">Ou</span>
        </div>
      </div>

      {/* Contêiner onde o botão do Google Sign-In será renderizado */}
      <div id="googleSignInDiv" className="w-full max-w-sm flex justify-center"></div>

      {/* Link para a página de Login */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">
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
