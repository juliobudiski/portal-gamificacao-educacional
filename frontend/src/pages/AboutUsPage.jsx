// frontend/src/pages/AboutUsPage.jsx
import React from 'react';
import { BookOpen, Users, Award, BarChart2, Heart, Shield, Star } from 'react-feather';

function AboutUsPage() {
  // Dados sobre os valores da plataforma
  const values = [
    { 
      icon: <Star className="w-8 h-8" />, 
      title: "Inovação Educacional", 
      description: "Utilizamos as mais recentes pesquisas em gamificação para criar experiências de aprendizado transformadoras." 
    },
    { 
      icon: <Users className="w-8 h-8" />, 
      title: "Comunidade", 
      description: "Fomentamos uma comunidade colaborativa onde professores e alunos aprendem juntos." 
    },
    { 
      icon: <Award className="w-8 h-8" />, 
      title: "Reconhecimento", 
      description: "Valorizamos o esforço e progresso de cada estudante com sistemas de conquistas significativas." 
    },
    { 
      icon: <BarChart2 className="w-8 h-8" />, 
      title: "Progresso Mensurável", 
      description: "Fornecemos ferramentas para acompanhar o desenvolvimento acadêmico de forma clara e objetiva." 
    }
  ];

  // Dados sobre a equipe (exemplo)
  const teamMembers = [
    { name: "Ana Silva", role: "Fundadora & Pedagoga", specialty: "Design Instrucional" },
    { name: "Carlos Mendes", role: "CTO", specialty: "Desenvolvimento de Software" },
    { name: "Mariana Costa", role: "Designer Educacional", specialty: "Gamificação" },
    { name: "Pedro Alves", role: "Suporte Pedagógico", specialty: "Implementação em Sala de Aula" }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      {/* Cabeçalho com destaque visual */}
      <div className="text-center mb-12 mt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd30] to-[#69e8cb]">
          Sobre o Portal
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Transformando a educação através da gamificação e engajamento
        </p>
      </div>

      {/* Missão com destaque visual */}
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

      {/* O que fazemos em colunas responsivas */}
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

      {/* Nossos Valores */}
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

      {/* Equipe */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Conheça Nossa Equipe</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-[#343a40] p-6 rounded-xl shadow-lg text-center border border-[#9570d9]/20 hover:border-[#ffbd30]/50 transition-all duration-300"
            >
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-1 dark:text-white">{member.name}</h3>
              <p className="text-[#ffbd30] font-medium mb-2">{member.role}</p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{member.specialty}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chamada final com gradiente */}
      <div className="bg-gradient-to-r from-[#ffbd30]/10 to-[#69e8cb]/10 p-8 rounded-2xl border-2 border-[#9570d9]/30 text-center mb-8">
        <Heart className="w-12 h-12 mx-auto text-[#ff6b6b] mb-4" />
        <h2 className="text-3xl font-bold mb-4 dark:text-white">Junte-se a Nossa Comunidade</h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
          Faça parte desta revolução educacional que já transforma a vida de milhares de professores e alunos.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="bg-gradient-to-r from-[#ffbd30] to-[#ffa000] hover:from-[#ffcc5c] hover:to-[#ffb140] text-[#2c3135] font-bold py-3 px-6 rounded-full shadow-md transition-all duration-300 transform hover:scale-105">
            Comece Agora
          </button>
          <button className="bg-[#343a40] hover:bg-[#2c3135] text-white font-bold py-3 px-6 rounded-full border border-[#69e8cb]/40 shadow-md transition-all duration-300">
            Fale Conosco
          </button>
        </div>
      </div>
    </div>
  );
}

export default AboutUsPage;