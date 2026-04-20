// frontend/src/components/activity/creation_steps/Step5_Activity.jsx
import React, { useState, useEffect } from 'react';
import {
  FaLayerGroup, FaChartBar, FaGem, FaCoins, FaDice, FaClock, FaIdBadge,
  FaHandshake, FaVrCardboard, FaPuzzlePiece, FaSyncAlt, FaBook, FaUserEdit,
  FaShieldAlt, FaShareAlt, FaCheckCircle, FaChartLine, FaListOl, FaGift,
  FaBookOpen, FaAward, FaTrophy, FaGamepad, FaBullseye, FaBrain, FaLightbulb,
  FaStar, FaProjectDiagram, FaCodeBranch, FaUsers, FaComments, FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
import GameBoardEditor from '../../activity/GameBoardEditor';
import { useHelpModal } from "../../../context/HelpModalContext";
import api from '../../../services/api'; // Certifique-se que o caminho do axios/api está correto

// Mapeamento de ícones (Objeto estático para performance)
const ICON_MAP = {
  "Níveis": <FaLayerGroup />,
  "Sistema de pontuação": <FaStar />,
  "Estatísticas (métricas de progresso)": <FaChartBar />,
  "Reconhecimento": <FaAward />,
  "Raridade (itens exclusivos, objetos raros)": <FaGem />,
  "Economia (sistema monetário)": <FaCoins />,
  "Escolha imposta (decisões forçadas)": <FaCodeBranch />,
  "Chance (sorte e probabilidade)": <FaDice />,
  "Pressão de tempo": <FaClock />,
  "Reputação (prestígio, renome, status)": <FaIdBadge />,
  "Cooperação": <FaHandshake />,
  "Competição": <FaTrophy />,
  "Pressão social": <FaUsers />,
  "Sensação (imersão, experiência sensorial)": <FaVrCardboard />,
  "Objetivo (missão, meta do jogo)": <FaBullseye />,
  "Quebra-cabeça": <FaPuzzlePiece />,
  "Renovação (atualizações de conteúdo)": <FaSyncAlt />,
  "Novidade (novas funcionalidades)": <FaLightbulb />,
  "Storytelling": <FaBook />,
  "Customização de personagem": <FaUserEdit />,
  "Customização de equipamento": <FaShieldAlt />,
  "Chat ou sistema de mensagens": <FaComments />,
  "Fórum de Discussão": <FaComments />,
  "Interação social com outros jogadores": <FaShareAlt />,
  "Feedback claro sobre o desempenho": <FaCheckCircle />,
  "Progressão baseada em habilidade": <FaChartLine />,
  "Narrativas envolventes": <FaBookOpen />,
  "Sistema de classificação e ranking": <FaListOl />,
  "Recompensas atraentes": <FaGift />,
  "Conquistas digitais para metas alcançadas": <FaAward />,
};

function Step5_GameElements({ activityData, handleInputChange, setActivityData, onEditContent, onStructureChange }) {
  const { openHelp } = useHelpModal();
  const [clusters, setClusters] = useState({ recommended: [], neutral: [], forbidden: [] });
  const [loading, setLoading] = useState(true);
  const [conflictModal, setConflictModal] = useState({ isOpen: false, element: null, message: '' });

  // 1. Busca Recomendações do Backend ao Montar
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        // Envia o contexto acumulado dos Steps 1-4
        const response = await api.post('/activities/recommendations', activityData);
        const data = response.data;

        setClusters({
          recommended: data.recommended || [],
          neutral: data.neutral || [],
          forbidden: data.forbidden || []
        });

        // Auto-selecionar recomendados (Opcional, conforme spec [cite: 42])
        // Cuidado para não sobrescrever seleções manuais se o usuário voltar para este passo
        if (activityData.gameElements.selectedElements.length === 0) {
          const preSelected = data.recommended.map(item => item.name);
          if (preSelected.length > 0) {
            setActivityData(prev => ({
              ...prev,
              gameElements: { ...prev.gameElements, selectedElements: preSelected }
            }));
          }
        }

      } catch (error) {
        console.error("Erro ao carregar recomendações:", error);
        // Fallback: Coloca tudo em neutro se falhar
        const allNames = Object.keys(ICON_MAP).map(name => ({ name, score: 0 }));
        setClusters({ recommended: [], neutral: allNames, forbidden: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []); // Executa apenas uma vez ao montar

  // 2. Manipulação de Seleção com Lógica de Soft Block
  const handleSelectionAttempt = (elementObj, category) => {
    const elementName = elementObj.name;
    const isSelected = activityData.gameElements.selectedElements.includes(elementName);

    // Se já está selecionado, apenas remove (sem modal)
    if (isSelected) {
      toggleElement(elementName);
      return;
    }

    // Se está tentando selecionar um "Forbidden", abre Modal [cite: 49]
    if (category === 'forbidden') {
      setConflictModal({
        isOpen: true,
        element: elementName,
        message: elementObj.warning_msg || "Este elemento conflita com o perfil da turma."
      });
      return;
    }

    // Caso normal
    toggleElement(elementName);
  };

  const toggleElement = (elementName) => {
    setActivityData(prevData => {
      const currentElements = prevData.gameElements.selectedElements;
      const newElements = currentElements.includes(elementName)
        ? currentElements.filter(el => el !== elementName)
        : [...currentElements, elementName];

      return {
        ...prevData,
        gameElements: { ...prevData.gameElements, selectedElements: newElements },
      };
    });
  };

  const confirmConflictSelection = () => {
    if (conflictModal.element) {
      toggleElement(conflictModal.element);
    }
    setConflictModal({ isOpen: false, element: null, message: '' });
  };

  // Renderizador de Card Genérico
  const renderCard = (item, category) => {
    const isSelected = activityData.gameElements.selectedElements.includes(item.name);

    // Estilos baseados na categoria [cite: 41, 45, 48]
    let borderClass = 'border-border-color hover:border-teal-400 dark:border-gray-600';
    let bgClass = 'bg-secondary-bg dark:bg-gray-800';
    let opacityClass = 'opacity-100';
    let iconColor = 'text-secondary-text';

    if (category === 'recommended') {
      borderClass = 'border-green-500 ring-1 ring-green-500 shadow-md';
      bgClass = 'bg-green-50 dark:bg-green-900/20';
      iconColor = 'text-green-600 dark:text-green-400';
    } else if (category === 'forbidden') {
      borderClass = 'border-red-200 dark:border-red-900 border-dashed';
      bgClass = 'bg-gray-100 dark:bg-gray-900';
      opacityClass = 'opacity-70'; // Opacidade reduzida
      iconColor = 'text-gray-400';
    }

    if (isSelected) {
      borderClass = 'border-2 border-teal-500 ring-2 ring-teal-500/20';
      bgClass = 'bg-teal-50 dark:bg-teal-900/40';
      opacityClass = 'opacity-100';
      iconColor = 'text-teal-500';
    }

    return (
      <div
        key={item.name}
        onClick={() => handleSelectionAttempt(item, category)}
        className={`
          group relative flex flex-col items-center justify-start p-4 rounded-xl border transition-all duration-200 cursor-pointer
          ${borderClass} ${bgClass} ${opacityClass}
        `}
      >
        {category === 'recommended' && (
          <div className="absolute top-2 right-2 text-green-500 animate-pulse" title="Recomendado pelo Motor">
            <FaStar />
          </div>
        )}
        {category === 'forbidden' && !isSelected && (
          <div className="absolute top-2 right-2 text-yellow-500" title="Não Recomendado">
            <FaExclamationTriangle />
          </div>
        )}

        <div className={`text-3xl mb-2 ${iconColor}`}>
          {ICON_MAP[item.name] || <FaGamepad />}
        </div>

        <p className={`text-sm font-medium text-center ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-secondary-text dark:text-gray-300'}`}>
          {item.name}
        </p>

        {/* Tooltip de Razão (apenas para recomendados/restritos) */}
        {item.reason && category === 'recommended' && (
          <span className="mt-2 text-xs text-green-600 dark:text-green-400 text-center px-2">{item.reason}</span>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Carregando sugestões do Motor Contextual...</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text">
          Design Guiado: Elementos de Jogo
        </h2>
        <p className="mt-2 text-secondary-text">
          O sistema analisou o perfil da sua turma e organizou os elementos abaixo.
        </p>
      </div>

      {/* CLUSTER 1: RECOMENDADOS [cite: 40] */}
      {clusters.recommended.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center text-lg font-semibold text-green-600 dark:text-green-400">
            <FaStar className="mr-2" /> Altamente Recomendados
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {clusters.recommended.map(item => renderCard(item, 'recommended'))}
          </div>
        </div>
      )}

      {/* CLUSTER 2: NEUTROS [cite: 44] */}
      <div className="space-y-4">
        <h3 className="flex items-center text-lg font-semibold text-gray-600 dark:text-gray-300">
          <FaLayerGroup className="mr-2" /> Disponíveis (Neutros)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {clusters.neutral.map(item => renderCard(item, 'neutral'))}
        </div>
      </div>

      {/* CLUSTER 3: NÃO RECOMENDADOS [cite: 47] */}
      {clusters.forbidden.length > 0 && (
        <div className="space-y-4 pt-4 border-t dark:border-gray-700">
          <h3 className="flex items-center text-lg font-semibold text-yellow-600 dark:text-yellow-500">
            <FaExclamationTriangle className="mr-2" /> Requer Cuidado (Potenciais Conflitos)
          </h3>
          <p className="text-sm text-gray-500">Estes elementos podem conflitar com o perfil da turma ou a logística definida.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {clusters.forbidden.map(item => renderCard(item, 'forbidden'))}
          </div>
        </div>
      )}

      {/* INPUT PERSONALIZADO */}
      <div className="pt-6">
        <label className="block text-sm font-medium text-secondary-text">
          Outro elemento (Personalizado)
        </label>
        <input
          type="text"
          value={activityData.gameElements.otherElement || ''}
          onChange={handleInputChange}
          name="gameElements.otherElement"
          className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          placeholder="Ex: Realidade Aumentada Externa..."
        />
      </div>

      {/* EDITOR DE TABULEIRO (Mantido) */}
      <GameBoardEditor
        gamificationDesign={activityData.gamificationDesign}
        setActivityData={setActivityData}
        onEditContent={onEditContent}
        onStructureChange={onStructureChange}
        activityId={activityData.id}
        fullActivityData={activityData}
      />

      {/* MODAL DE SOFT BLOCK [cite: 49-50] */}
      {conflictModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 border-l-4 border-yellow-500 animate-scale-in">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <FaExclamationTriangle className="text-yellow-500 mr-2" />
              Conflito Pedagógico Detectado
            </h3>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              {conflictModal.message}
            </p>
            <p className="mt-2 text-sm text-gray-500 italic">
              Deseja incluir este elemento mesmo assim?
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setConflictModal({ isOpen: false, element: null, message: '' })}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmConflictSelection}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-medium"
              >
                Sim, manter elemento
              </button>
            </div>
          </div>
        </div>
      )}

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