// frontend/src/pages/RegisterPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importa o hook useAuth para interagir com o contexto de autenticação
import useGoogleSignIn from '../hooks/useGoogleSignIn';
import { useAuthOperations } from '../hooks/useAuthOperations';
import TermsOfUseModal from '../components/TermsOfUseModal';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

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
  const [accessCode, setAccessCode] = useState(''); // Estado para o Código Institucional (Professor)

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
        const backendResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
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

    // --- Validação de Domínio de E-mail ---
    const allowedDomains = [
      'gmail.com', 'hotmail.com', 'outlook.com', 'outlook.com.br',
      'yahoo.com', 'yahoo.com.br', 'icloud.com', 'live.com', 'uem.br'
    ];

    const emailDomain = email.split('@')[1]?.toLowerCase();

    if (!allowedDomains.includes(emailDomain)) {
      setError(`Provedor de e-mail inválido. Utilize um domínio conhecido (ex: gmail.com, outlook.com, uem.br).`);
      return;
    }
    // --------------------------------------

    if (password !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }

    // Validação dos termos de uso
    if (!termsAccepted) {
      setError('Você deve aceitar os Termos de Uso para continuar.');
      return;
    }

    if (selectedRole === 'professor' && !accessCode.trim()) {
      setError('O Código de Acesso Institucional é obrigatório para cadastro de professores.');
      return;
    }

    const registrationData = { name, email, password, role: selectedRole, accessCode };

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

      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-primary-bg p-4 py-12 transition-colors duration-300">
        
        {/* Background Animado (Blobs) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent-yellow/20 blur-[100px] animate-blob"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent-teal/20 blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute top-[40%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-accent-purple/10 blur-[80px] animate-blob animation-delay-4000"></div>
        </div>

        <div className="w-full max-w-xl relative z-10">
          <div className="bg-secondary-bg/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-border-color/50 transform transition-all hover:border-accent-yellow/30">
            
            {/* Cabeçalho */}
            <div className="p-8 text-center border-b border-border-color/30">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent-teal to-accent-purple mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-primary-text tracking-tight mb-2">
                Crie Sua Conta
              </h2>
              <p className="text-secondary-text text-sm">
                Junte-se a nós e transforme a experiência de aprendizado
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
                    <strong className="font-bold block mb-0.5">Erro no Cadastro</strong>
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

              {/* SELEÇÃO DE PERFIL */}
              <div className="space-y-6 mb-8">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-secondary-text">Eu sou um...</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden ${selectedRole === 'aluno' ? 'border-accent-teal bg-accent-teal/10 shadow-[0_0_15px_rgba(105,232,203,0.15)]' : 'border-border-color bg-primary-bg/30 hover:border-accent-teal/50'}`}
                      onClick={() => setSelectedRole('aluno')}
                    >
                      {selectedRole === 'aluno' && <div className="absolute top-0 right-0 w-16 h-16 bg-accent-teal/20 rounded-bl-full -mr-2 -mt-2 blur-md"></div>}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${selectedRole === 'aluno' ? 'bg-accent-teal text-primary-bg' : 'bg-secondary-bg text-accent-teal group-hover:bg-accent-teal/20'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>
                        </div>
                        <span className={`font-bold text-lg ${selectedRole === 'aluno' ? 'text-accent-teal' : 'text-primary-text'}`}>Aluno</span>
                      </div>
                      {selectedRole === 'aluno' && (<div className="absolute top-3 right-3"><svg className="w-5 h-5 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>)}
                    </div>

                    <div
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden ${selectedRole === 'professor' ? 'border-accent-yellow bg-accent-yellow/10 shadow-[0_0_15px_rgba(255,189,48,0.15)]' : 'border-border-color bg-primary-bg/30 hover:border-accent-yellow/50'}`}
                      onClick={() => setSelectedRole('professor')}
                    >
                      {selectedRole === 'professor' && <div className="absolute top-0 right-0 w-16 h-16 bg-accent-yellow/20 rounded-bl-full -mr-2 -mt-2 blur-md"></div>}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${selectedRole === 'professor' ? 'bg-accent-yellow text-primary-bg' : 'bg-secondary-bg text-accent-yellow group-hover:bg-accent-yellow/20'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </div>
                        <span className={`font-bold text-lg ${selectedRole === 'professor' ? 'text-accent-yellow' : 'text-primary-text'}`}>Professor</span>
                      </div>
                      {selectedRole === 'professor' && (<div className="absolute top-3 right-3"><svg className="w-5 h-5 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>)}
                    </div>
                  </div>
                </div>

                {/* Termos de Uso */}
                {!termsAccepted ? (
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="w-full text-center py-3.5 px-4 rounded-xl border-2 border-dashed border-accent-purple/50 bg-accent-purple/5 text-accent-purple hover:border-accent-purple hover:bg-accent-purple/10 transition-all duration-300 flex items-center justify-center font-semibold group"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Ler e aceitar os Termos de Uso
                  </button>
                ) : (
                  <div
                    className="w-full text-center py-3.5 px-4 rounded-xl border-2 border-success bg-success-bg/30 text-success flex items-center justify-center cursor-pointer hover:bg-success-bg/50 transition-colors"
                    onClick={() => setIsTermsModalOpen(true)}
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span className="font-bold">Termos de Uso aceitos!</span>
                  </div>
                )}
              </div>

              {/* Formulário Principal */}
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1.5 group">
                    <label htmlFor="name" className="block text-sm font-semibold text-secondary-text group-focus-within:text-accent-teal transition-colors">Nome Completo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500 group-focus-within:text-accent-teal transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <input type="text" id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-primary-bg/50 border border-border-color rounded-xl focus:outline-none focus:border-accent-teal focus:ring-1 focus:ring-accent-teal text-primary-text placeholder-gray-500 transition-all duration-300 shadow-sm" placeholder="Seu nome completo" />
                    </div>
                  </div>

                  <div className="space-y-1.5 group">
                    <label htmlFor="email" className="block text-sm font-semibold text-secondary-text group-focus-within:text-accent-teal transition-colors">Email Institucional/Pessoal</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500 group-focus-within:text-accent-teal transition-colors" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                      </div>
                      <input type="email" id="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-primary-bg/50 border border-border-color rounded-xl focus:outline-none focus:border-accent-teal focus:ring-1 focus:ring-accent-teal text-primary-text placeholder-gray-500 transition-all duration-300 shadow-sm" placeholder="seu@email.com" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 group">
                    <label htmlFor="password" className="block text-sm font-semibold text-secondary-text group-focus-within:text-accent-teal transition-colors">Senha</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500 group-focus-within:text-accent-teal transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3.5 bg-primary-bg/50 border border-border-color rounded-xl focus:outline-none focus:border-accent-teal focus:ring-1 focus:ring-accent-teal text-primary-text placeholder-gray-500 transition-all duration-300 shadow-sm"
                        placeholder="********"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-accent-teal transition-colors focus:outline-none p-2 rounded-lg hover:bg-secondary-bg">
                          {showPassword ? <FaEyeSlash className="w-4 h-4"/> : <FaEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 group">
                    <label htmlFor="confirm-password" className="block text-sm font-semibold text-secondary-text group-focus-within:text-accent-teal transition-colors">Confirmar</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500 group-focus-within:text-accent-teal transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirm-password"
                        name="confirm-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3.5 bg-primary-bg/50 border border-border-color rounded-xl focus:outline-none focus:border-accent-teal focus:ring-1 focus:ring-accent-teal text-primary-text placeholder-gray-500 transition-all duration-300 shadow-sm"
                        placeholder="********"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-500 hover:text-accent-teal transition-colors focus:outline-none p-2 rounded-lg hover:bg-secondary-bg">
                          {showConfirmPassword ? <FaEyeSlash className="w-4 h-4"/> : <FaEye className="w-4 h-4"/>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Código Institucional - Apenas Professor */}
                {selectedRole === 'professor' && (
                  <div className="space-y-2 pt-2 animate-fade-in">
                    <div className="bg-accent-yellow/5 border border-accent-yellow/30 p-4 rounded-xl">
                      <label htmlFor="accessCode" className="block text-sm font-bold text-accent-yellow mb-1">
                        Código Institucional (Obrigatório)
                      </label>
                      <p className="text-xs text-secondary-text mb-3">
                        Para criar uma conta de educador, é necessário o código fornecido pela coordenação.
                      </p>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <svg className="w-5 h-5 text-accent-yellow" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="accessCode"
                          name="accessCode"
                          required
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-secondary-bg border-2 border-accent-yellow/40 rounded-lg focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow text-primary-text placeholder-gray-500 font-mono tracking-wider transition-all shadow-inner"
                          placeholder="EX: GAMIFICA2026"
                        />
                      </div>
                      <div className="mt-3 text-right">
                        <Link
                          to={`/contact?subject=${encodeURIComponent("Solicitação de Código Institucional - Professor")}`}
                          className="text-xs font-semibold text-accent-yellow hover:text-[#ffcc5c] hover:underline transition-colors"
                        >
                          Solicitar um código
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!termsAccepted}
                    className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg text-lg font-bold text-primary-bg bg-gradient-to-r from-accent-teal to-accent-purple hover:brightness-110 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-teal disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <span>Finalizar Cadastro</span>
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-border-color/30 text-center">
                <p className="text-sm text-secondary-text">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="font-bold text-accent-yellow hover:text-accent-teal transition-colors duration-200">Faça login aqui</Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-secondary-text/70">© {new Date().getFullYear()} Portal de Gamificação Educacional.</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;