import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Award, BarChart2, Heart, Shield, Star, ChevronDown, ChevronUp, UserCheck, Smile, Grid, Activity } from 'react-feather';
import { Link } from 'react-router-dom';

/**
 * AboutUsPage
 * 
 * Architectural intent: Provides a presentational view of the platform's vision, team, and public statistics.
 * By isolating this content into a dedicated page component, we maintain Separation of Concerns,
 * keeping marketing and informational content decoupled from the core gamification application logic.
 */

const LattesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M43.25 216.744h65.378V502H43.25zM76.213 43.25c27.56,0 49.333,21.773 49.333,48.553 0,27.56 -21.773,48.553 -49.333,48.553 -26.78,0 -48.553,-20.993 -48.553,-48.553 0,-26.78 21.773,-48.553 48.553,-48.553zM153.29 216.744h65.378v29.313h.818c9.692,-17.447 32.843,-35.813 65.378,-35.813 69.873,0 82.888,45.858 82.888,104.513v122.245h-65.378v-109c0,-26.78 -1.637,-52.74 -39.29,-52.74 -40.108,0 -45.858,30.95 -45.858,51.1v110.64h-65.378V216.744zM364.57 216.744h67.013v29.313h.818c9.692,-17.447 32.843,-35.813 65.378,-35.813 69.873,0 82.888,45.858 82.888,104.513v122.245h-65.378v-109c0,-26.78 -1.637,-52.74 -39.29,-52.74 -40.108,0 -45.858,30.95 -45.858,51.1v110.64h-65.378V216.744z" transform="scale(0.8) translate(40, -30)" />
  </svg>
);

const OrcidIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.363 4.312h2.91v10.59H7.363V4.312zM8.818 16.53c-1.05 0-1.902.85-1.902 1.9s.852 1.9 1.902 1.9 1.902-.85 1.902-1.9-.853-1.9-1.902-1.9zM16.637 6.41v1.562h-2.91v8.627h2.91V8.03h1.455V6.41h-4.365z" />
  </svg>
);

function AboutUsPage() {
  const [platformStats, setPlatformStats] = useState({
    users: 0,
    professors: 0,
    students: 0,
    activities: 0,
    classes: 0,
    total_visits: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/stats`);
        if (response.ok) {
          const data = await response.json();
          setPlatformStats(data);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas do portal:", error);
      }
    };
    fetchStats();
  }, []);

  const values = [
    { icon: <Star className="w-8 h-8" />, title: "Inovação", description: "As mais recentes pesquisas em gamificação criando experiências transformadoras." },
    { icon: <Users className="w-8 h-8" />, title: "Comunidade", description: "Fomentamos um ambiente onde professores e alunos aprendem juntos." },
    { icon: <Award className="w-8 h-8" />, title: "Reconhecimento", description: "Valorizamos o esforço e progresso através de conquistas e status." },
    { icon: <BarChart2 className="w-8 h-8" />, title: "Transparência", description: "Acompanhamento de desenvolvimento acadêmico de forma clara e visual." }
  ];

  const teamMembers = [
    {
      name: "Júlio Budiski Herculani",
      role: "Pesquisador & Idealizador",
      photo: "/team/julio.jpeg",
      bio: "Licenciado em Computação pela UEMS, Mestre e Doutorando em Ciência da Computação pela UEM. Foco de pesquisa na aplicação da Gamificação na educação em Engenharia de Software para tornar o aprendizado mais efetivo.",
      lattes: "http://lattes.cnpq.br/5242549943501681",
      orcid: "https://orcid.org/0000-0003-1947-0101"
    },
    {
      name: "Aline M. M. M. Amaral",
      role: "Orientadora",
      photo: "/team/aline.jpeg",
      bio: "Mestrado pela USP e doutorado em Informática pela PUCPR. É professora Adjunta na UEM, com experiência em Engenharia de Software e identificação de autoria em manuscritos.",
      lattes: "http://lattes.cnpq.br/6738366464597912",
      orcid: "https://orcid.org/0000-0001-8884-3966"
    },
    {
      name: "Jorge Marques Prates",
      role: "Coorientador",
      photo: "/team/jorge.jpeg",
      bio: "Mestrado pela UNESP e doutorado pela USP. É professor adjunto na UEMS. Interesses em Engenharia de Software Aplicada, Computação Aplicada à Educação e Visualização de Informação.",
      lattes: "http://lattes.cnpq.br/8890226324601605",
      orcid: "https://orcid.org/0000-0002-6798-7263"
    },
    {
      name: "Armando Maciel Toda",
      role: "Pesquisador Colaborador",
      photo: "/team/armando.jpeg",
      bio: "Doutorado pela USP. Atua como pesquisador assistente na Universidade de Durham (Reino Unido) e no NEES-UFAL. Especialista em jogos digitais e interação humano-computador.",
      lattes: "http://lattes.cnpq.br/5262287389812766",
      orcid: "https://orcid.org/0000-0003-2681-8698"
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in relative">
      
      {/* Background Decorativo */}
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-accent-teal/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute top-[40%] left-0 w-[400px] h-[400px] bg-accent-purple/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      
      {/* Hero Section */}
      <div className="text-center py-20 px-4">
        <h1 className="text-5xl md:text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow to-accent-teal">
          Revolucionando a Educação
        </h1>
        <p className="text-xl md:text-2xl text-secondary-text max-w-3xl mx-auto font-light">
          Acreditamos que o engajamento é a chave para o aprendizado. Combinamos a mais alta 
          tecnologia de gamificação com didática educacional.
        </p>
      </div>

      {/* Missão e Visão (Glassmorphism) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24 px-4">
        <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl p-10 rounded-3xl border border-white/20 dark:border-slate-800/50 shadow-2xl transition-transform hover:-translate-y-2">
          <BookOpen className="w-12 h-12 text-accent-yellow mb-6" />
          <h2 className="text-3xl font-bold mb-4 text-primary-text">Nossa Missão</h2>
          <p className="text-lg text-secondary-text leading-relaxed">
            Transformar a experiência educacional em uma jornada interativa e incrivelmente 
            divertida através da gamificação, criando um ecossistema educacional vibrante 
            que conecta professores e alunos em um propósito único.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {values.map((value, idx) => (
             <div key={idx} className="bg-secondary-bg/80 p-6 rounded-3xl border border-border-color shadow-sm flex flex-col justify-center items-center text-center transition-all hover:border-accent-teal hover:shadow-lg">
               <div className="text-accent-teal mb-3">{value.icon}</div>
               <h3 className="font-bold text-lg mb-2 text-primary-text">{value.title}</h3>
               <p className="text-sm text-secondary-text">{value.description}</p>
             </div>
          ))}
        </div>
      </div>

      {/* Estatísticas com Contador de Visitas */}
      <div className="mb-24 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-text mb-4">O Nosso Impacto</h2>
          <p className="text-secondary-text text-lg">Números reais de uma plataforma em constante crescimento.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <StatCard icon={<Activity className="text-blue-500" />} value={platformStats.total_visits} label="Acessos Totais" border="border-blue-500" bg="bg-blue-500/10" span="col-span-2 md:col-span-3 lg:col-span-2" />
          <StatCard icon={<Users className="text-accent-purple" />} value={platformStats.users} label="Usuários" border="border-accent-purple" bg="bg-accent-purple/10" span="col-span-1 lg:col-span-1" />
          <StatCard icon={<UserCheck className="text-[#ff6b6b]" />} value={platformStats.professors} label="Professores" border="border-[#ff6b6b]" bg="bg-[#ff6b6b]/10" span="col-span-1 lg:col-span-1" />
          <StatCard icon={<Smile className="text-accent-teal" />} value={platformStats.students} label="Alunos" border="border-accent-teal" bg="bg-accent-teal/10" span="col-span-1 lg:col-span-1" />
          <StatCard icon={<BookOpen className="text-accent-yellow" />} value={platformStats.activities} label="Atividades" border="border-accent-yellow" bg="bg-accent-yellow/10" span="col-span-1 lg:col-span-1" />
        </div>
      </div>

      {/* Equipe - Design Premium */}
      <div className="mb-24 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-primary-text">
          Pesquisadores por Trás do Portal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="group relative bg-secondary-bg rounded-3xl p-6 text-center border border-border-color hover:border-accent-yellow transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 rounded-3xl pointer-events-none"></div>
              
              <div className="relative mx-auto w-32 h-32 mb-6">
                 <div className="absolute inset-0 bg-accent-yellow rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                 <img
                  src={member.photo}
                  alt={member.name}
                  className="relative w-full h-full rounded-full object-cover border-4 border-secondary-bg shadow-lg group-hover:border-accent-yellow transition-colors duration-300"
                />
              </div>
              
              <h3 className="text-xl font-bold mb-1 text-primary-text line-clamp-1" title={member.name}>{member.name}</h3>
              <p className="text-sm font-semibold text-accent-yellow mb-4 uppercase tracking-wider">{member.role}</p>
              
              <p className="text-sm text-secondary-text mb-6 line-clamp-4 group-hover:line-clamp-none transition-all duration-300 text-left min-h-[80px]">
                {member.bio}
              </p>
              
              <div className="flex justify-center space-x-4 pt-4 border-t border-border-color">
                <a href={member.lattes} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors" title="Lattes">
                  <LattesIcon />
                </a>
                <a href={member.orcid} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors" title="ORCID">
                  <OrcidIcon />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Final */}
      <div className="mx-4 mb-16">
        <div className="bg-gradient-to-r from-accent-purple/20 via-primary-bg to-accent-teal/20 p-10 md:p-16 rounded-[40px] text-center border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-10 mix-blend-overlay"></div>
          
          <Heart className="w-16 h-16 mx-auto text-red-500 mb-6 animate-pulse" />
          <h2 className="text-3xl md:text-5xl font-black mb-6 text-primary-text">Pronto para engajar seus alunos?</h2>
          <p className="text-lg md:text-xl text-secondary-text max-w-2xl mx-auto mb-10">
            Junte-se à revolução gamificada e veja a transformação na sua sala de aula acontecer.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link to="/cadastro"
              className="bg-accent-yellow hover:bg-yellow-500 text-black font-extrabold py-4 px-10 rounded-full shadow-[0_0_20px_rgba(255,189,48,0.4)] transition-all hover:scale-105 uppercase tracking-wide">
              Criar Conta Grátis
            </Link>
            <Link to="/contact"
              className="bg-transparent hover:bg-white/5 text-primary-text font-bold py-4 px-10 rounded-full border-2 border-accent-teal/50 transition-all hover:border-accent-teal">
              Fale Conosco
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

// Subcomponente de Estatística
const StatCard = ({ icon, value, label, border, bg, span }) => (
  <div className={`bg-secondary-bg p-6 rounded-3xl border ${border} shadow-lg flex flex-col justify-center items-center text-center transition-all hover:-translate-y-1 hover:shadow-xl ${span}`}>
    <div className={`p-4 rounded-2xl mb-4 ${bg}`}>
      {icon}
    </div>
    <div className="text-4xl font-black text-primary-text mb-1">{value}</div>
    <div className="text-sm font-semibold text-secondary-text uppercase tracking-wider">{label}</div>
  </div>
);

export default AboutUsPage;
