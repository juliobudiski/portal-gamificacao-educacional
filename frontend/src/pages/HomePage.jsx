// frontend/src/pages/Homepage.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Homepage() {
  const { user } = useContext(AuthContext);
  // Função auxiliar para decidir para onde o botão "Dashboard" leva
  const getDashboardPath = () => {
    if (user?.role === 'professor') return '/professor/dashboard';
    if (user?.role === 'admin') return '/admin/dashboard';
    return '/aluno/dashboard';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary-bg text-primary-text p-6 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[#ffbd30]/10 blur-3xl"></div>
      <div className="absolute bottom-10 left-0 w-80 h-80 rounded-full bg-[#69e8cb]/10 blur-3xl"></div>

      {/* Conteúdo principal */}
      <div className="z-10 max-w-4xl w-full space-y-12">
        {/* Cabeçalho */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-[#ffbd30] via-[#69e8cb] to-[#9570d9] text-transparent bg-clip-text">
              Portal de Gamificação Educacional
            </span>
          </h1>

          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-secondary-text dark:text-secondary-text leading-relaxed">
            Transforme a educação em uma jornada envolvente e interativa. Crie, compartilhe e participe de atividades gamificadas que <span className="text-[#ffbd30]">inspiram o aprendizado</span> e o <span className="text-[#69e8cb]">engajamento</span>.
          </p>
        </div>

        {/* Botões de ação com Lógica de Autenticação */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
          {user ? (
            /* --- VISÃO PARA USUÁRIO LOGADO --- */
            <Link
              to={getDashboardPath()}
              className="relative bg-gradient-to-r from-accent-teal to-green-600 px-10 py-5 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
            >
              <span className="text-xl font-bold text-white flex items-center gap-3">
                Ir para o Dashboard
                <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          ) : (
            /* --- VISÃO PARA VISITANTE (Código Original) --- */
            <>
              <Link
                to="/login"
                className="relative group bg-secondary-bg px-8 py-4 rounded-xl shadow-lg border border-accent-teal transition-all duration-300 hover:border-accent-teal/60"
              >
                <span className="text-lg font-bold text-accent-teal transition-colors">
                  Entrar
                </span>
                <div className="absolute inset-0 bg-accent-teal/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>

              <Link
                to="/cadastro"
                className="relative bg-accent-yellow px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-accent-yellow/90 transition-all duration-300"
              >
                <span className="text-lg font-bold text-white dark:text-gray-900 transition-colors">
                  Cadastre-se
                </span>
              </Link>
            </>
          )}
        </div>

        {/* Seção de benefícios interativa */}
        <div className="bg-secondary-bg p-8 rounded-2xl shadow-2xl border-t-4 border-accent-yellow transform transition-transform duration-500 hover:scale-[1.02]">
          <h3 className="text-3xl font-bold mb-8 text-center text-accent-yellow">
            Por que Gamificar a Educação?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4 p-4 bg-secondary-bg/50 rounded-xl hover:bg-secondary-bg transition-colors">
              <div className="bg-accent-yellow/10 p-3 rounded-full">
                <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-primary-text">Motivação</h4>
                <p className="text-secondary-text dark:text-secondary-text">Elementos de jogos motivam alunos, aumentando a participação e o interesse.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-secondary-bg/50 rounded-xl hover:bg-secondary-bg transition-colors">
              <div className="bg-accent-teal/10 p-3 rounded-full">
                <svg className="w-6 h-6 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-primary-text">Colaboração</h4>
                <p className="text-secondary-text dark:text-secondary-text">Ambientes gamificados incentivam trabalho em equipe e competição saudável.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-secondary-bg/50 rounded-xl hover:bg-secondary-bg transition-colors">
              <div className="bg-accent-purple/10 p-3 rounded-full">
                <svg className="w-6 h-6 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-primary-text">Feedback Imediato</h4>
                <p className="text-secondary-text dark:text-secondary-text">Sistemas de pontos e conquistas fornecem feedback contínuo sobre o progresso.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-secondary-bg/50 rounded-xl hover:bg-secondary-bg transition-colors">
              <div className="bg-gradient-to-br from-accent-yellow/10 to-accent-purple/10 p-3 rounded-full">
                <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-primary-text">Retenção</h4>
                <p className="text-secondary-text dark:text-secondary-text">Conceitos aprendidos através de jogos têm maior taxa de retenção a longo prazo.</p>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/sobre-nos"
              className="inline-flex items-center text-accent-teal hover:text-accent-yellow transition-colors font-semibold"
            >
              Saiba mais sobre gamificação
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-secondary-text dark:text-secondary-text text-sm">
        <p>Transformando a educação através da gamificação • Para professores e alunos</p>
      </div>
    </div>
  );
}

export default Homepage;
