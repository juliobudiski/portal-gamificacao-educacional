// frontend/src/pages/AboutUsPage.jsx
import React from 'react';

function AboutUsPage() {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-4xl font-bold mb-6 text-gray-800 dark:text-white">Sobre o Portal de Gamificação Educacional</h2>
      <p className="text-lg text-center max-w-3xl mb-4">
        Nosso portal foi desenvolvido com o objetivo de transformar a experiência educacional através da gamificação. Acreditamos que a aprendizagem pode ser mais engajadora, interativa e divertida.
      </p>
      <p className="text-lg text-center max-w-3xl mb-4">
        Oferecemos ferramentas para professores criarem e gerenciarem atividades gamificadas de forma intuitiva, permitindo que personalizem o ensino e motivem seus alunos. Para os alunos, o portal proporciona um ambiente dinâmico onde o progresso é recompensado e a colaboração é incentivada.
      </p>
      <p className="text-lg text-center max-w-3xl">
        Nosso foco é promover o engajamento intrínseco e a aprendizagem significativa, adaptando-se às necessidades de cada estudante e fomentando uma comunidade educacional vibrante.
      </p>
    </div>
  );
}

export default AboutUsPage;
