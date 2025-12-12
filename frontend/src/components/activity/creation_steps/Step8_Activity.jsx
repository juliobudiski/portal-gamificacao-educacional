// frontend/src/components/steps/Step8_RulesAndSharing.jsx
// Verificado 09/12/2025 - OK

import React from 'react';
import {
  FaGavel,
  FaUserShield,
  FaMobileAlt,
  FaUniversity,
  FaUsers,
  FaBook,
  FaGraduationCap,
  FaComments,
  FaSyncAlt,
  FaUserTie,
  FaGlobeAmericas, // Novo: Para representar Público
  FaLock,          // Novo: Para representar Privado
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";

/**
 * Componente para a Etapa 8 do formulário de criação de atividades.
 * Focado na definição de regras e na opção de compartilhamento da atividade.
 * @param {object} props - As propriedades passadas do componente pai.
 * @param {object} props.activityData - O objeto de estado que contém todos os dados do formulário.
 * @param {function} props.handleInputChange - A função para manipular mudanças em inputs, textareas e checkboxes.
 * @param {function} props.setActivityData - A função para definir o estado da atividade, ideal para manipular arrays.
 */
function Step8_RulesAndSharing({ activityData, handleInputChange, setActivityData }) {
  // Array de objetos para as regras gerais, facilitando a renderização dos cards.
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
  const { openHelp } = useHelpModal();
  /**
   * Manipula a seleção de regras a partir dos cards.
   * Adiciona ou remove a regra do array no estado pai.
   * @param {string} ruleText - O texto da regra que foi clicada.
   */
  const handleRuleSelection = (ruleText) => {
    // Utiliza setActivityData para uma atualização de estado aninhado mais segura e explícita.
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

        {/* SEÇÃO: Toggle de Compartilhamento Moderno */}
        <div className="pt-2">
          <label
            htmlFor="isPublic"
            className={`
              relative flex cursor-pointer items-center justify-between rounded-xl border p-6 transition-all duration-300
              ${activityData.isPublic
                ? 'border-[#69e8cb] bg-[#69e8cb]/10 shadow-[0_0_15px_rgba(105,232,203,0.15)]' // Estado Ativo (Teal + Glow)
                : 'border-gray-600 bg-secondary-bg hover:border-gray-500 dark:bg-[#2c3135]' // Estado Inativo
              }
            `}
          >
            <div className="flex items-center gap-4 pr-4">
              {/* Ícone Dinâmico: Muda conforme o estado */}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-colors duration-300
                  ${activityData.isPublic
                    ? 'bg-[#69e8cb] text-[#2c3135]' // Fundo Teal, ícone escuro
                    : 'bg-gray-700 text-gray-400'   // Fundo cinza, ícone cinza
                  }
                `}
              >
                {activityData.isPublic ? <FaGlobeAmericas /> : <FaLock />}
              </div>

              {/* Textos */}
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

            {/* O Switch Visual (Toggle) */}
            <div className="relative">
              <input
                id="isPublic"
                name="isPublic"
                type="checkbox"
                checked={activityData.isPublic}
                onChange={handleInputChange}
                className="peer sr-only" // Oculta o checkbox nativo visualmente, mas mantém acessível
              />
              {/* Trilho do Switch */}
              <div className="h-8 w-14 rounded-full bg-gray-700 transition-colors duration-300 peer-focus:ring-4 peer-focus:ring-[#69e8cb]/40 peer-checked:bg-[#69e8cb]"></div>
              {/* Bolinha do Switch */}
              <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-all duration-300 peer-checked:translate-x-6 peer-checked:bg-[#2c3135]"></div>
            </div>
          </label>
        </div>
      </div>
      <button
        onClick={() => openHelp('regras_gamificacao')} // Chama pelo ID
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Ajuda
      </button>
    </div>
  );
}

export default Step8_RulesAndSharing;