// frontend/src/components/steps/Step8_RulesAndSharing.jsx
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
} from 'react-icons/fa';

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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Regras da Gamificação e Compartilhamento
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Defina as regras que guiarão a atividade. Boas regras criam um ambiente justo, divertido e produtivo para todos.
        </p>
      </div>

      {/* SEÇÃO 2: Seleção de Regras Gerais com Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
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
                    : 'border-gray-300 bg-white hover:border-teal-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-500'
                  }
                `}
              >
                <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-500 dark:text-gray-500 dark:group-hover:text-teal-400'}`}>
                  {rule.icon}
                </div>
                <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-gray-700 dark:text-gray-300'}`}>
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
          <label htmlFor="gamificationRules.specificRules" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Regras específicas da sua atividade (Opcional)
          </label>
          <textarea 
            id="gamificationRules.specificRules" 
            name="gamificationRules.specificRules" 
            value={activityData.gamificationRules.specificRules} 
            onChange={handleInputChange} 
            rows="4" 
            className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" 
            placeholder="Ex: Não é permitido usar o celular durante o desafio. A entrega do projeto deve conter no mínimo 3 commits."
          ></textarea>
        </div>
        
        <div className="relative flex items-start">
          <div className="flex h-6 items-center">
            <input
              id="isPublic"
              name="isPublic"
              type="checkbox"
              checked={activityData.isPublic}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
          </div>
          <div className="ml-3 text-sm leading-6">
            <label htmlFor="isPublic" className="font-medium text-gray-900 dark:text-gray-200">
              Compartilhar esta atividade?
            </label>
            <p className="text-gray-500 dark:text-gray-400">Ao marcar, sua atividade ficará pública para outros professores usarem como modelo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step8_RulesAndSharing;