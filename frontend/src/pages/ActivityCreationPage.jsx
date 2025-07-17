// frontend/src/pages/ActivityCreationPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importar o hook useAuth para acessar o contexto de autenticação

/**
 * Componente ActivityCreationPage
 * Esta página é um formulário de várias etapas (wizard) que permite aos professores
 * criar uma nova atividade gamificada. Ele guia o usuário através de 8 etapas,
 * coletando informações sobre o cenário, objetivos, planejamento, perfil do jogador,
 * elementos de jogo, recompensas, ações e regras.
 */
function ActivityCreationPage() {
  // --- Hooks de Navegação e Estado ---

  // Hook do React Router para navegar programaticamente entre as rotas.
  const navigate = useNavigate();
  // Estado para controlar a etapa atual do formulário. Inicia na etapa 1.
  const [currentStep, setCurrentStep] = useState(1);
  // Número total de etapas no formulário.
  const totalSteps = 8;
  // Hook para acessar o contexto de autenticação (dados do usuário, token, etc.).
  const { user } = useAuth();

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

  // --- Verificação de Autenticação e Autorização ---

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
        const response = await fetch('http://127.0.0.1:5000/api/templates', {
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
      // Lógica de submissão para a última etapa
      console.log('handleNext: Etapa final atingida. Enviando dados da atividade para o backend...');
      console.log('Dados a serem salvos:', JSON.stringify(activityData, null, 2)); // Log detalhado dos dados

      try {
        const response = await fetch('http://127.0.0.1:5000/api/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}` // Adiciona o token de autenticação
          },
          body: JSON.stringify(activityData),
        });

        const result = await response.json();

        if (response.ok) {
          console.log("handleNext: Atividade criada com sucesso! Resposta do servidor:", result);
          setNewlyCreatedActivityId(result.activity.id);
          setShowAssignmentPrompt(true);
          //navigate('/professor/dashboard'); // Redireciona para o dashboard após o sucesso
        } else {
          console.error('handleNext: Erro ao criar atividade. Resposta do servidor:', result);
          // Substituir alert por um modal ou toast de erro
          // alert('Erro ao criar atividade: ' + (result.message || 'Erro desconhecido do servidor.'));
        }
      } catch (error) {
        console.error('handleNext: Erro de conexão ou ao processar a requisição:', error);
        // Substituir alert por um modal ou toast de erro
        // alert('Ocorreu um erro de rede ao tentar salvar a atividade. Verifique sua conexão e se o backend está rodando.');
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
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cenário Atual</h3>
            {/* Campos para Título e Descrição da Atividade como um todo */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Título da Atividade: <span className="text-red-500">*</span>
              </label>
              <input type="text" id="title" name="title" value={activityData.title} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ex: Gamificação em Engenharia de Software" required />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Descrição da Atividade:
              </label>
              <textarea id="description" name="description" value={activityData.description} onChange={handleInputChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Descreva brevemente sua atividade gamificada."></textarea>
            </div>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Nesta seção, identifique os problemas dos alunos e escolha as sugestões adequadas ao cenário. Leia atentamente e selecione as melhores opções para entender e solucionar a situação de forma efetiva.</p>
            {/* Problemas dos Alunos */}
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Selecione os problemas dos alunos:</label>
            {[
              "Dificuldades na compreensão de conceitos complexos de programação.", "Dificuldades em aplicar as teorias aprendidas na prática.", "Dificuldades em trabalhar em equipe e colaborar com colegas.", "Falta de motivação e interesse no assunto.", "Dificuldades em gerenciar o tempo e priorizar tarefas.", "Dificuldades em lidar com a pressão e o estresse da grade de estudos intensa.", "Dificuldades em aprender novas ferramentas e tecnologias rapidamente.", "Falta de habilidades de comunicação e apresentação.", "Dificuldades em equilibrar o estudo com outras responsabilidades e obrigações.", "Dificuldades em gerenciar a ansiedade e a sobrecarga de trabalho.", "Dificuldades em lidar com ferramentas de desenvolvimento complexas.", "Dificuldades em encontrar oportunidades de estágio ou experiência profissional.", "Dificuldades em trabalhar com prazos apertados em projetos acadêmicos.",
            ].map(problem => (
              <div key={problem} className="flex items-center">
                <input type="checkbox" id={`problem-${problem}`} name="currentScenario.problems" value={problem} checked={activityData.currentScenario.problems.includes(problem)} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor={`problem-${problem}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{problem}</label>
              </div>
            ))}
            <div className="mt-2">
              <label htmlFor="currentScenario.otherProblem" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Outra:</label>
              <input type="text" id="currentScenario.otherProblem" name="currentScenario.otherProblem" value={activityData.currentScenario.otherProblem} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Descreva outro problema" />
            </div>
            <button onClick={() => openHelpModal("Ajuda - Cenário Atual", `Avalie as habilidades e competências requeridas...`)} className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Ajuda - Cenário Atual</button>
          </div>
        );

      // ETAPA 2: CENÁRIO DESEJADO
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cenário Desejado</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Nesta seção, selecione seus objetivos para a gamificação. Escolha metas claras e específicas para medição e acompanhamento.</p>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Objetivos:</label>
            {[
              "Criar um ambiente de aprendizagem motivador e envolvente", "Aumentar a motivação e a concentração dos alunos", "Desenvolver habilidades cognitivas, sociais e de aprendizagem", "Estimular a criatividade e a inovação", "Aumentar a retenção de conhecimentos e habilidades adquiridos ao longo do curso", "Promover a participação ativa dos alunos nas atividades de aprendizagem", "Melhorar a colaboração e o trabalho em equipe entre os alunos", "Incentivar a aplicação prática dos conhecimentos teóricos em projetos reais",
            ].map(objective => (
              <div key={objective} className="flex items-center">
                <input type="checkbox" id={`obj-${objective}`} name="desiredScenario.objectives" value={objective} checked={activityData.desiredScenario.objectives.includes(objective)} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor={`obj-${objective}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{objective}</label>
              </div>
            ))}
            <div className="mt-2">
              <label htmlFor="desiredScenario.otherObjective" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Outra:</label>
              <input type="text" id="desiredScenario.otherObjective" name="desiredScenario.otherObjective" value={activityData.desiredScenario.otherObjective} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Descreva outro objetivo" />
            </div>
            <button onClick={() => openHelpModal("Ajuda - Cenário Desejado", `Definir objetivos claros e específicos requer algumas etapas...`)} className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Ajuda - Cenário Desejado</button>
          </div>
        );

      // ETAPA 3: PLANEJAMENTO DA ATIVIDADE
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Planejamento da Atividade</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Nesta página, você pode descrever as características da atividade que planeja realizar. Essas informações são importantes para a preparação dos materiais, alocação de espaço físico e identificação de restrições logísticas. Verifique os exemplos fornecidos para obter inspiração na gamificação da atividade.</p>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Selecione as características da atividade:</label>
            {[
              "Presencial", "Online", "Individual", "Em grupos", "Requer equipamentos específicos", "Formativa (atividade de prática ou revisão)", "Somativa (avaliação)", "Foco em projetos ou desenvolvimento de software real", "Uso de plataformas de aprendizado online específicas para recursos e interações adicionais", "Níveis de dificuldade ou desafios progressivos para adaptação ao nível de habilidades dos alunos",
            ].map(char => (
              <div key={char} className="flex items-center">
                <input type="checkbox" id={`char-${char}`} name="activityPlanning.characteristics" value={char} checked={activityData.activityPlanning.characteristics.includes(char)} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor={`char-${char}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{char}</label>
              </div>
            ))}
            <div className="mt-4">
              <label htmlFor="activityPlanning.participantsQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Quantidade de participantes:</label>
              <input type="text" id="activityPlanning.participantsQuantity" name="activityPlanning.participantsQuantity" value={activityData.activityPlanning.participantsQuantity} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ex: 20 alunos" />
            </div>
            <div className="mt-2">
              <label htmlFor="activityPlanning.expectedDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Duração prevista:</label>
              <input type="text" id="activityPlanning.expectedDuration" name="activityPlanning.expectedDuration" value={activityData.activityPlanning.expectedDuration} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ex: 2 horas" />
            </div>
            <div className="mt-2">
              <label htmlFor="activityPlanning.location" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Localização da atividade:</label>
              <input type="text" id="activityPlanning.location" name="activityPlanning.location" value={activityData.activityPlanning.location} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ex: Sala de aula, Online" />
            </div>
            <div className="mt-2">
              <label htmlFor="activityPlanning.otherInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Outra informação:</label>
              <textarea id="activityPlanning.otherInfo" name="activityPlanning.otherInfo" value={activityData.activityPlanning.otherInfo} onChange={handleInputChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Detalhes adicionais sobre a atividade"></textarea>
            </div>
            <div className="mt-4">
              <label htmlFor="areaKnowledge" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Área de Conhecimento:</label>
              <input type="text" id="areaKnowledge" name="areaKnowledge" value={activityData.areaKnowledge} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ex: Engenharia de Software, Matemática" />
            </div>
            <button onClick={() => openHelpModal("Sugestões e exemplos de atividades que podem ser gamificadas", `Desafios de programação...`)} className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Ajuda - Planejamento da Atividade</button>
          </div>
        );

      // ETAPA 4: PERFIL DO JOGADOR
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Selecione os perfis de jogadores que deseja motivar:</h3>
            {[
              "Jogador competitivo", "Jogador cooperativo", "Jogador imersivo", "Jogador de realização", "Jogador social",
            ].map(profile => (
              <div key={profile} className="flex items-center">
                <input type="checkbox" id={`profile-${profile}`} name="playerProfile.selectedProfiles" value={profile} checked={activityData.playerProfile.selectedProfiles.includes(profile)} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor={`profile-${profile}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{profile}</label>
              </div>
            ))}
            <button onClick={() => openHelpModal("Ajuda - Perfil do Jogador", `A seguir, listo alguns dos elementos de jogos ideais para motivar cada tipo de jogador...`)} className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Ajuda - Perfil do Jogador</button>
          </div>
        );

      // ETAPA 5: ELEMENTOS DE JOGOS
      case 5:
        // Lógica para sugerir elementos com base nos perfis de jogador selecionados na etapa anterior.
        const recommendedElements = new Set();
        if (activityData.playerProfile.selectedProfiles.includes("Jogador competitivo")) { ["Níveis", "Sistema de pontuação", "Estatísticas (métricas de progresso)", "Reconhecimento", "Competição", "Progressão baseada em habilidade", "Sistema de classificação e ranking"].forEach(el => recommendedElements.add(el)); }
        if (activityData.playerProfile.selectedProfiles.includes("Jogador cooperativo")) { ["Cooperação", "Chat ou sistema de mensagens", "Interação social com outros jogadores"].forEach(el => recommendedElements.add(el)); }
        if (activityData.playerProfile.selectedProfiles.includes("Jogador imersivo")) { ["Narrativas envolventes", "Storytelling", "Sensação (imersão, experiência sensorial)", "Customização de personagem", "Customização de equipamento"].forEach(el => recommendedElements.add(el)); }
        if (activityData.playerProfile.selectedProfiles.includes("Jogador de realização")) { ["Níveis", "Sistema de pontuação", "Conquistas digitais para metas alcançadas", "Recompensas atraentes", "Progressão baseada em habilidade", "Feedback claro sobre o desempenho"].forEach(el => recommendedElements.add(el)); }
        if (activityData.playerProfile.selectedProfiles.includes("Jogador social")) { ["Interação social com outros jogadores", "Chat ou sistema de mensagens", "Reputação (prestígio, renome, status)", "Cooperação", "Feedback claro sobre o desempenho"].forEach(el => recommendedElements.add(el)); }

        console.log("renderStep 5: Elementos recomendados com base nos perfis:", Array.from(recommendedElements));

        const allGameElements = [
          "Níveis", "Sistema de pontuação", "Estatísticas (métricas de progresso)", "Reconhecimento", "Raridade (itens exclusivos, objetos raros)", "Economia (sistema monetário)", "Escolha imposta (decisões forçadas)", "Chance (sorte e probabilidade)", "Pressão de tempo", "Reputação (prestígio, renome, status)", "Cooperação", "Competição", "Pressão social", "Sensação (imersão, experiência sensorial)", "Objetivo (missão, meta do jogo)", "Quebra-cabeça", "Renovação (atualizações de conteúdo)", "Novidade (novas funcionalidades)", "Storytelling", "Customização de personagem", "Customização de equipamento", "Chat ou sistema de mensagens", "Interação social com outros jogadores", "Feedback claro sobre o desempenho", "Progressão baseada em habilidade", "Narrativas envolventes", "Sistema de classificação e ranking", "Recompensas atraentes"
        ];

        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Elementos de Jogos</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Nesta seção, você pode selecionar os elementos de jogos desejados. Alguns elementos são previamente selecionados com base nas suas escolhas de perfil de jogador. Escolha com cuidado e selecione apenas os elementos que deseja usar em seus jogos.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allGameElements.map(element => (
                <div key={element} className="flex items-center">
                  <input type="checkbox" id={`element-${element}`} name="gameElements.selectedElements" value={element} checked={activityData.gameElements.selectedElements.includes(element) || recommendedElements.has(element)} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <label htmlFor={`element-${element}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{element}{recommendedElements.has(element) && <span className="text-xs text-blue-500 ml-1">(Sugerido)</span>}</label>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label htmlFor="gameElements.otherElement" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Outro elemento de jogo:</label>
              <input type="text" id="gameElements.otherElement" name="gameElements.otherElement" value={activityData.gameElements.otherElement} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Descreva outro elemento" />
            </div>
            {/* Campos de narrativa aparecem condicionalmente se "Narrativas envolventes" for selecionado */}
            {activityData.gameElements.selectedElements.includes("Narrativas envolventes") && (
              <div className="mt-4 p-4 border border-blue-300 rounded-md bg-blue-50 dark:bg-blue-900/20">
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Detalhes da Narrativa/Storytelling:</h4>
                <div>
                  <label htmlFor="gameElements.narrativeTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Título da Narrativa:</label>
                  <input type="text" id="gameElements.narrativeTitle" name="gameElements.narrativeTitle" value={activityData.gameElements.narrativeTitle} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ex: A Jornada do Desenvolvedor" />
                </div>
                <div className="mt-2">
                  <label htmlFor="gameElements.narrativeContent" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Conteúdo da Narrativa:</label>
                  <textarea id="gameElements.narrativeContent" name="gameElements.narrativeContent" value={activityData.gameElements.narrativeContent} onChange={handleInputChange} rows="5" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Descreva a história e o mundo da gamificação aqui."></textarea>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Futuramente, poderá haver integração com APIs de LLMs (como o Gemini API) para auxiliar na geração de rascunhos de narrativa.</p>
              </div>
            )}
            <button onClick={() => openHelpModal("Ajuda - Elementos de Jogos", `Descrição detalhada das mecânicas e componentes dos jogos...`)} className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Ajuda - Elementos de Jogos</button>
          </div>
        );

      // ETAPA 6: RECOMPENSAS OFERECIDAS
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recompensas oferecidas</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Nesta seção, você encontrará 15 sugestões de recompensas para usar em sala de aula gamificada. Escolha de acordo com o perfil do jogador. Motive os alunos com certificados, pontos extras, prêmios físicos e experiências especiais.</p>
            {[
              "Pontos de bônus para a participação na aula.", "Conquistas digitais para metas alcançadas.", "Vantagens para jogos e desafios.", "Tempo extra para jogos e atividades divertidas.", "Destaque na apresentação de trabalhos.", "Acesso a recursos exclusivos (por exemplo, jogos, ferramentas, aplicativos).", "Brindes (por exemplo, canetas, adesivos, livros, chocolates).", "Certificados digitais.", "Oportunidades para liderar a turma em atividades.", "Acesso a vídeos, filmes ou jogos extras.", "Acesso a sala dos professores.", "Participação em eventos ou viagens.", "Reconhecimento público (por exemplo, menção em redes sociais ou na frente da turma).", "Oportunidades para mentorar colegas.", "Prêmios em dinheiro ou descontos.",
            ].map(reward => (
              <div key={reward} className="flex items-center">
                <input type="checkbox" id={`reward-${reward}`} name="rewardsOffered.selectedRewards" value={reward} checked={activityData.rewardsOffered.selectedRewards.includes(reward)} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor={`reward-${reward}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{reward}</label>
              </div>
            ))}
            <div className="mt-2">
              <label htmlFor="rewardsOffered.otherReward" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Outra recompensa específica:</label>
              <input type="text" id="rewardsOffered.otherReward" name="rewardsOffered.otherReward" value={activityData.rewardsOffered.otherReward} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Descreva outra recompensa" />
            </div>
            <button onClick={() => openHelpModal("Ajuda - Recompensas Oferecidas", `Relações entre os perfis de jogadores e as recompensas sugeridas...`)} className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Ajuda - Recompensas Oferecidas</button>
          </div>
        );

      // ETAPA 7: AÇÕES RECOMPENSADAS
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ações Recompensadas</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Lista de 15 sugestões de ações para ganhar recompensas. Escolha as que mais se adequam a você. As recompensas são limitadas e serão concedidas com base no desempenho e no progresso em relação às metas estabelecidas.</p>
            {[
              "Participação ativa nas discussões em sala de aula", "Conclusão de tarefas antes do prazo estipulado", "Atingir uma pontuação elevada em um jogo educacional", "Colaboração com outros alunos em projetos de grupo", "Contribuição criativa em atividades de escrita ou arte", "Demonstrar pensamento crítico em tarefas desafiadoras", "Responder corretamente a perguntas de revisão de material", "Auxiliar um colega com dificuldades em uma tarefa", "Apresentar um trabalho com excelência", "Atender prontamente as solicitações do professor", "Realizar atividades extras em casa para aprofundar o aprendizado", "Ser responsável pelo cuidado e organização do material escolar", "Demonstração de habilidades de liderança em atividades em grupo",
            ].map(action => (
              <div key={action} className="flex items-center">
                <input type="checkbox" id={`action-${action}`} name="rewardedActions.selectedActions" value={action} checked={activityData.rewardedActions.selectedActions.includes(action)} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor={`action-${action}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{action}</label>
              </div>
            ))}
            <div className="mt-2">
              <label htmlFor="rewardedActions.otherAction" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Outra:</label>
              <input type="text" id="rewardedActions.otherAction" name="rewardedActions.otherAction" value={activityData.rewardedActions.otherAction} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Descreva outra ação" />
            </div>
            <button onClick={() => openHelpModal("Ajuda - Ações Recompensadas", `Aqui estão algumas dicas para estabelecer ações claras e significativas...`)} className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Ajuda - Ações Recompensadas</button>
          </div>
        );

      // ETAPA 8: REGRAS E COMPARTILHAMENTO
      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Regras da Gamificação</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Nesta seção, encontrará sugestões de regras gerais para uma sala de aula gamificada. Elas promovem um ambiente de aprendizado engajador e divertido. Adapte e personalize as sugestões de acordo com as necessidades da sua turma.</p>
            {[
              "Respeite as regras do jogo e as decisões do professor em todas as atividades.", "Seja respeitoso e colaborativo com outros jogadores em todas as atividades.", "Entenda as regras do jogo e como elas se aplicam a cada atividade.", "Busque sempre aprender e se esforçar para alcançar seus objetivos em cada atividade.", "Comunique-se com outros jogadores de forma clara e objetiva em todas as atividades.", "Proteja a privacidade e a segurança de todos os jogadores em todas as atividades.", "Use dispositivos eletrônicos apenas para fins educacionais relacionados ao jogo.", "Respeite as regras e políticas da instituição em todas as atividades.", "Mantenha-se atualizado com as atualizações nas regras do jogo em todas as atividades.", "Busque sempre a supervisão do professor em todas as atividades.",
            ].map(rule => (
              <div key={rule} className="flex items-center">
                <input type="checkbox" id={`rule-${rule}`} name="gamificationRules.generalRules" value={rule} checked={activityData.gamificationRules.generalRules.includes(rule)} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor={`rule-${rule}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{rule}</label>
              </div>
            ))}
            <div className="mt-2">
              <label htmlFor="gamificationRules.specificRules" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Regras específicas da atividade planejada:</label>
              <textarea id="gamificationRules.specificRules" name="gamificationRules.specificRules" value={activityData.gamificationRules.specificRules} onChange={handleInputChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Descreva as regras específicas aqui"></textarea>
            </div>
            {/* Opção de Compartilhamento (Tornar a atividade pública) */}
            <div className="mt-4 flex items-center">
              <input type="checkbox" id="isPublic" name="isPublic" checked={activityData.isPublic} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="isPublic" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">Compartilhar esta atividade com outros professores (tornar pública)?</label>
            </div>
            <button onClick={() => openHelpModal("Ajuda - Regras da Gamificação", `Aqui estao algumas dicas para alinhar regras com objetivos...`)} className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Ajuda - Regras da Gamificação</button>
          </div>
        );
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

// ... (renderStep permanece funcionalmente igual, mas com melhorias visuais)

export default ActivityCreationPage;