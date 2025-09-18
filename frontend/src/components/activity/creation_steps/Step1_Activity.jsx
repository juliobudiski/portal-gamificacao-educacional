// frontend/src/components/steps/Step1_InitialDetails.jsx
import React from 'react';
import { 
  FaCode, FaTools, FaUsers, FaFrown, FaTasks, FaHeadSideVirus, 
  FaRocket, FaComments, FaBalanceScale, FaHeartbeat, FaCogs, 
  FaBriefcase, FaCalendarTimes 
} from 'react-icons/fa';

/**
 * Componente para a Etapa 1 do formulário de criação de atividades.
 * Coleta o título, a descrição e os principais desafios enfrentados pelos alunos.
 * @param {object} props - As propriedades passadas do componente pai.
 * @param {object} props.activityData - O objeto de estado que contém todos os dados do formulário.
 * @param {function} props.handleInputChange - A função para manipular mudanças em inputs de texto e textareas.
 * @param {function} props.setActivityData - A função para definir o estado da atividade diretamente, usada para campos complexos como arrays.
 */
function Step1_InitialDetails({ activityData, handleInputChange, setActivityData }) {
  // Array de objetos para facilitar a renderização dos cards com seus ícones correspondentes
  const studentProblems = [
    { text: "Dificuldades na compreensão de conceitos complexos de programação.", icon: <FaCode /> },
    { text: "Dificuldades em aplicar as teorias aprendidas na prática.", icon: <FaTools /> },
    { text: "Dificuldades em trabalhar em equipe e colaborar com colegas.", icon: <FaUsers /> },
    { text: "Falta de motivação e interesse no assunto.", icon: <FaFrown /> },
    { text: "Dificuldades em gerenciar o tempo e priorizar tarefas.", icon: <FaTasks /> },
    { text: "Dificuldades em lidar com a pressão e o estresse da grade de estudos intensa.", icon: <FaHeadSideVirus /> },
    { text: "Dificuldades em aprender novas ferramentas e tecnologias rapidamente.", icon: <FaRocket /> },
    { text: "Falta de habilidades de comunicação e apresentação.", icon: <FaComments /> },
    { text: "Dificuldades em equilibrar o estudo com outras responsabilidades e obrigações.", icon: <FaBalanceScale /> },
    { text: "Dificuldades em gerenciar a ansiedade e a sobrecarga de trabalho.", icon: <FaHeartbeat /> },
    { text: "Dificuldades em lidar com ferramentas de desenvolvimento complexas.", icon: <FaCogs /> },
    { text: "Dificuldades em encontrar oportunidades de estágio ou experiência profissional.", icon: <FaBriefcase /> },
    { text: "Dificuldades em trabalhar com prazos apertados em projetos acadêmicos.", icon: <FaCalendarTimes /> },
  ];

  /**
   * Manipula a seleção de problemas a partir dos cards.
   * Adiciona o problema ao array se ele não existir, ou o remove se já existir,
   * atualizando o estado no componente pai.
   * @param {string} problemText - O texto do problema que foi clicado.
   */
  const handleProblemSelection = (problemText) => {
    const currentProblems = activityData.currentScenario.problems;
    const newProblems = currentProblems.includes(problemText)
      ? currentProblems.filter(p => p !== problemText)
      : [...currentProblems, problemText];

    // Atualiza o estado no componente pai.
    // Usar setActivityData é mais direto para atualizar um array.
    setActivityData(prevData => ({
      ...prevData,
      currentScenario: {
        ...prevData.currentScenario,
        problems: newProblems,
      },
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SEÇÃO 1: Título e Descrição da Atividade */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Definindo o Cenário da Atividade
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Para começar, dê um nome e descreva o propósito geral da sua atividade gamificada.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Título da Atividade <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={activityData.title}
            onChange={handleInputChange}
            className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            placeholder="Ex: A Jornada do Herói em Java"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Descrição da Atividade
          </label>
          <textarea
            id="description"
            name="description"
            value={activityData.description}
            onChange={handleInputChange}
            rows="1"
            className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            placeholder="Um resumo sobre o que é a atividade."
          ></textarea>
        </div>
      </div>

      {/* SEÇÃO 2: Seleção de Problemas com Cards */}
      <div className="pt-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Quais desafios seus alunos enfrentam?
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Selecione os principais problemas que você observa. Isso ajudará a personalizar a gamificação.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {studentProblems.map((problem) => {
            const isSelected = activityData.currentScenario.problems.includes(problem.text);
            return (
              <div
                key={problem.text}
                onClick={() => handleProblemSelection(problem.text)}
                className={`
                  group relative flex cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-4 text-center transition-all duration-200
                  ${isSelected
                    ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                    : 'border-gray-300 bg-white hover:border-teal-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-500'
                  }
                `}
              >
                <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-500 dark:text-gray-500 dark:group-hover:text-teal-400'}`}>
                  {problem.icon}
                </div>
                <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-gray-700 dark:text-gray-300'}`}>
                  {problem.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 3: Campo Aberto e Botão de Ajuda */}
      <div className="pt-4">
        <label htmlFor="currentScenario.otherProblem" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Outro desafio não listado? (Opcional)
        </label>
        <input
          type="text"
          id="currentScenario.otherProblem"
          name="currentScenario.otherProblem"
          value={activityData.currentScenario.otherProblem}
          onChange={handleInputChange}
          className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          placeholder="Descreva outro problema específico"
        />
      </div>
    </div>
  );
}

export default Step1_InitialDetails;