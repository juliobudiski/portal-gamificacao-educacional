// frontend/src/pages/Homepage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Homepage() {
  return (
    // Container principal da homepage com estilos dark
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Título principal */}
      <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-6 leading-tight text-white">
        Portal de Gamificação Educacional
      </h1>

      {/* Descrição do portal */}
      <p className="text-lg md:text-xl text-center max-w-3xl mb-10 opacity-90 text-gray-300">
        Transforme a educação em uma jornada envolvente e interativa. Crie, compartilhe e participe de atividades gamificadas que inspiram o aprendizado e o engajamento.
      </p>

      {/* Seção de Chamada para Ação */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
        <Link
          to="/login"
          className="bg-gray-700 text-accent-teal font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-600 hover:scale-105 transition duration-300 ease-in-out text-lg border-2 border-accent-teal"
        >
          Entrar
        </Link>
        <Link
          to="/cadastro"
          className="bg-purple-950 text-accent-yellow font-bold py-3 px-8 rounded-full shadow-lg hover:bg-purple-800 hover:scale-105 transition duration-300 ease-in-out text-lg border-2 border-accent-yellow"
        >
          Cadastre-se
        </Link>
      </div>

      {/* Seção de Destaque */}
      <div className="bg-gray-800 text-gray-200 p-8 rounded-lg shadow-xl max-w-4xl w-full text-center">
        <h3 className="text-2xl font-bold mb-4">Por que Gamificar?</h3>
        <p className="text-md leading-relaxed">
          A gamificação na educação utiliza elementos de jogos para motivar alunos, aumentar a participação e melhorar a retenção do conhecimento. Com nosso portal, professores podem facilmente integrar desafios, pontos, rankings e recompensas em suas aulas, tornando o aprendizado mais divertido e eficaz.
        </p>
        <p className="mt-4 text-md leading-relaxed">
          Alunos, por sua vez, encontram um ambiente dinâmico que os incentiva a superar limites e colaborar, transformando cada tarefa em uma nova missão.
        </p>
      </div>
    </div>
  );
}

export default Homepage;