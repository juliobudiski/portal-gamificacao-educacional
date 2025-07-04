// frontend/src/pages/ActivityCreationPage.jsx
import React, { useState } from 'react';

function ActivityCreationPage() {
  const [currentStep, setCurrentStep] = useState(1); // Estado para controlar a etapa atual

  // Estados para a Etapa 1: Informações Básicas e Contexto
  const [activityName, setActivityName] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [classId, setClassId] = useState('');
  const [professorName, setProfessorName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [studentProblems, setStudentProblems] = useState([]); // Array para problemas dos alunos

  const handleNextStep = () => {
    setCurrentStep(prevStep => prevStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(prevStep => prevStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold mb-4 dark:text-white">Etapa 1: Informações Básicas e Contexto</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Por favor, preencha as informações a seguir. Essas informações iniciais serão apresentadas na página final, garantindo que sua experiência seja personalizada e adaptada às necessidades dos seus alunos. Por favor, verifique se as informações estão corretas antes de submeter o formulário.
            </p>

            
                      

            {/* Cenário Atual: Problemas dos Alunos */}
            <h4 className="text-xl font-semibold mt-8 mb-4 dark:text-white">
              Definição do Cenário Atual: Dificuldades dos Alunos
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Nesta seção, identifique os problemas dos alunos e escolha as sugestões adequadas ao cenário. Leia atentamente e selecione as melhores opções para entender e solucionar a situação de forma efetiva.
            </p>
            {/* Aqui vamos manter checkboxes por enquanto, mas com a ideia de aprimorar visualmente depois */}
            {[
              "Dificuldades na compreensão de conceitos complexos de programação.",,
              "Dificuldades em aplicar as teorias aprendidas na prática.",,
              "Dificuldades em trabalhar em equipe e colaborar com colegas.",,
              "Falta de motivação e interesse no assunto.",,
              "Dificuldades em gerenciar o tempo e priorizar tarefas.",,
              "Dificuldades em lidar com a pressão e o estresse da grade de estudos intensa.",,
              "Dificuldades em aprender novas ferramentas e tecnologias rapidamente.",,
              "Falta de habilidades de comunicação e apresentação.",,
              "Dificuldades em equilibrar o estudo com outras responsabilidades e obrigações.",,
              "Dificuldades em gerenciar a ansiedade e a sobrecarga de trabalho.",,
              "Dificuldades em lidar com ferramentas de desenvolvimento complexas.",,
              "Dificuldades em encontrar oportunidades de estágio ou experiência profissional.",,
              "Dificuldades em trabalhar com prazos apertados em projetos acadêmicos.",,
            ].map((problem, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`problem-${index}`}
                  value={problem}
                  checked={studentProblems.includes(problem)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setStudentProblems([...studentProblems, problem]);
                    } else {
                      setStudentProblems(studentProblems.filter(p => p !== problem));
                    }
                  }}
                  className="form-checkbox h-5 w-5 text-blue-600 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-500"
                />
                <label htmlFor={`problem-${index}`} className="ml-2 text-gray-700 dark:text-gray-200">
                  {problem}
                </label>
              </div>
            ))}
            {/* Campo "Outra" para problemas */}
            <div>
              <label htmlFor="otherProblem" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mt-4">
                Outra:
              </label>
              <input
                type="text"
                id="otherProblem"
                placeholder="Descreva outro problema"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <button
              onClick={handleNextStep}
              className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Próxima Etapa
            </button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold mb-4 dark:text-white">Etapa 2: Objetivos Pedagógicos e Planejamento</h3>
            <p className="text-gray-600 dark:text-gray-300">Conteúdo da Etapa 2...</p>
            <div className="flex justify-between mt-6">
              <button
                onClick={handlePreviousStep}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
              >
                Voltar
              </button>
              <button
                onClick={handleNextStep}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                Próxima Etapa
              </button>
            </div>
          </div>
        );
      // Adicione mais casos para Etapa 3, 4, etc.
      default:
        return (
          <div className="text-center dark:text-white">
            <h3 className="text-2xl font-semibold">Criação de Atividade</h3>
            <p>Etapa não reconhecida.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 dark:text-white">
        Criação de Atividade Gamificada
      </h2>

      {/* Barra de Progresso (opcional, mas bom para UX) */}
      <div className="w-full max-w-4xl mb-8">
        <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700">
          <div
            className="h-2 bg-blue-600 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / 5) * 100}%` }} /* Ajuste o 5 pelo número total de etapas */
          ></div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-2 dark:text-gray-400">
          Progresso: {Math.round((currentStep / 5) * 100)}%
        </p>
      </div>

      <div className="w-full max-w-4xl">
        {renderStep()}
      </div>
    </div>
  );
}

export default ActivityCreationPage;
