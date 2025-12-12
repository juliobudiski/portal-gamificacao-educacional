// frontend/src/components/steps/Step3_ActivityPlanning.jsx
// Verificado 09/12/2025 - OK

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
/**
 * Componente para a Etapa 3 do formulário de criação de atividades.
 * Coleta informações sobre o planejamento logístico da atividade.
 * @param {object} props - As propriedades passadas do componente pai.
 * @param {object} props.activityData - O objeto de estado que contém todos os dados do formulário.
 * @param {function} props.handleInputChange - A função para manipular mudanças em inputs de texto e outros campos simples.
 * @param {function} props.setActivityData - A função para definir o estado da atividade, ideal para manipular arrays complexos.
 */
function Step3_ActivityPlanning({ activityData, handleInputChange, setActivityData }) {
  // Array de objetos para as características da atividade, facilitando a renderização dos cards.
  const activityCharacteristics = [
    { text: "Presencial", icon: <FaChalkboardTeacher /> },
    { text: "Online", icon: <FaLaptop /> },
    { text: "Requer equipamentos específicos", icon: <FaTools /> },
    { text: "Formativa (prática ou revisão)", icon: <FaClipboardCheck /> },
    { text: "Somativa (avaliação)", icon: <FaFileSignature /> },
    { text: "Foco em projetos de software", icon: <FaCodeBranch /> },
    { text: "Uso de plataformas de aprendizado", icon: <FaCloud /> },
    { text: "Níveis de dificuldade progressivos", icon: <FaTrophy /> },
  ];
  const { openHelp } = useHelpModal();

  /**
   * Manipula a seleção de características a partir dos cards.
   * Adiciona ou remove a característica do array no estado pai.
   * @param {string} charText - O texto da característica que foi clicada.
   */
  const handleCharacteristicSelection = (charText) => {
    // Utiliza setActivityData para uma atualização de estado aninhado mais segura e explícita.
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

  // 2. Nova função para controlar o MODO DE JOGO (Team vs Individual)
  const handleModeSelection = (isTeam) => {
    setActivityData(prevData => ({
      ...prevData,
      activityPlanning: {
        ...prevData.activityPlanning,
        isTeamActivity: isTeam // Salva explicitamente no JSON
      }
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SEÇÃO 1: Título e Descrição */}
      <div>
        <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text">
          Planejamento da Atividade
        </h2>
        <p className="mt-2 text-secondary-text dark:text-secondary-text">
          Descreva as características e a logística da atividade. Essas informações são cruciais para um bom planejamento.
        </p>
      </div>

      {/* --- NOVA SEÇÃO: DINÂMICA DE PARTICIPAÇÃO (Decisão Crítica) --- */}
      <div className="bg-primary-bg border border-border-color p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-primary-text mb-4 flex items-center gap-2">
          Dinâmica de Participação <span className="text-xs font-normal text-secondary-text bg-secondary-bg px-2 py-1 rounded-full border border-border-color">Obrigatório</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Opção 1: Individual */}
          <div
            onClick={() => handleModeSelection(false)}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4
              ${activityData.activityPlanning.isTeamActivity === false
                ? 'border-accent-teal bg-accent-teal/10'
                : 'border-border-color hover:border-gray-400 bg-secondary-bg opacity-70 hover:opacity-100'}
            `}
          >
            <div className={`p-3 rounded-full ${activityData.activityPlanning.isTeamActivity === false ? 'bg-accent-teal text-white' : 'bg-gray-700 text-gray-400'}`}>
              <FaUser size={24} />
            </div>
            <div>
              <h4 className="font-bold text-primary-text">Jornada Individual</h4>
              <p className="text-sm text-secondary-text">Cada aluno progride sozinho e vê apenas seu próprio avatar.</p>
            </div>
          </div>

          {/* Opção 2: Equipes */}
          <div
            onClick={() => handleModeSelection(true)}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4
              ${activityData.activityPlanning.isTeamActivity === true
                ? 'border-accent-purple bg-accent-purple/10'
                : 'border-border-color hover:border-gray-400 bg-secondary-bg opacity-70 hover:opacity-100'}
            `}
          >
            <div className={`p-3 rounded-full ${activityData.activityPlanning.isTeamActivity === true ? 'bg-accent-purple text-white' : 'bg-gray-700 text-gray-400'}`}>
              <FaUsers size={24} />
            </div>
            <div>
              <h4 className="font-bold text-primary-text">Expedição em Equipe</h4>
              <p className="text-sm text-secondary-text">Alunos veem o progresso dos colegas de equipe no tabuleiro em tempo real.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: Seleção de Características com Cards */}
      <div>
        <h3 className="text-lg font-semibold text-primary-text dark:text-primary-text">
          Características da Atividade
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activityCharacteristics.map((char) => {
            const isSelected = activityData.activityPlanning.characteristics.includes(char.text);
            return (
              <div
                key={char.text}
                onClick={() => handleCharacteristicSelection(char.text)}
                className={`
                  group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-5 text-center transition-all duration-200
                  ${isSelected
                    ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                    : 'border-border-color bg-secondary-bg hover:border-teal-400 hover:shadow-lg dark:border-border-color dark:bg-primary-bg dark:hover:border-teal-500'
                  }
                `}
              >
                <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-secondary-text group-hover:text-teal-500 dark:text-secondary-text dark:group-hover:text-teal-400'}`}>
                  {char.icon}
                </div>
                <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-secondary-text dark:text-secondary-text'}`}>
                  {char.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 3: Detalhes Logísticos */}
      <div className="pt-4">
        <h3 className="text-lg font-semibold text-primary-text dark:text-primary-text">
          Detalhes Logísticos
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="activityPlanning.participantsQuantity" className="block text-sm font-medium text-secondary-text dark:text-secondary-text">
              Quantidade de participantes
            </label>
            <input type="text" id="activityPlanning.participantsQuantity" name="activityPlanning.participantsQuantity" value={activityData.activityPlanning.participantsQuantity} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Ex: 25 alunos" />
          </div>
          <div>
            <label htmlFor="activityPlanning.expectedDuration" className="block text-sm font-medium text-secondary-text dark:text-secondary-text">
              Duração prevista
            </label>
            <input type="text" id="activityPlanning.expectedDuration" name="activityPlanning.expectedDuration" value={activityData.activityPlanning.expectedDuration} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Ex: 90 minutos" />
          </div>
          <div>
            <label htmlFor="activityPlanning.location" className="block text-sm font-medium text-secondary-text dark:text-secondary-text">
              Localização
            </label>
            <input type="text" id="activityPlanning.location" name="activityPlanning.location" value={activityData.activityPlanning.location} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Ex: Laboratório 5, Online (Discord)" />
          </div>
          <div>
            <label htmlFor="areaKnowledge" className="block text-sm font-medium text-secondary-text dark:text-secondary-text">
              Área de Conhecimento
            </label>
            <input type="text" id="areaKnowledge" name="areaKnowledge" value={activityData.areaKnowledge} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Ex: Engenharia de Software" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="activityPlanning.otherInfo" className="block text-sm font-medium text-secondary-text dark:text-secondary-text">
              Outras informações relevantes (Opcional)
            </label>
            <textarea id="activityPlanning.otherInfo" name="activityPlanning.otherInfo" value={activityData.activityPlanning.otherInfo} onChange={handleInputChange} rows="3" className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Ex: Os alunos precisam trazer notebook. Acesso à internet é essencial."></textarea>
          </div>
        </div>
      </div>

      {/* Exemplo do botão de ajuda mantido, caso necessário */}
      {/* <button 
        onClick={() => openHelpModal("Sugestões e exemplos...", `Desafios de programação...`)} 
        className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-text bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Ajuda
      </button> 
      */}
    </div>
  );
}

export default Step3_ActivityPlanning;