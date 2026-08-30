// frontend/src/pages/AboutUsPage.jsx
import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Award, BarChart2, Heart, Shield, Star, ChevronDown, ChevronUp, UserCheck, Smile, Grid } from 'react-feather';
import { Link } from 'react-router-dom';

// NOVO: Ícones para Lattes e Orcid (adicionados como componentes SVG)
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

/**
 * Componente AboutUsPage
 * 
 * Renderiza a página "Sobre o Portal", que apresenta a missão, a equipe de pesquisadores
 * e as estatísticas globais da plataforma (impacto em números). 
 * Utiliza fetch para buscar dados reais de estatísticas de uso na rota pública da API.
 */
function AboutUsPage() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  // NOVO: Estado para as estatísticas da plataforma
  const [platformStats, setPlatformStats] = useState({
    users: 0,
    professors: 0,
    students: 0,
    activities: 0,
    classes: 0
  });

  // NOVO: Fetch dos dados quando a página carrega
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
    { icon: <Star className="w-8 h-8" />, title: "Inovação Educacional", description: "Utilizamos as mais recentes pesquisas em gamificação para criar experiências de aprendizado transformadoras." },
    { icon: <Users className="w-8 h-8" />, title: "Comunidade", description: "Fomentamos uma comunidade colaborativa onde professores e alunos aprendem juntos." },
    { icon: <Award className="w-8 h-8" />, title: "Reconhecimento", description: "Valorizamos o esforço e progresso de cada estudante com sistemas de conquistas significativas." },
    { icon: <BarChart2 className="w-8 h-8" />, title: "Progresso Mensurável", description: "Fornecemos ferramentas para acompanhar o desenvolvimento acadêmico de forma clara e objetiva." }
  ];

  const teamMembers = [
    {
      name: "Júlio Budiski Herculani",
      role: "Pesquisador & Idealizador",
      photo: "/team/julio.jpeg",
      bio: "Licenciado em Computação pela UEMS, Mestre em Ciência da Computação pela UEM e atualmente doutorando no mesmo programa. Com trajetória em computação embarcada, robótica, MOOCs, e Gamificação, seu foco de pesquisa é a aplicação da Gamificação na educação em Engenharia de Software para tornar o aprendizado mais atrativo e efetivo.",
      lattes: "http://lattes.cnpq.br/5242549943501681",
      orcid: "https://orcid.org/0000-0003-1947-0101"
    },
    {
      name: "Aline M. M. M. Amaral",
      role: "Orientadora",
      photo: "/team/aline.jpeg",
      bio: "Graduada em Ciência da Computação pela UEM, com mestrado pela USP e doutorado em Informática pela PUCPR. É professora Adjunta na UEM, com experiência em Engenharia de Software e Computação Forense, atuando principalmente em desenvolvimento de sistemas, engenharia de software e identificação de autoria em manuscritos.",
      lattes: "http://lattes.cnpq.br/6738366464597912",
      orcid: "https://orcid.org/0000-0001-8884-3966"
    },
    {
      name: "Jorge Marques Prates",
      role: "Coorientador",
      photo: "/team/jorge.jpeg",
      bio: "Graduado em Física e Ciência da Computação pela UNESP, com mestrado pela UNESP e doutorado pela USP. Atualmente é professor adjunto na UEMS. Seus interesses de pesquisa incluem Engenharia de Software Aplicada, Computação Aplicada à Educação (Pensamento Computacional, MOOCs) e Visualização de Informação.",
      lattes: "http://lattes.cnpq.br/8890226324601605",
      orcid: "https://orcid.org/0000-0002-6798-7263"
    },
    {
      name: "Armando Maciel Toda",
      role: "Pesquisador Colaborador",
      photo: "/team/armando.jpeg",
      bio: "Graduado em Ciências da Computação, com mestrado pela UEL e doutorado pela USP, incluindo um período na Universidade de Durham, Reino Unido. Atua como pesquisador assistente na Universidade de Durham e no NEES-UFAL. Sua experiência abrange jogos digitais, informática na educação, gamificação e interação humano-computador.",
      lattes: "http://lattes.cnpq.br/5262287389812766",
      orcid: "https://orcid.org/0000-0003-2681-8698"
    }
  ];

  const toggleBio = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-full mx-auto p-4 sm:p-6 animate-fade-in">
      <div className="text-center mb-12 mt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd30] to-[#69e8cb]">
          Sobre o Portal
        </h1>
        <p className="text-xl text-secondary-text max-w-full mx-auto">
          Transformando a educação através da gamificação e engajamento
        </p>
      </div>

      {/* Bloco de Missão */}
      <div className="bg-gradient-to-br from-gray-100 to-white dark:from-[#343a40] dark:to-[#2c3135] p-8 rounded-2xl shadow-2xl border-l-4 border-accent-yellow mb-16">
        <div className="flex items-start mb-4">
          <BookOpen className="w-10 h-10 text-accent-yellow mr-4 flex-shrink-0" />
          <div>
            <h2 className="text-3xl font-bold mb-3 text-primary-text">Nossa Missão</h2>
            <p className="text-lg text-secondary-text leading-relaxed">
              Transformar a experiência educacional em uma jornada engajadora, interativa e divertida através da gamificação. Queremos revolucionar a forma como professores ensinam e alunos aprendem, criando um ecossistema educacional vibrante.
            </p>
          </div>
        </div>
      </div>

      {/* NOVO: Seção de Estatísticas (Nosso Impacto em Números) */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary-text">Nosso Impacto em Números</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">

          <div className="bg-secondary-bg p-6 rounded-2xl shadow-lg border border-accent-purple/20 flex flex-col items-center text-center group hover:border-accent-purple transition-all duration-300">
            <div className="p-3 bg-accent-purple/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-accent-purple" />
            </div>
            <p className="text-3xl font-extrabold text-primary-text">{platformStats.users}</p>
            <p className="text-sm font-medium text-secondary-text">Usuários Totais</p>
          </div>

          <div className="bg-secondary-bg p-6 rounded-2xl shadow-lg border border-accent-yellow/20 flex flex-col items-center text-center group hover:border-accent-yellow transition-all duration-300">
            <div className="p-3 bg-accent-yellow/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-accent-yellow" />
            </div>
            <p className="text-3xl font-extrabold text-primary-text">{platformStats.activities}</p>
            <p className="text-sm font-medium text-secondary-text">Atividades Criadas</p>
          </div>

          <div className="bg-secondary-bg p-6 rounded-2xl shadow-lg border border-blue-400/20 flex flex-col items-center text-center group hover:border-blue-400 transition-all duration-300">
            <div className="p-3 bg-blue-400/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Grid className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-3xl font-extrabold text-primary-text">{platformStats.classes}</p>
            <p className="text-sm font-medium text-secondary-text">Turmas Ativas</p>
          </div>

          <div className="bg-secondary-bg p-6 rounded-2xl shadow-lg border border-[#ff6b6b]/20 flex flex-col items-center text-center group hover:border-[#ff6b6b] transition-all duration-300">
            <div className="p-3 bg-[#ff6b6b]/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <UserCheck className="w-8 h-8 text-[#ff6b6b]" />
            </div>
            <p className="text-3xl font-extrabold text-primary-text">{platformStats.professors}</p>
            <p className="text-sm font-medium text-secondary-text">Professores</p>
          </div>

          <div className="bg-secondary-bg p-6 rounded-2xl shadow-lg border border-accent-teal/20 flex flex-col items-center text-center group hover:border-accent-teal transition-all duration-300 col-span-2 md:col-span-1 lg:col-span-1">
            <div className="p-3 bg-accent-teal/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Smile className="w-8 h-8 text-accent-teal" />
            </div>
            <p className="text-3xl font-extrabold text-primary-text">{platformStats.students}</p>
            <p className="text-sm font-medium text-secondary-text">Alunos</p>
          </div>

        </div>
      </div>

      {/* Seção da Equipe com Novo Layout */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-primary-text">Conheça Nossa Equipe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="bg-secondary-bg p-6 rounded-2xl shadow-lg border border-accent-purple/20 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:border-accent-yellow/50">
              <img
                src={member.photo}
                alt={`Foto de ${member.name}`}
                className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-[#69e8cb]"
              />
              <h3 className="text-2xl font-bold mb-1 dark:text-primary-text">{member.name}</h3>
              <p className="text-[#ffbd30] font-semibold mb-4">{member.role}</p>

              <div className="text-secondary-text text-left mb-4">
                <p>
                  {expandedIndex === index ? member.bio : `${member.bio.substring(0, 150)}...`}
                </p>
                <button onClick={() => toggleBio(index)} className="text-[#69e8cb] hover:text-[#ffbd30] font-bold mt-2 flex items-center mx-auto focus:outline-none">
                  {expandedIndex === index ? 'Leia menos' : 'Leia mais'}
                  {expandedIndex === index ? <ChevronUp className="ml-1 h-5 w-5" /> : <ChevronDown className="ml-1 h-5 w-5" />}
                </button>
              </div>

              <div className="flex space-x-4 mt-auto pt-4 border-t border-border-color w-full justify-center">
                <a href={member.lattes} target="_blank" rel="noopener noreferrer" className="text-secondary-text hover:text-[#69e8cb] transition-colors" title="Currículo Lattes">
                  <LattesIcon />
                </a>
                <a href={member.orcid} target="_blank" rel="noopener noreferrer" className="text-secondary-text hover:text-[#69e8cb] transition-colors" title="ORCID">
                  <OrcidIcon />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seções restantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        <div className="bg-secondary-bg p-6 rounded-2xl shadow-lg border-t-4 border-accent-teal">
          <h3 className="text-2xl font-bold mb-4 flex items-center text-primary-text">
            <Shield className="w-6 h-6 text-accent-teal mr-2" />
            Para Professores
          </h3>
          <p className="text-lg text-secondary-text mb-4">
            Oferecemos ferramentas intuitivas para criar e gerenciar atividades gamificadas, permitindo personalizar o ensino e motivar seus alunos. Com nosso sistema, você pode:
          </p>
          <ul className="space-y-3">
            {[
              "Criar missões educacionais personalizadas",
              "Acompanhar o progresso individual e da turma",
              "Designar recompensas significativas",
              "Compartilhar atividades com outros educadores"
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-[#ffbd30] mr-3 mt-1">•</span>
                <span className="text-secondary-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-secondary-bg p-6 rounded-2xl shadow-lg border-t-4 border-[#9570d9]">
          <h3 className="text-2xl font-bold mb-4 text-primary-text flex items-center">
            <Award className="w-6 h-6 text-[#9570d9] mr-2" />
            Para Alunos
          </h3>
          <p className="text-lg text-secondary-text mb-4">
            Proporcionamos um ambiente dinâmico onde o progresso é recompensado e a colaboração é incentivada. Em nossa plataforma, você pode:
          </p>
          <ul className="space-y-3">
            {[
              "Acompanhar seu progresso de aprendizado",
              "Participar de desafios educacionais divertidos",
              "Colecionar conquistas e recompensas",
              "Colaborar com colegas em missões de equipe"
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-[#ffbd30] mr-3 mt-1">•</span>
                <span className="text-secondary-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-primary-text">Nossos Valores Fundamentais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <div
              key={index}
              className="bg-secondary-bg p-6 rounded-xl shadow-lg border border-[#69e8cb]/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-[#ffbd30] mb-4">
                {value.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 dark:text-primary-text">{value.title}</h3>
              <p className="text-secondary-text">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#ffbd30]/10 to-[#69e8cb]/10 p-8 rounded-2xl border-2 border-[#9570d9]/30 text-center mb-8 relative overflow-hidden">
        {/* Efeito de brilho de fundo opcional */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-accent-teal/5 blur-[100px] -z-10"></div>

        <Heart className="w-12 h-12 mx-auto text-[#ff6b6b] mb-4" />
        <h2 className="text-3xl font-bold mb-4 dark:text-primary-text">Junte-se a Nossa Comunidade</h2>
        <p className="text-xl text-secondary-text max-w-2xl mx-auto mb-8">
          Faça parte desta revolução educacional que já transforma a vida de milhares de professores e alunos.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/cadastro"
            className="bg-gradient-to-r from-[#ffbd30] to-[#ffa000] hover:from-[#ffcc5c] hover:to-[#ffb140] text-[#2c3135] font-bold py-3 px-8 rounded-full shadow-md transition-all duration-300 transform hover:scale-105">
            Comece Agora</Link>

          <Link to="/contact"
            className="bg-secondary-bg hover:bg-primary-bg text-primary-text font-bold py-3 px-8 rounded-full border border-[#69e8cb]/40 shadow-md transition-all duration-300 flex items-center justify-center hover:-translate-y-1">
            Fale Conosco</Link>
        </div>
      </div>
    </div>
  );
}

export default AboutUsPage;