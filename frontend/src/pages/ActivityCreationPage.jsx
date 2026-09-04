// frontend/src/pages/ActivityCreationPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAnalytics from '../hooks/useAnalytics';
import { useActivityCreation } from '../context/ActivityCreationContext';

import Step1_InitialDetails from '../components/activity/creation_steps/Step1_Activity';
import Step2_DesiredScenario from '../components/activity/creation_steps/Step2_Activity';
import Step3_ActivityPlanning from '../components/activity/creation_steps/Step3_Activity';
import Step4_PlayerProfile from '../components/activity/creation_steps/Step4_Activity';
import Step5_GameElements from '../components/activity/creation_steps/Step5_Activity';
import Step6_GameBoard from '../components/activity/creation_steps/Step6_Activity';
import Step7_RewardsOffered from '../components/activity/creation_steps/Step7_Activity';
import Step8_RewardedActions from '../components/activity/creation_steps/Step8_Activity';
import Step9_RulesAndSharing from '../components/activity/creation_steps/Step9_Activity';
import ActivityCreationModals from './ActivityCreation/components/ActivityCreationModals';
import { useTutorial } from '../context/TutorialContext';
import { useToast } from '../context/ToastContext';
import ActivityCreationStepper from '../components/activity/ActivityCreationStepper';
import InitialSelectionPanel from './ActivityCreation/components/InitialSelectionPanel';
import ActivityCreationHeader from './ActivityCreation/components/ActivityCreationHeader';
import { FaCheckCircle, FaTimesCircle, FaSync, FaArrowLeft } from 'react-icons/fa';

import {
  ACTIVITY_SELECTION_STEPS,
  WIZARD_SCENARIO_STEPS,
  WIZARD_DYNAMICS_STEPS,
  WIZARD_PROFILES_STEPS,
  WIZARD_ELEMENTS_STEPS,
  WIZARD_GAMEBOARD_STEPS,
  WIZARD_END_STEPS
} from '../data/tutorialSteps';

const hubElementCardMap = {
  "Chance (sorte e probabilidade)": ["roulette", "slot_machine"],
  "Sistema de classificação e ranking": ["ranking"],
  "Conquistas digitais para metas alcançadas": ["badges"],
  "Reputação (prestígio, renome, status)": ["badges", "ranking"],
  "Chat ou sistema de mensagens": ["chat"],
  "Fórum de Discussão": ["forum"],
  "Interação social com outros jogadores": ["forum", "chat"],
  "Economia (sistema monetário)": ["store"],
  "Recompensas atraentes": ["final_reward"],
  "Raridade (itens exclusivos, objetos raros)": ["store", "final_reward"],
  "Customização de personagem": ["avatar_customization"],
  "Customização de equipamento": ["avatar_customization"],
  "Narrativas envolventes": ["narrative"],
  "Storytelling": ["narrative"],
  "Quebra-cabeça": ["quiz"],
  "Pressão de tempo": ["quiz"],
  "Feedback claro sobre o desempenho": ["quiz"],
  "Objetivo (missão, meta do jogo)": ["mission"]
};

/**
 * Componente ActivityCreationPage
 * 
 * Página principal de criação de atividades gamificadas, gerenciando metadados, conteúdo e mecânicas.
 */
function ActivityCreationPage({ existingActivity }) {
  const navigate = useNavigate();
  const { startTour, stopTour } = useTutorial();
  const totalSteps = 9;
  const { user } = useAuth();
  const formStartedRef = useRef(false);
  const { activityId } = useParams();
  const isEditMode = !!activityId || !!existingActivity;
  const { logEvent } = useAnalytics('activity_creation', user?.token, activityId);
  const { showToast } = useToast();
  const [showTemplateList, setShowTemplateList] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState(null);

  // --- NOVO ESTADO: Controle de Cliques Duplos (Debounce/Cooldown) ---
  const [isNavigating, setIsNavigating] = useState(false);

  const {
    activityData,
    setActivityData,
    currentStep,
    setCurrentStep,
    showInitialSelection,
    setShowInitialSelection,
    startNewActivity,
    resetCreation,
    autoSaveStatus,
    lastSavedAt,
    loadDraft
  } = useActivityCreation();

  const stepStartTimeRef = useRef(Date.now());
  const previousStepRef = useRef(currentStep);
  const isSubmittingRef = useRef(false);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpContent, setHelpContent] = useState({ title: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [maxReachedStep, setMaxReachedStep] = useState(1);

  useEffect(() => {
    if (isEditMode) {
      setMaxReachedStep(9);
    } else {
      if (currentStep > maxReachedStep) {
        setMaxReachedStep(currentStep);
      }
    }
  }, [currentStep, isEditMode, maxReachedStep]);

  useEffect(() => {
    if (formStartedRef.current && activityData.title && !isEditMode) {
      setMaxReachedStep(9);
    }
  }, [formStartedRef.current, activityData.title, isEditMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 111, left: 0, behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep]);

  useEffect(() => {
    const startTime = stepStartTimeRef.current;
    const previousStep = previousStepRef.current;
    const durationInSeconds = Math.round((Date.now() - startTime) / 1000);

    if (durationInSeconds > 0 && previousStep !== currentStep) {
      logEvent("step_view_duration", {
        step: previousStep,
        duration_seconds: durationInSeconds
      });
    }
    stepStartTimeRef.current = Date.now();
    previousStepRef.current = currentStep;
  }, [currentStep, logEvent, startTour]);

  useEffect(() => {
    return () => {
      if (formStartedRef.current && !isSubmittingRef.current) {
        logEvent("form_abandoned", {
          last_step: previousStepRef.current
        });
      }
    };
  }, [logEvent]);

  const location = useLocation();
  const startTourRef = useRef(startTour);
  useEffect(() => { startTourRef.current = startTour; }, [startTour]);

  // Tour handler unmount cleanup
  useEffect(() => {
    return () => {
      if (!isNavigating && !isSubmittingRef.current) {
        // Se desmontou por qualquer motivo que não seja fluxo de envio/navegação normal
        sessionStorage.removeItem('TUTORIAL_MODE');
      }
    };
  }, [isNavigating]);

  useEffect(() => {
    const sessionForce = sessionStorage.getItem('TUTORIAL_MODE') === 'true';
    const stateForce = location.state?.forceTour === true;
    const shouldForce = stateForce || sessionForce;

    if (!shouldForce) return;

    const timer = setTimeout(() => {
      const startTourFn = startTourRef.current;

      if (showInitialSelection) {
        if (!isEditMode && !showTemplateList) {
          startTourFn(ACTIVITY_SELECTION_STEPS, 'teacher_creation_v1', true);
        }
      } else {
        switch (currentStep) {
          case 1: startTourFn(WIZARD_SCENARIO_STEPS, 'creation_step_1_scenario', true); break;
          case 3: startTourFn(WIZARD_DYNAMICS_STEPS, 'creation_step_3_dynamics', true); break;
          case 4: startTourFn(WIZARD_PROFILES_STEPS, 'creation_step_4_profiles', true); break;
          case 5: startTourFn(WIZARD_ELEMENTS_STEPS, 'creation_step_5_elements', true); break;
          case 6: startTourFn(WIZARD_GAMEBOARD_STEPS, 'creation_step_6_gameboard', true); break;
          case 9: startTourFn(WIZARD_END_STEPS, 'creation_step_9_end', true); break;
          default: stopTour(); break;
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [currentStep, showInitialSelection, isEditMode, location.state, showTemplateList]);

  useEffect(() => {
    if (!user || !user.token || user.role !== 'professor') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchActivityDataForBoard = async () => {
      if (activityId && user?.token) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          const data = await response.json();

          if (response.ok) {
            setActivityData(prev => ({
              ...prev,
              id: data.id,
              title: data.title || prev.title,
              description: data.description || prev.description,
              areaKnowledge: data.area_knowledge || data.areaKnowledge || prev.areaKnowledge,
              isPublic: data.is_public ?? prev.isPublic,
              currentScenario: data.current_scenario || data.currentScenario || prev.currentScenario,
              desiredScenario: data.desired_scenario || data.desiredScenario || prev.desiredScenario,
              activityPlanning: data.activity_planning || data.activityPlanning || prev.activityPlanning,
              playerProfile: data.player_profile || data.playerProfile || prev.playerProfile,
              gameElements: data.game_elements || data.gameElements || prev.gameElements,
              rewardsOffered: data.rewards_offered || data.rewardsOffered || prev.rewardsOffered,
              rewardedActions: data.rewarded_actions || data.rewardedActions || prev.rewardedActions,
              gamificationRules: data.gamification_rules || data.gamificationRules || prev.gamificationRules,
              gamificationDesign: data.gamification_design || data.gamificationDesign || prev.gamificationDesign,
            }));
            setShowInitialSelection(false);
            setCurrentStep(1);
          }
        } catch (error) {
          console.error('[ActivityCreationPage] Erro de rede:', error);
        }
      }
    };
    fetchActivityDataForBoard();
  }, [activityId, user?.token, setActivityData, setShowInitialSelection, setCurrentStep]);

  const handleStepJump = (stepId) => {
    // --- PROTEÇÃO DE NAVEGAÇÃO ---
    if (isSubmittingRef.current || isNavigating) return;
    setIsNavigating(true);

    logEvent("stepper_navigation", {
      from_step: currentStep,
      to_step: stepId
    });

    setCurrentStep(stepId);
    setTimeout(() => setIsNavigating(false), 500); // Libera após meio segundo
  };

  const handleAutoSaveStructure = useCallback(async (newGamificationDesign) => {
    const activityIdToSave = activityId || existingActivity?.id;
    if (!activityIdToSave || !user?.token) return;

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
        subdomain: existingActivity.subdomain || '',
        isPublic: existingActivity.isPublic == null ? true : existingActivity.isPublic,
        currentScenario: existingActivity.currentScenario || { problems: [], otherProblem: '' },
        desiredScenario: existingActivity.desiredScenario || { objectives: [], otherObjective: '' },
        activityPlanning: existingActivity.activityPlanning || { characteristics: [], participantsQuantity: '', expectedDuration: '', location: '', otherInfo: '' },
        playerProfile: existingActivity.playerProfile || { selectedProfiles: [] },
        gameElements: existingActivity.gameElements || { selectedElements: [], otherElement: '' },
        gamificationDesign: existingActivity.gamificationDesign || { theme: 'vila_da_aventura', progression_path: [], hub_elements: [] },
        rewardsOffered: existingActivity.rewardsOffered || { selectedRewards: [], otherReward: '' },
        rewardedActions: existingActivity.rewardedActions || { selectedActions: [], otherAction: '' },
        gamificationRules: existingActivity.gamificationRules || { generalRules: [], specificRules: '' },
      });
      setShowInitialSelection(false);
      setCurrentStep(1);
    }
  }, [isEditMode, existingActivity, setActivityData, setShowInitialSelection, setCurrentStep]);

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
        } else {
          const errorData = await response.json();
          setTemplateError(errorData.message || 'Erro ao carregar templates.');
        }
      } catch (error) {
        setTemplateError('Erro de conexão ao carregar templates.');
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, [user]);

  useEffect(() => {
    const selectedCards = activityData.gameElements?.selectedElements || [];
    const currentHubElements = activityData.gamificationDesign?.hub_elements || [];

    const targetHubTypes = new Set();
    selectedCards.forEach(cardName => {
      const types = hubElementCardMap[cardName];
      if (types) {
        types.forEach(type => targetHubTypes.add(type));
      }
    });

    const newHubElements = [...currentHubElements];
    let changed = false;

    targetHubTypes.forEach(type => {
      const exists = currentHubElements.some(el => el.type === type);
      if (!exists) {
        newHubElements.push({
          id: `hub_${type}`,
          type: type,
          enabled: true,
          config: {},
        });
        changed = true;
      }
    });

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

  const handleSelectTemplate = (templateData) => {
    stopTour();
    setTimeout(() => {
      formStartedRef.current = true;
      startNewActivity(templateData);
    }, 100);
  };

  const handleStartFromScratch = () => {
    stopTour();
    setTimeout(() => {
      formStartedRef.current = true;
      startNewActivity();
    }, 100);
  };

  const handleShowTemplates = () => {
    stopTour();
    setShowInitialSelection(true);
    setShowTemplateList(true);
  };

  const handleBackToInitialSelection = () => {
    stopTour();
    setShowInitialSelection(true);
    setShowTemplateList(false);
  };

  const [editingStep, setEditingStep] = useState(null);

  const handleOpenContentEditor = (step) => {
    const currentContent = activityData.gamificationDesign?.progression_path?.find(p => p.id === step.id)?.content || {};
    setEditingStep({ ...step, content: currentContent });
  };

  const handleSaveContentLocally = (newContent) => {
    if (!editingStep) return;
    setActivityData(prev => {
      const newPath = prev.gamificationDesign.progression_path.map(step => {
        if (step.id === editingStep.id) {
          return { ...step, content: newContent };
        }
        return step;
      });
      return {
        ...prev,
        gamificationDesign: { ...prev.gamificationDesign, progression_path: newPath }
      };
    });
    setEditingStep(null);
  };

  /**
   * handleNext: Avança para a próxima etapa ou submete o formulário.
   * AGORA COM VALIDAÇÃO E COOLDOWN ANTI-CLIQUE DUPLO!
   */
  const handleNext = async () => {
    // 1. Prevenção de cliques duplos/Spam (Cooldown)
    if (isSubmittingRef.current || isNavigating) return;

    // Trava imediatamente a navegação
    setIsNavigating(true);

    // --- 2. VALIDAÇÕES POR ETAPA (Bloqueia o avanço se vazio) ---

    // Etapa 1: Título, Área e Desafios (Problemas)
    if (currentStep === 1) {
      if (!activityData.title?.trim() || !activityData.areaKnowledge) {
        showToast('Por favor, preencha o Título e a Área de Conhecimento.', 'warning');
        setTimeout(() => setIsNavigating(false), 300); // Destrava o botão rapidamente
        return;
      }
      if (!activityData.currentScenario?.problems || activityData.currentScenario.problems.length === 0) {
        showToast('Selecione pelo menos um desafio que seus alunos enfrentam.', 'warning');
        setTimeout(() => setIsNavigating(false), 300);
        return;
      }
    }

    // Etapa 2: Objetivos/Cenário Desejado
    if (currentStep === 2) {
      if (!activityData.desiredScenario?.objectives || activityData.desiredScenario.objectives.length === 0) {
        showToast('Selecione pelo menos uma meta ou objetivo.', 'warning');
        setTimeout(() => setIsNavigating(false), 300);
        return;
      }
    }

    // Etapa 3: Dinâmica e Ambiente (ATUALIZADA)
    if (currentStep === 3) {
      if (typeof activityData.activityPlanning?.isTeamActivity !== 'boolean') {
        showToast('Selecione a Dinâmica de Participação (Individual ou Equipe).', 'warning');
        setTimeout(() => setIsNavigating(false), 300);
        return;
      }
      // Verifica se escolheu Pelo Menos 1 ambiente excludente (Presencial Lab, Desplugado ou Online)
      const hasEnvironment = activityData.activityPlanning?.characteristics?.some(c =>
        c.includes("Laboratório") || c.includes("Desplugado") || c.includes("Online")
      );
      if (!hasEnvironment) {
        showToast('Selecione obrigatóriamente o Ambiente de Aplicação.', 'warning');
        setTimeout(() => setIsNavigating(false), 300);
        return;
      }
    }

    // Etapa 4: Perfis
    if (currentStep === 4) {
      if (!activityData.playerProfile?.selectedProfiles || activityData.playerProfile.selectedProfiles.length === 0) {
        showToast('Selecione pelo menos um perfil de jogador.', 'warning');
        setTimeout(() => setIsNavigating(false), 300);
        return;
      }
    }

    // Etapa 5: Elementos de Jogos
    if (currentStep === 5) {
      if (!activityData.gameElements?.selectedElements || activityData.gameElements.selectedElements.length === 0) {
        showToast('Selecione pelo menos um Elemento de Jogo para sua atividade.', 'warning');
        setTimeout(() => setIsNavigating(false), 300);
        return;
      }
    }

    // Etapa 6: Tabuleiro de Progressão
    if (currentStep === 6) {
      const path = activityData.gamificationDesign?.progression_path || [];
      if (path.length === 0) {
        showToast('O Editor do Tabuleiro não pode ficar vazio. Adicione pelo menos um passo (Conteúdo, Quiz ou Narrativa) à trilha.', 'warning');
        setTimeout(() => setIsNavigating(false), 300);
        return;
      }
      
      const hasUnvalidatedDrafts = path.some(step => step.isDraft === true);
      if (hasUnvalidatedDrafts) {
        showToast('Atenção: Você possui rascunhos automáticos da IA no tabuleiro! Clique no lápis (✏️) em cada passo gerado para revisar e validar o conteúdo antes de avançar.', 'warning');
        setTimeout(() => setIsNavigating(false), 300);
        return;
      }
    }

    // Etapa 7: Recompensas (NOVO)
    if (currentStep === 7) {
      const hasPredefined = activityData.rewardsOffered?.selectedRewards?.length > 0;
      const hasCustom = activityData.rewardsOffered?.otherReward?.trim().length > 0;
      if (!hasPredefined && !hasCustom) {
        showToast('Selecione pelo menos uma Recompensa para engajar seus alunos.', 'warning');
        setTimeout(() => setIsNavigating(false), 300);
        return;
      }
    }

    // Etapa 8: Ações Recompensadas (NOVO)
    if (currentStep === 8) {
      const hasPredefined = activityData.rewardedActions?.selectedActions?.length > 0;
      const hasCustom = activityData.rewardedActions?.otherAction?.trim().length > 0;
      if (!hasPredefined && !hasCustom) {
        showToast('Defina pelo menos uma Ação que os alunos devem fazer para ganhar as recompensas.', 'warning');
        setTimeout(() => setIsNavigating(false), 300);
        return;
      }
    }

    // Etapa 9: Regras (NOVO)
    if (currentStep === 9) {
      const hasPredefined = activityData.gamificationRules?.generalRules?.length > 0;
      const hasCustom = activityData.gamificationRules?.specificRules?.trim().length > 0;
      if (!hasPredefined && !hasCustom) {
        showToast('Estabeleça ao menos uma Regra para manter a atividade justa e organizada.', 'warning');
        setTimeout(() => setIsNavigating(false), 300);
        return;
      }
    }

    // --- FIM DAS VALIDAÇÕES ---

    // 3. Lógica de Avanço (se passou pelas validações)
    if (currentStep < totalSteps) {
      setCurrentStep(prevStep => prevStep + 1);
      // Destrava a navegação após meio segundo para evitar spam
      setTimeout(() => setIsNavigating(false), 500);

    } else {
      if (!activityData.title?.trim() || !activityData.areaKnowledge) {
        showToast('O Título e a Área são obrigatórios. Volte à Etapa 1.', 'error');
        setIsNavigating(false); return;
      }
      if (!activityData.currentScenario?.problems?.length) {
        showToast('Selecione pelo menos um desafio enfrentado pelos alunos. Volte à Etapa 1.', 'error');
        setIsNavigating(false); return;
      }
      if (!activityData.desiredScenario?.objectives?.length) {
        showToast('Selecione pelo menos uma meta ou objetivo. Volte à Etapa 2.', 'error');
        setIsNavigating(false); return;
      }
      if (typeof activityData.activityPlanning?.isTeamActivity !== 'boolean') {
        showToast('Selecione a Dinâmica Individual ou Equipe. Volte à Etapa 3.', 'error');
        setIsNavigating(false); return;
      }
      const hasEnv = activityData.activityPlanning?.characteristics?.some(c => c.includes("Laboratório") || c.includes("Desplugado") || c.includes("Online"));
      if (!hasEnv) {
        showToast('Selecione o Ambiente de Aplicação. Volte à Etapa 3.', 'error');
        setIsNavigating(false); return;
      }
      if (!activityData.playerProfile?.selectedProfiles?.length) {
        showToast('Selecione pelo menos um perfil de jogador. Volte à Etapa 4.', 'error');
        setIsNavigating(false); return;
      }
      if (!activityData.gameElements?.selectedElements?.length) {
        showToast('Selecione pelo menos um elemento de jogo. Volte à Etapa 5.', 'error');
        setIsNavigating(false); return;
      }
      if ((activityData.gamificationDesign?.progression_path || []).length === 0) {
        showToast('O Editor do Tabuleiro não pode ficar vazio. Adicione um passo. Volte à Etapa 5.', 'error');
        setIsNavigating(false); return;
      }

      // Se passou pela Validação Global, Inicia o Salvamento
      sessionStorage.removeItem('TUTORIAL_MODE');
      stopTour();
      isSubmittingRef.current = true;
      setIsSaving(true);

      const finalStepDuration = Math.round((Date.now() - stepStartTimeRef.current) / 1000);
      if (finalStepDuration > 0) {
        logEvent("step_view_duration", { step: currentStep, duration_seconds: finalStepDuration });
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
          body: JSON.stringify({ ...activityData, isDraft: false }),
        });

        const result = await response.json();

        if (response.ok) {
          showToast(isEditMode ? 'Atividade atualizada com sucesso!' : 'Atividade criada com sucesso!', 'success');
          navigate('/professor/banco-atividades');
        } else {
          stopTour();
          showToast('Erro: ' + (result.message || 'Erro desconhecido do servidor.'), 'error');
          isSubmittingRef.current = false;
          setIsSaving(false);
          setIsNavigating(false);
        }
      } catch (error) {
        stopTour();
        showToast('Ocorreu um erro de rede. Verifique sua conexão.', 'error');
        isSubmittingRef.current = false;
        setIsSaving(false);
        setIsNavigating(false);
      }
    }
  };

  /**
   * handlePrevious: Retorna para a etapa anterior.
   * AGORA COM COOLDOWN PARA EVITAR SPAM
   */
  const handlePrevious = () => {
    if (isNavigating) return;
    setIsNavigating(true);

    if (currentStep > 1) {
      logEvent("previous_button_click", {
        from_step: currentStep,
        to_step: currentStep - 1
      });
      setCurrentStep(prevStep => prevStep - 1);
    }

    setTimeout(() => setIsNavigating(false), 500); // Destrava após meio segundo
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nameParts = name.split('.');

    setActivityData(prevData => {
      let newData;
      if (nameParts.length === 1) {
        const fieldName = nameParts[0];
        newData = {
          ...prevData,
          [fieldName]: type === 'checkbox' ? checked : value,
        };
      } else {
        const [section, field] = nameParts;
        const sectionData = prevData[section];

        if (type === 'checkbox') {
          const currentValues = sectionData[field] || [];
          const newValues = checked
            ? [...currentValues, value]
            : currentValues.filter(item => item !== value);
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
      return newData;
    });
  };

  const openHelpModal = (title, text) => {
    logEvent("help_button_click", { step: currentStep, help_title: title });
    setHelpContent({ title, text });
    setShowHelpModal(true);
  };

  const closeHelpModal = () => {
    setShowHelpModal(false);
    setHelpContent({ title: '', text: '' });
  };

  const renderStep = () => {
    if (!user || !user.token || user.role !== 'professor') {
      return null;
    }
    const commonStepProps = { activityData, handleInputChange, setActivityData };

    switch (currentStep) {
      case 1: return <Step1_InitialDetails {...commonStepProps} openHelpModal={openHelpModal} />;
      case 2: return <Step2_DesiredScenario {...commonStepProps} openHelpModal={openHelpModal} />;
      case 3: return <Step3_ActivityPlanning {...commonStepProps} />;
      case 4: return <Step4_PlayerProfile {...commonStepProps} openHelpModal={openHelpModal} />;
      case 5: return <Step5_GameElements {...commonStepProps} />;
      case 6: return <Step6_GameBoard {...commonStepProps} onEditContent={handleOpenContentEditor} onStructureChange={handleAutoSaveStructure} />;
      case 7: return <Step7_RewardsOffered {...commonStepProps} />;
      case 8: return <Step8_RewardedActions {...commonStepProps} />;
      case 9: return <Step9_RulesAndSharing {...commonStepProps} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="container mx-auto px-4 py-8">
        <button 
            onClick={() => navigate(-1)} 
            className="group mb-6 flex items-center gap-2 text-secondary-text hover:text-accent-teal transition-colors font-bold uppercase tracking-widest text-sm"
        >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Sair e Voltar
        </button>
        {/* Cabeçalho */}
        <ActivityCreationHeader 
          isEditMode={isEditMode}
          showInitialSelection={showInitialSelection}
          autoSaveStatus={autoSaveStatus}
          lastSavedAt={lastSavedAt}
        />

        {(showInitialSelection && !isEditMode) ? (
          // Seleção Inicial
          <InitialSelectionPanel
            showTemplateList={showTemplateList}
            handleStartFromScratch={handleStartFromScratch}
            handleShowTemplates={handleShowTemplates}
            handleSelectTemplate={handleSelectTemplate}
            handleBackToInitialSelection={handleBackToInitialSelection}
            loadingTemplates={loadingTemplates}
            templateError={templateError}
            templates={templates}
          />
        ) : (
          <>
            {/* Barra de Progresso */}
            <ActivityCreationStepper
              currentStep={currentStep}
              maxReachedStep={maxReachedStep}
              onStepClick={handleStepJump}
              isEditMode={isEditMode || (maxReachedStep === 8)}
            />

            {/* Contêiner do Formulário */}
            <div id="tour-form-container" className="bg-secondary-bg dark:bg-primary-bg p-8 rounded-lg shadow-md">
              {renderStep()}

              {/* Botões de Navegação */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border-color dark:border-border-color">
                {currentStep > 1 ? (
                  <button
                    onClick={handlePrevious}
                    disabled={isNavigating} // Trava visualmente
                    className={`py-2 px-4 border border-border-color rounded-md shadow-sm text-sm font-medium text-secondary-text transition-colors
                      ${isNavigating ? 'bg-gray-300 cursor-not-allowed opacity-50' : 'bg-secondary-bg hover:bg-hover-bg-color'}
                    `}
                  >
                    Anterior
                  </button>
                ) : (
                  <div></div>
                )}
                <button
                  id={currentStep === totalSteps ? "tour-final-save" : "tour-next-button"}
                  onClick={handleNext}
                  disabled={isSaving || isNavigating} // Bloqueia cliques duplos!
                  className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-text transition-colors
                  ${(isSaving || isNavigating) ? 'bg-gray-500 cursor-wait opacity-70' : 'bg-teal-600 hover:bg-teal-700'}`}
                >
                  {isSaving ? 'Salvando...' : (currentStep === totalSteps ? 'Concluir e Salvar' : 'Próximo')}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Modal de Ajuda */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-secondary-bg dark:bg-primary-bg rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-medium leading-6 text-primary-text">{helpContent.title}</h3>
              <div className="mt-2">
                <p className="text-sm text-secondary-text">{helpContent.text}</p>
              </div>
              <div className="mt-4">
                <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-teal-100 px-4 py-2 text-sm font-medium text-teal-900 hover:bg-teal-200" onClick={closeHelpModal}>
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAIS DE CONTEÚDO */}
        <ActivityCreationModals 
          editingStep={editingStep}
          setEditingStep={setEditingStep}
          handleSaveContentLocally={handleSaveContentLocally}
        />
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