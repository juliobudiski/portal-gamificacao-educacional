// frontend/src/components/steps/Step4_PlayerProfile.jsx
// Verificado 09/12/2025 - OK

import React from 'react';
import {
  FaTrophy,
  FaUsers,
  FaBookOpen,
  FaAward,
  FaComments,
  FaCheckCircle,
  FaInfoCircle
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";

/**
 * @component Step4_Activity
 * @description
 * Fourth step of the activity creation wizard, profiling the target student audience (Competitive, Social, Explorer, Achiever).
 * 
 * Architectural Decisions:
 * - Constant Mapping: Uses a static `playerProfiles` dictionary to define the UI elements (icons, descriptions) for each profile type.
 * - Array Toggling: Implements an immutable array toggle pattern in `handleProfileSelection` to add or remove strings from the `selectedProfiles` state.
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
    <div id="tour-step-profiles" className="space-y-10 animate-fade-in relative">
      {/* CABEÇALHO DO PASSO */}
      <div className="flex items-center justify-between border-b border-border-color pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow">
            Perfil do Jogador
          </h2>
          <p className="mt-2 text-secondary-text text-lg">
            Quais perfis você quer engajar? Isso ajuda a definir os elementos gamificados.
          </p>
        </div>
        <button
          onClick={() => openHelp('perfil_jogador')}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-primary-bg border border-border-color hover:border-accent-teal/50 hover:bg-accent-teal/10 transition-all duration-300 shadow-sm"
          title="Ajuda sobre este passo"
        >
          <FaInfoCircle className="text-xl text-secondary-text group-hover:text-accent-teal transition-colors" />
        </button>
      </div>

      {/* SEÇÃO 2: Seleção de Perfis com Cards */}
      <div className="pt-2">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {playerProfiles.map((profile) => {
            const isSelected = activityData.playerProfile.selectedProfiles.includes(profile.name);
            return (
              <div
                key={profile.name}
                onClick={() => handleProfileSelection(profile.name)}
                className={`
                  group relative flex h-full cursor-pointer flex-col items-center justify-start rounded-2xl p-8 text-center transition-all duration-300 transform hover:-translate-y-1
                  ${isSelected
                    ? 'border-2 border-accent-teal bg-gradient-to-br from-accent-teal/20 to-primary-bg shadow-[0_8px_20px_rgba(20,184,166,0.3)]'
                    : 'border border-border-color bg-primary-bg/50 backdrop-blur-sm hover:border-accent-teal/50 hover:shadow-xl'
                  }
                `}
              >
                <div className={`text-6xl mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${isSelected ? 'text-accent-teal' : 'text-secondary-text/80 group-hover:text-accent-teal'}`}>
                  {profile.icon}
                </div>
                <h4 className={`text-xl font-extrabold mb-3 ${isSelected ? 'text-accent-teal' : 'text-primary-text'}`}>
                  {profile.name}
                </h4>
                <p className={`text-sm leading-relaxed ${isSelected ? 'text-primary-text font-medium' : 'text-secondary-text'}`}>
                  {profile.description}
                </p>
                {/* Check animado no canto quando selecionado */}
                {isSelected && (
                  <div className="absolute top-4 right-4 text-accent-teal animate-bounce-in">
                    <FaCheckCircle className="text-xl" />
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

export default Step4_PlayerProfile;
