// frontend/src/components/steps/Step4_PlayerProfile.jsx
// Verificado 09/12/2025 - OK

import React from 'react';
import {
  FaTrophy,
  FaUsers,
  FaBookOpen,
  FaAward,
  FaComments
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";

/**
 * Componente para a Etapa 4 do formulário de criação de atividades.
 * Permite ao professor selecionar os perfis de jogador que deseja engajar.
 * @param {object} props - As propriedades passadas do componente pai.
 * @param {object} props.activityData - O objeto de estado que contém todos os dados do formulário.
 * @param {function} props.setActivityData - A função para definir o estado da atividade, ideal para manipular arrays.
 * @param {function} props.openHelpModal - A função para abrir o modal de ajuda do componente pai.
 */
function Step4_PlayerProfile({ activityData, setActivityData, openHelpModal }) {
  // Array de objetos para os perfis de jogadores com descrições e ícones.
  const playerProfiles = [
    {
      name: "Competitivo",
      description: "Motivado por desafios, rankings e por ser melhor que os demais.",
      icon: <FaTrophy />
    },
    {
      name: "Social",
      description: "Valoriza a colaboração, o trabalho em equipe e a conexão com outros.",
      icon: <FaUsers /> // Antigo "Cooperativo/Social" fundidos
    },
    {
      name: "Explorador",
      description: "Busca se aprofundar na narrativa, descobrir o mundo e aprender o contexto.",
      icon: <FaBookOpen /> // Antigo "Imersivo"
    },
    {
      name: "Realizador",
      description: "Focado em completar tarefas, coletar pontos e alcançar metas.",
      icon: <FaAward />
    }
  ];
  const { openHelp } = useHelpModal();

  /**
   * Manipula a seleção de perfis de jogador a partir dos cards.
   * Adiciona ou remove o perfil do array no estado pai usando setActivityData.
   * @param {string} profileName - O nome do perfil que foi clicado.
   */
  const handleProfileSelection = (profileName) => {
    setActivityData(prevData => {
      const currentProfiles = prevData.playerProfile.selectedProfiles;
      const newProfiles = currentProfiles.includes(profileName)
        ? currentProfiles.filter(p => p !== profileName)
        : [...currentProfiles, profileName];

      return {
        ...prevData,
        playerProfile: {
          ...prevData.playerProfile,
          selectedProfiles: newProfiles,
        },
      };
    });
  };

  return (
    <div id="tour-step-profiles" className="space-y-8 animate-fade-in">
      {/* SEÇÃO 1: Título e Descrição */}
      <div>
        <h2 className="text-2xl font-bold text-primary-text">
          Qual perfil de jogador você quer engajar?
        </h2>
        <p className="mt-2 text-secondary-text">
          Selecionar os perfis corretos ajuda a definir os elementos de gamificação mais eficazes para a sua atividade.
        </p>
      </div>

      {/* SEÇÃO 2: Seleção de Perfis com Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {playerProfiles.map((profile) => {
          const isSelected = activityData.playerProfile.selectedProfiles.includes(profile.name);
          return (
            <div
              key={profile.name}
              onClick={() => handleProfileSelection(profile.name)}
              className={`
                group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-6 text-center transition-all duration-200
                ${isSelected
                  ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                  : 'border-border-color bg-secondary-bg hover:border-teal-400 hover:shadow-lg dark:border-border-color dark:bg-primary-bg dark:hover:border-teal-500'
                }
              `}
            >
              <div className={`text-5xl mb-2 ${isSelected ? 'text-teal-500' : 'text-secondary-text group-hover:text-teal-500 dark:text-secondary-text dark:group-hover:text-teal-400'}`}>
                {profile.icon}
              </div>
              <h4 className={`text-base font-semibold ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-primary-text dark:text-secondary-text'}`}>
                {profile.name}
              </h4>
              <p className={`text-xs ${isSelected ? 'text-teal-700 dark:text-teal-200' : 'text-secondary-text'}`}>
                {profile.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* SEÇÃO 3: Botão de Ajuda */}

      <button
        onClick={() => openHelp('perfil_jogador')} // Chama pelo ID
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Ajuda
      </button>

    </div>
  );
}

export default Step4_PlayerProfile;
