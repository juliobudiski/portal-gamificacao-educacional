// frontend/src/pages/RegisterPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importa o hook useAuth para interagir com o contexto de autenticação
import useGoogleSignIn from '../hooks/useGoogleSignIn';
import { useAuthOperations } from '../hooks/useAuthOperations';
import TermsOfUseModal from '../components/TermsOfUseModal';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

/**}

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

  // --- NOVO: Estados para controlar a visibilidade da senha ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Armazenam mensagens de feedback para o usuário.
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const location = useLocation();
  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location]);

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
    // Validação local antes de chamar o backend
    if (!termsAccepted) {
      setError('Você deve aceitar os Termos de Uso antes de usar o Google Sign-In.');
      return;
    }

    if (response.credential) {
      try {
        const backendResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_token: response.credential,
            role: selectedRole,    // Perfil selecionado nos cards (aluno/professor)
            is_registration: true  // Indica que a intenção é CADASTRO (permite criação)
          }),
        });

        const data = await backendResponse.json();

        if (backendResponse.ok) {
          setSuccess('Cadastro realizado com sucesso!');
          login(data.access_token);
          setTimeout(() => {
            navigate(selectedRole === 'professor' ? '/professor/dashboard' : '/aluno/dashboard');
          }, 1500);
        } else {
          setError(data.message || 'Erro ao realizar cadastro.');
        }
      } catch (err) {
        setError('Erro de conexão com o servidor.');
      }
    }
  }, [navigate, login, selectedRole, termsAccepted]);

  // 2. Chame o hook passando o callback
  const { googleButtonRef, googleLoaded } = useGoogleSignIn(handleGoogleSignInCallback, 'signup_with');




  const { performAuthRequest } = useAuthOperations();
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }
    // Validação dos termos de uso
    if (!termsAccepted) {
      setError('Você deve aceitar os Termos de Uso para continuar.');
      return;
    }

    const registrationData = { name, email, password, role: selectedRole };

    const result = await performAuthRequest(
      `${import.meta.env.VITE_API_URL}/api/auth/register`,
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

  // Texto dos termos de uso (você pode colocar seu texto aqui)
  const termsTextContent = `
Termos e Condições de Uso do Portal Colaborativo de Gamificação Educacional

Última atualização: 19 de agosto de 2025

Bem-vindo(a) ao Portal Colaborativo de Gamificação Educacional. Por favor, leia atentamente os termos e condições de uso a seguir antes de criar sua conta e utilizar a plataforma.

Este documento estabelece as regras para a utilização do portal desenvolvido no âmbito do projeto de pesquisa de doutorado intitulado “Proposta e Validação de um Modelo de Design de Gamificação Educacional Contextualizado por meio de um Portal Colaborativo”, conduzido junto ao Programa de Pós-Graduação em Ciência da Computação (PCC) da Universidade Estadual de Maringá (UEM).

Ao clicar em "Aceito os Termos" e criar uma conta, você declara que leu, compreendeu e concorda integralmente com as condições aqui estabelecidas.

Cláusula 1ª - O Objeto

1.1. O presente portal é uma ferramenta de apoio a professores para o diagnóstico, planejamento, criação e compartilhamento de atividades de aprendizagem gamificadas.

1.2. Simultaneamente, o portal funciona como um ambiente para a coleta de dados para a pesquisa de doutorado supracitada, que visa propor e validar um modelo de design de gamificação educacional.

Cláusula 2ª - Cadastro e Uso da Conta

2.1. O acesso ao portal é destinado a dois perfis de usuários:

a) Professores: Educadores de ensino superior ou outros níveis, voluntários, que utilizarão o portal para criar e gerenciar atividades gamificadas.
b) Alunos: Estudantes que participarão das atividades criadas por seus respectivos professores.

2.2. O usuário se compromete a fornecer informações cadastrais verdadeiras e atualizadas, sendo o único responsável pela segurança de sua senha e pela confidencialidade de sua conta.
2.3. Usuários menores de 18 anos declaram possuir autorização de seus pais ou responsáveis legais para participar das atividades e concordar com estes termos.

Cláusula 3ª - Coleta, Uso e Proteção de Dados (LGPD)

Esta cláusula detalha como seus dados serão tratados, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

3.1. Consentimento Explícito: Ao aceitar estes termos, o usuário (professor ou aluno) fornece seu consentimento livre, informado e inequívoco para a coleta, armazenamento e tratamento de seus dados para os fins exclusivos de pesquisa científica.
3.2. Finalidade da Coleta: Os dados coletados serão utilizados estritamente para:

a) Analisar a experiência de uso e a percepção de professores e alunos sobre a plataforma e as atividades propostas.
b) Coletar dados para avaliar a eficácia de diferentes abordagens e elementos de gamificação no engajamento e na aprendizagem.
c) Gerar dados para a elaboração de uma tese de doutorado, artigos científicos e outras publicações acadêmicas resultantes do estudo.

3.3. Dados Coletados: A pesquisa coletará os seguintes tipos de dados:

a) Dados Cadastrais: Nome, e-mail, instituição de ensino e informações de perfil fornecidas pelo usuário.
b) Dados de Uso da Plataforma (Logs): Interações com a interface, frequência de acesso, progresso nas atividades, tempo gasto nas tarefas, criação e gestão de atividades (para professores) e interações (para alunos).
c) Dados de Pesquisa Qualitativa e Quantitativa: Respostas a questionários (com escalas e perguntas abertas).

3.4. Confidencialidade e Anonimização: O compromisso desta pesquisa é com o sigilo absoluto. 

A identidade da instituição e de todos os participantes será mantida em sigilo. Todos os dados serão anonimizados ou pseudo-anonimizados antes da análise e em todas as publicações científicas, garantindo que nenhum participante possa ser identificado.

3.5. Armazenamento e Segurança: Os dados serão armazenados em servidores seguros, com acesso restrito apenas aos pesquisadores responsáveis pelo projeto.
3.6. Direitos do Titular: A qualquer momento, o usuário poderá exercer seus direitos previstos na LGPD, como o acesso aos seus dados, a correção de informações, a anonimização e a revogação deste consentimento. A revogação do consentimento implicará na interrupção da coleta de novos dados, não afetando a legalidade do tratamento realizado previamente.

Cláusula 4ª - Propriedade Intelectual

4.1. O portal, seu código-fonte, design e estrutura são de propriedade dos pesquisadores e da Universidade Estadual de Maringá (UEM).
4.2. O conteúdo educacional (atividades, textos, materiais) criado e inserido na plataforma pelos professores é de propriedade intelectual de seus respectivos criadores. Ao inseri-lo, o professor concede aos pesquisadores uma licença não exclusiva, gratuita e mundial para usar, analisar e reproduzir tal conteúdo estritamente para os fins acadêmicos e não comerciais desta pesquisa.

Cláusula 5ª - Obrigações dos Usuários

5.1. O usuário concorda em não utilizar o portal para fins ilícitos, para transmitir conteúdo ilegal, difamatório, que viole a privacidade ou os direitos de propriedade intelectual de terceiros.

Cláusula 6ª - Rescisão

6.1. O usuário poderá, a qualquer momento, solicitar a exclusão de sua conta e de seus dados pessoais identificáveis, entrando em contato com os pesquisadores.
6.2. Os pesquisadores se reservam o direito de suspender ou encerrar a conta de qualquer usuário que viole os presentes termos.

Cláusula 7ª - Isenção de Responsabilidades

7.1. Este portal é um protótipo desenvolvido para fins de pesquisa. Ele é oferecido "no estado em que se encontra", sem garantias de funcionamento ininterrupto ou livre de erros.

Cláusula 8ª - Disposições Finais

8.1. Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de Maringá, Estado do Paraná, para dirimir quaisquer litígios.
8.2. Os pesquisadores podem alterar estes Termos a qualquer momento, e os usuários serão notificados sobre quaisquer mudanças significativas.

Cláusula 9ª - Contato

Para qualquer dúvida sobre estes Termos, sobre a pesquisa ou para exercer seus direitos como titular de dados, entre em contato:

Pesquisador Responsável: Me. Júlio Budiski Herculani - juliobudiskiherculani@gmail.com 
Professora Orientadora: Prof.ª Dr.ª Aline Maria Malachini Miotto Amaral - ammmamaral@uem.br`;


  // --- Renderização do Componente ---
  return (
    <>
      {isTermsModalOpen && (
        <TermsOfUseModal
          termsText={termsTextContent}
          onClose={() => setIsTermsModalOpen(false)}
          onAccept={() => {
            setTermsAccepted(true);
            setIsTermsModalOpen(false);
            setError('');
          }}
        />
      )}

      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br bg-primary-bg p-4">
        {/* --- CORREÇÃO: Borda ciente do tema --- */}
        <div className="w-full max-w-md bg-secondary-bg rounded-2xl shadow-2xl overflow-hidden border border-border-color">
          <div className="bg-gradient-to-r from-[#69e8cb] to-[#9570d9] p-6 text-center">
            <div className="bg-secondary-bg/20 backdrop-blur-sm rounded-full p-3 inline-block mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            {/* --- CORREÇÃO: Título com texto escuro fixo --- */}
            <h2 className="text-3xl font-extrabold text-gray-900">Crie Sua Conta</h2>
            <p className="text-gray-800/90 mt-2">Transforme sua experiência de aprendizado</p>
          </div>

          <div className="p-8">
            {/* --- CORREÇÃO: Mensagens de feedback cientes do tema --- */}
            {error && (
              <div className="bg-danger-bg border border-danger text-danger px-4 py-3 rounded-xl mb-6 flex items-start" role="alert">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <div><strong className="font-bold">Erro!</strong><span className="block"> {error}</span></div>
              </div>
            )}
            {success && (
              <div className="bg-success-bg border border-success text-success px-4 py-3 rounded-xl mb-6 flex items-start" role="alert">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <div><strong className="font-bold">Sucesso!</strong><span className="block"> {success}</span></div>
              </div>
            )}

            {/* ===== NOVA SEÇÃO SUPERIOR AGRUPADA ===== */}
            <div className="space-y-6 mb-6">
              {/* 1. Seleção de Perfil */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary-text mb-3">Eu sou um...</label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    // --- CORREÇÃO: Borda ciente do tema ---
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${selectedRole === 'aluno' ? 'border-accent-teal bg-accent-teal/10 shadow-lg' : 'border-border-color hover:border-accent-teal/50'}`}
                    onClick={() => setSelectedRole('aluno')}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${selectedRole === 'aluno' ? 'bg-accent-teal text-gray-900' : 'bg-primary-bg text-accent-teal'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>
                      </div>
                      <span className="font-medium text-secondary-text">Aluno</span>
                    </div>
                    {selectedRole === 'aluno' && (<div className="absolute top-2 right-2"><svg className="w-5 h-5 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>)}
                  </div>
                  <div
                    // --- CORREÇÃO: Borda ciente do tema ---
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${selectedRole === 'professor' ? 'border-accent-yellow bg-accent-yellow/10 shadow-lg' : 'border-border-color hover:border-accent-yellow/50'}`}
                    onClick={() => setSelectedRole('professor')}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${selectedRole === 'professor' ? 'bg-accent-yellow text-gray-900' : 'bg-primary-bg text-accent-yellow'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      </div>
                      <span className="font-medium text-secondary-text">Professor</span>
                    </div>
                    {selectedRole === 'professor' && (<div className="absolute top-2 right-2"><svg className="w-5 h-5 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>)}
                  </div>
                </div>
              </div>

              {/* 2. Termos de Uso */}
              {!termsAccepted ? (
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(true)}
                  // --- CORREÇÃO: Botão de termos ciente do tema ---
                  className="w-full text-center py-3 px-4 rounded-xl border-2 border-solid border-accent-teal/60 bg-accent-teal/10 text-accent-teal hover:border-accent-teal hover:bg-accent-teal/20 transition-all duration-300 flex items-center justify-center font-semibold"
                >
                  Clique para ler e aceitar os Termos de Uso
                </button>
              ) : (
                <div
                  // --- CORREÇÃO: Botão de termos aceitos ciente do tema ---
                  className="w-full text-center py-3 px-4 rounded-xl border-2 border-success bg-success-bg text-success flex items-center justify-center cursor-pointer"
                  onClick={() => setIsTermsModalOpen(true)} // Permite reler os termos
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Termos de Uso aceitos!
                </div>
              )}

              {/* 3. Botão do Google */}
              <div className="text-center">
                <p className="text-secondary-text text-sm mb-2">Ou cadastre-se rapidamente com o Google:</p>
                <div ref={googleButtonRef} className="w-full flex justify-center bg-secondary-bg rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300" />
                {!googleLoaded && (<button className="w-full py-3 px-4 bg-gray-200 rounded-xl animate-pulse"><div className="h-6 bg-gray-300 rounded w-3/4 mx-auto"></div></button>)}
              </div>
            </div>

            <div className="relative my-8">
              {/* --- CORREÇÃO: Borda ciente do tema --- */}
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-color"></div></div>
              <div className="relative flex justify-center"><span className="px-3 bg-secondary-bg text-secondary-text text-sm">Ou preencha seus dados</span></div>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-secondary-text">Nome Completo</label>
                {/* --- CORREÇÃO: Borda ciente do tema --- */}
                <div className="relative"><input type="text" id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow text-primary-text placeholder-gray-500 transition-all duration-200" placeholder="Seu nome completo" /><div className="absolute inset-y-0 right-0 flex items-center pr-3"><svg className="w-5 h-5 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div></div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-secondary-text">Email</label>
                {/* --- CORREÇÃO: Borda ciente do tema --- */}
                <div className="relative"><input type="email" id="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow text-primary-text placeholder-gray-500 transition-all duration-200" placeholder="seu@email.com" /><div className="absolute inset-y-0 right-0 flex items-center pr-3"><svg className="w-5 h-5 text-secondary-text" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg></div></div>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-secondary-text">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    // --- CORREÇÃO: Borda ciente do tema ---
                    className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow text-primary-text placeholder-gray-500"
                    placeholder="********"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-secondary-text focus:outline-none">
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-secondary-text">Confirme a Senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-password"
                    name="confirm-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    // --- CORREÇÃO: Borda ciente do tema ---
                    className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow text-primary-text placeholder-gray-500"
                    placeholder="********"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-secondary-text focus:outline-none">
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={!termsAccepted}
                // --- CORREÇÃO: Texto do botão escuro ---
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg text-lg font-bold text-gray-900 bg-gradient-to-r from-accent-yellow to-[#ffa000] hover:from-[#ffcc5c] hover:to-[#ffb140] transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-yellow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cadastrar
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-secondary-text">
                Já tem uma conta?{' '}
                {/* --- CORREÇÃO: Link ciente do tema --- */}
                <Link to="/login" className="font-medium text-accent-teal hover:text-accent-yellow transition-colors duration-200">Faça login aqui</Link>
              </p>
            </div>
          </div>

          <div className="bg-primary-bg p-4 text-center border-t border-border-color">
            <p className="text-xs text-secondary-text">© {new Date().getFullYear()} Portal de Gamificação Educacional. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;