// frontend/src/components/steps/Step2_DesiredScenario.jsx
import React from 'react';
import {
  FaGamepad,
  FaBullseye,
  FaBrain,
  FaLightbulb,
  FaGraduationCap,
  FaStar,
  FaUsers,
  FaProjectDiagram
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";
/**
 * Componente para a Etapa 2 do formulário de criação de atividades.
 * Coleta os objetivos de aprendizagem e metas a serem alcançadas.
 * @param {object} props - As propriedades passadas do componente pai.
 * @param {object} props.activityData - O objeto de estado que contém todos os dados do formulário.
 * @param {function} props.handleInputChange - A função para manipular mudanças em inputs de texto.
 * @param {function} props.setActivityData - A função para definir o estado da atividade, ideal para manipular arrays complexos.
 * @param {function} props.openHelpModal - A função para abrir o modal de ajuda do componente pai.
 */
function Step2_DesiredScenario({ activityData, handleInputChange, setActivityData, openHelpModal }) {
  // Array de objetos para os objetivos, facilitando a renderização dos cards com ícones.
  const objectives = [
    { text: "Criar um ambiente de aprendizagem motivador e envolvente", icon: <FaGamepad /> },
    { text: "Aumentar a motivação e a concentração dos alunos", icon: <FaBullseye /> },
    { text: "Desenvolver habilidades cognitivas, sociais e de aprendizagem", icon: <FaBrain /> },
    { text: "Estimular a criatividade e a inovação", icon: <FaLightbulb /> },
    { text: "Aumentar a retenção de conhecimentos e habilidades", icon: <FaGraduationCap /> },
    { text: "Promover a participação ativa dos alunos nas atividades", icon: <FaStar /> },
    { text: "Melhorar a colaboração e o trabalho em equipe", icon: <FaUsers /> },
    { text: "Incentivar a aplicação prática dos conhecimentos teóricos", icon: <FaProjectDiagram /> },
  ];
  const { openHelp } = useHelpModal();
  /**
   * Manipula a seleção de objetivos a partir dos cards.
   * Adiciona ou remove o objetivo do array no estado pai usando setActivityData
   * para uma atualização mais direta e clara do array.
   * @param {string} objectiveText - O texto do objetivo que foi clicado.
   */
  const handleObjectiveSelection = (objectiveText) => {
    const currentObjectives = activityData.desiredScenario.objectives;
    const newObjectives = currentObjectives.includes(objectiveText)
      ? currentObjectives.filter(o => o !== objectiveText)
      : [...currentObjectives, objectiveText];

    // Utiliza setActivityData para atualizar o estado aninhado de forma segura.
    // Esta abordagem é mais explícita e menos propensa a erros do que simular um evento.
    setActivityData(prevData => ({
      ...prevData,
      desiredScenario: {
        ...prevData.desiredScenario,
        objectives: newObjectives,
      },
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SEÇÃO 1: Título e Descrição */}
      <div>
        <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text">
          Qual é o seu Cenário Desejado?
        </h2>
        <p className="mt-2 text-secondary-text dark:text-secondary-text">
          Selecione os principais objetivos que você deseja alcançar com esta atividade. Metas claras são o primeiro passo para o sucesso.
        </p>
      </div>

      {/* SEÇÃO 2: Seleção de Objetivos com Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {objectives.map((objective) => {
          const isSelected = activityData.desiredScenario.objectives.includes(objective.text);
          return (
            <div
              key={objective.text}
              onClick={() => handleObjectiveSelection(objective.text)}
              className={`
                group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-5 text-center transition-all duration-200
                ${isSelected
                  ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                  : 'border-border-color bg-secondary-bg hover:border-teal-400 hover:shadow-lg dark:border-border-color dark:bg-primary-bg dark:hover:border-teal-500'
                }
              `}
            >
              <div className={`text-5xl ${isSelected ? 'text-teal-500' : 'text-secondary-text group-hover:text-teal-500 dark:text-secondary-text dark:group-hover:text-teal-400'}`}>
                {objective.icon}
              </div>
              <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-secondary-text dark:text-secondary-text'}`}>
                {objective.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* SEÇÃO 3: Campo Aberto */}
      <div className="pt-4">
        <label htmlFor="desiredScenario.otherObjective" className="block text-sm font-medium text-secondary-text dark:text-secondary-text">
          Outro objetivo em mente? (Opcional)
        </label>
        <input
          type="text"
          id="desiredScenario.otherObjective"
          name="desiredScenario.otherObjective"
          value={activityData.desiredScenario.otherObjective}
          onChange={handleInputChange}
          className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          placeholder="Descreva um objetivo personalizado"
        />
      </div>

      <button
        onClick={() => openHelp('cenario_desejado')} // Chama pelo ID
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Ajuda
      </button>
    </div>
  );
}

export default Step2_DesiredScenario;