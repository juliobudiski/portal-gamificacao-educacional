// frontend/src/components/steps/Step6_RewardsOffered.jsx
import React from 'react';
import {
  FaPlusCircle,
  FaAward,
  FaStar,
  FaHourglassHalf,
  FaMicrophoneAlt,
  FaKey,
  FaGift,
  FaCertificate,
  FaUserTie,
  FaFilm,
  FaDoorOpen,
  FaPlane,
  FaBullhorn,
  FaHandsHelping,
  FaMoneyBillWave,
} from 'react-icons/fa';

/**
 * Componente para a Etapa 6 do formulário de criação de atividades.
 * Focado na seleção das recompensas que serão oferecidas aos alunos.
 * @param {object} props - As propriedades passadas do componente pai.
 * @param {object} props.activityData - O objeto de estado que contém todos os dados do formulário.
 * @param {function} props.handleInputChange - A função para manipular mudanças em inputs de texto.
 * @param {function} props.setActivityData - A função para definir o estado da atividade, ideal para manipular arrays.
 */
function Step6_RewardsOffered({ activityData, handleInputChange, setActivityData }) {
  // Array de objetos para as recompensas, facilitando a renderização dos cards com ícones.
  const rewards = [
    { text: "Pontos de bônus para a participação.", icon: <FaPlusCircle /> },
    { text: "Conquistas digitais para metas alcançadas.", icon: <FaAward /> },
    { text: "Vantagens para jogos e desafios.", icon: <FaStar /> },
    { text: "Tempo extra para atividades divertidas.", icon: <FaHourglassHalf /> },
    { text: "Destaque na apresentação de trabalhos.", icon: <FaMicrophoneAlt /> },
    { text: "Acesso a recursos exclusivos.", icon: <FaKey /> },
    { text: "Brindes (canetas, adesivos, livros).", icon: <FaGift /> },
    { text: "Certificados digitais de conclusão.", icon: <FaCertificate /> },
    { text: "Oportunidades para liderar a turma.", icon: <FaUserTie /> },
    { text: "Acesso a vídeos ou jogos extras.", icon: <FaFilm /> },
    { text: "Acesso a um espaço diferenciado.", icon: <FaDoorOpen /> },
    { text: "Participação em eventos ou viagens.", icon: <FaPlane /> },
    { text: "Reconhecimento público na turma.", icon: <FaBullhorn /> },
    { text: "Oportunidades para mentorar colegas.", icon: <FaHandsHelping /> },
    { text: "Prêmios em dinheiro ou descontos.", icon: <FaMoneyBillWave /> },
  ];

  /**
   * Manipula a seleção de recompensas a partir dos cards.
   * Adiciona ou remove a recompensa do array no estado pai.
   * @param {string} rewardText - O texto da recompensa que foi clicada.
   */
  const handleRewardSelection = (rewardText) => {
    // Utiliza setActivityData para uma atualização de estado aninhado mais segura e explícita.
    setActivityData(prevData => {
      const currentRewards = prevData.rewardsOffered.selectedRewards;
      const newRewards = currentRewards.includes(rewardText)
        ? currentRewards.filter(r => r !== rewardText)
        : [...currentRewards, rewardText];

      return {
        ...prevData,
        rewardsOffered: {
          ...prevData.rewardsOffered,
          selectedRewards: newRewards,
        },
      };
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SEÇÃO 1: Título e Descrição */}
      <div>
        <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text">
          Quais Recompensas Serão Oferecidas?
        </h2>
        <p className="mt-2 text-secondary-text dark:text-secondary-text">
          Escolha os incentivos para motivar seus alunos. Recompensas bem pensadas aumentam o engajamento e a sensação de progresso.
        </p>
      </div>

      {/* SEÇÃO 2: Seleção de Recompensas com Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {rewards.map((reward) => {
          const isSelected = activityData.rewardsOffered.selectedRewards.includes(reward.text);
          return (
            <div
              key={reward.text}
              onClick={() => handleRewardSelection(reward.text)}
              className={`
                group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-2 rounded-xl border p-4 text-center transition-all duration-200
                ${isSelected
                  ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                  : 'border-gray-300 bg-secondary-bg hover:border-teal-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-500'
                }
              `}
            >
              <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-secondary-text group-hover:text-teal-500 dark:text-secondary-text dark:group-hover:text-teal-400'}`}>
                {reward.icon}
              </div>
              <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-gray-700 dark:text-secondary-text'}`}>
                {reward.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* SEÇÃO 3: Campo Aberto */}
      <div className="pt-4">
        <label htmlFor="rewardsOffered.otherReward" className="block text-sm font-medium text-gray-700 dark:text-secondary-text">
          Outra recompensa específica? (Opcional)
        </label>
        <input
          type="text"
          id="rewardsOffered.otherReward"
          name="rewardsOffered.otherReward"
          value={activityData.rewardsOffered.otherReward}
          onChange={handleInputChange}
          className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          placeholder="Descreva uma recompensa personalizada"
        />
      </div>
    </div>
  );
}

export default Step6_RewardsOffered;