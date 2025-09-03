// frontend/src/pages/ActivityCreationPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importar o hook useAuth para acessar o contexto de autenticação
import { 
  FaLayerGroup, FaChartBar, FaGem, FaCoins, FaDice, FaClock, FaIdBadge, FaHandshake, FaVrCardboard, FaPuzzlePiece, FaSyncAlt, FaBook, FaUserEdit, FaShieldAlt, FaShareAlt, FaCheckCircle, FaChartLine, FaListOl, FaGift, FaBookOpen, FaAward, FaChalkboardTeacher, FaLaptop, FaUser, FaClipboardCheck, FaFileSignature, FaCodeBranch, FaCloud, FaTrophy, FaGamepad, FaBullseye, FaBrain, FaLightbulb, FaGraduationCap, FaStar, FaProjectDiagram, FaCode, FaTools, FaUsers, FaFrown, FaTasks, FaHeadSideVirus, FaRocket, FaComments, FaBalanceScale, FaHeartbeat, FaCogs, FaBriefcase, FaCalendarTimes, 
  FaPlusCircle, FaHourglassHalf, FaMicrophoneAlt, FaKey, FaCertificate, FaUserTie, FaFilm, FaDoorOpen, FaPlane, FaBullhorn, FaHandsHelping, FaMoneyBillWave, 
  FaCalendarCheck, FaPaintBrush, FaQuestionCircle, FaBell, FaBookReader, FaBoxOpen,
  FaGavel, FaUserShield, FaMobileAlt, FaUniversity
} from 'react-icons/fa';
import useAnalytics from '../hooks/useAnalytics';



/**
 * Componente ActivityCreationPage
 * Esta página é um formulário de várias etapas (wizard) que permite aos professores
 * criar uma nova atividade gamificada. Ele guia o usuário através de 8 etapas,
 * coletando informações sobre o cenário, objetivos, planejamento, perfil do jogador,
 * elementos de jogo, recompensas, ações e regras.
 */
function ActivityCreationPage({ existingActivity }) {
  // --- Hooks de Navegação e Estado ---

  // Hook do React Router para navegar programaticamente entre as rotas.
  const navigate = useNavigate();
  // Estado para controlar a etapa atual do formulário. Inicia na etapa 1.
  const [currentStep, setCurrentStep] = useState(1);
  // Número total de etapas no formulário.
  const totalSteps = 8;
  // Hook para acessar o contexto de autenticação (dados do usuário, token, etc.).
  const { user } = useAuth();
  
  const { activityId } = useParams();
  const isEditMode = !!existingActivity;
  const { logEvent } = useAnalytics('activity_creation', user?.token, activityId);
  // Estado para controlar se a tela de seleção de template inicial deve ser exibida (com as duas opções).
  const [showInitialSelection, setShowInitialSelection] = useState(true);
  // Estado para controlar se a lista de templates (os cards) deve ser exibida.
  const [showTemplateList, setShowTemplateList] = useState(false);
  // Estado para armazenar os templates carregados do backend.
  const [templates, setTemplates] = useState([]);
  // Estado para controlar o carregamento dos templates.
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  // Estado para armazenar erros ao carregar templates.
  const [templateError, setTemplateError] = useState(null);
  const [newlyCreatedActivityId, setNewlyCreatedActivityId] = useState(null);
  const [showAssignmentPrompt, setShowAssignmentPrompt] = useState(false);
  const [isNarrativeModalOpen, setIsNarrativeModalOpen] = useState(false);
  // --- Estrutura de Dados da Atividade ---

  // Estado principal que armazena todos os dados coletados no formulário.
  // A estrutura é dividida em seções, correspondendo a cada etapa do formulário.
  const [activityData, setActivityData] = useState({
    // Campos globais da atividade
    title: '',
    description: '',
    areaKnowledge: '',
    isPublic: false,

    // Etapa 1: Cenário Atual
    currentScenario: {
      problems: [],
      otherProblem: '',
    },
    // Etapa 2: Cenário Desejado
    desiredScenario: {
      objectives: [],
      otherObjective: '',
    },
    // Etapa 3: Planejamento da Atividade
    activityPlanning: {
      characteristics: [],
      participantsQuantity: '',
      expectedDuration: '',
      location: '',
      otherInfo: '',
    },
    // Etapa 4: Perfil do Jogador
    playerProfile: {
      selectedProfiles: [],
    },
    // Etapa 5: Elementos de Jogos
    gameElements: {
      selectedElements: [],
      otherElement: '',
      narrativeTitle: '',
      narrativeContent: '',
    },
    // Etapa 6: Recompensas Oferecidas
    rewardsOffered: {
      selectedRewards: [],
      otherReward: '',
    },
    // Etapa 7: Ações Recompensadas
    rewardedActions: {
      selectedActions: [],
      otherAction: '',
    },
    // Etapa 8: Regras da Gamificação
    gamificationRules: {
      generalRules: [],
      specificRules: '',
    },
  });

  // --- RASTREAMENTO DE TEMPO POR ETAPA ---
const stepStartTimeRef = useRef(Date.now());
const previousStepRef = useRef(currentStep);

useEffect(() => {
  const startTime = stepStartTimeRef.current;
  const previousStep = previousStepRef.current;
  
  // Calcula a duração na etapa anterior
  const durationInSeconds = Math.round((Date.now() - startTime) / 1000);

  // Evita logar na primeira renderização (duração de 0s)
  if (durationInSeconds > 0 && previousStep !== currentStep) {
    console.log(`Logando duração da Etapa ${previousStep}: ${durationInSeconds}s`);
    logEvent("step_view_duration", { 
      step: previousStep,
      duration_seconds: durationInSeconds 
    });
  }

  // Reseta o timer para a nova etapa
  stepStartTimeRef.current = Date.now();
  previousStepRef.current = currentStep;

}, [currentStep, logEvent]); // O efeito roda sempre que a etapa muda

const isSubmittingRef = useRef(false);

useEffect(() => {
  // A função de retorno (cleanup) é executada quando o componente é desmontado
  return () => {
    // Só loga abandono se o formulário não foi concluído e não está no processo de submissão
    if (!isSubmittingRef.current) {
        console.log(`Usuário abandonou o formulário na etapa ${previousStepRef.current}`);
        logEvent("form_abandoned", {
            last_step: previousStepRef.current
        });
    }
  };
}, [logEvent]); // O array vazio garante que o cleanup só rode ao desmontar

  // --- Verificação de Autenticação e Autorização ---

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

  // Efeito que roda uma vez para verificar se o usuário está logado e tem a permissão correta.
  useEffect(() => {
    console.log("ActivityCreationPage: Verificando autenticação do usuário...", user);
    // Se não houver usuário, token ou se o papel não for 'professor', redireciona para o login.
    // Este é um controle de segurança para garantir que apenas usuários autorizados acessem a página.
    if (!user || !user.token || user.role !== 'professor') {
      console.error("ActivityCreationPage: Usuário não autenticado ou não é professor. Redirecionando para /login.");
      navigate('/login');
    }
  }, [user, navigate]);


  // Novo useEffect para preencher o formulário no modo de edição
  useEffect(() => {
    if (isEditMode) {
      console.log("Modo de edição ativado. Preenchendo formulário com dados existentes:", existingActivity);
      setActivityData({
          title: existingActivity.title || '',
          description: existingActivity.description || '',
          areaKnowledge: existingActivity.areaKnowledge || '',
          isPublic: existingActivity.isPublic || false,
          currentScenario: existingActivity.currentScenario || { problems: [], otherProblem: '' },
          desiredScenario: existingActivity.desiredScenario || { objectives: [], otherObjective: '' },
          activityPlanning: existingActivity.activityPlanning || { characteristics: [], participantsQuantity: '', expectedDuration: '', location: '', otherInfo: '' },
          playerProfile: existingActivity.playerProfile || { selectedProfiles: [] },
          gameElements: existingActivity.gameElements || { selectedElements: [], otherElement: '', narrativeTitle: '', narrativeContent: '' },
          rewardsOffered: existingActivity.rewardsOffered || { selectedRewards: [], otherReward: '' },
          rewardedActions: existingActivity.rewardedActions || { selectedActions: [], otherAction: '' },
          gamificationRules: existingActivity.gamificationRules || { generalRules: [], specificRules: '' },
      });
      setShowInitialSelection(false); // Garante que o formulário seja exibido diretamente
    }
  }, [isEditMode, existingActivity]);

  

  // --- Carregamento de Templates do Backend ---
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!user || !user.token) {
        setLoadingTemplates(false);
        return;
      }

      try {
        setLoadingTemplates(true);
        setTemplateError(null);
        const response = await fetch('http://127.0.0.1:5000/api/activities/templates', {
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
  }, [user]); // Dependência do 'user' para recarregar se o usuário mudar/logar


  // --- Estado do Modal de Ajuda ---

  // Estado para controlar a visibilidade do modal de ajuda.
  const [showHelpModal, setShowHelpModal] = useState(false);
  // Estado para armazenar o conteúdo (título e texto) a ser exibido no modal.
  const [helpContent, setHelpContent] = useState({ title: '', text: '' });


  /**
   * handleSelectTemplate: Preenche o formulário com os dados do template selecionado
   * e muda para a tela de criação da atividade.
   * @param {object} templateData - Os dados do template a serem usados para pré-preencher o formulário.
   */
  const handleSelectTemplate = (templateData) => {
    console.log("handleSelectTemplate: Selecionando template e preenchendo dados...", templateData);
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


  // --- Funções de Manipulação de Eventos ---

  /**
   * handleNext: Avança para a próxima etapa ou submete o formulário.
   * Se não for a última etapa, incrementa `currentStep`.
   * Se for a última etapa, envia os dados para o backend via API.
   */
  const handleNext = async () => {
    console.log(`handleNext: Tentando avançar da etapa ${currentStep}.`);
    if (currentStep < totalSteps) {
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      const url = isEditMode
        ? `http://127.0.0.1:5000/api/activities/${activityId}`
        : 'http://127.0.0.1:5000/api/activities';
      
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

  const handleSaveNarrative = (newNarrativeConfig) => {
        setActivityData(prevData => ({
            ...prevData,
            gameElements: {
                ...prevData.gameElements,
                narrativeConfig: newNarrativeConfig
            }
        }));
        setIsNarrativeModalOpen(false); // Fecha o modal após salvar
    };

  // --- Funções de Renderização ---

  /**
   * renderStep: Renderiza o conteúdo da etapa atual com base no valor de `currentStep`.
   * Utiliza um `switch` para determinar qual conjunto de campos de formulário exibir.
   * @returns {JSX.Element | null} O JSX para a etapa atual.
   */
  const renderStep = () => {
    console.log(`renderStep: Renderizando a etapa ${currentStep}.`);
    // Retorna null se o usuário não estiver autenticado para evitar renderização indevida
    if (!user || !user.token || user.role !== 'professor') {
      console.warn("renderStep: Tentativa de renderização sem usuário autorizado. Retornando null.");
      return null;
    }

    switch (currentStep) {
      // ETAPA 1: CENÁRIO ATUAL
      case 1:
      // Array de objetos para facilitar a renderização dos cards com seus ícones correspondentes
      const studentProblems = [
        { text: "Dificuldades na compreensão de conceitos complexos de programação.", icon: <FaCode /> },
        { text: "Dificuldades em aplicar as teorias aprendidas na prática.", icon: <FaTools /> },
        { text: "Dificuldades em trabalhar em equipe e colaborar com colegas.", icon: <FaUsers /> },
        { text: "Falta de motivação e interesse no assunto.", icon: <FaFrown /> },
        { text: "Dificuldades em gerenciar o tempo e priorizar tarefas.", icon: <FaTasks /> },
        { text: "Dificuldades em lidar com a pressão e o estresse da grade de estudos intensa.", icon: <FaHeadSideVirus /> },
        { text: "Dificuldades em aprender novas ferramentas e tecnologias rapidamente.", icon: <FaRocket /> },
        { text: "Falta de habilidades de comunicação e apresentação.", icon: <FaComments /> },
        { text: "Dificuldades em equilibrar o estudo com outras responsabilidades e obrigações.", icon: <FaBalanceScale /> },
        { text: "Dificuldades em gerenciar a ansiedade e a sobrecarga de trabalho.", icon: <FaHeartbeat /> },
        { text: "Dificuldades em lidar com ferramentas de desenvolvimento complexas.", icon: <FaCogs /> },
        { text: "Dificuldades em encontrar oportunidades de estágio ou experiência profissional.", icon: <FaBriefcase /> },
        { text: "Dificuldades em trabalhar com prazos apertados em projetos acadêmicos.", icon: <FaCalendarTimes /> },
      ];

      /**
       * Função para manipular a seleção de problemas.
       * Você pode adaptar esta lógica para o seu handler `handleInputChange` existente.
       * A ideia é adicionar o problema ao array se ele não existir, ou removê-lo se já existir.
       */
      const handleProblemSelection = (problemText) => {
        const currentProblems = activityData.currentScenario.problems;
        const newProblems = currentProblems.includes(problemText)
          ? currentProblems.filter(p => p !== problemText)
          : [...currentProblems, problemText];
        
        // Simula o evento de mudança para o seu handler genérico
        handleInputChange({
          target: {
            name: 'currentScenario.problems',
            value: newProblems,
          },
        });
      };

      return (
        <div className="space-y-8 animate-fade-in">
          {/* SEÇÃO 1: Título e Descrição da Atividade */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Definindo o Cenário da Atividade
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Para começar, dê um nome e descreva o propósito geral da sua atividade gamificada.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Título da Atividade <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                value={activityData.title} 
                onChange={handleInputChange} 
                className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                placeholder="Ex: A Jornada do Herói em Java" 
                required 
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descrição da Atividade
              </label>
              <textarea 
                id="description" 
                name="description" 
                value={activityData.description} 
                onChange={handleInputChange} 
                rows="1"
                className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" 
                placeholder="Um resumo sobre o que é a atividade."
              ></textarea>
            </div>
          </div>

          {/* SEÇÃO 2: Seleção de Problemas com Cards */}
          <div className="pt-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Quais desafios seus alunos enfrentam?
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Selecione os principais problemas que você observa. Isso ajudará a personalizar a gamificação.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {studentProblems.map((problem) => {
                const isSelected = activityData.currentScenario.problems.includes(problem.text);
                return (
                  <div
                    key={problem.text}
                    onClick={() => handleProblemSelection(problem.text)}
                    className={`
                      group relative flex cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-4 text-center transition-all duration-200
                      ${isSelected
                        ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                        : 'border-gray-300 bg-white hover:border-teal-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-500'
                      }
                    `}
                  >
                    <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-500 dark:text-gray-500 dark:group-hover:text-teal-400'}`}>
                      {problem.icon}
                    </div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {problem.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 3: Campo Aberto e Botão de Ajuda */}
          <div className="pt-4">
            <label htmlFor="currentScenario.otherProblem" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Outro desafio não listado? (Opcional)
            </label>
            <input 
              type="text" 
              id="currentScenario.otherProblem" 
              name="currentScenario.otherProblem" 
              value={activityData.currentScenario.otherProblem} 
              onChange={handleInputChange} 
              className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder="Descreva outro problema específico" 
            />
          </div>

          
          <button 
            onClick={() => openHelpModal("Ajuda - Cenário Atual", `Avalie as habilidades e competências requeridas...`)} 
            className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Ajuda
          </button> 
          
        </div>
      );

      // ETAPA 2: CENÁRIO DESEJADO
      case 2:
      // Array de objetos para os objetivos, facilitando a renderização dos cards com ícones
      const objectives = [
        { text: "Criar um ambiente de aprendizagem motivador e envolvente", icon: <FaGamepad /> },
        { text: "Aumentar a motivação e a concentração dos alunos", icon: <FaBullseye /> },
        { text: "Desenvolver habilidades cognitivas, sociais e de aprendizagem", icon: <FaBrain /> },
        { text: "Estimular a criatividade e a inovação", icon: <FaLightbulb /> },
        { text: "Aumentar a retenção de conhecimentos e habilidades", icon: <FaGraduationCap /> },
        { text: "Promover a participação ativa dos alunos nas atividades", icon: <FaStar /> },
        { text: "Melhorar a colaboração e o trabalho em equipe", icon: <FaUsers /> },
        { text: "Incentivar a aplicação prática dos conhecimentos teóricos", icon: <FaProjectDiagram /> },
      ];

      /**
       * Função para manipular a seleção de objetivos.
       * Adiciona o objetivo ao array se não existir, ou o remove se já existir.
       */
      const handleObjectiveSelection = (objectiveText) => {
        const currentObjectives = activityData.desiredScenario.objectives;
        const newObjectives = currentObjectives.includes(objectiveText)
          ? currentObjectives.filter(o => o !== objectiveText)
          : [...currentObjectives, objectiveText];
        
        // Simula o evento de mudança para o seu handler genérico
        handleInputChange({
          target: {
            name: 'desiredScenario.objectives',
            value: newObjectives,
          },
        });
      };

      return (
        <div className="space-y-8 animate-fade-in">
          {/* SEÇÃO 1: Título e Descrição */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Qual é o seu Cenário Desejado?
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Selecione os principais objetivos que você deseja alcançar com esta atividade. Metas claras são o primeiro passo para o sucesso.
            </p>
          </div>

          {/* SEÇÃO 2: Seleção de Objetivos com Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {objectives.map((objective) => {
              const isSelected = activityData.desiredScenario.objectives.includes(objective.text);
              return (
                <div
                  key={objective.text}
                  onClick={() => handleObjectiveSelection(objective.text)}
                  className={`
                    group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-5 text-center transition-all duration-200
                    ${isSelected
                      ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                      : 'border-gray-300 bg-white hover:border-teal-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-500'
                    }
                  `}
                >
                  <div className={`text-5xl ${isSelected ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-500 dark:text-gray-500 dark:group-hover:text-teal-400'}`}>
                    {objective.icon}
                  </div>
                  <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    {objective.text}
                  </p>
                </div>
              );
            })}
          </div>

          {/* SEÇÃO 3: Campo Aberto */}
          <div className="pt-4">
            <label htmlFor="desiredScenario.otherObjective" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Outro objetivo em mente? (Opcional)
            </label>
            <input 
              type="text" 
              id="desiredScenario.otherObjective" 
              name="desiredScenario.otherObjective" 
              value={activityData.desiredScenario.otherObjective} 
              onChange={handleInputChange} 
              className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder="Descreva um objetivo personalizado" 
            />
          </div>
          
           <button 
            onClick={() => openHelpModal("Ajuda - Cenário Desejado", `Definir objetivos claros e específicos requer algumas etapas...`)} 
            className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Ajuda
          </button> 
        </div>
      );

      // ETAPA 3: PLANEJAMENTO DA ATIVIDADE
      case 3:
      // Array de objetos para as características da atividade
      const activityCharacteristics = [
        { text: "Presencial", icon: <FaChalkboardTeacher /> },
        { text: "Online", icon: <FaLaptop /> },
        { text: "Individual", icon: <FaUser /> },
        { text: "Em grupos", icon: <FaUsers /> },
        { text: "Requer equipamentos específicos", icon: <FaTools /> },
        { text: "Formativa (prática ou revisão)", icon: <FaClipboardCheck /> },
        { text: "Somativa (avaliação)", icon: <FaFileSignature /> },
        { text: "Foco em projetos de software", icon: <FaCodeBranch /> },
        { text: "Uso de plataformas de aprendizado", icon: <FaCloud /> },
        { text: "Níveis de dificuldade progressivos", icon: <FaTrophy /> },
      ];

      /**
       * Função para manipular a seleção de características.
       * Adiciona ou remove a característica do array no estado.
       */
      const handleCharacteristicSelection = (charText) => {
        const currentChars = activityData.activityPlanning.characteristics;
        const newChars = currentChars.includes(charText)
          ? currentChars.filter(c => c !== charText)
          : [...currentChars, charText];
        
        // Simula o evento de mudança para o seu handler genérico
        handleInputChange({
          target: {
            name: 'activityPlanning.characteristics',
            value: newChars,
          },
        });
      };

      return (
        <div className="space-y-8 animate-fade-in">
          {/* SEÇÃO 1: Título e Descrição */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Planejamento da Atividade
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Descreva as características e a logística da atividade. Essas informações são cruciais para um bom planejamento.
            </p>
          </div>

          {/* SEÇÃO 2: Seleção de Características com Cards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Características da Atividade
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activityCharacteristics.map((char) => {
                const isSelected = activityData.activityPlanning.characteristics.includes(char.text);
                return (
                  <div
                    key={char.text}
                    onClick={() => handleCharacteristicSelection(char.text)}
                    className={`
                      group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-5 text-center transition-all duration-200
                      ${isSelected
                        ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                        : 'border-gray-300 bg-white hover:border-teal-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-500'
                      }
                    `}
                  >
                    <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-500 dark:text-gray-500 dark:group-hover:text-teal-400'}`}>
                      {char.icon}
                    </div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {char.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 3: Detalhes Logísticos */}
          <div className="pt-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Detalhes Logísticos
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="activityPlanning.participantsQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantidade de participantes
                </label>
                <input type="text" id="activityPlanning.participantsQuantity" name="activityPlanning.participantsQuantity" value={activityData.activityPlanning.participantsQuantity} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Ex: 25 alunos" />
              </div>
              <div>
                <label htmlFor="activityPlanning.expectedDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Duração prevista
                </label>
                <input type="text" id="activityPlanning.expectedDuration" name="activityPlanning.expectedDuration" value={activityData.activityPlanning.expectedDuration} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Ex: 90 minutos" />
              </div>
              <div>
                <label htmlFor="activityPlanning.location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Localização
                </label>
                <input type="text" id="activityPlanning.location" name="activityPlanning.location" value={activityData.activityPlanning.location} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Ex: Laboratório 5, Online (Discord)" />
              </div>
              <div>
                <label htmlFor="areaKnowledge" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Área de Conhecimento
                </label>
                <input type="text" id="areaKnowledge" name="areaKnowledge" value={activityData.areaKnowledge} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Ex: Engenharia de Software" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="activityPlanning.otherInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Outras informações relevantes (Opcional)
                </label>
                <textarea id="activityPlanning.otherInfo" name="activityPlanning.otherInfo" value={activityData.activityPlanning.otherInfo} onChange={handleInputChange} rows="3" className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Ex: Os alunos precisam trazer notebook. Acesso à internet é essencial."></textarea>
              </div>
            </div>
          </div>
          
          {/* Exemplo do botão de ajuda mantido, caso necessário */}
          {/* <button 
            onClick={() => openHelpModal("Sugestões e exemplos...", `Desafios de programação...`)} 
            className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Ajuda
          </button> 
          */}
        </div>
      );

      // ETAPA 4: PERFIL DO JOGADOR
      case 4:
      // Array de objetos para os perfis de jogadores com descrições
      const playerProfiles = [
        { 
          name: "Competitivo", 
          description: "Motivado por desafios, rankings e por ser o melhor.", 
          icon: <FaTrophy /> 
        },
        { 
          name: "Cooperativo", 
          description: "Gosta de trabalhar em equipe para alcançar objetivos comuns.", 
          icon: <FaUsers /> 
        },
        { 
          name: "Imersivo", 
          description: "Busca se aprofundar na história e no universo da atividade.", 
          icon: <FaBookOpen /> 
        },
        { 
          name: "Realizador", 
          description: "Focado em completar tarefas, coletar itens e alcançar metas.", 
          icon: <FaAward /> 
        },
        { 
          name: "Social", 
          description: "Valoriza a interação, a comunicação e a conexão com outros.", 
          icon: <FaComments /> 
        },
      ];

      /**
       * Função para manipular a seleção de perfis.
       * Adiciona ou remove o perfil do array no estado.
       */
      const handleProfileSelection = (profileName) => {
        const currentProfiles = activityData.playerProfile.selectedProfiles;
        const newProfiles = currentProfiles.includes(profileName)
          ? currentProfiles.filter(p => p !== profileName)
          : [...currentProfiles, profileName];
        
        // Simula o evento de mudança para o seu handler genérico
        handleInputChange({
          target: {
            name: 'playerProfile.selectedProfiles',
            value: newProfiles,
          },
        });
      };

      return (
        <div className="space-y-8 animate-fade-in">
          {/* SEÇÃO 1: Título e Descrição */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Qual perfil de jogador você quer engajar?
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Selecionar os perfis corretos ajuda a definir os elementos de gamificação mais eficazes para a sua atividade.
            </p>
          </div>

          {/* SEÇÃO 2: Seleção de Perfis com Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {playerProfiles.map((profile) => {
              const isSelected = activityData.playerProfile.selectedProfiles.includes(profile.name);
              return (
                <div
                  key={profile.name}
                  onClick={() => handleProfileSelection(profile.name)}
                  className={`
                    group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-6 text-center transition-all duration-200
                    ${isSelected
                      ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                      : 'border-gray-300 bg-white hover:border-teal-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-500'
                    }
                  `}
                >
                  <div className={`text-5xl mb-2 ${isSelected ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-500 dark:text-gray-500 dark:group-hover:text-teal-400'}`}>
                    {profile.icon}
                  </div>
                  <h4 className={`text-base font-semibold ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-gray-800 dark:text-gray-200'}`}>
                    {profile.name}
                  </h4>
                  <p className={`text-xs ${isSelected ? 'text-teal-700 dark:text-teal-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    {profile.description}
                  </p>
                </div>
              );
            })}
          </div>
          
          <div className="pt-4 text-center">
            <button 
              onClick={() => openHelpModal("Ajuda - Perfil do Jogador", `A seguir, listo alguns dos elementos de jogos ideais...`)} 
              className="py-2 px-5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Precisa de ajuda para escolher?
            </button> 
          </div>
        </div>
      );

      // ETAPA 5: ELEMENTOS DE JOGOS
      case 5: {
        // A lógica para sugerir elementos é mantida
        const recommendedElements = new Set();
        if (activityData.playerProfile.selectedProfiles.includes("Competitivo")) { ["Níveis", "Sistema de pontuação", "Estatísticas (métricas de progresso)", "Reconhecimento", "Competição", "Progressão baseada em habilidade", "Sistema de classificação e ranking"].forEach(el => recommendedElements.add(el)); }
        if (activityData.playerProfile.selectedProfiles.includes("Cooperativo")) { ["Cooperação", "Chat ou sistema de mensagens", "Interação social com outros jogadores"].forEach(el => recommendedElements.add(el)); }
        if (activityData.playerProfile.selectedProfiles.includes("Imersivo")) { ["Narrativas envolventes", "Storytelling", "Sensação (imersão, experiência sensorial)", "Customização de personagem", "Customização de equipamento"].forEach(el => recommendedElements.add(el)); }
        if (activityData.playerProfile.selectedProfiles.includes("Realizador")) { ["Níveis", "Sistema de pontuação", "Conquistas digitais para metas alcançadas", "Recompensas atraentes", "Progressão baseada em habilidade", "Feedback claro sobre o desempenho"].forEach(el => recommendedElements.add(el)); }
        if (activityData.playerProfile.selectedProfiles.includes("Social")) { ["Interação social com outros jogadores", "Chat ou sistema de mensagens", "Reputação (prestígio, renome, status)", "Cooperação", "Feedback claro sobre o desempenho"].forEach(el => recommendedElements.add(el)); }

        // --- CORREÇÃO: Lista de 'allGameElements' atualizada com os nomes corretos e completos ---
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
          { name: "Interação social com outros jogadores", icon: <FaShareAlt /> },
          { name: "Feedback claro sobre o desempenho", icon: <FaCheckCircle /> },
          { name: "Progressão baseada em habilidade", icon: <FaChartLine /> },
          { name: "Narrativas envolventes", icon: <FaBookOpen /> },
          { name: "Sistema de classificação e ranking", icon: <FaListOl /> },
          { name: "Recompensas atraentes", icon: <FaGift /> },
          { name: "Conquistas digitais para metas alcançadas", icon: <FaAward /> },
        ].sort((a, b) => a.name.localeCompare(b.name));

        // --- CORREÇÃO APLICADA AQUI ---
        // Esta função agora atualiza o estado diretamente, sem depender da antiga 'handleInputChange'.
        const handleElementSelection = (elementName) => {
          setActivityData(prevData => {
            const currentElements = prevData.gameElements.selectedElements;
            const newElements = currentElements.includes(elementName)
              ? currentElements.filter(el => el !== elementName) // Remove o elemento
              : [...currentElements, elementName]; // Adiciona o elemento

            // Retorna o novo estado completo
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
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Escolha os Elementos de Jogo
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
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
                        : 'border-gray-300 bg-white hover:border-teal-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-500'
                      }
                    `}
                  >
                    {isRecommended && (
                      <div className="absolute top-2 right-2 text-yellow-500" title="Sugerido">
                        <FaStar />
                      </div>
                    )}
                    <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-500 dark:text-gray-500 dark:group-hover:text-teal-400'}`}>
                      {element.icon}
                    </div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {element.name}
                    </p>
                  </div>
                );
              })}
            </div>
            
            {/* SEÇÃO 3: Campo Aberto */}
            <div className="pt-4">
              <label htmlFor="gameElements.otherElement" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Outro elemento não listado? (Opcional)
              </label>
              <input 
                type="text" 
                id="gameElements.otherElement" 
                name="gameElements.otherElement" 
                value={activityData.gameElements.otherElement} 
                onChange={handleInputChange} 
                className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                placeholder="Descreva um elemento de jogo personalizado" 
              />
            </div>

            {/* SEÇÃO 4: Detalhes da Narrativa (Condicional) */}
            {activityData.gameElements.selectedElements.includes("Narrativas envolventes") && (
              <div className="mt-4 p-6 border border-teal-300 dark:border-teal-800 rounded-lg bg-teal-50 dark:bg-teal-900/20 animate-fade-in">
                <h4 className="text-lg font-semibold text-teal-800 dark:text-teal-200 mb-4">
                  Construindo sua Narrativa
                </h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="gameElements.narrativeTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título da Narrativa:</label>
                    <input type="text" id="gameElements.narrativeTitle" name="gameElements.narrativeTitle" value={activityData.gameElements.narrativeTitle} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Ex: A Saga do Código Perdido" />
                  </div>
                  <div>
                    <label htmlFor="gameElements.narrativeContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Conteúdo da Narrativa:</label>
                    <textarea id="gameElements.narrativeContent" name="gameElements.narrativeContent" value={activityData.gameElements.narrativeContent} onChange={handleInputChange} rows="5" className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="Descreva o enredo, os personagens e o mundo da sua atividade."></textarea>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Dica: Use um LLM como o Gemini para gerar ideias e rascunhos para sua história!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      // ETAPA 6: RECOMPENSAS OFERECIDAS
      case 6: {
        // Array de objetos para as recompensas com seus ícones
        const rewards = [
          { text: "Pontos de bônus para a participação.", icon: <FaPlusCircle /> },
          { text: "Conquistas digitais para metas alcançadas.", icon: <FaAward /> },
          { text: "Vantagens para jogos e desafios.", icon: <FaStar /> },
          { text: "Tempo extra para atividades divertidas.", icon: <FaHourglassHalf /> },
          { text: "Destaque na apresentação de trabalhos.", icon: <FaMicrophoneAlt /> },
          { text: "Acesso a recursos exclusivos.", icon: <FaKey /> },
          { text: "Brindes (canetas, adesivos, livros).", icon: <FaGift /> },
          { text: "Certificados digitais de conclusão.", icon: <FaCertificate /> },
          { text: "Oportunidades para liderar a turma.", icon: <FaUserTie /> },
          { text: "Acesso a vídeos ou jogos extras.", icon: <FaFilm /> },
          { text: "Acesso a um espaço diferenciado.", icon: <FaDoorOpen /> },
          { text: "Participação em eventos ou viagens.", icon: <FaPlane /> },
          { text: "Reconhecimento público na turma.", icon: <FaBullhorn /> },
          { text: "Oportunidades para mentorar colegas.", icon: <FaHandsHelping /> },
          { text: "Prêmios em dinheiro ou descontos.", icon: <FaMoneyBillWave /> },
        ];

        /**
        * Função para manipular a seleção de recompensas.
        */
        const handleRewardSelection = (rewardText) => {
          const currentRewards = activityData.rewardsOffered.selectedRewards;
          const newRewards = currentRewards.includes(rewardText)
            ? currentRewards.filter(r => r !== rewardText)
            : [...currentRewards, rewardText];
          
          handleInputChange({
            target: {
              name: 'rewardsOffered.selectedRewards',
              value: newRewards,
            },
          });
        };

        return (
          <div className="space-y-8 animate-fade-in">
            {/* SEÇÃO 1: Título e Descrição */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Quais Recompensas Serão Oferecidas?
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Escolha os incentivos para motivar seus alunos. Recompensas bem pensadas aumentam o engajamento e a sensação de progresso.
              </p>
            </div>

            {/* SEÇÃO 2: Seleção de Recompensas com Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {rewards.map((reward) => {
                const isSelected = activityData.rewardsOffered.selectedRewards.includes(reward.text);
                return (
                  <div
                    key={reward.text}
                    onClick={() => handleRewardSelection(reward.text)}
                    className={`
                      group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-2 rounded-xl border p-4 text-center transition-all duration-200
                      ${isSelected
                        ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                        : 'border-gray-300 bg-white hover:border-teal-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-500'
                      }
                    `}
                  >
                    <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-500 dark:text-gray-500 dark:group-hover:text-teal-400'}`}>
                      {reward.icon}
                    </div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {reward.text}
                    </p>
                  </div>
                );
              })}
            </div>
            
            {/* SEÇÃO 3: Campo Aberto */}
            <div className="pt-4">
              <label htmlFor="rewardsOffered.otherReward" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Outra recompensa específica? (Opcional)
              </label>
              <input 
                type="text" 
                id="rewardsOffered.otherReward" 
                name="rewardsOffered.otherReward" 
                value={activityData.rewardsOffered.otherReward} 
                onChange={handleInputChange} 
                className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                placeholder="Descreva uma recompensa personalizada" 
              />
            </div>
          </div>
        );
      }

      // ETAPA 7: AÇÕES RECOMPENSADAS
      case 7: {
        // Array de objetos para as ações recompensadas
        const rewardedActions = [
          { text: "Participação ativa nas discussões em aula.", icon: <FaComments /> },
          { text: "Conclusão de tarefas antes do prazo.", icon: <FaCalendarCheck /> },
          { text: "Atingir uma pontuação elevada em um jogo.", icon: <FaTrophy /> },
          { text: "Colaboração efetiva em projetos de grupo.", icon: <FaUsers /> },
          { text: "Contribuição criativa em atividades.", icon: <FaPaintBrush /> },
          { text: "Demonstrar pensamento crítico em desafios.", icon: <FaBrain /> },
          { text: "Responder corretamente a perguntas de revisão.", icon: <FaQuestionCircle /> },
          { text: "Auxiliar um colega com dificuldades.", icon: <FaHandsHelping /> },
          { text: "Apresentar um trabalho com excelência.", icon: <FaChalkboardTeacher /> },
          { text: "Atender prontamente às solicitações.", icon: <FaBell /> },
          { text: "Realizar atividades extras para aprofundar.", icon: <FaBookReader /> },
          { text: "Cuidar e organizar o material escolar.", icon: <FaBoxOpen /> },
          { text: "Demonstrar habilidades de liderança.", icon: <FaUserTie /> },
        ];

        /**
        * Função para manipular a seleção de ações.
        */
        const handleActionSelection = (actionText) => {
          const currentActions = activityData.rewardedActions.selectedActions;
          const newActions = currentActions.includes(actionText)
            ? currentActions.filter(a => a !== actionText)
            : [...currentActions, actionText];
          
          handleInputChange({
            target: {
              name: 'rewardedActions.selectedActions',
              value: newActions,
            },
          });
        };

        return (
          <div className="space-y-8 animate-fade-in">
            {/* SEÇÃO 1: Título e Descrição */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Quais Ações Valem Recompensas?
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Defina quais comportamentos e conquistas dos alunos serão recompensados. Ações claras incentivam o engajamento direcionado.
              </p>
            </div>

            {/* SEÇÃO 2: Seleção de Ações com Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {rewardedActions.map((action) => {
                const isSelected = activityData.rewardedActions.selectedActions.includes(action.text);
                return (
                  <div
                    key={action.text}
                    onClick={() => handleActionSelection(action.text)}
                    className={`
                      group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-2 rounded-xl border p-4 text-center transition-all duration-200
                      ${isSelected
                        ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                        : 'border-gray-300 bg-white hover:border-teal-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-500'
                      }
                    `}
                  >
                    <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-500 dark:text-gray-500 dark:group-hover:text-teal-400'}`}>
                      {action.icon}
                    </div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {action.text}
                    </p>
                  </div>
                );
              })}
            </div>
            
            {/* SEÇÃO 3: Campo Aberto */}
            <div className="pt-4">
              <label htmlFor="rewardedActions.otherAction" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Outra ação a ser recompensada? (Opcional)
              </label>
              <input 
                type="text" 
                id="rewardedActions.otherAction" 
                name="rewardedActions.otherAction" 
                value={activityData.rewardedActions.otherAction} 
                onChange={handleInputChange} 
                className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                placeholder="Descreva uma ação personalizada" 
              />
            </div>
          </div>
        );
      }

      // ETAPA 8: REGRAS E COMPARTILHAMENTO
      case 8: {
        // Array de objetos para as regras gerais
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
        * Função para manipular a seleção de regras.
        */
        const handleRuleSelection = (ruleText) => {
          const currentRules = activityData.gamificationRules.generalRules;
          const newRules = currentRules.includes(ruleText)
            ? currentRules.filter(r => r !== ruleText)
            : [...currentRules, ruleText];
          
          handleInputChange({
            target: {
              name: 'gamificationRules.generalRules',
              value: newRules,
            },
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
      default:
        // Caso padrão para evitar erros se `currentStep` for um valor inesperado.
        console.warn(`renderStep: Estado de etapa inválido: ${currentStep}. Renderizando null.`);
        return null;
    }
  };

  // --- Renderização Principal do Componente ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e2226] to-[#2c3135] py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho com gradiente */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-accent-purple/10 to-accent-teal/10 p-1 rounded-full mb-4">
            <div className="bg-[#2c3135] rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-accent-yellow to-accent-teal bg-clip-text text-transparent">
            Criar Nova Atividade Gamificada
          </h2>
          <p className="mt-2 text-gray-400 max-w-md mx-auto">
            Crie experiências de aprendizado envolventes com nossa ferramenta de gamificação
          </p>
        </div>

        {showInitialSelection ? (
          // Tela de seleção inicial (Iniciar do Zero / Escolher um Template)
          <div className="bg-gradient-to-br from-[#3a4046] to-[#2c3135] p-8 rounded-2xl shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-accent-purple to-accent-teal bg-clip-text text-transparent">
              Como você gostaria de começar?
            </h3>

            {!showTemplateList ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Opção: Iniciar do Zero */}
                <div className="relative bg-gradient-to-br from-[#3a4046] to-[#2c3135] rounded-2xl shadow-xl overflow-hidden border border-[#4a525a] hover:border-accent-yellow/50 transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-teal/5 to-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 p-6 flex flex-col items-center text-center h-full">
                    <div className="mb-4 bg-gradient-to-r from-accent-yellow to-accent-teal p-1 rounded-full">
                      <div className="bg-[#3a4046] rounded-full p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-200 mb-2">
                      Iniciar do Zero
                    </h4>
                    <p className="text-gray-400 mb-6 flex-grow">
                      Comece com um formulário completamente vazio e personalize cada detalhe.
                    </p>
                    <button
                      onClick={handleStartFromScratch}
                      className="w-full py-3 px-6 bg-gradient-to-r from-accent-yellow to-accent-teal text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-accent-yellow/90 hover:to-accent-teal/90 transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                    >
                      Atividade em Branco
                    </button>
                  </div>
                </div>

                {/* Opção: Escolher um Template */}
                <div className="relative bg-gradient-to-br from-[#3a4046] to-[#2c3135] rounded-2xl shadow-xl overflow-hidden border border-[#4a525a] hover:border-accent-purple/50 transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/5 to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 p-6 flex flex-col items-center text-center h-full">
                    <div className="mb-4 bg-gradient-to-r from-accent-purple to-accent-teal p-1 rounded-full">
                      <div className="bg-[#3a4046] rounded-full p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-200 mb-2">
                      Escolher um Template
                    </h4>
                    <p className="text-gray-400 mb-6 flex-grow">
                      Use um de nossos templates predefinidos para agilizar a criação.
                    </p>
                    <button
                      onClick={handleShowTemplates}
                      className="w-full py-3 px-6 bg-gradient-to-r from-accent-purple to-accent-teal text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-accent-purple/90 hover:to-accent-teal/90 transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
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
                    <p className="mt-4 text-gray-400">Carregando templates...</p>
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
                        className="relative bg-gradient-to-br from-[#3a4046] to-[#2c3135] rounded-2xl shadow-xl p-6 border border-[#4a525a] hover:border-accent-teal/50 transition-all duration-300 group overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/5 to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-center mb-4">
                            <div className="bg-gradient-to-r from-accent-purple to-accent-yellow p-1 rounded-full">
                              <div className="bg-[#3a4046] rounded-full p-2">
                                <span className="text-2xl">{template.icon}</span>
                              </div>
                            </div>
                          </div>
                          <h5 className="text-lg font-semibold text-gray-200 text-center mb-2">{template.name}</h5>
                          <p className="text-gray-400 text-sm mb-4 flex-grow text-center">{template.description}</p>
                          <button
                            onClick={() => handleSelectTemplate(template.data)}
                            className="mt-auto py-2 px-4 bg-gradient-to-r from-accent-purple to-accent-teal text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
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
                    className="py-2 px-4 border border-accent-teal/30 rounded-xl shadow-sm text-sm font-medium text-gray-300 bg-[#3a4046] hover:bg-[#4a525a] focus:outline-none focus:ring-2 focus:ring-accent-teal transition duration-300"
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
          // Formulário de criação de atividade
          <>
            {/* Barra de Progresso */}
            <div className="w-full bg-gray-700 rounded-full h-3 mb-8 shadow-inner">
              <div
                className="bg-gradient-to-r from-accent-yellow to-accent-teal h-3 rounded-full shadow-md transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>

            {/* Contêiner do Formulário */}
            <div className="relative bg-gradient-to-br from-[#3a4046] to-[#2c3135] rounded-2xl shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/10 to-accent-teal/10"></div>
              <div className="relative z-10 p-6 sm:p-8">
                {renderStep()}

                {/* Botões de Navegação */}
                <div className="flex justify-between mt-8">
                  {currentStep > 1 && (
                    <button
                      onClick={handlePrevious}
                      className="py-3 px-6 border border-accent-teal/30 rounded-xl shadow-sm text-sm font-medium text-gray-300 bg-[#3a4046] hover:bg-[#4a525a] focus:outline-none focus:ring-2 focus:ring-accent-teal transition duration-300 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Anterior
                    </button>
                  )}
                  
                  <button
                    onClick={handleNext}
                    className={`py-3 px-6 rounded-xl shadow-lg font-bold text-white ${
                      currentStep === totalSteps 
                        ? 'bg-gradient-to-r from-green-500 to-accent-teal hover:from-green-600 hover:to-accent-teal/90' 
                        : 'bg-gradient-to-r from-accent-yellow to-accent-teal hover:from-accent-yellow/90 hover:to-accent-teal/90'
                    } transform hover:-translate-y-0.5 transition-all duration-300 ease-out ml-auto flex items-center`}
                  >
                    {currentStep === totalSteps ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Concluir e Salvar
                      </>
                    ) : (
                      <>
                        Próximo
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal de Ajuda */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative bg-gradient-to-br from-[#3a4046] to-[#2c3135] rounded-2xl shadow-2xl max-w-2xl w-full border border-accent-teal/20">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-accent-yellow to-accent-teal bg-clip-text text-transparent">
                    {helpContent.title}
                  </h3>
                  <button
                    onClick={closeHelpModal}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="prose prose-invert max-h-[60vh] overflow-y-auto">
                  <p className="text-gray-300">{helpContent.text}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prompt para atribuir atividade */}
        {showAssignmentPrompt && newlyCreatedActivityId && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative bg-gradient-to-br from-[#3a4046] to-[#2c3135] rounded-2xl shadow-2xl max-w-md w-full border border-accent-teal/20 p-6">
              <h3 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-accent-yellow to-accent-teal bg-clip-text text-transparent">
                Atividade Criada com Sucesso!
              </h3>
              <p className="text-gray-300 text-center mb-6">
                Deseja atribuir esta atividade a uma turma agora?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate(`/assign-activity-to-class/${newlyCreatedActivityId}`)}
                  className="py-3 px-4 bg-gradient-to-r from-accent-yellow to-accent-teal text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-accent-yellow/90 hover:to-accent-teal/90 transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                >
                  Sim, atribuir agora
                </button>
                <button
                  onClick={() => navigate('/professor/dashboard')}
                  className="py-3 px-4 border border-accent-teal/30 text-gray-300 bg-[#3a4046] rounded-xl shadow-md hover:bg-[#4a525a] transition duration-300"
                >
                  Não, deixar para depois
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