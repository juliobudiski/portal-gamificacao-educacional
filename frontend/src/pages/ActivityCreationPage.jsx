// frontend/src/pages/ActivityCreationPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAnalytics from '../hooks/useAnalytics';
import { useActivityCreation } from '../context/ActivityCreationContext';
// 1. Importação dos novos componentes de etapa filhos
import Step1_InitialDetails from '../components/activity/creation_steps/Step1_Activity';
import Step2_DesiredScenario from '../components/activity/creation_steps/Step2_Activity';
import Step3_ActivityPlanning from '../components/activity/creation_steps/Step3_Activity';
import Step4_PlayerProfile from '../components/activity/creation_steps/Step4_Activity';
import Step5_GameElements from '../components/activity/creation_steps/Step5_Activity';
import Step6_RewardsOffered from '../components/activity/creation_steps/Step6_Activity';
import Step7_RewardedActions from '../components/activity/creation_steps/Step7_Activity';
import Step8_RulesAndSharing from '../components/activity/creation_steps/Step8_Activity';
import QuizEditor from './QuizEditorPage';
import NarrativeEditor from './NarrativeEditorPage';
import LearningContentEditor from './LearningContentEditorPage';
import { useTutorial } from '../context/TutorialContext';

// Nota: O GameBoardEditor é usado dentro do Step5, mas o mantemos importado aqui
// caso seja necessário em outro local ou para referência.
//import GameBoardEditor from '../../components/activity/GameBoardEditor';
// Importe TODOS os passos aqui (centralizado)
import {
  ACTIVITY_SELECTION_STEPS, // Tour Inicial
  WIZARD_SCENARIO_STEPS,    // Passo 1
  WIZARD_DYNAMICS_STEPS,    // Passo 3 
  WIZARD_PROFILES_STEPS,    // Passo 4
  WIZARD_ELEMENTS_STEPS,    // Passo 5 
  WIZARD_END_STEPS          // Passo 8
} from '../data/tutorialSteps';

/**
 * Mapeamento entre nomes de cartas de elementos e tipos de elementos do Hub.
 * Utilizado para sincronizar a seleção do usuário com a estrutura do gamification design.
 */
const hubElementCardMap = {
  "Chance (sorte e probabilidade)": ["roulette", "slot_machine"],
  "Competição": ["ranking"],
  "Sistema de classificação e ranking": ["ranking"],
  "Chat ou sistema de mensagens": ["chat"],
  "Conquistas digitais para metas alcançadas": ["badges"],
  "Economia (sistema monetário)": ["store"],
  "Objetivo (missão, meta do jogo)": ["mission"],
  "Recompensas atraentes": ["final_reward"],
  "Fórum de Discussão": ["forum"],
  "Customização de personagem": ["avatar_customization"],
  "Customização de equipamento": ["avatar_customization"]
};

/**
 * @component ActivityCreationPage
 * @desc Componente principal para criação e edição de atividades. Gerencia o estado do formulário (wizard),
 * navegação entre etapas, seleção de templates e persistência de dados.
 * @param {Object} props - Propriedades do componente.
 * @param {Object} [props.existingActivity] - Objeto contendo dados de uma atividade existente para edição.
 */
function ActivityCreationPage({ existingActivity }) {
  // --- TODA A LÓGICA DE ESTADO, HOOKS E HANDLERS É MANTIDA AQUI ---
  const navigate = useNavigate();
  const { startTour, stopTour } = useTutorial();
  const totalSteps = 8;
  const { user } = useAuth();
  const formStartedRef = useRef(false);
  const { activityId } = useParams();
  const isEditMode = !!activityId || !!existingActivity;
  const { logEvent } = useAnalytics('activity_creation', user?.token, activityId);

  const [showTemplateList, setShowTemplateList] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState(null);

  const {
    activityData,
    setActivityData,
    currentStep,
    setCurrentStep,
    showInitialSelection,
    setShowInitialSelection,
    startNewActivity,
    resetCreation,
    // --- NOVOS CAMPOS ---
    autoSaveStatus, // 'idle', 'saving', 'saved', 'error'
    lastSavedAt,
    loadDraft
  } = useActivityCreation();

  const stepStartTimeRef = useRef(Date.now());
  const previousStepRef = useRef(currentStep);
  const isSubmittingRef = useRef(false);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpContent, setHelpContent] = useState({ title: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);
  // (Todos os useEffects e handlers como handleNext, handlePrevious, handleInputChange, etc. são mantidos)


  // Rola para o topo sempre que a etapa mudar, com um leve atraso para garantir a renderização
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 111, left: 0, behavior: 'smooth' });
    }, 100); // 100ms é imperceptível para o olho, mas suficiente para o React terminar o render

    return () => clearTimeout(timer); // Limpa o timer se o componente desmontar rápido
  }, [currentStep]);

  useEffect(() => {

    const startTime = stepStartTimeRef.current;
    const previousStep = previousStepRef.current;

    // Calcula a duração na etapa anterior
    const durationInSeconds = Math.round((Date.now() - startTime) / 1000);

    // Evita logar na primeira renderização (duração de 0s)
    if (durationInSeconds > 0 && previousStep !== currentStep) {
      if (import.meta.env.VITE_DEBUG_MODE) {
        console.log(`// LOG: [ActivityCreationPage] Duração da etapa ${previousStep}: ${durationInSeconds}s`);
      }
      console.log(`Logando duração da Etapa ${previousStep}: ${durationInSeconds}s`);
      logEvent("step_view_duration", {
        step: previousStep,
        duration_seconds: durationInSeconds
      });

    }

    // Reseta o timer para a nova etapa
    stepStartTimeRef.current = Date.now();
    previousStepRef.current = currentStep;
  }, [currentStep, logEvent, startTour]); // O efeito roda sempre que a etapa muda

  useEffect(() => {

    // A função de retorno (cleanup) é executada quando o componente é desmontado
    return () => {

      // Só loga abandono se o formulário não foi concluído e não está no processo de submissão
      if (formStartedRef.current && !isSubmittingRef.current) {
        if (import.meta.env.VITE_DEBUG_MODE) {
          console.log(`// LOG: [ActivityCreationPage] Abandono do formulário detectado na etapa ${previousStepRef.current}`);
        }
        console.log(`Usuário abandonou o formulário INICIADO na etapa ${previousStepRef.current}`);
        logEvent("form_abandoned", {
          last_step: previousStepRef.current
        });
      }
    };

  }, [logEvent]);

  useEffect(() => {
    // Executa apenas quando o usuário chega na etapa 5
    if (currentStep === 5) {
      if (import.meta.env.VITE_DEBUG_MODE) {
        console.log("// LOG: [ActivityCreationPage] Etapa 5 (Elementos de Jogo) iniciada. Executando lógica de recomendação.");
      }
      console.log("ActivityCreationPage: Etapa 5 alcançada. Calculando e mesclando elementos de jogo recomendados.");
      const recommendedElements = new Set();
      if (activityData.playerProfile.selectedProfiles.includes("Competitivo")) { ["Níveis", "Sistema de pontuação", "Estatísticas (métricas de progresso)", "Reconhecimento", "Competição", "Progressão baseada em habilidade", "Sistema de classificação e ranking"].forEach(el => recommendedElements.add(el)); }
      if (activityData.playerProfile.selectedProfiles.includes("Cooperativo")) { ["Cooperação", "Chat ou sistema de mensagens", "Interação social com outros jogadores"].forEach(el => recommendedElements.add(el)); }
      if (activityData.playerProfile.selectedProfiles.includes("Imersivo")) { ["Narrativas envolventes", "Storytelling", "Sensação (imersão, experiência sensorial)", "Customização de personagem", "Customização de equipamento"].forEach(el => recommendedElements.add(el)); }
      if (activityData.playerProfile.selectedProfiles.includes("Realizador")) { ["Níveis", "Sistema de pontuação", "Conquistas digitais para metas alcançadas", "Recompensas atraentes", "Progressão baseada em habilidade", "Feedback claro sobre o desempenho"].forEach(el => recommendedElements.add(el)); }
      if (activityData.playerProfile.selectedProfiles.includes("Social")) { ["Interação social com outros jogadores", "Chat ou sistema de mensagens", "Reputação (prestígio, renome, status)", "Cooperação", "Feedback claro sobre o desempenho"].forEach(el => recommendedElements.add(el)); }

      setActivityData(prevData => {
        const mergedElements = new Set([...prevData.gameElements.selectedElements, ...recommendedElements]);
        // Combina os elementos já selecionados com os novos recomendados, evitando duplicatas.
        if (import.meta.env.VITE_DEBUG_MODE) {
          console.log(`// LOG: [ActivityCreationPage] Elementos mesclados. Total: ${mergedElements.size}`);
        }


        if (import.meta.env.VITE_DEBUG_MODE) {
          console.log("// LOG: [ActivityCreationPage] Verificando credenciais do usuário.");
        }
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
  const startTourRef = useRef(startTour);
  useEffect(() => { startTourRef.current = startTour; }, [startTour]);

  // --- LÓGICA CENTRAL DO TUTORIAL (O MAESTRO) ---
  useEffect(() => {
    // 1. Captura a intenção de força (Sessão ou State)
    const sessionForce = sessionStorage.getItem('TUTORIAL_MODE') === 'true';
    const stateForce = location.state?.forceTour === true;
    const shouldForce = stateForce || sessionForce;

    // --- O PORTEIRO ---
    // Se o usuário NÃO clicou no botão de tour (não tem força),
    // nós não iniciamos NADA automaticamente.
    if (!shouldForce) {
      return;
    }

    // Se passou do porteiro, avisa no log
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log(`// LOG: [ActivityCreationPage] Maestro do Tutorial ativado. Step atual: ${currentStep}`);
    }
    console.log(`🔍 MAESTRO: Modo Tutorial Ativo! (Step: ${currentStep})`);

    const timer = setTimeout(() => {
      const startTourFn = startTourRef.current;

      // CASO 1: Tela de Seleção Inicial
      if (showInitialSelection) {
        if (!isEditMode && !showTemplateList) {
          console.log(`🚀 MAESTRO: Disparando 'teacher_creation_v1'.`);
          startTourFn(ACTIVITY_SELECTION_STEPS, 'teacher_creation_v1', true);
        }
      }
      // CASO 2: Modo Wizard (Formulário)
      else {
        switch (currentStep) {
          case 1:
            startTourFn(WIZARD_SCENARIO_STEPS, 'creation_step_1_scenario', true);
            break;
          case 3:
            // Certifique-se que no seu form o passo da Dinâmica é realmente o 3
            // Se for o 2, mude aqui para 'case 2'.
            startTourFn(WIZARD_DYNAMICS_STEPS, 'creation_step_3_dynamics', true);
            break;
          case 4:
            startTourFn(WIZARD_PROFILES_STEPS, 'creation_step_4_profiles', true);
            break;
          case 5:
            startTourFn(WIZARD_ELEMENTS_STEPS, 'creation_step_5_elements', true);
            break;
          case 8:
            startTourFn(WIZARD_END_STEPS, 'creation_step_8_end', true);
            break;
          default:
            break;
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [currentStep, showInitialSelection, isEditMode, location.state, showTemplateList]);


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
        if (import.meta.env.VITE_DEBUG_MODE) {
          console.log(`// LOG: [ActivityCreationPage] Buscando dados atualizados para Activity ID: ${activityId}`);
        }
        console.log(`[ActivityCreationPage] useEffect detectou um activityId (${activityId}). BUSCANDO DADOS ATUALIZADOS da atividade.`);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          const data = await response.json();
          if (import.meta.env.VITE_DEBUG_MODE) {
            console.log("// LOG: [ActivityCreationPage] Dados recebidos da API.", { keys: Object.keys(data) });
          }

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
          if (import.meta.env.VITE_DEBUG_MODE) {
            console.error("// LOG: [ActivityCreationPage] Erro ao buscar dados da atividade:", error);
            if (error.stack) console.error(error.stack);
          }
          console.error('[ActivityCreationPage] Erro de rede ao buscar dados frescos:', error);
        }
      } else {
        console.log('[ActivityCreationPage] useEffect de recarregamento executado, mas sem activityId ou token para agir.');
      }
    };

    fetchActivityDataForBoard();
  }, [activityId, user?.token]);

  /**
   * @function handleAutoSaveStructure
   * @desc Salva automaticamente a estrutura de gamificação (trilha) quando alterada.
   * @param {Object} newGamificationDesign - O novo design de gamificação a ser salvo.
   */
  const handleAutoSaveStructure = useCallback(async (newGamificationDesign) => {
    const activityIdToSave = activityId || existingActivity?.id;
    if (!activityIdToSave || !user?.token) return;

    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log("// LOG: [ActivityCreationPage] Auto-save da estrutura iniciado.");
    }
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
      if (import.meta.env.VITE_DEBUG_MODE) {
        console.error("// LOG: [ActivityCreationPage] Falha no auto-save:", error);
      }
      console.error("[Auto-Save] Falha ao salvar a estrutura:", error);
    }
  }, [activityId, existingActivity, user]);

  useEffect(() => {
    if (isEditMode && existingActivity) {
      if (import.meta.env.VITE_DEBUG_MODE) {
        console.log("// LOG: [ActivityCreationPage] Inicializando modo de edição com dados existentes.");
      }
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
      setCurrentStep(1);
    }
  }, [
    isEditMode,
    existingActivity,
    setActivityData,        // <-- Adicionada
    setShowInitialSelection,  // <-- Adicionada
    setCurrentStep          // <-- Adicionada
  ]);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!user || !user.token) {
        setLoadingTemplates(false);
        return;
      }

      try {
        if (import.meta.env.VITE_DEBUG_MODE) {
          console.log("// LOG: [ActivityCreationPage] Buscando templates disponíveis.");
        }
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
          if (import.meta.env.VITE_DEBUG_MODE) {
            console.log(`// LOG: [ActivityCreationPage] ${data.length} templates carregados.`);
          }

          setTemplates(data);
          console.log("Templates carregados com sucesso:", data);
        } else {
          const errorData = await response.json();
          setTemplateError(errorData.message || 'Erro ao carregar templates.');
          console.error("Erro ao carregar templates:", errorData);
        }
      } catch (error) {
        if (import.meta.env.VITE_DEBUG_MODE) {
          console.error("// LOG: [ActivityCreationPage] Exceção ao buscar templates:", error);
        }
        setTemplateError('Erro de conexão ao carregar templates.');
        console.error("Erro de rede ao carregar templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [user]);

  // useEffect para sincronizar os elementos do hub baseados nas seleções da Etapa 5
  useEffect(() => {
    // TODO: Esta lógica de sincronização poderia ser extraída para um hook customizado 'useHubSync'.
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log("// LOG: [ActivityCreationPage] Sincronizando elementos do Hub com seleções da Etapa 5.");
    }
    // Pega os nomes dos cards selecionados (ex: "Economia (sistema monetário)")
    const selectedCards = activityData.gameElements?.selectedElements || [];
    // Pega os elementos do hub que JÁ existem na atividade
    const currentHubElements = activityData.gamificationDesign?.hub_elements || [];

    // Mapeia os nomes dos cards para os tipos de hub (ex: "store")
    const targetHubTypes = new Set();
    selectedCards.forEach(cardName => {
      const types = hubElementCardMap[cardName]; // hubElementCardMap está na linha 24
      if (types) {
        types.forEach(type => targetHubTypes.add(type));
      }
    });

    // --- LÓGICA CORRIGIDA (ADITIVA, NÃO DESTRUTIVA) ---

    // 1. Copia os elementos que já existem
    const newHubElements = [...currentHubElements];
    let changed = false;

    // 2. Itera nos tipos de hub que *deveriam* existir
    targetHubTypes.forEach(type => {
      // Verifica se ele já está na lista
      const exists = currentHubElements.some(el => el.type === type);

      // 3. Se não existir, ADICIONA
      if (!exists) {
        newHubElements.push({
          id: `hub_${type}`,
          type: type,
          enabled: true, // Habilitado por padrão
          config: {},
        });
        changed = true; // Marca que a lista mudou
      }
    });

    // 4. Só atualiza o estado se um novo elemento foi realmente adicionado
    if (changed) {
      setActivityData(prev => ({
        ...prev,
        gamificationDesign: {
          ...(prev.gamificationDesign || {}),
          hub_elements: newHubElements,
        }
      }));
    }
  }, [activityData.gameElements?.selectedElements, setActivityData]);


  /**
   * @function handleSelectTemplate
   * @desc Seleciona um template e preenche o formulário com seus dados.
   * @param {Object} templateData - Os dados do template selecionado.
   */
  const handleSelectTemplate = (templateData) => {
    stopTour();
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log("// LOG: [ActivityCreationPage] Template selecionado. Iniciando preenchimento.");
    }
    console.log("handleSelectTemplate: Selecionando template e preenchendo dados...", templateData);
    setTimeout(() => {
      formStartedRef.current = true;
      startNewActivity(templateData);
    }, 100);
  };

  /**
   * @function handleStartFromScratch
   * @desc Inicia o formulário de criação de atividade vazio.
   */
  const handleStartFromScratch = () => {
    stopTour();
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log("// LOG: [ActivityCreationPage] Iniciando nova atividade do zero.");
    }
    console.log("handleStartFromScratch: Iniciando atividade do zero.");
    setTimeout(() => {
      formStartedRef.current = true;
      startNewActivity();
    }, 100);
  };

  /**
   * @function handleShowTemplates
   * @desc Exibe a lista de templates disponíveis para seleção.
   */
  const handleShowTemplates = () => {
    stopTour();
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log("// LOG: [ActivityCreationPage] Exibindo lista de templates.");
    }
    console.log("handleShowTemplates: Exibindo a lista de templates.");
    setShowInitialSelection(true);
    setShowTemplateList(true);
  };


  /**
   * @function handleBackToInitialSelection
   * @desc Volta para a tela inicial de seleção (Iniciar do Zero / Escolher Template).
   */
  const handleBackToInitialSelection = () => {
    stopTour();
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log("// LOG: [ActivityCreationPage] Retornando à seleção inicial.");
    }
    console.log("handleBackToInitialSelection: Voltando para a seleção inicial.");
    setShowInitialSelection(true);
    setShowTemplateList(false);
  };


  const [editingStep, setEditingStep] = useState(null); // Guarda o passo sendo editado {id, type, content}

  // 2. ATUALIZAR A FUNÇÃO DE ABRIR EDITOR
  /**
   * @function handleOpenContentEditor
   * @desc Abre o modal de edição de conteúdo para um passo específico da trilha.
   * @param {Object} step - O objeto do passo a ser editado.
   */
  const handleOpenContentEditor = (step) => {
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log(`// LOG: [ActivityCreationPage] Abrindo editor de conteúdo para o passo: ${step.id} (${step.type})`);
    }
    // Em vez de navegar, abrimos o modal localmente com o conteúdo atual do estado
    const currentContent = activityData.gamificationDesign?.progression_path?.find(p => p.id === step.id)?.content || {};

    setEditingStep({
      ...step,
      content: currentContent
    });
  };

  // 3. FUNÇÃO PARA SALVAR O CONTEÚDO NO ESTADO (SEM API)
  /**
   * @function handleSaveContentLocally
   * @desc Salva o conteúdo editado no estado local da atividade, sem persistir na API imediatamente.
   * @param {Object} newContent - O novo conteúdo a ser salvo no passo.
   */
  const handleSaveContentLocally = (newContent) => {
    if (!editingStep) return;

    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log("// LOG: [ActivityCreationPage] Salvando conteúdo localmente.", { stepId: editingStep.id });
    }
    setActivityData(prev => {
      const newPath = prev.gamificationDesign.progression_path.map(step => {
        if (step.id === editingStep.id) {
          return { ...step, content: newContent }; // Injeta o conteúdo no passo
        }
        return step;
      });

      return {
        ...prev,
        gamificationDesign: {
          ...prev.gamificationDesign,
          progression_path: newPath
        }
      };
    });

    setEditingStep(null); // Fecha o modal
  };


  /**
   * handleNext: Avança para a próxima etapa ou submete o formulário.
   * Se não for a última etapa, incrementa `currentStep`.
   * Se for a última etapa, envia os dados para o backend via API.
   */
  const handleNext = async () => {
    // --- TRAVA DE SEGURANÇA 1: Se já estiver enviando, PARE IMEDIATAMENTE ---
    if (isSubmittingRef.current) return;

    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log(`// LOG: [ActivityCreationPage] handleNext acionado. Etapa atual: ${currentStep}`);
    }
    console.log(`%c[handleNext] Botão clicado na Etapa ${currentStep}.`, "background: #FFD700; color: black;");

    // Validação da Etapa 3: Dinâmica de Participação
    if (currentStep === 3) {
      if (typeof activityData.activityPlanning?.isTeamActivity !== 'boolean') {
        alert('Por favor, selecione a Dinâmica de Participação (Individual ou em Equipe) antes de prosseguir.');
        return; // Impede o avanço
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prevStep => prevStep + 1);

    } else {
      sessionStorage.removeItem('TUTORIAL_MODE');
      stopTour();
      // --- TRAVA DE SEGURANÇA 2: Ativa o bloqueio ---
      isSubmittingRef.current = true;
      setIsSaving(true); // Atualiza a UI para mostrar "Salvando..." e desabilitar botão

      if (import.meta.env.VITE_DEBUG_MODE) {
        console.log("// LOG: [ActivityCreationPage] Submetendo formulário final.");
      }
      console.log("%c[handleNext] INICIANDO SALVAMENTO...", "background: #28a745; color: white;");

      // Log de duração da última etapa
      const finalStepDuration = Math.round((Date.now() - stepStartTimeRef.current) / 1000);
      if (finalStepDuration > 0) {
        logEvent("step_view_duration", {
          step: currentStep,
          duration_seconds: finalStepDuration
        });
      }

      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL}/api/activities/${activityId}`
        : `${import.meta.env.VITE_API_URL}/api/activities`;

      const method = isEditMode ? 'PUT' : 'POST';

      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(activityData),
        });

        const result = await response.json();

        if (response.ok) {
          if (import.meta.env.VITE_DEBUG_MODE) {
            console.log("// LOG: [ActivityCreationPage] Atividade salva com sucesso.");
          }
          alert(isEditMode ? 'Atividade atualizada com sucesso!' : 'Atividade criada com sucesso!');
          navigate('/professor/banco-atividades');
          // Não precisamos destravar o ref aqui porque vamos sair da página
        } else {
          if (import.meta.env.VITE_DEBUG_MODE) {
            console.error("// LOG: [ActivityCreationPage] Erro na resposta da API ao salvar.", result);
          }
          stopTour();
          alert('Erro: ' + (result.message || 'Erro desconhecido do servidor.'));
          // Se deu erro, destravamos para o usuário tentar de novo
          isSubmittingRef.current = false;
          setIsSaving(false);
        }
      } catch (error) {
        if (import.meta.env.VITE_DEBUG_MODE) {
          console.error("// LOG: [ActivityCreationPage] Exceção de rede ao salvar atividade:", error);
        }
        console.error(error);
        stopTour();
        alert('Ocorreu um erro de rede. Verifique sua conexão.');
        // Se deu erro de rede, destravamos
        isSubmittingRef.current = false;
        setIsSaving(false);
      }
    }
  };

  /**
   * handlePrevious: Retorna para a etapa anterior.
   * Decrementa `currentStep` se não estiver na primeira etapa.
   */
  const handlePrevious = () => {
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log(`// LOG: [ActivityCreationPage] handlePrevious acionado. Voltando da etapa ${currentStep}.`);
    }
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
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log(`// LOG: [ActivityCreationPage] Input alterado: ${name}`);
    }
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
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log(`// LOG: [ActivityCreationPage] Abrindo ajuda: ${title}`);
    }
    console.log(`openHelpModal: Abrindo modal de ajuda com o título: "${title}"`);
    logEvent("help_button_click", { step: currentStep, help_title: title });
    setHelpContent({ title, text });
    setShowHelpModal(true);
  };

  /**
   * closeHelpModal: Fecha o modal de ajuda.
   */
  const closeHelpModal = () => {
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log("// LOG: [ActivityCreationPage] Fechando modal de ajuda.");
    }
    console.log("closeHelpModal: Fechando modal de ajuda.");
    setShowHelpModal(false);
    setHelpContent({ title: '', text: '' });
  };

  /**
   * @function renderStep
   * @desc Renderiza o componente filho apropriado para a etapa atual.
   * @returns {JSX.Element|null} O componente da etapa atual ou null.
   */
  const renderStep = () => {
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log(`// LOG: [ActivityCreationPage] Renderizando etapa ${currentStep}`);
    }
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
          {/* --- INDICADOR DE AUTOSAVE --- */}
          {!showInitialSelection && (
            // ALTERAÇÃO AQUI: Mudamos de 'absolute' para 'fixed' e adicionamos background/borda para destaque
            <div className="fixed top-24 right-8 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-full shadow-lg text-sm font-medium transition-all duration-500">
              {autoSaveStatus === 'saving' && (
                <span className="text-yellow-500 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </span>
              )}
              {autoSaveStatus === 'saved' && lastSavedAt && (
                <span className="text-green-500 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Salvo às {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {autoSaveStatus === 'error' && (
                <span className="text-red-500 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Erro ao salvar
                </span>
              )}
            </div>
          )}
        </div>

        {(showInitialSelection && !isEditMode) ? (
          // O JSX para a seleção inicial (Iniciar do Zero / Templates) é mantido
          <div className="bg-secondary-bg dark:bg-primary-bg p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-accent-purple to-accent-teal bg-clip-text text-transparent">
              Como você gostaria de começar?
            </h3>

            {!showTemplateList ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Opção: Iniciar do Zero */}
                {/* Alterado para bg-secondary-bg para contraste e borda variável */}
                <div id="tour-start-scratch" className="relative bg-secondary-bg rounded-2xl shadow-xl overflow-hidden border border-[var(--border-color)] hover:border-accent-yellow/50 transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-teal/5 to-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 p-6 flex flex-col items-center text-center h-full">
                    <div className="mb-4 bg-gradient-to-r from-accent-yellow to-accent-teal p-1 rounded-full">
                      {/* Fundo do ícone ajustado para primary-bg */}
                      <div className="bg-primary-bg rounded-full p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                    {/* Título com cor principal para destaque */}
                    <h4 className="text-xl font-semibold text-primary-text mb-2">
                      Iniciar do Zero
                    </h4>
                    <p className="text-secondary-text mb-6 flex-grow">
                      Comece com um formulário completamente vazio e personalize cada detalhe.
                    </p>
                    <button
                      onClick={handleStartFromScratch}
                      // Texto do botão adaptável ao tema para contraste no gradiente
                      className="w-full py-3 px-6 bg-gradient-to-r from-accent-yellow to-accent-teal text-white dark:text-primary-bg font-bold rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                    >
                      Atividade em Branco
                    </button>
                  </div>
                </div>

                {/* Opção: Escolher um Template */}
                {/* Mudei para bg-secondary-bg para contraste e usei a variável de borda */}
                <div className="relative bg-secondary-bg rounded-2xl shadow-xl overflow-hidden border border-[var(--border-color)] hover:border-accent-purple/50 transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/5 to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 p-6 flex flex-col items-center text-center h-full">
                    <div className="mb-4 bg-gradient-to-r from-accent-purple to-accent-teal p-1 rounded-full">
                      {/* O fundo do ícone agora é primary-bg para contrastar com o card secondary */}
                      <div className="bg-primary-bg rounded-full p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                    </div>
                    {/* Título com cor principal */}
                    <h4 className="text-xl font-semibold text-primary-text mb-2">
                      Escolher um Template
                    </h4>
                    <p className="text-secondary-text mb-6 flex-grow">
                      Use um de nossos templates predefinidos para agilizar a criação.
                    </p>
                    <button id="tour-choose-scratch"
                      onClick={handleShowTemplates}
                      // Texto adaptável: branco no tema claro (fundo escuro), escuro no tema escuro (fundo claro)
                      className="w-full py-3 px-6 bg-gradient-to-r from-accent-purple to-accent-teal text-white dark:text-primary-bg font-bold rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
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
                  // Erro com cores semânticas
                  <div className="bg-danger-bg border border-danger/20 text-danger p-4 rounded-xl text-center">
                    <p>Erro: {templateError}</p>
                  </div>
                ) : templates.length === 0 ? (
                  // Info com cores semânticas
                  <div className="bg-info-bg border border-info/20 text-info p-4 rounded-xl text-center">
                    <p>Nenhum template disponível no momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                      <div
                        key={template.id}
                        // Card secondary-bg com borda variável
                        className="relative bg-secondary-bg rounded-2xl shadow-xl p-6 border border-[var(--border-color)] hover:border-accent-teal/50 transition-all duration-300 group overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/5 to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-center mb-4">
                            <div className="bg-gradient-to-r from-accent-purple to-accent-yellow p-1 rounded-full">
                              <div className="bg-primary-bg rounded-full p-2">
                                <span className="text-2xl">{template.icon}</span>
                              </div>
                            </div>
                          </div>
                          <h5 className="text-lg font-semibold text-primary-text text-center mb-2">{template.name}</h5>
                          <p className="text-secondary-text text-sm mb-4 flex-grow text-center">{template.description}</p>
                          <button
                            onClick={() => handleSelectTemplate(template.data)}
                            // Texto adaptável
                            className="mt-auto py-2 px-4 bg-gradient-to-r from-accent-purple to-accent-teal text-white dark:text-primary-bg font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
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
                    className="py-2 px-4 border border-accent-teal/30 rounded-xl shadow-sm text-sm font-medium text-primary-text bg-secondary-bg hover:bg-primary-bg focus:outline-none focus:ring-2 focus:ring-accent-teal transition duration-300"
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
            <div id="tour-progress-bar" className="w-full bg-gray-200 dark:bg-border-color rounded-full h-2.5 mb-6">
              <div
                className="bg-teal-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>

            {/* Contêiner do Formulário */}
            <div id="tour-form-container" className="bg-secondary-bg dark:bg-primary-bg p-8 rounded-lg shadow-md">
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
                <button id={currentStep === totalSteps ? "tour-final-save" : "tour-next-button"}
                  onClick={handleNext}
                  disabled={isSaving}
                  className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-text 
                  ${isSaving ? 'bg-gray-500 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`} // <--- Mude a classe condicionalmente
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
        {/* MODAL DE EDIÇÃO DE QUIZ */}
        {editingStep?.type === 'quiz' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white dark:bg-primary-bg p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <QuizEditor
                initialData={editingStep.content?.questions || []}
                onSave={(questions) => handleSaveContentLocally({ type: 'quiz', questions })}
                onCancel={() => setEditingStep(null)}
                isOfflineMode={true} // Flag importante para o componente saber que não deve chamar API
              />
            </div>
          </div>
        )}

        {/* MODAL DE EDIÇÃO DE NARRATIVA */}
        {editingStep?.type === 'narrative' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white dark:bg-primary-bg p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <NarrativeEditor
                initialData={editingStep.content}
                onSave={(data) => handleSaveContentLocally({ type: 'narrative', ...data })}
                onCancel={() => setEditingStep(null)}
                isOfflineMode={true}
              />
            </div>
          </div>
        )}
        {editingStep?.type === 'content' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white dark:bg-primary-bg p-6 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">

              {/* Botão de Fechar Rápido (Opcional, mas bom para UX) */}
              <button
                onClick={() => setEditingStep(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 font-bold text-xl z-10"
              >

              </button>

              <LearningContentEditor
                initialData={editingStep.content}
                // Ao salvar, chamamos a função local que atualiza o estado da criação
                onSave={(data) => handleSaveContentLocally({ type: 'content', ...data })}
                isOfflineMode={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ActivityCreationPage.propTypes = {
  existingActivity: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    description: PropTypes.string,
    areaKnowledge: PropTypes.string,
    isPublic: PropTypes.bool,
    currentScenario: PropTypes.object,
    desiredScenario: PropTypes.object,
    activityPlanning: PropTypes.object,
    playerProfile: PropTypes.object,
    gameElements: PropTypes.object,
    gamificationDesign: PropTypes.object,
    rewardsOffered: PropTypes.object,
    rewardedActions: PropTypes.object,
    gamificationRules: PropTypes.object,
  }),
};

export default ActivityCreationPage;