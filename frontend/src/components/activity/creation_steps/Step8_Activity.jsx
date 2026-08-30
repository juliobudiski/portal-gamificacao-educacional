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
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";
/**
 * Componente para a Etapa 7 do formulário de criação de atividades.
 * Focado na seleção das ações dos alunos que serão elegíveis para recompensas.
 * @param {object} props - As propriedades passadas do componente pai.
 * @param {object} props.activityData - O objeto de estado que contém todos os dados do formulário.
 * @param {function} props.handleInputChange - A função para manipular mudanças em inputs de texto.
 * @param {function} props.setActivityData - A função para definir o estado da atividade, ideal para manipular arrays.
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
    <div className="space-y-8 animate-fade-in">
      {/* SEÇÃO 1: Título e Descrição */}
      <div>
        <h2 className="text-2xl font-bold text-primary-text">
          Quais Ações Valem Recompensas?
        </h2>
        <p className="mt-2 text-secondary-text">
          Defina quais comportamentos e conquistas dos alunos serão recompensados. Ações claras incentivam o engajamento direcionado.
        </p>
      </div>

      {/* SEÇÃO 2: Seleção de Ações com Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {rewardedActions.map((action) => {
          const isSelected = activityData.rewardedActions.selectedActions.includes(action.text);
          return (
            <div
              key={action.text}
              onClick={() => handleActionSelection(action.text)}
              className={`
                group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-2 rounded-xl border p-4 text-center transition-all duration-200
                ${isSelected
                  ? 'border-2 border-accent-teal bg-accent-teal/10 shadow-[0_0_15px_rgba(var(--accent-teal),0.2)]'
                  : 'border-border-color bg-secondary-bg hover:border-accent-teal/50 hover:shadow-lg'
                }
              `}
            >
              <div className={`text-4xl transition-transform group-hover:scale-110 ${isSelected ? 'text-accent-teal' : 'text-secondary-text group-hover:text-accent-teal'}`}>
                {action.icon}
              </div>
              <p className={`text-sm font-medium ${isSelected ? 'text-accent-teal font-bold' : 'text-secondary-text'}`}>
                {action.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* SEÇÃO 3: Campo Aberto */}
      <div className="pt-4">
        <label htmlFor="rewardedActions.otherAction" className="block text-sm font-medium text-secondary-text">
          Outra ação a ser recompensada? (Opcional)
        </label>
        <input
          type="text"
          id="rewardedActions.otherAction"
          name="rewardedActions.otherAction"
          value={activityData.rewardedActions.otherAction}
          onChange={handleInputChange}
          className="mt-1 block w-full px-4 py-2 bg-primary-bg border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-teal text-primary-text sm:text-sm"
          placeholder="Descreva uma ação personalizada"
        />
      </div>
      <button
        onClick={() => openHelp('acoes_recompensadas')} // Chama pelo ID
        className="bg-info text-white px-4 py-2 rounded-lg font-bold hover:bg-info/90 transition-colors"
      >
        Ajuda
      </button>
    </div>
  );
}

export default Step7_RewardedActions;