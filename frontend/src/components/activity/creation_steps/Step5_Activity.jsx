// frontend/src/components/activity/creation_steps/Step5_Activity.jsx
import React, { useState, useEffect } from 'react';
import {
  FaLayerGroup, FaChartBar, FaGem, FaCoins, FaDice, FaClock, FaIdBadge,
  FaHandshake, FaVrCardboard, FaPuzzlePiece, FaSyncAlt, FaBook, FaUserEdit,
  FaShieldAlt, FaShareAlt, FaCheckCircle, FaChartLine, FaListOl, FaGift,
  FaBookOpen, FaAward, FaTrophy, FaGamepad, FaBullseye, FaBrain, FaLightbulb,
  FaStar, FaProjectDiagram, FaCodeBranch, FaUsers, FaComments, FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";
import api from '../../../services/api';

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

function Step5_GameElements({ activityData, handleInputChange, setActivityData }) {
  const { openHelp } = useHelpModal();
  const [clusters, setClusters] = useState({ recommended: [], neutral: [], forbidden: [] });
  const [loading, setLoading] = useState(true);
  const [conflictModal, setConflictModal] = useState({ isOpen: false, element: null, message: '' });

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await api.post('/activities/recommendations', activityData);
        const data = response.data;

        setClusters({
          recommended: data.recommended || [],
          neutral: data.neutral || [],
          forbidden: data.not_recommended || []
        });

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
        const allNames = Object.keys(ICON_MAP).map(name => ({ name, score: 0 }));
        setClusters({ recommended: [], neutral: allNames, forbidden: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleSelectionAttempt = (elementObj, category) => {
    const elementName = elementObj.name;
    const isSelected = activityData.gameElements.selectedElements.includes(elementName);

    if (isSelected) {
      toggleElement(elementName);
      return;
    }

    if (category === 'forbidden') {
      setConflictModal({
        isOpen: true,
        element: elementName,
        message: elementObj.reason || elementObj.warning_msg || "O Sistema de Apoio à Decisão encontrou conflitos pedagógicos."
      });
      return;
    }

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

  // --- NOVA LÓGICA DE RENDERIZAÇÃO DO CARD (MUITO MAIS CLARA) ---
  const renderCard = (item, category) => {
    const isSelected = activityData.gameElements.selectedElements.includes(item.name);

    // Variáveis base
    let baseBorder = 'border-[var(--border-color)]';
    let baseBg = 'bg-secondary-bg';
    let iconColor = 'text-secondary-text';

    // 1. Cores de Estado Base (Não Selecionado)
    if (category === 'recommended') {
      baseBorder = 'border-success/50';
      baseBg = 'bg-success-bg/40';
      iconColor = 'text-success';
    } else if (category === 'forbidden') {
      baseBorder = 'border-danger/30 border-dashed';
      baseBg = 'bg-danger-bg/20';
      iconColor = 'text-danger/60';
    }

    // 2. Cores de Seleção (Sobrescreve o base)
    if (isSelected) {
      if (category === 'forbidden') {
        // Selecionado mas proibido (Fica vermelho forte)
        baseBorder = 'border-2 border-danger shadow-md shadow-danger/20';
        baseBg = 'bg-danger-bg';
        iconColor = 'text-danger';
      } else {
        // Selecionado Normal ou Recomendado (Fica Teal forte)
        baseBorder = 'border-2 border-accent-teal shadow-md shadow-accent-teal/20';
        baseBg = category === 'recommended' ? 'bg-success-bg' : 'bg-accent-teal/10';
        iconColor = 'text-accent-teal';
      }
    }

    return (
      <div
        key={item.name}
        onClick={() => handleSelectionAttempt(item, category)}
        className={`group relative flex flex-col items-center justify-start p-6 rounded-2xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 ${baseBorder} ${baseBg} backdrop-blur-sm`}
      >
        {/* CHECKMARK GIGANTE SE ESTIVER SELECIONADO */}
        {isSelected && (
          <div className={`absolute top-3 left-3 animate-bounce-in ${category === 'forbidden' ? 'text-danger' : 'text-accent-teal'}`}>
            <FaCheckCircle size={24} />
          </div>
        )}

        {/* ESTRELA SE FOR RECOMENDADO */}
        {category === 'recommended' && !isSelected && (
          <div className="absolute top-3 right-3 text-success animate-pulse" title="Recomendado pelo Motor">
            <FaStar size={20} />
          </div>
        )}

        {/* ALERTA SE FOR PROIBIDO */}
        {category === 'forbidden' && !isSelected && (
          <div className="absolute top-3 right-3 text-danger opacity-70" title="Não Recomendado">
            <FaExclamationTriangle size={20} />
          </div>
        )}

        <div className={`text-5xl mb-4 mt-2 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${iconColor}`}>
          {ICON_MAP[item.name] || <FaGamepad />}
        </div>

        <p className={`text-sm font-extrabold text-center leading-relaxed ${isSelected ? 'text-primary-text' : 'text-secondary-text group-hover:text-primary-text'}`}>
          {item.name}
        </p>

        {item.reason && category === 'recommended' && (
          <span className="mt-3 text-xs text-success font-bold text-center leading-tight bg-success/10 px-2 py-1 rounded-lg">
            {item.reason}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-teal"></div>
        <p className="text-secondary-text font-medium animate-pulse">O Motor Contextual está analisando sua turma...</p>
      </div>
    );
  }

  return (
    <div id="tour-step-elements" className="space-y-10 animate-fade-in relative pb-10">
      {/* CABEÇALHO DO PASSO */}
      <div className="flex items-center justify-between border-b border-border-color pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow">
            Design Guiado: Elementos de Jogo
          </h2>
          <p className="mt-2 text-secondary-text text-lg">
            O sistema analisou o perfil da sua turma e organizou os elementos abaixo para potencializar o engajamento.
          </p>
        </div>
        <button
          onClick={() => openHelp('elementos_jogos')}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-primary-bg border border-border-color hover:border-accent-teal/50 hover:bg-accent-teal/10 transition-all duration-300 shadow-sm"
          title="Ajuda sobre este passo"
        >
          <FaInfoCircle className="text-xl text-secondary-text group-hover:text-accent-teal transition-colors" />
        </button>
      </div>

      {clusters.recommended.length > 0 && (
        <div className="space-y-6 pt-2">
          <h3 className="flex items-center text-2xl font-bold text-success uppercase tracking-wider">
            <FaStar className="mr-3 text-3xl" /> Altamente Recomendados
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {clusters.recommended.map(item => renderCard(item, 'recommended'))}
          </div>
        </div>
      )}

      <div className="space-y-6 pt-6 border-t border-border-color">
        <h3 className="flex items-center text-xl font-bold text-primary-text uppercase tracking-wider">
          <FaLayerGroup className="mr-3" /> Disponíveis (Neutros)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {clusters.neutral.map(item => renderCard(item, 'neutral'))}
        </div>
      </div>

      {clusters.forbidden.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-border-color">
          <h3 className="flex items-center text-xl font-bold text-danger uppercase tracking-wider">
            <FaExclamationTriangle className="mr-3" /> Requer Cuidado (Potenciais Conflitos)
          </h3>
          <p className="text-base text-secondary-text">Estes elementos podem conflitar com o perfil da turma ou a logística definida anteriormente.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {clusters.forbidden.map(item => renderCard(item, 'forbidden'))}
          </div>
        </div>
      )}

      <div className="pt-8 border-t border-border-color group">
        <label className="block text-sm font-bold text-secondary-text uppercase tracking-wider mb-3">
          Outro elemento (Personalizado)
        </label>
        <div className="relative">
            <input
            type="text"
            value={activityData.gameElements.otherElement || ''}
            onChange={handleInputChange}
            name="gameElements.otherElement"
            className="block w-full px-6 py-4 bg-primary-bg/50 backdrop-blur-sm border border-border-color rounded-2xl shadow-inner focus:ring-2 focus:ring-accent-teal focus:border-transparent text-primary-text text-lg transition-all duration-300 group-hover:border-accent-teal/50"
            placeholder="Ex: Cartas Colecionáveis Físicas..."
            />
        </div>
      </div>

      {conflictModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-secondary-bg border border-danger rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-danger flex items-center mb-4">
              <FaExclamationTriangle className="mr-2" />
              Conflito Pedagógico
            </h3>
            <p className="text-primary-text mb-2">
              {conflictModal.message}
            </p>
            <p className="text-sm text-secondary-text mb-6">
              Deseja incluir este elemento mesmo assim?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConflictModal({ isOpen: false, element: null, message: '' })}
                className="px-4 py-2 bg-primary-bg text-secondary-text border border-border-color rounded-lg hover:bg-hover-bg-color font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmConflictSelection}
                className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/80 font-bold"
              >
                Sim, manter elemento
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default Step5_GameElements;