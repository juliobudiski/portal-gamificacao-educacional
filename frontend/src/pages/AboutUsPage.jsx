// frontend/src/pages/AboutUsPage.jsx
import React, { useState } from 'react';
import { BookOpen, Users, Award, BarChart2, Heart, Shield, Star, ChevronDown, ChevronUp } from 'react-feather';
import { Link } from 'react-router-dom';

// NOVO: Ícones para Lattes e Orcid (adicionados como componentes SVG)
const LattesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M43.25 216.744h65.378V502H43.25zM76.213 43.25c27.56,0 49.333,21.773 49.333,48.553 0,27.56 -21.773,48.553 -49.333,48.553 -26.78,0 -48.553,-20.993 -48.553,-48.553 0,-26.78 21.773,-48.553 48.553,-48.553zM153.29 216.744h65.378v29.313h.818c9.692,-17.447 32.843,-35.813 65.378,-35.813 69.873,0 82.888,45.858 82.888,104.513v122.245h-65.378v-109c0,-26.78 -1.637,-52.74 -39.29,-52.74 -40.108,0 -45.858,30.95 -45.858,51.1v110.64h-65.378V216.744zM364.57 216.744h67.013v29.313h.818c9.692,-17.447 32.843,-35.813 65.378,-35.813 69.873,0 82.888,45.858 82.888,104.513v122.245h-65.378v-109c0,-26.78 -1.637,-52.74 -39.29,-52.74 -40.108,0 -45.858,30.95 -45.858,51.1v110.64h-65.378V216.744z" transform="scale(0.8) translate(40, -30)"/>
  </svg>
);

const OrcidIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.363 4.312h2.91v10.59H7.363V4.312zM8.818 16.53c-1.05 0-1.902.85-1.902 1.9s.852 1.9 1.902 1.9 1.902-.85 1.902-1.9-.853-1.9-1.902-1.9zM16.637 6.41v1.562h-2.91v8.627h2.91V8.03h1.455V6.41h-4.365z"/>
  </svg>
);

function AboutUsPage() {
  // NOVO: Estado para controlar qual biografia está expandida
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Dados sobre os valores da plataforma
  const values = [
    { icon: <Star className="w-8 h-8" />, title: "Inovação Educacional", description: "Utilizamos as mais recentes pesquisas em gamificação para criar experiências de aprendizado transformadoras." },
    { icon: <Users className="w-8 h-8" />, title: "Comunidade", description: "Fomentamos uma comunidade colaborativa onde professores e alunos aprendem juntos." },
    { icon: <Award className="w-8 h-8" />, title: "Reconhecimento", description: "Valorizamos o esforço e progresso de cada estudante com sistemas de conquistas significativas." },
    { icon: <BarChart2 className="w-8 h-8" />, title: "Progresso Mensurável", description: "Fornecemos ferramentas para acompanhar o desenvolvimento acadêmico de forma clara e objetiva." }
  ];

  // Estrutura de dados da equipe com mais detalhes
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
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <div className="text-center mb-12 mt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd30] to-[#69e8cb]">
          Sobre o Portal
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Transformando a educação através da gamificação e engajamento
        </p>
      </div>

      <div className="bg-gradient-to-br from-[#343a40] to-[#2c3135] p-8 rounded-2xl shadow-2xl border-l-4 border-[#ffbd30] mb-16">
        <div className="flex items-start mb-4">
          <BookOpen className="w-10 h-10 text-[#ffbd30] mr-4 flex-shrink-0" />
          <div>
            <h2 className="text-3xl font-bold mb-3 text-white">Nossa Missão</h2>
            <p className="text-lg text-gray-300">
              Transformar a experiência educacional em uma jornada engajadora, interativa e divertida através da gamificação. Queremos revolucionar a forma como professores ensinam e alunos aprendem, criando um ecossistema educacional vibrante.
            </p>
          </div>
        </div>
      </div>
      
      {/* Seção da Equipe com Novo Layout */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Conheça Nossa Equipe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="bg-white dark:bg-[#343a40] p-6 rounded-2xl shadow-lg border border-[#9570d9]/20 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:border-[#ffbd30]/50">
              <img 
                src={member.photo} 
                alt={`Foto de ${member.name}`}
                className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-[#69e8cb]"
              />
              <h3 className="text-2xl font-bold mb-1 dark:text-white">{member.name}</h3>
              <p className="text-[#ffbd30] font-semibold mb-4">{member.role}</p>
              
              <div className="text-gray-600 dark:text-gray-300 text-left mb-4">
                <p>
                  {expandedIndex === index ? member.bio : `${member.bio.substring(0, 150)}...`}
                </p>
                <button onClick={() => toggleBio(index)} className="text-[#69e8cb] hover:text-[#ffbd30] font-bold mt-2 flex items-center mx-auto">
                  {expandedIndex === index ? 'Leia menos' : 'Leia mais'}
                  {expandedIndex === index ? <ChevronUp className="ml-1 h-5 w-5" /> : <ChevronDown className="ml-1 h-5 w-5" />}
                </button>
              </div>

              <div className="flex space-x-4 mt-auto pt-4 border-t border-gray-200 dark:border-gray-600 w-full justify-center">
                <a href={member.lattes} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#69e8cb] transition-colors" title="Currículo Lattes">
                  <LattesIcon />
                </a>
                <a href={member.orcid} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#69e8cb] transition-colors" title="ORCID">
                  <OrcidIcon />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seções restantes (sem alterações) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        <div className="bg-white dark:bg-[#343a40] p-6 rounded-2xl shadow-lg border-t-4 border-[#69e8cb]">
          <h3 className="text-2xl font-bold mb-4 dark:text-white flex items-center">
            <Shield className="w-6 h-6 text-[#69e8cb] mr-2" />
            Para Professores
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Oferecemos ferramentas intuitivas para criar e gerenciar atividades gamificadas, permitindo personalizar o ensino e motivar seus alunos. Com nosso sistema, você pode:
          </p>
          <ul className="mt-4 space-y-2">
            {[
              "Criar missões educacionais personalizadas",
              "Acompanhar o progresso individual e da turma",
              "Designar recompensas significativas",
              "Compartilhar atividades com outros educadores"
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-[#ffbd30] mr-2">•</span>
                <span className="text-gray-600 dark:text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-white dark:bg-[#343a40] p-6 rounded-2xl shadow-lg border-t-4 border-[#9570d9]">
          <h3 className="text-2xl font-bold mb-4 dark:text-white flex items-center">
            <Award className="w-6 h-6 text-[#9570d9] mr-2" />
            Para Alunos
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Proporcionamos um ambiente dinâmico onde o progresso é recompensado e a colaboração é incentivada. Em nossa plataforma, você pode:
          </p>
          <ul className="mt-4 space-y-2">
            {[
              "Acompanhar seu progresso de aprendizado",
              "Participar de desafios educacionais divertidos",
              "Colecionar conquistas e recompensas",
              "Colaborar com colegas em missões de equipe"
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-[#ffbd30] mr-2">•</span>
                <span className="text-gray-600 dark:text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Nossos Valores Fundamentais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-[#343a40] p-6 rounded-xl shadow-lg border border-[#69e8cb]/20 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-[#ffbd30] mb-4">
                {value.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 dark:text-white">{value.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#ffbd30]/10 to-[#69e8cb]/10 p-8 rounded-2xl border-2 border-[#9570d9]/30 text-center mb-8">
        <Heart className="w-12 h-12 mx-auto text-[#ff6b6b] mb-4" />
        <h2 className="text-3xl font-bold mb-4 dark:text-white">Junte-se a Nossa Comunidade</h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
          Faça parte desta revolução educacional que já transforma a vida de milhares de professores e alunos.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/cadastro" className="bg-gradient-to-r from-[#ffbd30] to-[#ffa000] hover:from-[#ffcc5c] hover:to-[#ffb140] text-[#2c3135] font-bold py-3 px-6 rounded-full shadow-md transition-all duration-300 transform hover:scale-105">Comece Agora</Link>
          <button className="bg-[#343a40] hover:bg-[#2c3135] text-white font-bold py-3 px-6 rounded-full border border-[#69e8cb]/40 shadow-md transition-all duration-300">
            Fale Conosco
          </button>
        </div>
      </div>
    </div>
  );
}

export default AboutUsPage;