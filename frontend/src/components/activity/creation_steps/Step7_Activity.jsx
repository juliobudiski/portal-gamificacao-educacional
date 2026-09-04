// frontend/src/components/steps/Step6_RewardsOffered.jsx
// Verificado 09/12/2025 - OK

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
  FaInfoCircle,
  FaCheckCircle,
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";
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
  const { openHelp } = useHelpModal();
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
    <div className="space-y-10 animate-fade-in relative pb-10">
      {/* CABEÇALHO DO PASSO */}
      <div className="flex items-center justify-between border-b border-border-color pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow">
            Quais Recompensas Serão Oferecidas?
          </h2>
          <p className="mt-2 text-secondary-text text-lg">
            Escolha os incentivos para motivar seus alunos. Recompensas bem pensadas aumentam o engajamento e a sensação de progresso.
          </p>
        </div>
        <button
          onClick={() => openHelp('recompensas_oferecidas')} // Chama pelo ID
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-primary-bg border border-border-color hover:border-accent-teal/50 hover:bg-accent-teal/10 transition-all duration-300 shadow-sm"
          title="Ajuda sobre este passo"
        >
          <FaInfoCircle className="text-xl text-secondary-text group-hover:text-accent-teal transition-colors" />
        </button>
      </div>

      {/* SEÇÃO 2: Seleção de Recompensas com Cards */}
      <div className="pt-2">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rewards.map((reward) => {
            const isSelected = activityData.rewardsOffered.selectedRewards.includes(reward.text);
            return (
              <div
                key={reward.text}
                onClick={() => handleRewardSelection(reward.text)}
                className={`
                  group relative flex h-full cursor-pointer flex-col items-center justify-start rounded-2xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1
                  ${isSelected
                    ? 'border-2 border-accent-teal bg-gradient-to-br from-accent-teal/20 to-primary-bg shadow-[0_8px_20px_rgba(20,184,166,0.3)]'
                    : 'border border-border-color bg-primary-bg/50 backdrop-blur-sm hover:border-accent-teal/50 hover:shadow-xl'
                  }
                `}
              >
                <div className={`text-5xl mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${isSelected ? 'text-accent-teal' : 'text-secondary-text/80 group-hover:text-accent-teal'}`}>
                  {reward.icon}
                </div>
                <p className={`text-sm leading-relaxed ${isSelected ? 'text-accent-teal font-extrabold' : 'text-secondary-text font-medium group-hover:text-primary-text'}`}>
                  {reward.text}
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
        <label htmlFor="rewardsOffered.otherReward" className="block text-sm font-bold text-secondary-text uppercase tracking-wider mb-3">
          Outra recompensa específica? (Opcional)
        </label>
        <div className="relative">
            <input
            type="text"
            id="rewardsOffered.otherReward"
            name="rewardsOffered.otherReward"
            value={activityData.rewardsOffered.otherReward}
            onChange={handleInputChange}
            className="block w-full px-6 py-4 bg-primary-bg/50 backdrop-blur-sm border border-border-color rounded-2xl shadow-inner focus:ring-2 focus:ring-accent-teal focus:border-transparent text-primary-text text-lg transition-all duration-300 group-hover:border-accent-teal/50"
            placeholder="Descreva uma recompensa personalizada"
            />
        </div>
      </div>
    </div>
  );
}

export default Step6_RewardsOffered;