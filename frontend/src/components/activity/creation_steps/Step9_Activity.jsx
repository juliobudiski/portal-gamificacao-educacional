// frontend/src/components/activity/creation_steps/Step8_RulesAndSharing.jsx
import React, { useState } from 'react';
import {
  FaGavel, FaUserShield, FaMobileAlt, FaUniversity, FaUsers, FaBook,
  FaGraduationCap, FaComments, FaSyncAlt, FaUserTie, FaGlobeAmericas, FaLock,
  FaPrint, FaInfoCircle, FaCheckCircle
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";

// Importe o componente que criamos para a folha A4
import PrintableActivity from '../../PrintableActivity';

/**
 * Step8_RulesAndSharing
 * 
 * Architectural intent: Orchestrates the 'Rules and Sharing' step of the activity creation wizard.
 * It acts as a Container component, managing the local state for rule selection and print view toggling,
 * while propagating changes up to the parent form state, adhering to unidirectional data flow.
 */
function Step8_RulesAndSharing({ activityData, handleInputChange, setActivityData }) {
  const { openHelp } = useHelpModal();

  // Estado para controlar se estamos vendo o Step 8 normal ou a Folha de Impressão
  const [showPrintView, setShowPrintView] = useState(false);

  const generalRules = [
    { text: "Respeite as regras do jogo e as decisões do professor.", icon: <FaGavel /> },
    { text: "Seja respeitoso e colaborativo com outros jogadores.", icon: <FaUsers /> },
    { text: "Entenda as regras e como elas se aplicam a cada atividade.", icon: <FaBook /> },
    { text: "Busque sempre aprender e se esforçar para alcançar seus objetivos.", icon: <FaGraduationCap /> },
    { text: "Comunique-se com outros jogadores de forma clara e objetiva.", icon: <FaComments /> },
    { text: "Proteja a privacidade e a segurança de todos os jogadores.", icon: <FaUserShield /> },
    { text: "Use dispositivos eletrônicos apenas para fins educacionais.", icon: <FaMobileAlt /> },
    { text: "Respeite as políticas da instituição em todas as atividades.", icon: <FaUniversity /> },
    { text: "Mantenha-se atualizado com as atualizações nas regras.", icon: <FaSyncAlt /> },
    { text: "Busque sempre a supervisão do professor quando necessário.", icon: <FaUserTie /> },
  ];

  const handleRuleSelection = (ruleText) => {
    setActivityData(prevData => {
      const currentRules = prevData.gamificationRules.generalRules;
      const newRules = currentRules.includes(ruleText)
        ? currentRules.filter(r => r !== ruleText)
        : [...currentRules, ruleText];

      return {
        ...prevData,
        gamificationRules: {
          ...prevData.gamificationRules,
          generalRules: newRules,
        },
      };
    });
  };

  // Se o botão de impressão foi clicado, esconde o Step 8 e mostra a Folha A4
  if (showPrintView) {
    return (
      <PrintableActivity
        activityData={activityData}
        onBack={() => setShowPrintView(false)}
      />
    );
  }

  // Verifica se a atividade foi marcada como desplugada no Step 3
  const isDesplugada = activityData.activityPlanning?.characteristics?.some(
    char => char.toLowerCase().includes('desplugado')
  );

  return (
    <div className="space-y-10 animate-fade-in relative pb-10">
      {/* CABEÇALHO DO PASSO */}
      <div className="flex items-center justify-between border-b border-border-color pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow">
            Regras e Compartilhamento
          </h2>
          <p className="mt-2 text-secondary-text text-lg">
            Defina as regras que guiarão a atividade. Boas regras criam um ambiente justo, divertido e produtivo para todos.
          </p>
        </div>
        <button
          onClick={() => openHelp('regras_gamificacao')}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-primary-bg border border-border-color hover:border-accent-teal/50 hover:bg-accent-teal/10 transition-all duration-300 shadow-sm"
          title="Ajuda sobre este passo"
        >
          <FaInfoCircle className="text-xl text-secondary-text group-hover:text-accent-teal transition-colors" />
        </button>
      </div>

      {/* SEÇÃO 2: Seleção de Regras Gerais com Cards */}
      <div className="pt-2">
        <h3 className="text-xl font-bold text-primary-text mb-6 uppercase tracking-wider">
          Regras Gerais Sugeridas
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {generalRules.map((rule) => {
            const isSelected = activityData.gamificationRules.generalRules.includes(rule.text);
            return (
              <div
                key={rule.text}
                onClick={() => handleRuleSelection(rule.text)}
                className={`
                  group relative flex h-full cursor-pointer flex-col items-center justify-start rounded-2xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1
                  ${isSelected
                    ? 'border-2 border-accent-teal bg-gradient-to-br from-accent-teal/20 to-primary-bg shadow-[0_8px_20px_rgba(20,184,166,0.3)]'
                    : 'border border-border-color bg-primary-bg/50 backdrop-blur-sm hover:border-accent-teal/50 hover:shadow-xl'
                  }
                `}
              >
                <div className={`text-4xl mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${isSelected ? 'text-accent-teal' : 'text-secondary-text/80 group-hover:text-accent-teal'}`}>
                  {rule.icon}
                </div>
                <p className={`text-sm leading-relaxed ${isSelected ? 'text-accent-teal font-extrabold' : 'text-secondary-text font-medium group-hover:text-primary-text'}`}>
                  {rule.text}
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

      {/* SEÇÃO 3: Regras Específicas e Compartilhamento */}
      <div className="pt-8 border-t border-border-color space-y-8">
        <div className="group">
          <label htmlFor="gamificationRules.specificRules" className="block text-sm font-bold text-secondary-text uppercase tracking-wider mb-3">
            Regras específicas da sua atividade (Opcional)
          </label>
          <div className="relative">
              <textarea
                id="gamificationRules.specificRules"
                name="gamificationRules.specificRules"
                value={activityData.gamificationRules.specificRules}
                onChange={handleInputChange}
                rows="4"
                className="block w-full px-6 py-4 bg-primary-bg/50 backdrop-blur-sm border border-border-color rounded-2xl shadow-inner focus:ring-2 focus:ring-accent-teal focus:border-transparent text-primary-text text-lg transition-all duration-300 group-hover:border-accent-teal/50"
                placeholder="Ex: Não é permitido usar o celular durante o desafio. A entrega do projeto deve conter no mínimo 3 commits."
              ></textarea>
          </div>
        </div>

        {/* --- NOVA SEÇÃO: IMPRESSÃO DESPLUGADA --- */}
        <div className="pt-6 pb-2">
          <div className="flex flex-col md:flex-row items-center justify-between bg-info-bg/30 backdrop-blur-sm border border-info/50 p-6 rounded-2xl shadow-inner">
            <div className="mb-4 md:mb-0">
              <h4 className="text-xl font-bold text-info flex items-center gap-2 uppercase tracking-wider mb-2">
                  <FaPrint /> Roteiro Desplugado
              </h4>
              <p className="text-base text-primary-text leading-relaxed">
                Gere um documento formatado para impressão com todo o conteúdo e perguntas da trilha para aplicar em sala de aula sem depender de internet.
              </p>
            </div>
            <button
              onClick={() => setShowPrintView(true)}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold shadow-lg transition-all duration-300 whitespace-nowrap group
                ${isDesplugada
                  ? 'bg-gradient-to-r from-info to-blue-500 text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                  : 'bg-primary-bg border-2 border-border-color text-primary-text hover:border-info hover:text-info'
                }`}
            >
              <FaPrint className="text-xl group-hover:scale-110 transition-transform" />
              <span>Imprimir Caderno</span>
            </button>
          </div>
        </div>

        {/* SEÇÃO: Toggle de Compartilhamento Moderno */}
        <div className="pt-6 border-t border-border-color">
          <label
            htmlFor="isPublic"
            className={`
              relative flex cursor-pointer items-center justify-between rounded-3xl border p-8 transition-all duration-500 hover:-translate-y-1 shadow-lg
              ${activityData.isPublic
                ? 'border-accent-teal bg-gradient-to-br from-accent-teal/20 to-primary-bg shadow-[0_8px_30px_rgba(20,184,166,0.2)]'
                : 'border-border-color bg-primary-bg/50 backdrop-blur-sm hover:border-accent-teal/30'
              }
            `}
          >
            <div id="tour-final-privacy" className="flex items-center gap-6 pr-4">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-inner transition-all duration-500
                  ${activityData.isPublic
                    ? 'bg-accent-teal text-gray-900 scale-110 rotate-12'
                    : 'bg-secondary-bg text-secondary-text'
                  }
                `}
              >
                {activityData.isPublic ? <FaGlobeAmericas /> : <FaLock />}
              </div>

              <div className="flex flex-col">
                <span className={`text-2xl font-extrabold mb-1 transition-colors duration-500 ${activityData.isPublic ? 'text-accent-teal' : 'text-primary-text'}`}>
                  {activityData.isPublic ? 'Atividade Pública (Compartilhada)' : 'Atividade Privada (Fechada)'}
                </span>
                <span className="text-base text-secondary-text leading-relaxed">
                  {activityData.isPublic
                    ? 'Sua atividade ficará na galeria para inspirar outros professores, enriquecendo nossa comunidade!'
                    : 'Apenas você e seus alunos terão acesso a esta atividade. Tudo ficará trancado a sete chaves.'}
                </span>
              </div>
            </div>

            <div className="relative flex-shrink-0">
              <input
                id="isPublic"
                name="isPublic"
                type="checkbox"
                checked={activityData.isPublic}
                onChange={handleInputChange}
                className="peer sr-only"
              />
              <div className="h-10 w-20 rounded-full bg-secondary-bg border border-border-color shadow-inner transition-all duration-500 peer-focus:ring-4 peer-focus:ring-accent-teal/40 peer-checked:bg-accent-teal peer-checked:border-accent-teal"></div>
              <div className="absolute left-1 top-1 h-8 w-8 rounded-full bg-primary-text shadow-md transition-all duration-500 peer-checked:translate-x-10 peer-checked:bg-gray-900"></div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

export default Step8_RulesAndSharing;