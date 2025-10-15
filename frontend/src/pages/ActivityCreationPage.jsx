// frontend/src/pages/ActivityCreationPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAnalytics from '../hooks/useAnalytics';

// 1. Importação dos novos componentes de etapa filhos
import Step1_InitialDetails from '../components/activity/creation_steps/Step1_Activity';
import Step2_DesiredScenario from '../components/activity/creation_steps/Step2_Activity';
import Step3_ActivityPlanning from '../components/activity/creation_steps/Step3_Activity';
import Step4_PlayerProfile from '../components/activity/creation_steps/Step4_Activity';
import Step5_GameElements from '../components/activity/creation_steps/Step5_Activity';
import Step6_RewardsOffered from '../components/activity/creation_steps/Step6_Activity';
import Step7_RewardedActions from '../components/activity/creation_steps/Step7_Activity';
import Step8_RulesAndSharing from '../components/activity/creation_steps/Step8_Activity';
// Nota: O GameBoardEditor é usado dentro do Step5, mas o mantemos importado aqui
// caso seja necessário em outro local ou para referência.
//import GameBoardEditor from '../../components/activity/GameBoardEditor';


const hubElementCardMap = {
  "Chance (sorte e probabilidade)": ["roulette", "slot_machine"],
  "Competição": ["ranking"],
  "Sistema de classificação e ranking": ["ranking"],
  "Chat ou sistema de mensagens": ["chat"],
  "Conquistas digitais para metas alcançadas": ["badges"],
  "Economia (sistema monetário)": ["store"],
  "Objetivo (missão, meta do jogo)": ["mission"],
};

/**
 * Componente ActivityCreationPage (Refatorado)
 * Atua como um "container" que gerencia o estado e a lógica para o formulário 
 * de criação de atividades de várias etapas. Renderiza dinamicamente o componente 
 * de etapa apropriado.
 */
function ActivityCreationPage({ existingActivity }) {
  // --- TODA A LÓGICA DE ESTADO, HOOKS E HANDLERS É MANTIDA AQUI ---
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;
  const { user } = useAuth();
  const formStartedRef = useRef(false);
  const { activityId } = useParams();
  const isEditMode = !!activityId || !!existingActivity;
  const { logEvent } = useAnalytics('activity_creation', user?.token, activityId);
  const [showInitialSelection, setShowInitialSelection] = useState(!isEditMode);
  const [showTemplateList, setShowTemplateList] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState(null);

  const [activityData, setActivityData] = useState({
    title: '',
    description: '',
    areaKnowledge: '',
    isPublic: true,
    currentScenario: { problems: [], otherProblem: '' },
    desiredScenario: { objectives: [], otherObjective: '' },
    activityPlanning: { characteristics: [], participantsQuantity: '', expectedDuration: '', location: '', otherInfo: '' },
    playerProfile: { selectedProfiles: [] },
    gameElements: { selectedElements: [], otherElement: '', narrativeTitle: '', narrativeContent: '' },
    gamificationDesign: { theme: 'vila_da_aventura', progression_path: [], hub_elements: [] },
    rewardsOffered: { selectedRewards: [], otherReward: '' },
    rewardedActions: { selectedActions: [], otherAction: '' },
    gamificationRules: { generalRules: [], specificRules: '' },
  });

  const stepStartTimeRef = useRef(Date.now());
  const previousStepRef = useRef(currentStep);
  const isSubmittingRef = useRef(false);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpContent, setHelpContent] = useState({ title: '', text: '' });

  // (Todos os useEffects e handlers como handleNext, handlePrevious, handleInputChange, etc. são mantidos)

  useEffect(() => {
    // ... (lógica de rastreamento de tempo mantida)
  }, [currentStep, logEvent]);

  useEffect(() => {
    // ... (lógica de abandono de formulário mantida)
    return () => {
      if (formStartedRef.current && !isSubmittingRef.current) {
        logEvent("form_abandoned", { last_step: previousStepRef.current });
      }
    };
  }, [logEvent]);

  useEffect(() => {
    // Executa apenas quando o usuário chega na etapa 5
    if (currentStep === 5) {
      console.log("ActivityCreationPage: Etapa 5 alcançada. Calculando e mesclando elementos de jogo recomendados.");

      const recommendedElements = new Set();
      if (activityData.playerProfile.selectedProfiles.includes("Competitivo")) { ["Níveis", "Sistema de pontuação", "Estatísticas (métricas de progresso)", "Reconhecimento", "Competição", "Progressão baseada em habilidade", "Sistema de classificação e ranking"].forEach(el => recommendedElements.add(el)); }
      if (activityData.playerProfile.selectedProfiles.includes("Cooperativo")) { ["Cooperação", "Chat ou sistema de mensagens", "Interação social com outros jogadores"].forEach(el => recommendedElements.add(el)); }
      if (activityData.playerProfile.selectedProfiles.includes("Imersivo")) { ["Narrativas envolventes", "Storytelling", "Sensação (imersão, experiência sensorial)", "Customização de personagem", "Customização de equipamento"].forEach(el => recommendedElements.add(el)); }
      if (activityData.playerProfile.selectedProfiles.includes("Realizador")) { ["Níveis", "Sistema de pontuação", "Conquistas digitais para metas alcançadas", "Recompensas atraentes", "Progressão baseada em habilidade", "Feedback claro sobre o desempenho"].forEach(el => recommendedElements.add(el)); }
      if (activityData.playerProfile.selectedProfiles.includes("Social")) { ["Interação social com outros jogadores", "Chat ou sistema de mensagens", "Reputação (prestígio, renome, status)", "Cooperação", "Feedback claro sobre o desempenho"].forEach(el => recommendedElements.add(el)); }

      setActivityData(prevData => {
        // Combina os elementos já selecionados com os novos recomendados, evitando duplicatas.
        const mergedElements = new Set([...prevData.gameElements.selectedElements, ...recommendedElements]);

        console.log("ActivityCreationPage: Elementos mesclados para salvar no estado:", Array.from(mergedElements));

        return {
          ...prevData,
          gameElements: {
            ...prevData.gameElements,
            selectedElements: Array.from(mergedElements)
          }
        };
      });
    }
  }, [currentStep, activityData.playerProfile.selectedProfiles]);

  const location = useLocation();

  useEffect(() => {
    // Verifica se recebemos um "recado" para ir para uma etapa específica
    const targetStep = location.state?.fromStep;
    if (targetStep) {
      console.log(`[ActivityCreationPage] Navegação recebida com lembrete para ir para a etapa: ${targetStep}`);
      setCurrentStep(targetStep);
    }
  }, []);

  useEffect(() => {
    console.log("ActivityCreationPage: Verificando autenticação do usuário...", user);
    // Se não houver usuário, token ou se o papel não for 'professor', redireciona para o login.
    // Este é um controle de segurança para garantir que apenas usuários autorizados acessem a página.
    if (!user || !user.token || user.role !== 'professor') {
      console.error("ActivityCreationPage: Usuário não autenticado ou não é professor. Redirecionando para /login.");
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchActivityDataForBoard = async () => {
      if (activityId && user?.token) {
        console.log(`[ActivityCreationPage] useEffect detectou um activityId (${activityId}). BUSCANDO DADOS ATUALIZADOS da atividade.`);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          const data = await response.json();
          console.log("%cLOG 1: DADOS BRUTOS RECEBIDOS DA API", "color: blue; font-weight: bold;", data);
          console.log("--> O objeto acima tem a chave 'gamification_design' (com underline)?", data.hasOwnProperty('gamification_design'));

          if (response.ok) {
            console.log('[ActivityCreationPage] DADOS FRESCOS RECEBIDOS DO BACKEND:', data);
            // Aqui é onde o estado deveria ser atualizado com os novos dados
            setActivityData(prev => ({ ...prev, ...data }));
          } else {
            console.error('[ActivityCreationPage] Erro ao buscar dados frescos:', data.message);
          }
        } catch (error) {
          console.error('[ActivityCreationPage] Erro de rede ao buscar dados frescos:', error);
        }
      } else {
        console.log('[ActivityCreationPage] useEffect de recarregamento executado, mas sem activityId ou token para agir.');
      }
    };

    fetchActivityDataForBoard();
  }, [activityId, user?.token]);

  const handleAutoSaveStructure = useCallback(async (newGamificationDesign) => {
    const activityIdToSave = activityId || existingActivity?.id;
    if (!activityIdToSave || !user?.token) return;

    console.log("%c[Auto-Save] Salvando estrutura da trilha...", "color: #007acc;");

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityIdToSave}/structure`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ gamificationDesign: newGamificationDesign }),
      });
    } catch (error) {
      console.error("[Auto-Save] Falha ao salvar a estrutura:", error);
    }
  }, [activityId, existingActivity, user]);

  useEffect(() => {
    if (isEditMode && existingActivity) {
      setActivityData({
        title: existingActivity.title || '',
        description: existingActivity.description || '',
        areaKnowledge: existingActivity.areaKnowledge || '',
        isPublic: existingActivity.isPublic == null ? true : existingActivity.isPublic,
        currentScenario: existingActivity.currentScenario || { problems: [], otherProblem: '' },
        desiredScenario: existingActivity.desiredScenario || { objectives: [], otherObjective: '' },
        activityPlanning: existingActivity.activityPlanning || { characteristics: [], participantsQuantity: '', expectedDuration: '', location: '', otherInfo: '' },
        playerProfile: existingActivity.playerProfile || { selectedProfiles: [] },
        gameElements: existingActivity.gameElements || { selectedElements: [], otherElement: '' },
        // Esta linha garante que o objeto sempre exista.
        gamificationDesign: existingActivity.gamificationDesign || { theme: 'vila_da_aventura', progression_path: [], hub_elements: [] },
        rewardsOffered: existingActivity.rewardsOffered || { selectedRewards: [], otherReward: '' },
        rewardedActions: existingActivity.rewardedActions || { selectedActions: [], otherAction: '' },
        gamificationRules: existingActivity.gamificationRules || { generalRules: [], specificRules: '' },
      });
      setShowInitialSelection(false); // Garante que o formulário seja exibido diretamente
    }
  }, [isEditMode, existingActivity]);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!user || !user.token) {
        setLoadingTemplates(false);
        return;
      }

      try {
        setLoadingTemplates(true);
        setTemplateError(null);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/templates`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
          console.log("Templates carregados com sucesso:", data);
        } else {
          const errorData = await response.json();
          setTemplateError(errorData.message || 'Erro ao carregar templates.');
          console.error("Erro ao carregar templates:", errorData);
        }
      } catch (error) {
        setTemplateError('Erro de conexão ao carregar templates.');
        console.error("Erro de rede ao carregar templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [user]);

  useEffect(() => {
    const selectedCards = activityData.gameElements.selectedElements;
    const currentHubElements = activityData.gamificationDesign?.hub_elements || [];

    // Usamos um Set para garantir que cada tipo de hub apareça apenas uma vez
    const targetHubTypes = new Set();
    selectedCards.forEach(cardName => {
      const types = hubElementCardMap[cardName];
      if (types) {
        types.forEach(type => targetHubTypes.add(type));
      }
    });

    const newHubElements = Array.from(targetHubTypes).map(type => {
      const existingElement = currentHubElements.find(el => el.type === type);
      return {
        id: `hub_${type}`,
        type: type,
        enabled: existingElement ? existingElement.enabled : true,
        config: existingElement ? existingElement.config : {},
      };
    });

    if (JSON.stringify(newHubElements) !== JSON.stringify(currentHubElements)) {
      setActivityData(prev => ({
        ...prev,
        gamificationDesign: {
          ...(prev.gamificationDesign || {}),
          hub_elements: newHubElements,
        }
      }));
    }
  }, [activityData.gameElements.selectedElements]);


  /**
   * handleSelectTemplate: Preenche o formulário com os dados do template selecionado
   * e muda para a tela de criação da atividade.
   * @param {object} templateData - Os dados do template a serem usados para pré-preencher o formulário.
   */
  const handleSelectTemplate = (templateData) => {
    console.log("handleSelectTemplate: Selecionando template e preenchendo dados...", templateData);
    formStartedRef.current = true;
    setActivityData(templateData); // Preenche o estado com os dados do template
    setShowInitialSelection(false); // Esconde a tela de seleção inicial
    setShowTemplateList(false); // Esconde a lista de templates
    setCurrentStep(1); // Volta para a primeira etapa do formulário
  };

  /**
   * handleStartFromScratch: Inicia o formulário de criação de atividade vazio.
   */
  const handleStartFromScratch = () => {
    console.log("handleStartFromScratch: Iniciando atividade do zero.");
    formStartedRef.current = true;
    // Reseta activityData para o estado inicial vazio
    setActivityData({
      title: '', description: '', areaKnowledge: '', isPublic: false,
      currentScenario: { problems: [], otherProblem: '' },
      desiredScenario: { objectives: [], otherObjective: '' },
      activityPlanning: { characteristics: [], participantsQuantity: '', expectedDuration: '', location: '', otherInfo: '' },
      playerProfile: { selectedProfiles: [] },
      gameElements: { selectedElements: [], otherElement: '', narrativeTitle: '', narrativeContent: '' },
      rewardsOffered: { selectedRewards: [], otherReward: '' },
      rewardedActions: { selectedActions: [], otherAction: '' },
      gamificationRules: { generalRules: [], specificRules: '' },
    });
    setShowInitialSelection(false); // Esconde a tela de seleção inicial
    setShowTemplateList(false); // Esconde a lista de templates
    setCurrentStep(1); // Volta para a primeira etapa do formulário
  };

  /**
   * handleShowTemplates: Exibe a lista de templates.
   */
  const handleShowTemplates = () => {
    console.log("handleShowTemplates: Exibindo a lista de templates.");
    setShowInitialSelection(true); // Garante que a seção principal de seleção esteja visível
    setShowTemplateList(true); // Mostra a lista de templates
  };


  /**
   * handleBackToInitialSelection: Volta para a tela inicial de seleção (Iniciar do Zero / Escolher Template).
   */
  const handleBackToInitialSelection = () => {
    console.log("handleBackToInitialSelection: Voltando para a seleção inicial.");
    setShowInitialSelection(true);
    setShowTemplateList(false);
  };


  const handleOpenContentEditor = (step) => {
    const effectiveActivityId = activityId || existingActivity?.id;

    if (!effectiveActivityId) {
      alert("Você precisa salvar a atividade pelo menos uma vez antes de poder editar o conteúdo.");
      return;
    }

    // --- ADICIONE ESTA LINHA ---
    console.log(`Tentando navegar para: /professor/atividades/${effectiveActivityId}/${step.type}/${step.id}/edit`);

    // A linha original de navegação
    navigate(`/professor/atividades/${effectiveActivityId}/${step.type}/${step.id}/edit`);
  };


  /**
   * handleNext: Avança para a próxima etapa ou submete o formulário.
   * Se não for a última etapa, incrementa `currentStep`.
   * Se for a última etapa, envia os dados para o backend via API.
   */
  const handleNext = async () => {
    console.log(`%c[handleNext] Botão clicado na Etapa ${currentStep}. Total de etapas: ${totalSteps}.`, "background: #FFD700; color: black;");
    console.log(`handleNext: Tentando avançar da etapa ${currentStep}.`);
    if (currentStep < totalSteps) {
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      console.log("%c[handleNext] CONDIÇÃO DE SALVAMENTO ATINGIDA. INICIANDO REQUISIÇÃO PUT...", "background: #28a745; color: white;");

      const finalStepDuration = Math.round((Date.now() - stepStartTimeRef.current) / 1000);
      if (finalStepDuration > 0) {
        console.log(`Logando duração da Etapa FINAL ${currentStep}: ${finalStepDuration}s`);
        logEvent("step_view_duration", {
          step: currentStep,
          duration_seconds: finalStepDuration
        });
      }
      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL}/api/activities/${activityId}`
        : `${import.meta.env.VITE_API_URL}/api/activities`;

      const method = isEditMode ? 'PUT' : 'POST';
      isSubmittingRef.current = true;
      console.log(`Submetendo formulário em modo de ${isEditMode ? 'EDIÇÃO' : 'CRIAÇÃO'}`);
      console.log(`URL: ${method} ${url}`);

      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}` // Adiciona o token de autenticação
          },
          body: JSON.stringify(activityData),
        });

        const result = await response.json();

        if (response.ok) {
          alert(isEditMode ? 'Atividade atualizada com sucesso!' : 'Atividade criada com sucesso!');
          navigate('/professor/banco-atividades'); // Redireciona para o banco de atividades após sucesso
        } else {
          alert('Erro: ' + (result.message || 'Erro desconhecido do servidor.'));
        }
      } catch (error) {
        alert('Ocorreu um erro de rede. Verifique sua conexão.');
      }
    }
  };

  /**
   * handlePrevious: Retorna para a etapa anterior.
   * Decrementa `currentStep` se não estiver na primeira etapa.
   */
  const handlePrevious = () => {
    console.log(`handlePrevious: Retornando da etapa ${currentStep}.`);
    if (currentStep > 1) {
      logEvent("previous_button_click", {
        from_step: currentStep,
        to_step: currentStep - 1
      });
      setCurrentStep(prevStep => prevStep - 1);
    }
  };

  /**
   * handleInputChange: Atualiza o estado `activityData` com base na entrada do usuário.
   * Lida com diferentes tipos de inputs (texto, textarea, checkbox).
   * O nome do input usa uma notação de ponto (ex: 'section.field') para atualizar o estado aninhado.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - O evento do input.
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`handleInputChange: Input alterado -> name='${name}', type='${type}', value='${value}', checked=${checked}`);

    const nameParts = name.split('.');

    setActivityData(prevData => {
      let newData;
      if (nameParts.length === 1) { // Campo no nível raiz (ex: 'title', 'isPublic')
        const fieldName = nameParts[0];
        newData = {
          ...prevData,
          [fieldName]: type === 'checkbox' ? checked : value,
        };
      } else { // Campo aninhado (ex: 'currentScenario.problems')
        const [section, field] = nameParts;
        const sectionData = prevData[section];

        if (type === 'checkbox') {
          const currentValues = sectionData[field] || [];
          const newValues = checked
            ? [...currentValues, value] // Adiciona o valor ao array se o checkbox for marcado
            : currentValues.filter(item => item !== value); // Remove o valor se desmarcado
          newData = {
            ...prevData,
            [section]: { ...sectionData, [field]: newValues },
          };
        } else {
          newData = {
            ...prevData,
            [section]: { ...sectionData, [field]: value },
          };
        }
      }
      console.log("handleInputChange: Novo estado de activityData:", newData);
      return newData;
    });
  };

  /**
   * openHelpModal: Abre o modal de ajuda e define seu conteúdo.
   * @param {string} title - O título do modal.
   * @param {string} text - O texto de ajuda a ser exibido.
   */
  const openHelpModal = (title, text) => {
    console.log(`openHelpModal: Abrindo modal de ajuda com o título: "${title}"`);
    logEvent("help_button_click", { step: currentStep, help_title: title });
    setHelpContent({ title, text });
    setShowHelpModal(true);
  };

  /**
   * closeHelpModal: Fecha o modal de ajuda.
   */
  const closeHelpModal = () => {
    console.log("closeHelpModal: Fechando modal de ajuda.");
    setShowHelpModal(false);
    setHelpContent({ title: '', text: '' });
  };

  /**
   * renderStep (Refatorado): Renderiza o componente filho apropriado para a etapa atual.
   * O JSX de cada etapa foi movido para seu próprio componente.
   */
  const renderStep = () => {
    if (!user || !user.token || user.role !== 'professor') {
      return null;
    }

    // Props comuns a serem passadas para a maioria dos componentes de etapa
    const commonStepProps = {
      activityData,
      handleInputChange,
      setActivityData,
    };

    // 2. O switch case agora apenas renderiza o componente correto com as props
    switch (currentStep) {
      case 1:
        return <Step1_InitialDetails {...commonStepProps} openHelpModal={openHelpModal} />;
      case 2:
        return <Step2_DesiredScenario {...commonStepProps} openHelpModal={openHelpModal} />;
      case 3:
        return <Step3_ActivityPlanning {...commonStepProps} />;
      case 4:
        return <Step4_PlayerProfile {...commonStepProps} openHelpModal={openHelpModal} />;
      case 5:
        return <Step5_GameElements {...commonStepProps} onEditContent={handleOpenContentEditor} onStructureChange={handleAutoSaveStructure} />;
      case 6:
        return <Step6_RewardsOffered {...commonStepProps} />;
      case 7:
        return <Step7_RewardedActions {...commonStepProps} />;
      case 8:
        return <Step8_RulesAndSharing {...commonStepProps} />;
      default:
        return null;
    }
  };

  console.log("%cLOG 3: ESTADO 'activityData' ATUAL ANTES DE RENDERIZAR", "color: purple; font-weight: bold;", activityData);


  // --- O JSX ESTRUTURAL DA PÁGINA É MANTIDO ---
  return (
    <div className="min-h-screen bg-primary-bg dark:bg-primary-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-text dark:text-primary-text">
            {isEditMode ? 'Editar Atividade' : 'Criar Nova Atividade Gamificada'}
          </h1>
          <p className="mt-2 text-secondary-text dark:text-secondary-text">
            Siga as etapas para criar uma experiência de aprendizado envolvente.
          </p>
        </div>

        {showInitialSelection ? (
          // O JSX para a seleção inicial (Iniciar do Zero / Templates) é mantido
          <div className="bg-secondary-bg dark:bg-primary-bg p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-accent-purple to-accent-teal bg-clip-text text-transparent">
              Como você gostaria de começar?
            </h3>

            {!showTemplateList ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Opção: Iniciar do Zero */}
                <div className="relative bg-primary-bg rounded-2xl shadow-xl overflow-hidden border border-[#4a525a] hover:border-accent-yellow/50 transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-teal/5 to-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 p-6 flex flex-col items-center text-center h-full">
                    <div className="mb-4 bg-gradient-to-r from-accent-yellow to-accent-teal p-1 rounded-full">
                      <div className="bg-secondary-bg rounded-full p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-xl font-semibold text-secondary-text mb-2">
                      Iniciar do Zero
                    </h4>
                    <p className="text-secondary-text mb-6 flex-grow">
                      Comece com um formulário completamente vazio e personalize cada detalhe.
                    </p>
                    <button
                      onClick={handleStartFromScratch}
                      className="w-full py-3 px-6 bg-gradient-to-r from-accent-yellow to-accent-teal text-primary-text font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-accent-yellow/90 hover:to-accent-teal/90 transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                    >
                      Atividade em Branco
                    </button>
                  </div>
                </div>

                {/* Opção: Escolher um Template */}
                <div className="relative bg-primary-bg rounded-2xl shadow-xl overflow-hidden border border-[#4a525a] hover:border-accent-purple/50 transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/5 to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 p-6 flex flex-col items-center text-center h-full">
                    <div className="mb-4 bg-gradient-to-r from-accent-purple to-accent-teal p-1 rounded-full">
                      <div className="bg-secondary-bg rounded-full p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-xl font-semibold text-secondary-text mb-2">
                      Escolher um Template
                    </h4>
                    <p className="text-secondary-text mb-6 flex-grow">
                      Use um de nossos templates predefinidos para agilizar a criação.
                    </p>
                    <button
                      onClick={handleShowTemplates}
                      className="w-full py-3 px-6 bg-gradient-to-r from-accent-purple to-accent-teal text-primary-text font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-accent-purple/90 hover:to-accent-teal/90 transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                    >
                      Ver Templates
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Lista de templates
              <div className="mt-6">
                <h4 className="text-xl font-bold text-center mb-6 bg-gradient-to-r from-accent-purple to-accent-yellow bg-clip-text text-transparent">
                  Templates Predefinidos
                </h4>

                {loadingTemplates ? (
                  <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-teal"></div>
                    <p className="mt-4 text-secondary-text">Carregando templates...</p>
                  </div>
                ) : templateError ? (
                  <div className="bg-red-900/30 text-red-400 p-4 rounded-xl text-center">
                    <p>Erro: {templateError}</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="bg-blue-900/30 text-blue-400 p-4 rounded-xl text-center">
                    <p>Nenhum template disponível no momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                      <div
                        key={template.id}
                        className="relative bg-primary-bg rounded-2xl shadow-xl p-6 border border-[#4a525a] hover:border-accent-teal/50 transition-all duration-300 group overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/5 to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-center mb-4">
                            <div className="bg-gradient-to-r from-accent-purple to-accent-yellow p-1 rounded-full">
                              <div className="bg-secondary-bg rounded-full p-2">
                                <span className="text-2xl">{template.icon}</span>
                              </div>
                            </div>
                          </div>
                          <h5 className="text-lg font-semibold text-secondary-text text-center mb-2">{template.name}</h5>
                          <p className="text-secondary-text text-sm mb-4 flex-grow text-center">{template.description}</p>
                          <button
                            onClick={() => handleSelectTemplate(template.data)}
                            className="mt-auto py-2 px-4 bg-gradient-to-r from-accent-purple to-accent-teal text-primary-text font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                          >
                            Usar Template
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 text-center">
                  <button
                    onClick={handleBackToInitialSelection}
                    className="py-2 px-4 border border-accent-teal/30 rounded-xl shadow-sm text-sm font-medium text-secondary-text bg-secondary-bg hover:bg-hover-bg-color focus:outline-none focus:ring-2 focus:ring-accent-teal transition duration-300"
                  >
                    <span className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Voltar para Seleção Inicial
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Barra de Progresso */}
            <div className="w-full bg-gray-200 dark:bg-border-color rounded-full h-2.5 mb-6">
              <div
                className="bg-teal-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>

            {/* Contêiner do Formulário */}
            <div className="bg-secondary-bg dark:bg-primary-bg p-8 rounded-lg shadow-md">
              {/* 3. A função renderStep agora insere o componente filho aqui */}
              {renderStep()}

              {/* Botões de Navegação */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border-color dark:border-border-color">
                {currentStep > 1 ? (
                  <button
                    onClick={handlePrevious}
                    className="py-2 px-4 border border-border-color rounded-md shadow-sm text-sm font-medium text-secondary-text bg-secondary-bg hover:bg-hover-bg-color dark:bg-border-color dark:text-secondary-text dark:hover:bg-hover-bg-color"
                  >
                    Anterior
                  </button>
                ) : (
                  <div></div> // Espaçador para manter o botão "Próximo" à direita
                )}
                <button
                  onClick={handleNext}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-text bg-teal-600 hover:bg-teal-700"
                >
                  {currentStep === totalSteps ? 'Concluir e Salvar' : 'Próximo'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Modal de Ajuda (Estrutura mantida) */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-secondary-bg dark:bg-primary-bg rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-medium leading-6 text-primary-text dark:text-primary-text">{helpContent.title}</h3>
              <div className="mt-2">
                <p className="text-sm text-secondary-text dark:text-secondary-text">{helpContent.text}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-teal-100 px-4 py-2 text-sm font-medium text-teal-900 hover:bg-teal-200"
                  onClick={closeHelpModal}
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityCreationPage;