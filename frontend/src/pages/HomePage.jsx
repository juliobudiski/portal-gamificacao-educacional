// frontend/src/pages/Homepage.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Target, Users, Zap, Award, ArrowRight, Sparkles } from 'lucide-react';

export default function Homepage() {
  const { user } = useContext(AuthContext);

  const getDashboardPath = () => {
    if (user?.role === 'professor') return '/professor/dashboard';
    if (user?.role === 'admin') return '/admin/dashboard';
    return '/aluno/dashboard';
  };

  const benefits = [
    {
      title: 'Engajamento Profundo',
      description: 'Elementos de jogos motivam alunos organicamente, elevando drasticamente a participação nas aulas.',
      icon: Target,
      color: 'text-accent-yellow',
      bg: 'bg-accent-yellow/10'
    },
    {
      title: 'Colaboração Ativa',
      description: 'Ambientes gamificados incentivam o trabalho em equipe e uma competição saudável entre os alunos.',
      icon: Users,
      color: 'text-accent-teal',
      bg: 'bg-accent-teal/10'
    },
    {
      title: 'Feedback Imediato',
      description: 'Sistemas de pontos e conquistas fornecem respostas contínuas sobre o progresso e as vitórias.',
      icon: Zap,
      color: 'text-accent-purple',
      bg: 'bg-accent-purple/10'
    },
    {
      title: 'Retenção Acelerada',
      description: 'A curva de aprendizado através de jogos resulta em maior fixação a longo prazo dos conteúdos.',
      icon: Award,
      color: 'text-[#ffcc5c]',
      bg: 'bg-[#ffcc5c]/10'
    }
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-primary-bg text-primary-text relative overflow-hidden font-sans selection:bg-accent-purple/30">
      
      {/* Background Decorativo Glassmorphism */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent-purple/15 rounded-full blur-[150px] pointer-events-none mix-blend-screen animate-pulse duration-1000"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent-teal/15 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>

      {/* Main Container */}
      <div className="z-10 w-full max-w-7xl px-6 md:px-12 py-16 md:py-24 space-y-24">
        
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center mt-10 md:mt-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-bg/50 border border-border-color/50 mb-8 backdrop-blur-md shadow-lg">
            <Sparkles className="w-4 h-4 text-accent-yellow" />
            <span className="text-sm font-semibold uppercase tracking-widest text-secondary-text">O Futuro do Aprendizado</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tighter">
            Educação Movida a<br />
            <span className="bg-gradient-to-r from-accent-yellow via-accent-teal to-accent-purple text-transparent bg-clip-text drop-shadow-sm">
              Experiências Épicas
            </span>
          </h1>

          <p className="text-lg md:text-2xl max-w-3xl text-secondary-text font-light leading-relaxed mb-12">
            Crie, compartilhe e participe de jornadas gamificadas. Transformamos a sala de aula em uma aventura inesquecível para professores e alunos.
          </p>

          {/* Botões CTA */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 w-full max-w-md mx-auto sm:max-w-none">
            {user ? (
              <Link
                to={getDashboardPath()}
                className="group relative px-10 py-5 bg-gradient-to-r from-accent-teal to-green-600 rounded-2xl shadow-[0_0_30px_rgba(105,232,203,0.3)] hover:shadow-[0_0_40px_rgba(105,232,203,0.5)] hover:-translate-y-1 transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-3 text-lg font-bold text-white uppercase tracking-wider">
                  Ir para o Dashboard
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                </span>
              </Link>
            ) : (
              <>
                <Link
                  to="/cadastro"
                  className="relative group px-10 py-5 bg-gradient-to-r from-accent-yellow to-[#ffa000] rounded-2xl shadow-[0_0_30px_rgba(255,189,48,0.3)] hover:shadow-[0_0_40px_rgba(255,189,48,0.5)] hover:-translate-y-1 transition-all duration-300"
                >
                  <span className="flex items-center justify-center text-lg font-black text-[#2c3135] uppercase tracking-wider">
                    Comece Agora
                  </span>
                </Link>
                <Link
                  to="/login"
                  className="relative px-10 py-5 bg-secondary-bg/40 backdrop-blur-md rounded-2xl border border-border-color/50 hover:bg-secondary-bg hover:border-accent-teal/50 hover:-translate-y-1 transition-all duration-300 shadow-lg"
                >
                  <span className="flex items-center justify-center text-lg font-bold text-primary-text uppercase tracking-wider">
                    Fazer Login
                  </span>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features / Benefícios */}
        <section className="relative z-10 pt-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary-text mb-4">
              Por que Gamificar a Educação?
            </h2>
            <p className="text-secondary-text text-lg">Elementos cientificamente comprovados que transformam o estudo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <div 
                key={idx}
                className="group p-8 rounded-3xl bg-secondary-bg/60 backdrop-blur-xl border border-border-color/40 hover:-translate-y-2 hover:shadow-2xl hover:border-accent-yellow/40 transition-all duration-500 flex flex-col"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${benefit.bg} mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <benefit.icon className={`w-8 h-8 ${benefit.color}`} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-primary-text mb-3 tracking-tight">
                  {benefit.title}
                </h3>
                <p className="text-secondary-text leading-relaxed font-medium">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              to="/sobre-nos"
              className="group inline-flex items-center gap-2 text-lg font-bold text-accent-teal hover:text-accent-yellow transition-colors"
            >
              Conheça mais sobre a metodologia
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </div>

      <footer className="w-full mt-auto py-8 border-t border-border-color/20 text-center text-secondary-text">
        <p className="font-medium tracking-wide">Transformando a educação através da gamificação • © 2026</p>
      </footer>
    </div>
  );
}