// frontend/src/components/steps/Step5_GameElements.jsx
import React from 'react';
import {
  FaLayerGroup, FaChartBar, FaGem, FaCoins, FaDice, FaClock, FaIdBadge,
  FaHandshake, FaVrCardboard, FaPuzzlePiece, FaSyncAlt, FaBook, FaUserEdit,
  FaShieldAlt, FaShareAlt, FaCheckCircle, FaChartLine, FaListOl, FaGift,
  FaBookOpen, FaAward, FaTrophy, FaGamepad, FaBullseye, FaBrain, FaLightbulb,
  FaStar, FaProjectDiagram, FaCodeBranch, FaUsers, FaComments
} from 'react-icons/fa';
import GameBoardEditor from '../../activity/GameBoardEditor';
import { useHelpModal } from "../../../context/HelpModalContext";

/**
 * Componente para a Etapa 5 do formulário de criação de atividades.
 * Focado na seleção de elementos de jogo e na configuração da narrativa.
 * @param {object} props - As propriedades passadas do componente pai.
 * @param {object} props.activityData - O objeto de estado que contém todos os dados do formulário.
 * @param {function} props.handleInputChange - A função para manipular mudanças em inputs de texto.
 * @param {function} props.setActivityData - A função para definir o estado da atividade, ideal para manipular arrays.
 * @param {function} props.onEditContent - Callback para abrir o editor de conteúdo de uma etapa do tabuleiro.
 */
function Step5_GameElements({ activityData, handleInputChange, setActivityData, onEditContent, onStructureChange }) {
  // Lógica para determinar elementos recomendados com base nos perfis de jogador selecionados na etapa anterior.
  const recommendedElements = new Set();
  console.log("%cLOG 4: PROPS RECEBIDAS EM 'Step5_GameElements'", "color: orange; font-weight: bold;", activityData.gamificationDesign);

  if (activityData.playerProfile.selectedProfiles.includes("Competitivo")) { ["Níveis", "Sistema de pontuação", "Estatísticas (métricas de progresso)", "Reconhecimento", "Competição", "Progressão baseada em habilidade", "Sistema de classificação e ranking"].forEach(el => recommendedElements.add(el)); }
  if (activityData.playerProfile.selectedProfiles.includes("Cooperativo")) { ["Cooperação", "Chat ou sistema de mensagens", "Interação social com outros jogadores"].forEach(el => recommendedElements.add(el)); }
  if (activityData.playerProfile.selectedProfiles.includes("Imersivo")) { ["Narrativas envolventes", "Storytelling", "Sensação (imersão, experiência sensorial)", "Customização de personagem", "Customização de equipamento"].forEach(el => recommendedElements.add(el)); }
  if (activityData.playerProfile.selectedProfiles.includes("Realizador")) { ["Níveis", "Sistema de pontuação", "Conquistas digitais para metas alcançadas", "Recompensas atraentes", "Progressão baseada em habilidade", "Feedback claro sobre o desempenho"].forEach(el => recommendedElements.add(el)); }
  if (activityData.playerProfile.selectedProfiles.includes("Social")) { ["Interação social com outros jogadores", "Chat ou sistema de mensagens", "Reputação (prestígio, renome, status)", "Cooperação", "Feedback claro sobre o desempenho"].forEach(el => recommendedElements.add(el)); }

  // Lista completa de todos os elementos de jogo disponíveis para seleção.
  const allGameElements = [
    { name: "Níveis", icon: <FaLayerGroup /> },
    { name: "Sistema de pontuação", icon: <FaStar /> },
    { name: "Estatísticas (métricas de progresso)", icon: <FaChartBar /> },
    { name: "Reconhecimento", icon: <FaAward /> },
    { name: "Raridade (itens exclusivos, objetos raros)", icon: <FaGem /> },
    { name: "Economia (sistema monetário)", icon: <FaCoins /> },
    { name: "Escolha imposta (decisões forçadas)", icon: <FaCodeBranch /> },
    { name: "Chance (sorte e probabilidade)", icon: <FaDice /> },
    { name: "Pressão de tempo", icon: <FaClock /> },
    { name: "Reputação (prestígio, renome, status)", icon: <FaIdBadge /> },
    { name: "Cooperação", icon: <FaHandshake /> },
    { name: "Competição", icon: <FaTrophy /> },
    { name: "Pressão social", icon: <FaUsers /> },
    { name: "Sensação (imersão, experiência sensorial)", icon: <FaVrCardboard /> },
    { name: "Objetivo (missão, meta do jogo)", icon: <FaBullseye /> },
    { name: "Quebra-cabeça", icon: <FaPuzzlePiece /> },
    { name: "Renovação (atualizações de conteúdo)", icon: <FaSyncAlt /> },
    { name: "Novidade (novas funcionalidades)", icon: <FaLightbulb /> },
    { name: "Storytelling", icon: <FaBook /> },
    { name: "Customização de personagem", icon: <FaUserEdit /> },
    { name: "Customização de equipamento", icon: <FaShieldAlt /> },
    { name: "Chat ou sistema de mensagens", icon: <FaComments /> },
    { name: "Fórum de Discussão", icon: <FaComments /> },
    { name: "Interação social com outros jogadores", icon: <FaShareAlt /> },
    { name: "Feedback claro sobre o desempenho", icon: <FaCheckCircle /> },
    { name: "Progressão baseada em habilidade", icon: <FaChartLine /> },
    { name: "Narrativas envolventes", icon: <FaBookOpen /> },
    { name: "Sistema de classificação e ranking", icon: <FaListOl /> },
    { name: "Recompensas atraentes", icon: <FaGift /> },
    { name: "Conquistas digitais para metas alcançadas", icon: <FaAward /> },
  ].sort((a, b) => a.name.localeCompare(b.name));
  const { openHelp } = useHelpModal();

  /**
   * Manipula a seleção de elementos de jogo a partir dos cards.
   * @param {string} elementName - O nome do elemento que foi clicado.
   */
  const handleElementSelection = (elementName) => {
    setActivityData(prevData => {
      const currentElements = prevData.gameElements.selectedElements;
      const newElements = currentElements.includes(elementName)
        ? currentElements.filter(el => el !== elementName)
        : [...currentElements, elementName];

      return {
        ...prevData,
        gameElements: {
          ...prevData.gameElements,
          selectedElements: newElements,
        },
      };
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SEÇÃO 1: Título e Descrição */}
      <div>
        <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text">
          Escolha os Elementos de Jogo
        </h2>
        <p className="mt-2 text-secondary-text dark:text-secondary-text">
          Selecione os componentes que darão vida à sua atividade. Os elementos marcados com uma estrela são sugeridos com base nos perfis de jogador que você escolheu.
        </p>
      </div>

      {/* SEÇÃO 2: Seleção de Elementos com Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {allGameElements.map((element) => {
          const isSelected = activityData.gameElements.selectedElements.includes(element.name);
          const isRecommended = recommendedElements.has(element.name);
          return (
            <div
              key={element.name}
              onClick={() => handleElementSelection(element.name)}
              className={`
                group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-2 rounded-xl border p-4 text-center transition-all duration-200
                ${isSelected
                  ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                  : 'border-border-color bg-secondary-bg hover:border-teal-400 hover:shadow-lg dark:border-border-color dark:bg-primary-bg dark:hover:border-teal-500'
                }
              `}
            >
              {isRecommended && (
                <div className="absolute top-2 right-2 text-yellow-500" title="Sugerido">
                  <FaStar />
                </div>
              )}
              <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-secondary-text group-hover:text-teal-500 dark:text-secondary-text dark:group-hover:text-teal-400'}`}>
                {element.icon}
              </div>
              <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-secondary-text dark:text-secondary-text'}`}>
                {element.name}
              </p>
            </div>
          );
        })}
      </div>

      {/* SEÇÃO 3: Campo Aberto */}
      <div className="pt-4">
        <label htmlFor="gameElements.otherElement" className="block text-sm font-medium text-secondary-text dark:text-secondary-text">
          Outro elemento não listado? (Opcional)
        </label>
        <input
          type="text"
          id="gameElements.otherElement"
          name="gameElements.otherElement"
          value={activityData.gameElements.otherElement}
          onChange={handleInputChange}
          className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          placeholder="Descreva um elemento de jogo personalizado"
        />
      </div>

      <GameBoardEditor
        gamificationDesign={activityData.gamificationDesign}
        setActivityData={setActivityData}
        onEditContent={onEditContent}
        onStructureChange={onStructureChange}
        activityId={activityData.id} // Pode ser undefined, não tem problema mais
        fullActivityData={activityData}
      />


      <button
        onClick={() => openHelp('elementos_jogos')} // Chama pelo ID
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Ajuda
      </button>
    </div>
  );
}

export default Step5_GameElements;