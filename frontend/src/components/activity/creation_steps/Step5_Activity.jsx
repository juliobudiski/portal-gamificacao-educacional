// frontend/src/components/activity/creation_steps/Step5_Activity.jsx
import React, { useState, useEffect } from 'react';
import {
  FaLayerGroup, FaChartBar, FaGem, FaCoins, FaDice, FaClock, FaIdBadge,
  FaHandshake, FaVrCardboard, FaPuzzlePiece, FaSyncAlt, FaBook, FaUserEdit,
  FaShieldAlt, FaShareAlt, FaCheckCircle, FaChartLine, FaListOl, FaGift,
  FaBookOpen, FaAward, FaTrophy, FaGamepad, FaBullseye, FaBrain, FaLightbulb,
  FaStar, FaProjectDiagram, FaCodeBranch, FaUsers, FaComments, FaExclamationTriangle
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
        className={`group relative flex flex-col items-center justify-start p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-1 ${baseBorder} ${baseBg}`}
      >
        {/* CHECKMARK GIGANTE SE ESTIVER SELECIONADO (Muda a Forma, não só a cor) */}
        {isSelected && (
          <div className={`absolute top-2 left-2 ${category === 'forbidden' ? 'text-danger' : 'text-accent-teal'}`}>
            <FaCheckCircle size={20} />
          </div>
        )}

        {/* ESTRELA SE FOR RECOMENDADO (Apenas se não estiver selecionado) */}
        {category === 'recommended' && !isSelected && (
          <div className="absolute top-2 right-2 text-success animate-pulse" title="Recomendado pelo Motor">
            <FaStar size={16} />
          </div>
        )}

        {/* ALERTA SE FOR PROIBIDO (Apenas se não estiver selecionado) */}
        {category === 'forbidden' && !isSelected && (
          <div className="absolute top-2 right-2 text-danger opacity-70" title="Não Recomendado">
            <FaExclamationTriangle size={16} />
          </div>
        )}

        <div className={`text-4xl mb-3 mt-2 transition-transform group-hover:scale-110 ${iconColor}`}>
          {ICON_MAP[item.name] || <FaGamepad />}
        </div>

        <p className={`text-sm font-bold text-center leading-tight ${isSelected ? 'text-primary-text' : 'text-secondary-text'}`}>
          {item.name}
        </p>

        {item.reason && category === 'recommended' && (
          <span className="mt-2 text-[10px] text-success font-semibold text-center px-1 leading-tight">
            {item.reason}
          </span>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Carregando sugestões do Motor Contextual...</div>;

  return (
    <div id="tour-step-elements" className="space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="text-2xl font-bold text-primary-text">
          Design Guiado: Elementos de Jogo
        </h2>
        <p className="mt-2 text-secondary-text">
          O sistema analisou o perfil da sua turma e organizou os elementos abaixo.
        </p>
      </div>

      {clusters.recommended.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center text-lg font-semibold text-success">
            <FaStar className="mr-2" /> Altamente Recomendados
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {clusters.recommended.map(item => renderCard(item, 'recommended'))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="flex items-center text-lg font-semibold text-primary-text">
          <FaLayerGroup className="mr-2" /> Disponíveis (Neutros)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {clusters.neutral.map(item => renderCard(item, 'neutral'))}
        </div>
      </div>

      {clusters.forbidden.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border-color">
          <h3 className="flex items-center text-lg font-semibold text-danger">
            <FaExclamationTriangle className="mr-2" /> Requer Cuidado (Potenciais Conflitos)
          </h3>
          <p className="text-sm text-secondary-text">Estes elementos podem conflitar com o perfil da turma ou a logística definida.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {clusters.forbidden.map(item => renderCard(item, 'forbidden'))}
          </div>
        </div>
      )}

      <div className="pt-6">
        <label className="block text-sm font-medium text-secondary-text mb-1">
          Outro elemento (Personalizado)
        </label>
        <input
          type="text"
          value={activityData.gameElements.otherElement || ''}
          onChange={handleInputChange}
          name="gameElements.otherElement"
          className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal text-primary-text"
          placeholder="Ex: Cartas Colecionáveis Físicas..."
        />
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

      <button onClick={() => openHelp('elementos_jogos')} className="bg-info text-white px-4 py-2 rounded-lg font-bold">
        Ajuda
      </button>
    </div>
  );
}

export default Step5_GameElements;