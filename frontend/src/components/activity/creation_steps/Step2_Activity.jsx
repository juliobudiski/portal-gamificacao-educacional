// frontend/src/components/activity/creation_steps/Step2_Activity.jsx
import React, { useState, useEffect } from 'react';
import {
  FaGamepad, FaBullseye, FaBrain, FaLightbulb, FaUsers,
  FaProjectDiagram, FaRocket, FaWrench, FaCubes, FaShieldAlt,
  FaSearch, FaCheckDouble, FaBriefcase, FaHandshake
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";

/**
 * Criação de Atividade - Passo 2 (Mecânicas e Gamificação)
 * 
 * Permite ao professor configurar regras de jogo, pontuação (XP), restrições de tempo
 * e recompensas associadas à atividade.
 */


// DADOS DA LITERATURA E GERAIS
const SUBDOMAIN_OBJECTIVES = {
  "Fundamentos e Programação Introdutória": [
    { text: "Desenvolvimento do Pensamento Computacional e Raciocínio Lógico", icon: <FaBrain /> },
    { text: "Aumento de Motivação e Engajamento Inicial", icon: <FaRocket /> },
    { text: "Proficiência na Resolução de Problemas", icon: <FaWrench /> }
  ],
  "Engenharia de Software e Projetos": [
    { text: "Pensamento Sistêmico e Arquitetural", icon: <FaProjectDiagram /> },
    { text: "Proficiência na Modelagem de Soluções", icon: <FaCubes /> },
    { text: "Habilidades de Colaboração e Comunicação", icon: <FaUsers /> }
  ],
  "Testes e Qualidade de Software": [
    { text: "Internalizar a Cultura de 'Qualidade em Primeiro Lugar' (Shift-Left)", icon: <FaShieldAlt /> },
    { text: "Rigor Analítico e Ceticismo Profissional", icon: <FaSearch /> },
    { text: "Domínio da Verificação vs. Validação", icon: <FaCheckDouble /> }
  ]
};

// Lista ampla de metas comuns
const GENERIC_OBJECTIVES = [
  { text: "Aumentar a motivação e o engajamento geral", icon: <FaBullseye /> },
  { text: "Melhorar a cooperação e trabalho em equipe", icon: <FaHandshake /> },
  { text: "Promover autonomia no aprendizado", icon: <FaRocket /> },
  { text: "Fixação de conteúdo de forma lúdica", icon: <FaGamepad /> },
  { text: "Desenvolver criatividade e inovação", icon: <FaLightbulb /> },
  { text: "Preparar alunos para a realidade do mercado", icon: <FaBriefcase /> }
];

function Step2_DesiredScenario({ activityData, handleInputChange, setActivityData }) {
  const { openHelp } = useHelpModal();
  const [displayedObjectives, setDisplayedObjectives] = useState(GENERIC_OBJECTIVES);

  const isComputingArea = activityData.areaKnowledge === "Computação e Engenharia de Software";

  // Mistura as metas específicas com TODAS as genéricas
  useEffect(() => {
    if (isComputingArea && activityData.subdomain && SUBDOMAIN_OBJECTIVES[activityData.subdomain]) {
      setDisplayedObjectives([
        ...SUBDOMAIN_OBJECTIVES[activityData.subdomain],
        ...GENERIC_OBJECTIVES
      ]);
    } else {
      setDisplayedObjectives(GENERIC_OBJECTIVES);
    }
  }, [activityData.subdomain, activityData.areaKnowledge, isComputingArea]);

  const handleObjectiveSelection = (objectiveText) => {
    const currentObjectives = activityData.desiredScenario.objectives;
    const newObjectives = currentObjectives.includes(objectiveText)
      ? currentObjectives.filter(o => o !== objectiveText)
      : [...currentObjectives, objectiveText];

    setActivityData(prevData => ({
      ...prevData,
      desiredScenario: { ...prevData.desiredScenario, objectives: newObjectives },
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-primary-text">
          Cenário Desejado
        </h2>
        <p className="mt-2 text-secondary-text">
          {activityData.subdomain
            ? <span>Considerando o foco em <span className="text-teal-600 font-semibold">{activityData.subdomain}</span>, quais são suas metas?</span>
            : "Selecione os principais objetivos que você deseja alcançar com esta atividade."
          }
        </p>
        <p className="text-sm text-secondary-text mt-1">Selecione pelo menos uma meta para continuar.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayedObjectives.map((objective) => {
          const isSelected = activityData.desiredScenario.objectives.includes(objective.text);
          return (
            <div
              key={objective.text}
              onClick={() => handleObjectiveSelection(objective.text)}
              className={`
                group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-5 text-center transition-all duration-200
                ${isSelected
                  ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 shadow-md'
                  : 'border-border-color bg-secondary-bg hover:border-teal-400 hover:shadow-lg dark:border-border-color dark:bg-primary-bg'
                }
              `}
            >
              <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-secondary-text group-hover:text-teal-500 dark:text-secondary-text'}`}>
                {objective.icon}
              </div>
              <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-secondary-text'}`}>
                {objective.text}
              </p>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t dark:border-gray-700">
        <label htmlFor="desiredScenario.otherObjective" className="block text-sm font-medium text-secondary-text">
          Outro objetivo em mente? (Opcional)
        </label>
        <input
          type="text"
          id="desiredScenario.otherObjective"
          name="desiredScenario.otherObjective"
          value={activityData.desiredScenario.otherObjective || ''}
          onChange={handleInputChange}
          className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          placeholder="Ex: Preparar alunos para a maratona de programação..."
        />
      </div>

      <button
        onClick={() => openHelp('cenario_desejado')}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Ajuda
      </button>
    </div>
  );
}

export default Step2_DesiredScenario;