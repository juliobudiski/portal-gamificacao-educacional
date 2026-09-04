// frontend/src/components/activity/creation_steps/Step2_Activity.jsx
import React, { useState, useEffect } from 'react';
import {
  FaGamepad, FaBullseye, FaBrain, FaLightbulb, FaUsers,
  FaProjectDiagram, FaRocket, FaWrench, FaCubes, FaShieldAlt,
  FaSearch, FaCheckDouble, FaBriefcase, FaHandshake, FaCheckCircle, FaInfoCircle
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
    <div className="space-y-10 animate-fade-in relative">
      {/* CABEÇALHO DO PASSO */}
      <div className="flex items-center justify-between border-b border-border-color pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow">
            Cenário Desejado
          </h2>
          <p className="mt-2 text-secondary-text text-lg">
            {activityData.subdomain
              ? <span>Considerando o foco em <span className="text-accent-teal font-extrabold">{activityData.subdomain}</span>, quais são suas metas?</span>
              : "Selecione os principais objetivos que você deseja alcançar com esta atividade."
            }
          </p>
        </div>
        <button
          onClick={() => openHelp('cenario_desejado')}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-primary-bg border border-border-color hover:border-accent-teal/50 hover:bg-accent-teal/10 transition-all duration-300 shadow-sm"
          title="Ajuda sobre este passo"
        >
          <FaInfoCircle className="text-xl text-secondary-text group-hover:text-accent-teal transition-colors" />
        </button>
      </div>

      <div className="pt-2">
        <p className="text-base text-secondary-text mb-8">Selecione pelo menos uma meta para continuarmos a moldar a atividade.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedObjectives.map((objective) => {
            const isSelected = activityData.desiredScenario.objectives.includes(objective.text);
            return (
              <div
                key={objective.text}
                onClick={() => handleObjectiveSelection(objective.text)}
                className={`
                  group relative flex h-full cursor-pointer flex-col items-center justify-start rounded-2xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1
                  ${isSelected
                    ? 'border-2 border-accent-teal bg-gradient-to-br from-accent-teal/20 to-primary-bg shadow-[0_8px_20px_rgba(20,184,166,0.3)]'
                    : 'border border-border-color bg-primary-bg/50 backdrop-blur-sm hover:border-accent-teal/50 hover:shadow-xl'
                  }
                `}
              >
                <div className={`text-4xl mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${isSelected ? 'text-accent-teal' : 'text-secondary-text/80 group-hover:text-accent-teal'}`}>
                  {objective.icon}
                </div>
                <p className={`text-sm leading-relaxed ${isSelected ? 'text-accent-teal font-extrabold' : 'text-secondary-text font-medium group-hover:text-primary-text'}`}>
                  {objective.text}
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

      <div className="pt-8 border-t border-border-color group">
        <label htmlFor="desiredScenario.otherObjective" className="block text-sm font-bold text-secondary-text uppercase tracking-wider mb-3">
          Outro objetivo em mente? (Opcional)
        </label>
        <div className="relative">
            <input
            type="text"
            id="desiredScenario.otherObjective"
            name="desiredScenario.otherObjective"
            value={activityData.desiredScenario.otherObjective || ''}
            onChange={handleInputChange}
            className="block w-full px-6 py-4 bg-primary-bg/50 backdrop-blur-sm border border-border-color rounded-2xl shadow-inner focus:ring-2 focus:ring-accent-teal focus:border-transparent text-primary-text text-lg transition-all duration-300 group-hover:border-accent-teal/50"
            placeholder="Ex: Preparar alunos para a maratona de programação..."
            />
        </div>
      </div>
    </div>
  );
}

export default Step2_DesiredScenario;