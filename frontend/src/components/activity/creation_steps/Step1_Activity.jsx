// frontend/src/components/activity/creation_steps/Step1_Activity.jsx
import React, { useState, useEffect } from 'react';
import {
  FaCode, FaTools, FaUsers, FaFrown, FaTasks, FaHeadSideVirus, FaProjectDiagram, FaBug,
  FaRocket, FaComments, FaBriefcase, FaGlobeAmericas, FaInfoCircle, FaChartLine
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";

// MAPEAMENTO FOCADO (Honestidade Científica)
const MAIN_AREAS = [
  "Ciência da Computação",
  "Engenharia de Software",
  "Outras Áreas"
];

const SUBDOMAINS_COMPUTING = [
  "Fundamentos e Programação Introdutória",
  "Engenharia de Software e Projetos",
  "Testes e Qualidade de Software"
];

const SUBDOMAIN_PROBLEMS = {
  "Fundamentos e Programação Introdutória": [
    { text: "Barreira de abstração: foco na sintaxe em vez da lógica algorítmica.", icon: <FaCode /> },
    { text: "Medo de errar e frustração com depuração (debugging).", icon: <FaTools /> }
  ],
  "Engenharia de Software e Projetos": [
    { text: "Dificuldade de colaboração e adoção de papéis (ex: Scrum).", icon: <FaUsers /> },
    { text: "Dificuldade em visualizar consequências a longo prazo (débito técnico).", icon: <FaProjectDiagram /> }
  ],
  "Testes e Qualidade de Software": [
    { text: "Percepção de testes como atividade tediosa e secundária.", icon: <FaBug /> },
    { text: "Baixo engajamento para atingir alta cobertura de código.", icon: <FaChartLine /> } // Certifique-se de importar FaChartLine
  ]
};

const GENERIC_PROBLEMS = [
  { text: "Falta de motivação e interesse no assunto.", icon: <FaFrown /> },
  { text: "Dificuldade em gerenciar o tempo e prazos.", icon: <FaTasks /> },
  { text: "Dificuldade de concentração durante a aula.", icon: <FaHeadSideVirus /> },
  { text: "Falta de percepção da aplicabilidade no mercado.", icon: <FaBriefcase /> },
  { text: "Falta de engajamento em discussões e debates.", icon: <FaComments /> }
];

function Step1_InitialDetails({ activityData, handleInputChange, setActivityData }) {
  const { openHelp } = useHelpModal();
  const [selectedGreatArea, setSelectedGreatArea] = useState(activityData.greatArea || "");


  const [displayedProblems, setDisplayedProblems] = useState(GENERIC_PROBLEMS);

  const isComputingArea = activityData.areaKnowledge === "Ciência da Computação" || activityData.areaKnowledge === "Engenharia de Software";
  const isOtherArea = activityData.areaKnowledge === "Outras Áreas";

  // Atualiza a lista de problemas baseada no subdomínio ou mostra gerais
  useEffect(() => {
    if (isComputingArea && activityData.subdomain && SUBDOMAIN_PROBLEMS[activityData.subdomain]) {
      // Mostra problemas específicos + 2 genéricos para dar opções
      setDisplayedProblems([...SUBDOMAIN_PROBLEMS[activityData.subdomain], ...GENERIC_PROBLEMS]);
    } else {
      setDisplayedProblems(GENERIC_PROBLEMS);
    }
  }, [activityData.subdomain, activityData.areaKnowledge, isComputingArea]);

  const handleAreaChange = (e) => {
    const newArea = e.target.value;
    setActivityData(prev => ({
      ...prev,
      areaKnowledge: newArea,
      subdomain: "", // Prevenção de erro: limpa o subdomínio ao trocar a área
      currentScenario: { ...prev.currentScenario, problems: [] } // Limpa problemas selecionados para evitar lixo de dados
    }));
  };


  const handleProblemSelection = (problemText) => {
    const currentProblems = activityData.currentScenario.problems;
    const newProblems = currentProblems.includes(problemText)
      ? currentProblems.filter(p => p !== problemText)
      : [...currentProblems, problemText];

    setActivityData(prevData => ({
      ...prevData,
      currentScenario: { ...prevData.currentScenario, problems: newProblems },
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text">
          Definindo o Cenário
        </h2>
        <p className="mt-2 text-secondary-text">
          Comece definindo a área de conhecimento. Isso ajustará as sugestões do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-secondary-text">Título da Atividade *</label>
          <input
            type="text"
            name="title"
            value={activityData.title}
            onChange={handleInputChange}
            className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:ring-teal-500 sm:text-sm"
            placeholder="Ex: A Jornada do Herói em Java"
            required
          />
        </div>

        {/* ÚNICO DROPDOWN DE ÁREA */}
        <div className={isComputingArea ? "md:col-span-1" : "md:col-span-2"}>
          <label className="block text-sm font-medium text-secondary-text mb-1">Área de Conhecimento *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaGlobeAmericas />
            </div>
            <select
              required
              name="areaKnowledge"
              value={activityData.areaKnowledge || ""}
              onChange={handleAreaChange}
              className={`pl-10 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border rounded-md focus:ring-teal-500 sm:text-sm 
                ${!activityData.areaKnowledge ? 'border-red-300 dark:border-red-900' : 'border-border-color dark:border-gray-600'} 
              `}
            >
              <option value="">Selecione a área principal...</option>
              {MAIN_AREAS.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>

        {/* DROPDOWN DE SUBDOMÍNIO (Só aparece se for Computação) */}
        {isComputingArea && (
          <div className="md:col-span-1 animate-fade-in">
            <label className="block text-sm font-medium text-teal-600 dark:text-teal-400 mb-1">Foco da Disciplina (Opcional)</label>
            <select
              name="subdomain"
              value={activityData.subdomain || ""}
              onChange={handleInputChange}
              className="block w-full px-4 py-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700 rounded-md focus:ring-teal-500 sm:text-sm"
            >
              <option value="">Geral / Sem foco específico</option>
              {SUBDOMAINS_COMPUTING.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}

        {/* BANNER DE HONESTIDADE CIENTÍFICA (Aparece se for Outras Áreas) */}
        {isOtherArea && (
          <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-md animate-fade-in">
            <div className="flex items-start">
              <FaInfoCircle className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Modo Exploratório:</strong> O motor de evidências científicas desta versão foca em disciplinas de Computação e Engenharia de Software. Para a sua área, o sistema sugerirá elementos baseando-se no Perfil da Turma e na Logística, operando de forma genérica.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t dark:border-gray-700">
        <h3 className="text-lg font-semibold text-primary-text">
          Quais desafios seus alunos enfrentam em <span className="text-teal-600">{selectedGreatArea || "Geral"}</span>?
        </h3>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedProblems.map((problem) => {
            const isSelected = activityData.currentScenario.problems.includes(problem.text);
            return (
              <div
                key={problem.text}
                onClick={() => handleProblemSelection(problem.text)}
                className={`
                  group relative flex cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-4 text-center transition-all duration-200
                  ${isSelected
                    ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40'
                    : 'border-border-color bg-secondary-bg hover:border-teal-400 hover:shadow-lg dark:bg-primary-bg'
                  }
                `}
              >
                <div className={`text-3xl ${isSelected ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-500'}`}>
                  {problem.icon}
                </div>
                <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-secondary-text'}`}>
                  {problem.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => openHelp('analise_preliminar')}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Ajuda
      </button>
    </div>
  );
}

export default Step1_InitialDetails;