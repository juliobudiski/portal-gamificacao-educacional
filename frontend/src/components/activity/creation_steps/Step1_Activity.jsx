// frontend/src/components/activity/creation_steps/Step1_Activity.jsx
import React, { useState, useEffect } from 'react';
import {
  FaCode, FaTools, FaUsers, FaFrown, FaTasks, FaHeadSideVirus, FaProjectDiagram,
  FaComments, FaBriefcase, FaGlobeAmericas, FaInfoCircle, FaBrain, FaSearch,
  FaGhost, FaGamepad, FaBalanceScale, FaCalendarTimes, FaShieldAlt, FaEyeSlash,
  FaBookReader, FaHeartbeat
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";

/**
 * Criação de Atividade - Passo 1 (Informações Básicas)
 * 
 * Coleta o título, descrição, tipo e visibilidade (pública/privada) da nova atividade.
 */


// --- DADOS DA LITERATURA E GERAIS ---
const SUBDOMAINS_COMPUTING = [
  "Fundamentos e Programação Introdutória",
  "Engenharia de Software e Projetos",
  "Testes e Qualidade de Software"
];

const SUBDOMAIN_PROBLEMS = {
  "Fundamentos e Programação Introdutória": [
    { text: "Barreira da Abstração", icon: <FaCode /> },
    { text: "Sobrecarga Cognitiva (Sintaxe vs. Semântica)", icon: <FaBrain /> },
    { text: "Dificuldade de Rastreamento Mental (Tracing)", icon: <FaSearch /> },
    { text: "Ilusão de Competência", icon: <FaGhost /> }
  ],
  "Engenharia de Software e Projetos": [
    { text: "Síndrome do 'Problema de Brinquedo'", icon: <FaGamepad /> },
    { text: "Tradução de Modelos para Código", icon: <FaProjectDiagram /> },
    { text: "Natureza Subjetiva da Qualidade do Design", icon: <FaBalanceScale /> },
    { text: "Resistência ao Planejamento", icon: <FaCalendarTimes /> }
  ],
  "Testes e Qualidade de Software": [
    { text: "Bloqueio Psicológico e Viés do Desenvolvedor", icon: <FaHeadSideVirus /> },
    { text: "Dificuldade com Testes Abrangentes", icon: <FaShieldAlt /> },
    { text: "Invisibilidade dos Requisitos Não Funcionais (NFRs)", icon: <FaEyeSlash /> },
    { text: "Curva de Aprendizado das Ferramentas", icon: <FaTools /> }
  ]
};

// Lista ampla de problemas comuns
const GENERIC_PROBLEMS = [
  { text: "Falta de motivação e interesse na teoria.", icon: <FaFrown /> },
  { text: "Dificuldade em gerenciar o tempo e prazos.", icon: <FaTasks /> },
  { text: "Falta de percepção da aplicabilidade no mercado.", icon: <FaBriefcase /> },
  { text: "Dificuldade de comunicação e trabalho em equipe.", icon: <FaUsers /> },
  { text: "Frustração constante com bugs e erros técnicos.", icon: <FaTools /> },
  { text: "Falta de engajamento em discussões e debates.", icon: <FaComments /> },
  { text: "Dificuldade de concentração durante a aula.", icon: <FaHeadSideVirus /> },
  { text: "Sobrecarga com o volume de conteúdo.", icon: <FaBookReader /> }
];

function Step1_InitialDetails({ activityData, handleInputChange, setActivityData }) {
  const { openHelp } = useHelpModal();

  const currentArea = activityData.areaKnowledge || "Computação e Engenharia de Software";
  const isComputingArea = currentArea === "Computação e Engenharia de Software";

  const [displayedProblems, setDisplayedProblems] = useState(GENERIC_PROBLEMS);

  // Pré-seleciona a área na montagem
  useEffect(() => {
    if (!activityData.areaKnowledge) {
      setActivityData(prev => ({ ...prev, areaKnowledge: "Computação e Engenharia de Software" }));
    }
  }, []);

  // Mistura os problemas específicos com TODOS os genéricos
  useEffect(() => {
    if (isComputingArea && activityData.subdomain && SUBDOMAIN_PROBLEMS[activityData.subdomain]) {
      // Cria um Set para evitar duplicatas, caso algum genérico seja muito parecido
      setDisplayedProblems([...SUBDOMAIN_PROBLEMS[activityData.subdomain], ...GENERIC_PROBLEMS]);
    } else {
      setDisplayedProblems(GENERIC_PROBLEMS);
    }
  }, [activityData.subdomain, currentArea, isComputingArea]);

  const handleAreaChange = (e) => {
    const newArea = e.target.value;
    setActivityData(prev => ({
      ...prev,
      areaKnowledge: newArea,
      subdomain: "",
      currentScenario: { ...prev.currentScenario, problems: [] }
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
    <div id="tour-step-scenario-inputs" className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-primary-text">
          Definindo o Cenário
        </h2>
        <p className="mt-2 text-secondary-text">
          Comece definindo o escopo e os desafios da sua atividade.
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
            className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color rounded-md shadow-sm focus:ring-teal-500 sm:text-sm"
            placeholder="Ex: A Jornada do Herói em Java"
            required
          />
        </div>

        <div className={isComputingArea ? "md:col-span-1" : "md:col-span-2"}>
          <label className="block text-sm font-medium text-secondary-text mb-1">Área de Conhecimento *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
              <FaGlobeAmericas />
            </div>
            <select
              required
              name="areaKnowledge"
              value={currentArea}
              onChange={handleAreaChange}
              className="pl-10 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color rounded-md focus:ring-teal-500 sm:text-sm"
            >
              <option value="Computação e Engenharia de Software">Computação e Engenharia de Software</option>
              <option value="Outras Áreas">Outras Áreas (Modo Genérico)</option>
            </select>
          </div>
        </div>

        {isComputingArea && (
          <div className="md:col-span-1 animate-fade-in">
            <label className="block text-sm font-medium text-teal-600 dark:text-teal-400 mb-1">Foco da Disciplina (Opcional)</label>
            <select
              name="subdomain"
              value={activityData.subdomain || ""}
              onChange={handleInputChange}
              className="block w-full px-4 py-2 bg-primary-bg border border-border-color rounded-md focus:ring-accent-teal sm:text-sm text-primary-text"
            >
              <option value="">Geral / Sem foco específico</option>
              {SUBDOMAINS_COMPUTING.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}

        {!isComputingArea && (
          <div className="md:col-span-2 bg-info-bg/20 border-l-4 border-info p-4 rounded-md animate-fade-in">
            <div className="flex items-start">
              <FaInfoCircle className="text-info mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-info dark:text-info">
                <strong>Modo Exploratório:</strong> O motor de evidências científicas desta versão foca em disciplinas de Computação e Engenharia de Software. Para a sua área, o sistema operará de forma genérica.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t dark:border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-primary-text">
          Quais desafios seus alunos enfrentam?
        </h3>
        <p className="text-sm text-secondary-text mb-4">Selecione pelo menos um desafio para continuar.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedProblems.map((problem) => {
            const isSelected = activityData.currentScenario.problems.includes(problem.text);
            return (
              <div
                key={problem.text}
                onClick={() => handleProblemSelection(problem.text)}
                className={`
                  group relative flex cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-4 text-center transition-all duration-200
                  ${isSelected
                    ? 'border-2 border-accent-teal bg-accent-teal/10 shadow-[0_0_15px_rgba(var(--accent-teal),0.2)]'
                    : 'border-border-color bg-secondary-bg hover:border-accent-teal/50 hover:shadow-lg'
                  }
                `}
              >
                <div className={`text-3xl transition-transform group-hover:scale-110 ${isSelected ? 'text-accent-teal' : 'text-secondary-text group-hover:text-accent-teal'}`}>
                  {problem.icon}
                </div>
                <p className={`text-sm font-medium ${isSelected ? 'text-accent-teal font-bold' : 'text-secondary-text'}`}>
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