// frontend/src/components/activity/creation_steps/Step8_RulesAndSharing.jsx
import React, { useState } from 'react';
import {
  FaGavel, FaUserShield, FaMobileAlt, FaUniversity, FaUsers, FaBook,
  FaGraduationCap, FaComments, FaSyncAlt, FaUserTie, FaGlobeAmericas, FaLock,
  FaPrint // NOVO ÍCONE IMPORTADO
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";

// Importe o componente que criamos para a folha A4
import PrintableActivity from '../../PrintableActivity';

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
    <div className="space-y-8 animate-fade-in">
      {/* SEÇÃO 1: Título e Descrição */}
      <div>
        <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text">
          Regras da Gamificação e Compartilhamento
        </h2>
        <p className="mt-2 text-secondary-text dark:text-secondary-text">
          Defina as regras que guiarão a atividade. Boas regras criam um ambiente justo, divertido e produtivo para todos.
        </p>
      </div>

      {/* SEÇÃO 2: Seleção de Regras Gerais com Cards */}
      <div>
        <h3 className="text-lg font-semibold text-primary-text dark:text-primary-text">
          Regras Gerais Sugeridas
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {generalRules.map((rule) => {
            const isSelected = activityData.gamificationRules.generalRules.includes(rule.text);
            return (
              <div
                key={rule.text}
                onClick={() => handleRuleSelection(rule.text)}
                className={`
                  group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-5 text-center transition-all duration-200
                  ${isSelected
                    ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                    : 'border-border-color bg-secondary-bg hover:border-teal-400 hover:shadow-lg dark:border-border-color dark:bg-primary-bg dark:hover:border-teal-500'
                  }
                `}
              >
                <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-secondary-text group-hover:text-teal-500 dark:text-secondary-text dark:group-hover:text-teal-400'}`}>
                  {rule.icon}
                </div>
                <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-secondary-text dark:text-secondary-text'}`}>
                  {rule.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 3: Regras Específicas e Compartilhamento */}
      <div className="pt-4 space-y-6">
        <div>
          <label htmlFor="gamificationRules.specificRules" className="block text-sm font-medium text-secondary-text dark:text-secondary-text">
            Regras específicas da sua atividade (Opcional)
          </label>
          <textarea
            id="gamificationRules.specificRules"
            name="gamificationRules.specificRules"
            value={activityData.gamificationRules.specificRules}
            onChange={handleInputChange}
            rows="4"
            className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            placeholder="Ex: Não é permitido usar o celular durante o desafio. A entrega do projeto deve conter no mínimo 3 commits."
          ></textarea>
        </div>

        {/* --- NOVA SEÇÃO: IMPRESSÃO DESPLUGADA --- */}
        <div className="pt-4 pb-2 border-t border-border-color dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="mb-4 md:mb-0">
              <h4 className="text-lg font-bold text-blue-800 dark:text-blue-300">Roteiro Desplugado</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Gere um documento para impressão com todo o conteúdo e perguntas da trilha para aplicar em sala de aula.
              </p>
            </div>
            <button
              onClick={() => setShowPrintView(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow transition-all
                ${isDesplugada
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                }`}
            >
              <FaPrint /> Imprimir Caderno de Aula
            </button>
          </div>
        </div>

        {/* SEÇÃO: Toggle de Compartilhamento Moderno */}
        <div className="pt-2">
          <label
            htmlFor="isPublic"
            className={`
              relative flex cursor-pointer items-center justify-between rounded-xl border p-6 transition-all duration-300
              ${activityData.isPublic
                ? 'border-[#69e8cb] bg-[#69e8cb]/10 shadow-[0_0_15px_rgba(105,232,203,0.15)]'
                : 'border-gray-600 bg-secondary-bg hover:border-gray-500 dark:bg-[#2c3135]'
              }
            `}
          >
            <div id="tour-final-privacy" className="flex items-center gap-4 pr-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-colors duration-300
                  ${activityData.isPublic
                    ? 'bg-[#69e8cb] text-[#2c3135]'
                    : 'bg-gray-700 text-gray-400'
                  }
                `}
              >
                {activityData.isPublic ? <FaGlobeAmericas /> : <FaLock />}
              </div>

              <div className="flex flex-col">
                <span className={`text-lg font-bold transition-colors duration-300 ${activityData.isPublic ? 'text-[#69e8cb]' : 'text-primary-text'}`}>
                  {activityData.isPublic ? 'Atividade Pública' : 'Atividade Privada'}
                </span>
                <span className="text-sm text-secondary-text dark:text-gray-400">
                  {activityData.isPublic
                    ? 'Sua atividade ficará visível para outros professores usarem como inspiração.'
                    : 'Apenas você e seus alunos terão acesso a esta atividade.'}
                </span>
              </div>
            </div>

            <div className="relative">
              <input
                id="isPublic"
                name="isPublic"
                type="checkbox"
                checked={activityData.isPublic}
                onChange={handleInputChange}
                className="peer sr-only"
              />
              <div className="h-8 w-14 rounded-full bg-gray-700 transition-colors duration-300 peer-focus:ring-4 peer-focus:ring-[#69e8cb]/40 peer-checked:bg-[#69e8cb]"></div>
              <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-all duration-300 peer-checked:translate-x-6 peer-checked:bg-[#2c3135]"></div>
            </div>
          </label>
        </div>
      </div>

      <button
        onClick={() => openHelp('regras_gamificacao')}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Ajuda
      </button>
    </div>
  );
}

export default Step8_RulesAndSharing;