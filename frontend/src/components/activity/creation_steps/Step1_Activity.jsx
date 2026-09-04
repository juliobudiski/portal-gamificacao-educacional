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
    <div id="tour-step-scenario-inputs" className="space-y-10 animate-fade-in relative">
      
      {/* CABEÇALHO DO PASSO */}
      <div className="flex items-center justify-between border-b border-border-color pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow">
            Definindo o Cenário
          </h2>
          <p className="mt-2 text-secondary-text text-lg">
            Comece definindo o escopo e os desafios da sua atividade.
          </p>
        </div>
        <button
          onClick={() => openHelp('analise_preliminar')}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-primary-bg border border-border-color hover:border-accent-teal/50 hover:bg-accent-teal/10 transition-all duration-300 shadow-sm"
          title="Ajuda sobre este passo"
        >
          <FaInfoCircle className="text-xl text-secondary-text group-hover:text-accent-teal transition-colors" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* TÍTULO DA ATIVIDADE */}
        <div className="md:col-span-2 group">
          <label className="block text-sm font-bold text-secondary-text uppercase tracking-wider mb-2">Título da Atividade *</label>
          <div className="relative">
            <input
              type="text"
              name="title"
              value={activityData.title}
              onChange={handleInputChange}
              className="block w-full px-6 py-4 bg-primary-bg/50 backdrop-blur-sm border border-border-color rounded-2xl shadow-inner focus:ring-2 focus:ring-accent-teal focus:border-transparent text-primary-text text-lg transition-all duration-300 group-hover:border-accent-teal/50"
              placeholder="Ex: A Jornada do Herói em Java"
              required
            />
          </div>
        </div>

        {/* ÁREA DE CONHECIMENTO */}
        <div className={isComputingArea ? "md:col-span-1 group" : "md:col-span-2 group"}>
          <label className="block text-sm font-bold text-secondary-text uppercase tracking-wider mb-2">Área de Conhecimento *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-accent-teal">
              <FaGlobeAmericas className="text-xl" />
            </div>
            <select
              required
              name="areaKnowledge"
              value={currentArea}
              onChange={handleAreaChange}
              className="pl-12 block w-full px-4 py-4 bg-primary-bg/50 backdrop-blur-sm border border-border-color rounded-2xl focus:ring-2 focus:ring-accent-teal focus:border-transparent text-primary-text text-lg transition-all duration-300 appearance-none group-hover:border-accent-teal/50"
            >
              <option value="Computação e Engenharia de Software">Computação e Engenharia de Software</option>
              <option value="Outras Áreas">Outras Áreas (Modo Genérico)</option>
            </select>
          </div>
        </div>

        {/* FOCO DA DISCIPLINA */}
        {isComputingArea && (
          <div className="md:col-span-1 animate-fade-in group">
            <label className="block text-sm font-bold text-accent-teal uppercase tracking-wider mb-2">Foco da Disciplina (Opcional)</label>
            <div className="relative">
              <select
                name="subdomain"
                value={activityData.subdomain || ""}
                onChange={handleInputChange}
                className="block w-full px-6 py-4 bg-primary-bg/50 backdrop-blur-sm border border-border-color rounded-2xl focus:ring-2 focus:ring-accent-teal focus:border-transparent text-primary-text text-lg transition-all duration-300 appearance-none group-hover:border-accent-teal/50"
              >
                <option value="">Geral / Sem foco específico</option>
                {SUBDOMAINS_COMPUTING.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* MENSAGEM MODO EXPLORATÓRIO */}
        {!isComputingArea && (
          <div className="md:col-span-2 bg-info-bg/30 backdrop-blur-sm border border-info/50 p-6 rounded-2xl animate-fade-in shadow-inner">
            <div className="flex items-start gap-4">
              <div className="bg-info/20 p-2 rounded-xl">
                <FaInfoCircle className="text-info text-2xl flex-shrink-0" />
              </div>
              <p className="text-base text-primary-text leading-relaxed">
                <strong className="text-info tracking-wider uppercase text-sm block mb-1">Modo Exploratório</strong>
                O motor de evidências científicas desta versão foca em disciplinas de Computação e Engenharia de Software. Para a sua área, o sistema operará de forma genérica.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SELEÇÃO DE PROBLEMAS */}
      <div className="pt-8 border-t border-border-color">
        <h3 className="text-2xl font-bold text-primary-text mb-2">
          Quais desafios seus alunos enfrentam?
        </h3>
        <p className="text-base text-secondary-text mb-8">Selecione pelo menos um desafio enfrentado pela turma para continuarmos a moldar a atividade.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedProblems.map((problem) => {
            const isSelected = activityData.currentScenario.problems.includes(problem.text);
            return (
              <div
                key={problem.text}
                onClick={() => handleProblemSelection(problem.text)}
                className={`
                  group relative flex cursor-pointer flex-col items-center justify-start rounded-2xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1
                  ${isSelected
                    ? 'border-2 border-accent-teal bg-gradient-to-br from-accent-teal/20 to-primary-bg shadow-[0_8px_20px_rgba(20,184,166,0.3)]'
                    : 'border border-border-color bg-primary-bg/50 backdrop-blur-sm hover:border-accent-teal/50 hover:shadow-xl'
                  }
                `}
              >
                <div className={`text-4xl mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${isSelected ? 'text-accent-teal' : 'text-secondary-text/80 group-hover:text-accent-teal'}`}>
                  {problem.icon}
                </div>
                <p className={`text-sm leading-relaxed ${isSelected ? 'text-accent-teal font-extrabold' : 'text-secondary-text font-medium group-hover:text-primary-text'}`}>
                  {problem.text}
                </p>
                {/* Check animado no canto quando selecionado */}
                {isSelected && (
                  <div className="absolute top-3 right-3 text-accent-teal animate-bounce-in">
                    <FaCheckCircle />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Step1_InitialDetails;