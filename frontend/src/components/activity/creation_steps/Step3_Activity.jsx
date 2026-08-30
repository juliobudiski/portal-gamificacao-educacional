// frontend/src/components/activity/creation_steps/Step3_Activity.jsx
import React from 'react';
import {
  FaChalkboardTeacher,
  FaLaptop,
  FaUser,
  FaUsers,
  FaTools,
  FaClipboardCheck,
  FaFileSignature,
  FaCodeBranch,
  FaCloud,
  FaTrophy
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";

// Separamos as opções excludentes das opções cumulativas
const LOGISTIC_ENVIRONMENTS = [
  { text: "Presencial em Laboratório (Com PC/Internet)", icon: <FaLaptop /> },
  { text: "Presencial Desplugado (Sala Clássica sem Telas)", icon: <FaChalkboardTeacher /> },
  { text: "Online / Ensino a Distância", icon: <FaCloud /> },
];

const ACTIVITY_CHARACTERISTICS = [
  { text: "Formativa (prática ou revisão)", icon: <FaClipboardCheck /> },
  { text: "Somativa (avaliação)", icon: <FaFileSignature /> },
  { text: "Foco em projetos e desenvolvimento", icon: <FaCodeBranch /> },
  { text: "Uso de plataformas de aprendizado", icon: <FaTools /> },
  { text: "Níveis de dificuldade progressivos", icon: <FaTrophy /> },
];

function Step3_ActivityPlanning({ activityData, handleInputChange, setActivityData }) {
  const { openHelp } = useHelpModal();

  // Função para lidar com opções de múltipla escolha normais
  const handleCharacteristicSelection = (charText) => {
    setActivityData(prevData => {
      const currentChars = prevData.activityPlanning.characteristics;
      const newChars = currentChars.includes(charText)
        ? currentChars.filter(c => c !== charText)
        : [...currentChars, charText];

      return {
        ...prevData,
        activityPlanning: {
          ...prevData.activityPlanning,
          characteristics: newChars,
        },
      };
    });
  };

  // NOVA FUNÇÃO: Força escolha única para o Ambiente
  const handleEnvironmentSelection = (envText) => {
    setActivityData(prevData => {
      let currentChars = prevData.activityPlanning.characteristics;

      // Remove qualquer ambiente que já estava selecionado
      const envNames = LOGISTIC_ENVIRONMENTS.map(e => e.text);
      currentChars = currentChars.filter(c => !envNames.includes(c));

      // Adiciona apenas o novo ambiente clicado
      const newChars = [...currentChars, envText];

      return {
        ...prevData,
        activityPlanning: {
          ...prevData.activityPlanning,
          characteristics: newChars,
        },
      };
    });
  };

  const handleModeSelection = (isTeam) => {
    setActivityData(prevData => ({
      ...prevData,
      activityPlanning: {
        ...prevData.activityPlanning,
        isTeamActivity: isTeam
      }
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-primary-text">
          Planejamento da Atividade
        </h2>
        <p className="mt-2 text-secondary-text">
          Descreva as características e a logística da atividade. Essas informações são cruciais para um bom planejamento.
        </p>
      </div>

      <div
        id="tour-step-dynamics-options"
        className={`bg-primary-bg border p-6 rounded-xl transition-all duration-300 ${typeof activityData.activityPlanning.isTeamActivity !== 'boolean' ? 'border-red-500 shadow-lg shadow-red-500/10' : 'border-border-color'
          }`}
      >
        <h3 className="text-lg font-semibold text-primary-text mb-4 flex items-center gap-2">
          Dinâmica de Participação <span className="text-xs font-normal text-secondary-text bg-secondary-bg px-2 py-1 rounded-full border border-border-color">Obrigatório (Escolha Única)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => handleModeSelection(false)}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4
              ${activityData.activityPlanning.isTeamActivity === false
                ? 'border-accent-teal bg-accent-teal/10'
                : 'border-border-color hover:border-gray-400 bg-secondary-bg opacity-70 hover:opacity-100'}
            `}
          >
            <div className={`p-3 rounded-full ${activityData.activityPlanning.isTeamActivity === false ? 'bg-accent-teal text-white' : 'bg-hover-bg-color0 text-secondary-text'}`}>
              <FaUser size={24} />
            </div>
            <div>
              <h4 className="font-bold text-primary-text">Jornada Individual</h4>
              <p className="text-sm text-secondary-text">Cada aluno progride sozinho e vê apenas seu próprio avatar.</p>
            </div>
          </div>

          <div
            onClick={() => handleModeSelection(true)}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4
              ${activityData.activityPlanning.isTeamActivity === true
                ? 'border-accent-purple bg-accent-purple/10'
                : 'border-border-color hover:border-gray-400 bg-secondary-bg opacity-70 hover:opacity-100'}
            `}
          >
            <div className={`p-3 rounded-full ${activityData.activityPlanning.isTeamActivity === true ? 'bg-accent-purple text-white' : 'bg-hover-bg-color0 text-secondary-text'}`}>
              <FaUsers size={24} />
            </div>
            <div>
              <h4 className="font-bold text-primary-text">Expedição em Equipe</h4>
              <p className="text-sm text-secondary-text">Alunos veem o progresso dos colegas no tabuleiro em tempo real.</p>
            </div>
          </div>
        </div>
      </div>

      {/* NOVO: SEÇÃO DE AMBIENTE EXCLUDENTE */}
      <div>
        <h3 className="text-lg font-semibold text-primary-text flex items-center gap-2 mb-4">
          Ambiente de Aplicação <span className="text-xs font-normal text-secondary-text bg-secondary-bg px-2 py-1 rounded-full border border-border-color">Obrigatório (Escolha Única)</span>
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {LOGISTIC_ENVIRONMENTS.map((env) => {
            const isSelected = activityData.activityPlanning.characteristics.includes(env.text);
            return (
              <div
                key={env.text}
                onClick={() => handleEnvironmentSelection(env.text)}
                className={`
                  group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-5 text-center transition-all duration-200
                  ${isSelected
                    ? 'border-2 border-accent-yellow bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-500/20'
                    : 'border-border-color bg-secondary-bg hover:border-accent-yellow/50 hover:shadow-lg'
                  }
                `}
              >
                <div className={`text-4xl ${isSelected ? 'text-accent-yellow' : 'text-secondary-text group-hover:text-accent-yellow/80'}`}>
                  {env.icon}
                </div>
                <p className={`text-sm font-medium ${isSelected ? 'text-yellow-800 dark:text-yellow-100' : 'text-secondary-text'}`}>
                  {env.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-primary-text">
          Outras Características (Múltipla Escolha)
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIVITY_CHARACTERISTICS.map((char) => {
            const isSelected = activityData.activityPlanning.characteristics.includes(char.text);
            return (
              <div
                key={char.text}
                onClick={() => handleCharacteristicSelection(char.text)}
                className={`
                  group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-5 text-center transition-all duration-200
                  ${isSelected
                    ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                    : 'border-border-color bg-secondary-bg hover:border-teal-400 hover:shadow-lg'
                  }
                `}
              >
                <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-secondary-text group-hover:text-teal-500'}`}>
                  {char.icon}
                </div>
                <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-secondary-text'}`}>
                  {char.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-semibold text-primary-text">
          Detalhes Logísticos
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-secondary-text">Quantidade de participantes</label>
            <input type="text" name="activityPlanning.participantsQuantity" value={activityData.activityPlanning.participantsQuantity} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 sm:text-sm" placeholder="Ex: 25 alunos" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-text">Duração prevista</label>
            <input type="text" name="activityPlanning.expectedDuration" value={activityData.activityPlanning.expectedDuration} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 bg-secondary-bg border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 sm:text-sm" placeholder="Ex: 90 minutos" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-text">Localização</label>
            <input type="text" name="activityPlanning.location" value={activityData.activityPlanning.location} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 bg-secondary-bg border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 sm:text-sm" placeholder="Ex: Laboratório 5, Online (Discord)" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-text">Outras informações relevantes (Opcional)</label>
            <textarea name="activityPlanning.otherInfo" value={activityData.activityPlanning.otherInfo} onChange={handleInputChange} rows="3" className="mt-1 block w-full px-4 py-2 bg-secondary-bg border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 sm:text-sm" placeholder="Ex: Os alunos precisam trazer notebook."></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step3_ActivityPlanning;