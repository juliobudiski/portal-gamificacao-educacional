// frontend/src/components/steps/Step7_RewardedActions.jsx
// Verificado 09/12/2025 - OK

import React from 'react';
import {
  FaComments,
  FaCalendarCheck,
  FaTrophy,
  FaUsers,
  FaPaintBrush,
  FaBrain,
  FaQuestionCircle,
  FaHandsHelping,
  FaChalkboardTeacher,
  FaBell,
  FaBookReader,
  FaBoxOpen,
  FaUserTie,
  FaInfoCircle,
  FaCheckCircle,
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";
/**
 * Step7_RewardedActions
 * 
 * Architectural intent: Orchestrates the 'Rewarded Actions' step of the activity creation wizard.
 * It functions as a Container component that abstracts the domain logic of selecting gamification actions,
 * managing an internal predefined catalog of actions while synchronizing with the parent's centralized form state.
 */
function Step7_RewardedActions({ activityData, handleInputChange, setActivityData }) {
  // Array de objetos para as ações recompensadas, facilitando a renderização dos cards.
  const rewardedActions = [
    { text: "Participação ativa nas discussões em aula.", icon: <FaComments /> },
    { text: "Conclusão de tarefas antes do prazo.", icon: <FaCalendarCheck /> },
    { text: "Atingir uma pontuação elevada em um jogo.", icon: <FaTrophy /> },
    { text: "Colaboração efetiva em projetos de grupo.", icon: <FaUsers /> },
    { text: "Contribuição criativa em atividades.", icon: <FaPaintBrush /> },
    { text: "Demonstrar pensamento crítico em desafios.", icon: <FaBrain /> },
    { text: "Responder corretamente a perguntas de revisão.", icon: <FaQuestionCircle /> },
    { text: "Auxiliar um colega com dificuldades.", icon: <FaHandsHelping /> },
    { text: "Apresentar um trabalho com excelência.", icon: <FaChalkboardTeacher /> },
    { text: "Atender prontamente às solicitações.", icon: <FaBell /> },
    { text: "Realizar atividades extras para aprofundar.", icon: <FaBookReader /> },
    { text: "Cuidar e organizar o material escolar.", icon: <FaBoxOpen /> },
    { text: "Demonstrar habilidades de liderança.", icon: <FaUserTie /> },
  ];
  const { openHelp } = useHelpModal();
  /**
   * Manipula a seleção de ações a partir dos cards.
   * Adiciona ou remove a ação do array no estado pai.
   * @param {string} actionText - O texto da ação que foi clicada.
   */
  const handleActionSelection = (actionText) => {
    // Utiliza setActivityData para uma atualização de estado aninhado mais segura e explícita.
    setActivityData(prevData => {
      const currentActions = prevData.rewardedActions.selectedActions;
      const newActions = currentActions.includes(actionText)
        ? currentActions.filter(a => a !== actionText)
        : [...currentActions, actionText];

      return {
        ...prevData,
        rewardedActions: {
          ...prevData.rewardedActions,
          selectedActions: newActions,
        },
      };
    });
  };

  return (
    <div className="space-y-10 animate-fade-in relative pb-10">
      {/* CABEÇALHO DO PASSO */}
      <div className="flex items-center justify-between border-b border-border-color pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow">
            Quais Ações Valem Recompensas?
          </h2>
          <p className="mt-2 text-secondary-text text-lg">
            Defina quais comportamentos e conquistas dos alunos serão recompensados. Ações claras incentivam o engajamento direcionado.
          </p>
        </div>
        <button
          onClick={() => openHelp('acoes_recompensadas')} // Chama pelo ID
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-primary-bg border border-border-color hover:border-accent-teal/50 hover:bg-accent-teal/10 transition-all duration-300 shadow-sm"
          title="Ajuda sobre este passo"
        >
          <FaInfoCircle className="text-xl text-secondary-text group-hover:text-accent-teal transition-colors" />
        </button>
      </div>

      {/* SEÇÃO 2: Seleção de Ações com Cards */}
      <div className="pt-2">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rewardedActions.map((action) => {
            const isSelected = activityData.rewardedActions.selectedActions.includes(action.text);
            return (
              <div
                key={action.text}
                onClick={() => handleActionSelection(action.text)}
                className={`
                  group relative flex h-full cursor-pointer flex-col items-center justify-start rounded-2xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1
                  ${isSelected
                    ? 'border-2 border-accent-teal bg-gradient-to-br from-accent-teal/20 to-primary-bg shadow-[0_8px_20px_rgba(20,184,166,0.3)]'
                    : 'border border-border-color bg-primary-bg/50 backdrop-blur-sm hover:border-accent-teal/50 hover:shadow-xl'
                  }
                `}
              >
                <div className={`text-5xl mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${isSelected ? 'text-accent-teal' : 'text-secondary-text/80 group-hover:text-accent-teal'}`}>
                  {action.icon}
                </div>
                <p className={`text-sm leading-relaxed ${isSelected ? 'text-accent-teal font-extrabold' : 'text-secondary-text font-medium group-hover:text-primary-text'}`}>
                  {action.text}
                </p>
                {/* Check animado no canto quando selecionado */}
                {isSelected && (
                  <div className="absolute top-3 right-3 text-accent-teal animate-bounce-in">
                    <FaCheckCircle className="text-xl" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 3: Campo Aberto */}
      <div className="pt-8 border-t border-border-color group">
        <label htmlFor="rewardedActions.otherAction" className="block text-sm font-bold text-secondary-text uppercase tracking-wider mb-3">
          Outra ação a ser recompensada? (Opcional)
        </label>
        <div className="relative">
            <input
            type="text"
            id="rewardedActions.otherAction"
            name="rewardedActions.otherAction"
            value={activityData.rewardedActions.otherAction}
            onChange={handleInputChange}
            className="block w-full px-6 py-4 bg-primary-bg/50 backdrop-blur-sm border border-border-color rounded-2xl shadow-inner focus:ring-2 focus:ring-accent-teal focus:border-transparent text-primary-text text-lg transition-all duration-300 group-hover:border-accent-teal/50"
            placeholder="Descreva uma ação personalizada"
            />
        </div>
      </div>
    </div>
  );
}

export default Step7_RewardedActions;