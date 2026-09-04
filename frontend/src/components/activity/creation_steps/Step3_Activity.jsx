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
    <div className="space-y-10 animate-fade-in relative">
      {/* CABEÇALHO DO PASSO */}
      <div className="flex items-center justify-between border-b border-border-color pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow">
            Planejamento da Atividade
          </h2>
          <p className="mt-2 text-secondary-text text-lg">
            Descreva as características e a logística da atividade. Essas informações são cruciais para um bom planejamento.
          </p>
        </div>
      </div>

      <div
        id="tour-step-dynamics-options"
        className={`bg-primary-bg/50 backdrop-blur-sm border p-8 rounded-3xl transition-all duration-300 shadow-inner group ${typeof activityData.activityPlanning.isTeamActivity !== 'boolean' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-border-color hover:border-accent-teal/30'
          }`}
      >
        <h3 className="text-xl font-bold text-primary-text mb-6 flex items-center gap-3 uppercase tracking-wider">
          Dinâmica de Participação <span className="text-xs font-bold text-accent-yellow bg-accent-yellow/10 px-3 py-1 rounded-full border border-accent-yellow/20">Obrigatório</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div
            onClick={() => handleModeSelection(false)}
            className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-6 transform hover:-translate-y-1
              ${activityData.activityPlanning.isTeamActivity === false
                ? 'border-accent-teal bg-gradient-to-br from-accent-teal/20 to-transparent shadow-[0_8px_20px_rgba(20,184,166,0.2)]'
                : 'border-border-color hover:border-accent-teal/50 bg-secondary-bg/50 backdrop-blur-sm opacity-80 hover:opacity-100 hover:shadow-lg'}
            `}
          >
            <div className={`p-4 rounded-2xl shadow-inner transition-transform duration-300 ${activityData.activityPlanning.isTeamActivity === false ? 'bg-accent-teal text-gray-900 scale-110' : 'bg-primary-bg text-secondary-text'}`}>
              <FaUser className="text-3xl" />
            </div>
            <div>
              <h4 className="font-extrabold text-lg text-primary-text mb-1">Jornada Individual</h4>
              <p className="text-sm text-secondary-text leading-relaxed">Cada aluno progride sozinho e vê apenas seu próprio avatar.</p>
            </div>
          </div>

          <div
            onClick={() => handleModeSelection(true)}
            className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-6 transform hover:-translate-y-1
              ${activityData.activityPlanning.isTeamActivity === true
                ? 'border-accent-purple bg-gradient-to-br from-accent-purple/20 to-transparent shadow-[0_8px_20px_rgba(157,78,221,0.2)]'
                : 'border-border-color hover:border-accent-purple/50 bg-secondary-bg/50 backdrop-blur-sm opacity-80 hover:opacity-100 hover:shadow-lg'}
            `}
          >
            <div className={`p-4 rounded-2xl shadow-inner transition-transform duration-300 ${activityData.activityPlanning.isTeamActivity === true ? 'bg-accent-purple text-white scale-110' : 'bg-primary-bg text-secondary-text'}`}>
              <FaUsers className="text-3xl" />
            </div>
            <div>
              <h4 className="font-extrabold text-lg text-primary-text mb-1">Expedição em Equipe</h4>
              <p className="text-sm text-secondary-text leading-relaxed">Alunos veem o progresso dos colegas no tabuleiro em tempo real.</p>
            </div>
          </div>
        </div>
      </div>

      {/* NOVO: SEÇÃO DE AMBIENTE EXCLUDENTE */}
      <div className="pt-4">
        <h3 className="text-xl font-bold text-primary-text flex items-center gap-3 mb-6 uppercase tracking-wider">
          Ambiente de Aplicação <span className="text-xs font-bold text-accent-yellow bg-accent-yellow/10 px-3 py-1 rounded-full border border-accent-yellow/20">Obrigatório</span>
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {LOGISTIC_ENVIRONMENTS.map((env) => {
            const isSelected = activityData.activityPlanning.characteristics.includes(env.text);
            return (
              <div
                key={env.text}
                onClick={() => handleEnvironmentSelection(env.text)}
                className={`
                  group relative flex h-full cursor-pointer flex-col items-center justify-start rounded-2xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1
                  ${isSelected
                    ? 'border-2 border-accent-yellow bg-gradient-to-br from-accent-yellow/20 to-primary-bg shadow-[0_8px_20px_rgba(255,189,48,0.2)]'
                    : 'border border-border-color bg-primary-bg/50 backdrop-blur-sm hover:border-accent-yellow/50 hover:shadow-xl'
                  }
                `}
              >
                <div className={`text-5xl mb-4 transition-transform duration-500 group-hover:scale-110 ${isSelected ? 'text-accent-yellow' : 'text-secondary-text/80 group-hover:text-accent-yellow'}`}>
                  {env.icon}
                </div>
                <p className={`text-sm leading-relaxed ${isSelected ? 'text-accent-yellow font-extrabold' : 'text-secondary-text font-medium group-hover:text-primary-text'}`}>
                  {env.text}
                </p>
                {isSelected && (
                  <div className="absolute top-3 right-3 text-accent-yellow animate-bounce-in">
                    <FaClipboardCheck />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-border-color">
        <h3 className="text-xl font-bold text-primary-text mb-6 uppercase tracking-wider">
          Outras Características (Opcional)
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIVITY_CHARACTERISTICS.map((char) => {
            const isSelected = activityData.activityPlanning.characteristics.includes(char.text);
            return (
              <div
                key={char.text}
                onClick={() => handleCharacteristicSelection(char.text)}
                className={`
                  group relative flex h-full cursor-pointer flex-col items-center justify-start rounded-2xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1
                  ${isSelected
                    ? 'border-2 border-accent-teal bg-gradient-to-br from-accent-teal/20 to-primary-bg shadow-[0_8px_20px_rgba(20,184,166,0.2)]'
                    : 'border border-border-color bg-primary-bg/50 backdrop-blur-sm hover:border-accent-teal/50 hover:shadow-xl'
                  }
                `}
              >
                <div className={`text-4xl mb-4 transition-transform duration-500 group-hover:scale-110 ${isSelected ? 'text-accent-teal' : 'text-secondary-text/80 group-hover:text-accent-teal'}`}>
                  {char.icon}
                </div>
                <p className={`text-sm leading-relaxed ${isSelected ? 'text-accent-teal font-extrabold' : 'text-secondary-text font-medium group-hover:text-primary-text'}`}>
                  {char.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-8 border-t border-border-color">
        <h3 className="text-xl font-bold text-primary-text mb-6 uppercase tracking-wider">
          Detalhes Logísticos
        </h3>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="group">
            <label className="block text-sm font-bold text-secondary-text uppercase tracking-wider mb-2">Quantidade de participantes</label>
            <input type="text" name="activityPlanning.participantsQuantity" value={activityData.activityPlanning.participantsQuantity} onChange={handleInputChange} className="block w-full px-6 py-4 bg-primary-bg/50 backdrop-blur-sm border border-border-color rounded-2xl shadow-inner focus:ring-2 focus:ring-accent-teal focus:border-transparent text-primary-text text-lg transition-all duration-300 group-hover:border-accent-teal/50" placeholder="Ex: 25 alunos" />
          </div>
          <div className="group">
            <label className="block text-sm font-bold text-secondary-text uppercase tracking-wider mb-2">Duração prevista</label>
            <input type="text" name="activityPlanning.expectedDuration" value={activityData.activityPlanning.expectedDuration} onChange={handleInputChange} className="block w-full px-6 py-4 bg-primary-bg/50 backdrop-blur-sm border border-border-color rounded-2xl shadow-inner focus:ring-2 focus:ring-accent-teal focus:border-transparent text-primary-text text-lg transition-all duration-300 group-hover:border-accent-teal/50" placeholder="Ex: 90 minutos" />
          </div>
          <div className="md:col-span-2 group">
            <label className="block text-sm font-bold text-secondary-text uppercase tracking-wider mb-2">Localização</label>
            <input type="text" name="activityPlanning.location" value={activityData.activityPlanning.location} onChange={handleInputChange} className="block w-full px-6 py-4 bg-primary-bg/50 backdrop-blur-sm border border-border-color rounded-2xl shadow-inner focus:ring-2 focus:ring-accent-teal focus:border-transparent text-primary-text text-lg transition-all duration-300 group-hover:border-accent-teal/50" placeholder="Ex: Laboratório 5, Online (Discord)" />
          </div>
          <div className="md:col-span-2 group">
            <label className="block text-sm font-bold text-secondary-text uppercase tracking-wider mb-2">Outras informações relevantes (Opcional)</label>
            <textarea name="activityPlanning.otherInfo" value={activityData.activityPlanning.otherInfo} onChange={handleInputChange} rows="4" className="block w-full px-6 py-4 bg-primary-bg/50 backdrop-blur-sm border border-border-color rounded-2xl shadow-inner focus:ring-2 focus:ring-accent-teal focus:border-transparent text-primary-text text-lg transition-all duration-300 group-hover:border-accent-teal/50" placeholder="Ex: Os alunos precisam trazer notebook."></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step3_ActivityPlanning;