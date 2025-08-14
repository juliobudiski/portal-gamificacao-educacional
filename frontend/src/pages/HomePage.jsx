// frontend/src/pages/Homepage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Homepage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#2c3135] text-white p-6 relative overflow-hidden">
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
          
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90 text-gray-300 leading-relaxed">
            Transforme a educação em uma jornada envolvente e interativa. Crie, compartilhe e participe de atividades gamificadas que <span className="text-[#ffbd30]">inspiram o aprendizado</span> e o <span className="text-[#69e8cb]">engajamento</span>.
          </p>
        </div>

        {/* Botões de ação com feedback visual */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
          <Link
            to="/login"
            className="relative group bg-gradient-to-br from-[#2c3135] to-[#1e2226] px-8 py-4 rounded-xl shadow-2xl border border-[#69e8cb]/30 hover:border-[#69e8cb] transition-all duration-300"
          >
            <span className="text-lg font-bold text-[#69e8cb] group-hover:text-white transition-colors">
              Entrar
            </span>
            <div className="absolute inset-0 bg-[#69e8cb]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
          
          <Link
            to="/cadastro"
            className="relative group bg-gradient-to-br from-[#ffbd30] to-[#ffa000] px-8 py-4 rounded-xl shadow-2xl hover:shadow-[0_0_25px_rgba(255,189,48,0.4)] transition-all duration-300"
          >
            <span className="text-lg font-bold text-[#2c3135]">
              Cadastre-se
            </span>
            <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
          </Link>
        </div>

        {/* Seção de benefícios interativa */}
        <div className="bg-[#343a40] p-8 rounded-2xl shadow-2xl border-t-4 border-[#ffbd30] transform transition-transform duration-500 hover:scale-[1.02]">
          <h3 className="text-3xl font-bold mb-8 text-center text-[#ffbd30]">
            Por que Gamificar a Educação?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4 p-4 bg-[#2c3135]/50 rounded-xl hover:bg-[#2c3135] transition-colors">
              <div className="bg-[#ffbd30]/10 p-3 rounded-full">
                <svg className="w-6 h-6 text-[#ffbd30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-white">Motivação</h4>
                <p className="text-gray-300">Elementos de jogos motivam alunos, aumentando a participação e o interesse.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-[#2c3135]/50 rounded-xl hover:bg-[#2c3135] transition-colors">
              <div className="bg-[#69e8cb]/10 p-3 rounded-full">
                <svg className="w-6 h-6 text-[#69e8cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-white">Colaboração</h4>
                <p className="text-gray-300">Ambientes gamificados incentivam trabalho em equipe e competição saudável.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-[#2c3135]/50 rounded-xl hover:bg-[#2c3135] transition-colors">
              <div className="bg-[#9570d9]/10 p-3 rounded-full">
                <svg className="w-6 h-6 text-[#9570d9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-white">Feedback Imediato</h4>
                <p className="text-gray-300">Sistemas de pontos e conquistas fornecem feedback contínuo sobre o progresso.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-[#2c3135]/50 rounded-xl hover:bg-[#2c3135] transition-colors">
              <div className="bg-gradient-to-br from-[#ffbd30]/10 to-[#9570d9]/10 p-3 rounded-full">
                <svg className="w-6 h-6 text-gradient-to-r from-[#ffbd30] to-[#9570d9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-white">Retenção</h4>
                <p className="text-gray-300">Conceitos aprendidos através de jogos têm maior taxa de retenção a longo prazo.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <Link 
              to="/sobre-nos" 
              className="inline-flex items-center text-[#69e8cb] hover:text-[#ffbd30] transition-colors font-semibold"
            >
              Saiba mais sobre gamificação
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Rodapé */}
      <div className="mt-16 text-center text-gray-400 text-sm">
        <p>Transformando a educação através da gamificação • Para professores e alunos</p>
      </div>
    </div>
  );
}

export default Homepage;