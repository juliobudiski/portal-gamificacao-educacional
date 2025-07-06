// frontend/src/pages/ActivityCreationPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importar useAuth

function ActivityCreationPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;

  // Usar o hook useAuth para acessar o contexto de autenticação
  const { user } = useAuth();

  // Redireciona se o usuário não estiver logado ou não for professor
  // Este controle deve ser feito preferencialmente em PrivateRoute ou no layout,
  // mas aqui garante que a página não seja acessada sem autenticação.
  if (!user || !user.token || user.role !== 'professor') {
    console.error("Usuário não autenticado ou não é professor. Redirecionando.");
    navigate('/login');
    return null; // Retorna null para evitar renderização da página sem permissão
  }

  // Estado para armazenar os dados de toda a atividade
  const [activityData, setActivityData] = useState({
    // Campos globais da atividade (título e descrição)
    title: '',
    description: '',
    areaKnowledge: '', // Campo para RF002.1 - Seleção de Área
    isPublic: false, // Campo para RF011.1 - Opção de Compartilhamento

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

  // Estado para controlar a visibilidade dos modais de ajuda
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpContent, setHelpContent] = useState({ title: '', text: '' });

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      // Última etapa: Enviar dados para o backend
      console.log('Dados da Atividade para salvar:', activityData);
      
      try {
        const response = await fetch('http://127.0.0.1:5000/api/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}` // Usa o token do user do AuthContext
          },
          body: JSON.stringify(activityData), // Envia activityData completo
        });

        const result = await response.json();

        if (response.ok) {
          alert('Atividade criada com sucesso! ID: ' + result.activity.id);
          navigate('/professor/dashboard'); // Redirecionar após salvar
        } else {
          alert('Erro ao criar atividade: ' + (result.message || 'Erro desconhecido'));
          console.error('Erro detalhado:', result);
        }
      } catch (error) {
        console.error('Erro de conexão ou ao salvar atividade:', error);
        alert('Ocorreu um erro ao tentar salvar a atividade. Verifique a conexão do backend.');
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    // O name agora pode ser 'topLevelField' ou 'section.field'
    const nameParts = name.split('.');

    setActivityData(prevData => {
      if (nameParts.length === 1) { // Campo top-level como 'title', 'description', 'areaKnowledge', 'isPublic'
        // Trata isPublic como boolean
        if (name === 'isPublic') {
            return {
                ...prevData,
                [name]: checked,
            };
        }
        return {
          ...prevData,
          [name]: value,
        };
      } else { // Campo dentro de uma seção de etapa
        const [section, field] = nameParts;
        if (type === 'checkbox') {
          const currentValues = prevData[section][field] || [];
          return {
            ...prevData,
            [section]: {
              ...prevData[section],
              [field]: checked
                ? [...currentValues, value]
                : currentValues.filter(item => item !== value),
            },
          };
        } else {
          return {
            ...prevData,
            [section]: {
              ...prevData[section],
              [field]: value,
            },
          };
        }
      }
    });
  };

  const openHelpModal = (title, text) => {
    setHelpContent({ title, text });
    setShowHelpModal(true);
  };

  const closeHelpModal = () => {
    setShowHelpModal(false);
    setHelpContent({ title: '', text: '' });
  };

  // Funções de renderização para cada etapa
  const renderStep = () => {
    switch (currentStep) {
      case 1: // Etapa 1: Cenário Atual
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cenário Atual</h3>
            {/* Campos para Título e Descrição da Atividade como um todo */}
            <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Título da Atividade: <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    value={activityData.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: Gamificação em Engenharia de Software"
                    required
                />
            </div>
            <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Descrição da Atividade:
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={activityData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Descreva brevemente sua atividade gamificada."
                ></textarea>
            </div>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Nesta seção, identifique os problemas dos alunos e escolha as sugestões adequadas ao cenário. Leia atentamente e selecione as melhores opções para entender e solucionar a situação de forma efetiva.</p>
            {/* Problemas dos Alunos */}
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Selecione os problemas dos alunos:</label>
            {[
              "Dificuldades na compreensão de conceitos complexos de programação.",
              "Dificuldades em aplicar as teorias aprendidas na prática.",
              "Dificuldades em trabalhar em equipe e colaborar com colegas.",
              "Falta de motivação e interesse no assunto.",
              "Dificuldades em gerenciar o tempo e priorizar tarefas.",
              "Dificuldades em lidar com a pressão e o estresse da grade de estudos intensa.",
              "Dificuldades em aprender novas ferramentas e tecnologias rapidamente.",
              "Falta de habilidades de comunicação e apresentação.",
              "Dificuldades em equilibrar o estudo com outras responsabilidades e obrigações.",
              "Dificuldades em gerenciar a ansiedade e a sobrecarga de trabalho.",
              "Dificuldades em lidar com ferramentas de desenvolvimento complexas.",
              "Dificuldades em encontrar oportunidades de estágio ou experiência profissional.",
              "Dificuldades em trabalhar com prazos apertados em projetos acadêmicos.",
            ].map(problem => (
              <div key={problem} className="flex items-center">
                <input
                  type="checkbox"
                  id={`problem-${problem}`}
                  name="currentScenario.problems"
                  value={problem}
                  checked={activityData.currentScenario.problems.includes(problem)}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`problem-${problem}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {problem}
                </label>
              </div>
            ))}
            <div className="mt-2">
              <label htmlFor="currentScenario.otherProblem" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Outra:
              </label>
              <input
                type="text"
                id="currentScenario.otherProblem"
                name="currentScenario.otherProblem"
                value={activityData.currentScenario.otherProblem}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Descreva outro problema"
              />
            </div>
            
            <button
              onClick={() => openHelpModal(
                "Ajuda - Cenário Atual",
                `Avalie as habilidades e competências requeridas: Realize uma análise das habilidades e competências necessárias para os profissionais de engenharia de software. Isso pode incluir conhecimento em linguagens de programação, práticas de desenvolvimento ágil, padrões de design, testes automatizados, entre outros. Identificar essas competências auxiliará na definição dos objetivos de aprendizagem.
                Considere o ambiente de trabalho em engenharia de software: Avalie as características do ambiente de trabalho em engenharia de software, como a colaboração em equipe, a pressão por prazos, o uso de ferramentas e tecnologias específicas. Isso ajudará a adaptar a gamificação para refletir as situações reais enfrentadas pelos profissionais nessa área.
                
                Leitura Complementar:
                MORA, Alberto et al. A literature review of gamification design frameworks. In: 2015 7th international conference on games and virtual worlds for serious applications (VS-Games). IEEE, 2015. p. [cite_start]1-8. [cite: 147] HAMARI, Juho; KOIVISTO, Jonna; SARSA, Harri. Does gamification work?--a literature review of empirical studies on gamification. In: 2014 47th Hawaii international conference on system sciences. Ieee, 2014. p. [cite_start]3025-3034. [cite: 147]
                KAPP, Karl M. The gamification of learning and instruction: game-based methods and strategies for training and education. [cite_start]John Wiley & Sons, 2012. [cite: 147]`
              )}
              className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Ajuda - Cenário Atual
            </button>
          </div>
        );
      case 2: // Etapa 2: Cenário Desejado
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cenário Desejado</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Nesta seção, selecione seus objetivos para a gamificação. Escolha metas claras e específicas para medição e acompanhamento.</p>
            {/* Objetivos */}
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Objetivos:</label>
            {[
              "Criar um ambiente de aprendizagem motivador e envolvente",
              "Aumentar a motivação e a concentração dos alunos",
              "Desenvolver habilidades cognitivas, sociais e de aprendizagem",
              "Estimular a criatividade e a inovação",
              "Aumentar a retenção de conhecimentos e habilidades adquiridos ao longo do curso",
              "Promover a participação ativa dos alunos nas atividades de aprendizagem",
              "Melhorar a colaboração e o trabalho em equipe entre os alunos",
              "Incentivar a aplicação prática dos conhecimentos teóricos em projetos reais",
            ].map(objective => (
              <div key={objective} className="flex items-center">
                <input
                  type="checkbox"
                  id={`obj-${objective}`}
                  name="desiredScenario.objectives"
                  value={objective}
                  checked={activityData.desiredScenario.objectives.includes(objective)}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`obj-${objective}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {objective}
                </label>
              </div>
            ))}
            <div className="mt-2">
              <label htmlFor="desiredScenario.otherObjective" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Outra:
              </label>
              <input
                type="text"
                id="desiredScenario.otherObjective"
                name="desiredScenario.otherObjective"
                value={activityData.desiredScenario.otherObjective}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Descreva outro objetivo"
              />
            </div>
            
            <button
              onClick={() => openHelpModal(
                "Ajuda - Cenário Desejado",
                `Definir objetivos claros e específicos requer algumas etapas:
                - Identifique o objetivo geral - determine o que você deseja alcançar.
                - Seja específico - defina o objetivo de forma clara e detalhada.
                - Mantenha-o realista - estabeleça metas alcançáveis e realistas de acordo com suas habilidades e recursos.
                - Mantenha-o mensurável - determine como você medirá o sucesso em relação ao objetivo.
                - Mantenha o prazo - estabeleça uma data para alcançar o objetivo.
                - Mantenha-o relevante - certifique-se de que o objetivo seja importante para você e esteja alinhado com suas metas a longo prazo.

                Para garantir que seus objetivos são alcançáveis, é importante seguir algumas dicas:
                - Analise suas habilidades e recursos - certifique-se de que você possui as habilidades e os recursos necessários para alcançar o objetivo.
                - Seja realista - estabeleça metas realistas e factíveis de acordo com seu nível de habilidade e recursos disponíveis.
                - Divida o objetivo em pequenas metas - estabeleça pequenas metas intermediárias que o ajudem a chegar ao objetivo final.
                - Mantenha o foco - mantenha o foco no objetivo e evite se distrair com tarefas irrelevantes.
                - Mantenha-se motivado - mantenha-se motivado e comprometido com o objetivo para alcançá-lo.`
              )}
              className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Ajuda - Cenário Desejado
            </button>
          </div>
        );
      case 3: // Etapa 3: Planejamento da Atividade
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Planejamento da Atividade</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Nesta página, você pode descrever as características da atividade que planeja realizar. Essas informações são importantes para a preparação dos materiais, alocação de espaço físico e identificação de restrições logísticas. Verifique os exemplos fornecidos para obter inspiração na gamificação da atividade.</p>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Selecione as características da atividade:</label>
            {[
              "Presencial",
              "Online",
              "Individual",
              "Em grupos",
              "Requer equipamentos específicos",
              "Formativa (atividade de prática ou revisão)",
              "Somativa (avaliação)",
              "Foco em projetos ou desenvolvimento de software real",
              "Uso de plataformas de aprendizado online específicas para recursos e interações adicionais",
              "Níveis de dificuldade ou desafios progressivos para adaptação ao nível de habilidades dos alunos",
            ].map(char => (
              <div key={char} className="flex items-center">
                <input
                  type="checkbox"
                  id={`char-${char}`}
                  name="activityPlanning.characteristics"
                  value={char}
                  checked={activityData.activityPlanning.characteristics.includes(char)}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`char-${char}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {char}
                </label>
              </div>
            ))}
            <div className="mt-4">
              <label htmlFor="activityPlanning.participantsQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Quantidade de participantes:
              </label>
              <input
                type="text"
                id="activityPlanning.participantsQuantity"
                name="activityPlanning.participantsQuantity"
                value={activityData.activityPlanning.participantsQuantity}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ex: 20 alunos"
              />
            </div>
            <div className="mt-2">
              <label htmlFor="activityPlanning.expectedDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Duração prevista:
              </label>
              <input
                type="text"
                id="activityPlanning.expectedDuration"
                name="activityPlanning.expectedDuration"
                value={activityData.activityPlanning.expectedDuration}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ex: 2 horas"
              />
            </div>
            <div className="mt-2">
              <label htmlFor="activityPlanning.location" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Localização da atividade:
              </label>
              <input
                type="text"
                id="activityPlanning.location"
                name="activityPlanning.location"
                value={activityData.activityPlanning.location}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ex: Sala de aula, Online"
              />
            </div>
            <div className="mt-2">
              <label htmlFor="activityPlanning.otherInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Outra informação:
              </label>
              <textarea
                id="activityPlanning.otherInfo"
                name="activityPlanning.otherInfo"
                value={activityData.activityPlanning.otherInfo}
                onChange={handleInputChange}
                rows="3"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Detalhes adicionais sobre a atividade"
              ></textarea>
            </div>
            {/* Campo para Seleção de Área de Conhecimento (RF002.1) */}
            <div className="mt-4">
                <label htmlFor="areaKnowledge" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Área de Conhecimento:
                </label>
                <input
                    type="text"
                    id="areaKnowledge"
                    name="areaKnowledge"
                    value={activityData.areaKnowledge}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: Engenharia de Software, Matemática"
                />
            </div>
            <button
              onClick={() => openHelpModal(
                "Sugestões e exemplos de atividades que podem ser gamificadas",
                `Desafios de programação (individual ou em grupo, presencial ou online): os jogadores enfrentam desafios de programação, resolvendo problemas específicos relacionados à engenharia de software. Eles são pontuados com base na precisão e eficiência de suas soluções. Testes de depuração (individual, presencial ou online): os jogadores são apresentados a trechos de código com erros e precisam identificar e corrigir os bugs. Eles são avaliados com base na precisão e velocidade de suas correções. Simulações de desenvolvimento de software (individual ou em grupo, presencial ou online): os jogadores participam de simulações que reproduzem o processo de desenvolvimento de software, desde a análise de requisitos até a entrega final. Eles enfrentam desafios típicos encontrados na engenharia de software e são avaliados com base em suas habilidades de tomada de decisão e resolução de problemas. Desafios de arquitetura de software (individual, presencial ou online): os jogadores são apresentados a problemas complexos de design de software e precisam criar arquiteturas eficientes e escaláveis para solucioná-los. Suas soluções são avaliadas com base na robustez e qualidade da arquitetura proposta. Jogo de construção de algoritmos (individual ou em grupo, presencial ou online): os jogadores constroem algoritmos passo a passo para resolver problemas específicos relacionados à engenharia de software. Eles são avaliados com base na eficiência e correção dos algoritmos criados. Desafios de segurança cibernética (individual, presencial ou online): os jogadores enfrentam cenários de segurança cibernética, onde precisam identificar vulnerabilidades, aplicar medidas de proteção e responder a incidentes de segurança. São avaliados com base na eficácia de suas soluções e na capacidade de proteger sistemas de software.`
              )}
              className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Ajuda - Planejamento da Atividade
            </button>
          </div>
        );
      case 4: // Etapa 4: Perfil do Jogador
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Selecione os perfis de jogadores que deseja motivar:</h3>
            {[
              "Jogador competitivo",
              "Jogador cooperativo",
              "Jogador imersivo",
              "Jogador de realização",
              "Jogador social",
            ].map(profile => (
              <div key={profile} className="flex items-center">
                <input
                  type="checkbox"
                  id={`profile-${profile}`}
                  name="playerProfile.selectedProfiles"
                  value={profile}
                  checked={activityData.playerProfile.selectedProfiles.includes(profile)}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`profile-${profile}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {profile}
                </label>
              </div>
            ))}
             <button
              onClick={() => openHelpModal(
                "Ajuda - Perfil do Jogador",
                `A seguir, listo alguns dos elementos de jogos ideais para motivar cada tipo de jogador, baseados nas categorias de jogadores apresentadas por Hamari, Juho e Tuunanen (2014):\n\nJogador competitivo:\n- Competição clara com outros jogadores ou times.\n- Sistema de classificação e ranking para mostrar o desempenho em relação a outros jogadores.\n- Objetivos desafiadores e progressão baseada em habilidade.\n- Feedback claro sobre o desempenho e progresso.\n- Possibilidade de personalizar o personagem ou o equipamento.\n\nJogador cooperativo:\n- Oportunidades de trabalhar em equipe com outros jogadores.\n- Objetivos comuns a serem alcançados por todos os jogadores.\n- Comunicação facilitada com outros jogadores.\n- Feedback claro sobre o desempenho do time.\n- Recompensas coletivas para o time.\n\nJogador imersivo:\n- Narrativas envolventes e personagens interessantes.\n- Mundos virtuais detalhados e realistas.\n- Interações emocionantes e envolventes com outros personagens.\n- Escolhas que afetam o rumo da história.\n- Feedback claro sobre as consequências das escolhas do jogador.\n\nJogador de realização:\n- Objetivos claros e progressão baseada em habilidade.\n- Feedback claro sobre o desempenho e progresso.\n- Recompensas atraentes para incentivar a progressão.\n- Sistema de classificação e ranking para mostrar o desempenho em relação a outros jogadores.\n- Possibilidade de personalizar o personagem ou o equipamento.\n\nJogador social:\n- Oportunidades de interação social com outros jogadores.\n- Comunicação facilitada com outros jogadores.\n- Possibilidade de personalizar o personagem ou o equipamento.\n- Sistema de classificação e ranking para mostrar o desempenho em relação a outros jogadores.\n- Recompensas coletivas para o time ou grupo.\n\nEsta lista é apenas uma orientação e cada jogador pode ser motivado por elementos diferentes, dependendo de suas preferências e motivações únicas. É importante que os designers considerem uma combinação de elementos para atender a diferentes tipos de jogadores.\n\nEm síntese:\n- Jogadores competitivos: procuram desafios e querem vencer outros jogadores.\n- Jogadores cooperativos: preferem trabalhar em equipe com outros jogadores para alcançar objetivos comuns.\n- Jogadores imersivos: procuram imersão em mundos virtuais e histórias, e estão mais interessados na narrativa e no envolvimento emocional.\n- Jogadores de realização: procuram realizar tarefas e alcançar objetivos, e são motivados por recompensas e reconhecimento.\n- Jogadores sociais: procuram interações sociais através de jogos, sejam elas com outros jogadores ou com personagens fictícios.\n\nLeitura Complementar:\nHAMARI, Juho; TUUNANEN, Janne. Player types: A meta-synthesis. [cite_start]2014. [cite: 147] ANDRADE, Fernando et al. Qpj-br: questionário para identificação de perfis de jogadores para o português-brasileiro. In: Brazilian symposium on computers in education (Simpósio Brasileiro De Informática Na Educação-SBIE). 2016. p. 637.\nYEE, Nick. Motivations for play in online games. CyberPsychology & behavior, v. 9, n. 6, p. 772-775, 2006.`
              )}
              className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Ajuda - Perfil do Jogador
            </button>
          </div>
        );
      case 5: // Etapa 5: Elementos de Jogos
        const recommendedElements = new Set();
        if (activityData.playerProfile.selectedProfiles.includes("Jogador competitivo")) {
            ["Níveis", "Sistema de pontuação", "Estatísticas (métricas de progresso)", "Reconhecimento", "Competição", "Progressão baseada em habilidade", "Sistema de classificação e ranking"].forEach(el => recommendedElements.add(el));
        }
        if (activityData.playerProfile.selectedProfiles.includes("Jogador cooperativo")) {
            ["Cooperação", "Chat ou sistema de mensagens", "Interação social com outros jogadores"].forEach(el => recommendedElements.add(el));
        }
        if (activityData.playerProfile.selectedProfiles.includes("Jogador imersivo")) {
            ["Narrativas envolventes", "Storytelling", "Sensação (imersão, experiência sensorial)", "Customização de personagem", "Customização de equipamento"].forEach(el => recommendedElements.add(el));
        }
        if (activityData.playerProfile.selectedProfiles.includes("Jogador de realização")) {
            ["Níveis", "Sistema de pontuação", "Conquistas digitais para metas alcançadas", "Recompensas atraentes", "Progressão baseada em habilidade", "Feedback claro sobre o desempenho"].forEach(el => recommendedElements.add(el));
        }
        if (activityData.playerProfile.selectedProfiles.includes("Jogador social")) {
            ["Interação social com outros jogadores", "Chat ou sistema de mensagens", "Reputação (prestígio, renome, status)", "Cooperação", "Feedback claro sobre o desempenho"].forEach(el => recommendedElements.add(el));
        }

        const allGameElements = [
          "Níveis", "Sistema de pontuação", "Estatísticas (métricas de progresso)",
          "Reconhecimento", "Raridade (itens exclusivos, objetos raros)", "Economia (sistema monetário)",
          "Escolha imposta (decisões forçadas)", "Chance (sorte e probabilidade)", "Pressão de tempo",
          "Reputação (prestígio, renome, status)", "Cooperação", "Competição", "Pressão social",
          "Sensação (imersão, experiência sensorial)", "Objetivo (missão, meta do jogo)", "Quebra-cabeça",
          "Renovação (atualizações de conteúdo)", "Novidade (novas funcionalidades)", "Storytelling",
          "Customização de personagem", "Customização de equipamento", "Chat ou sistema de mensagens",
          "Interação social com outros jogadores", "Feedback claro sobre o desempenho",
          "Progressão baseada em habilidade", "Narrativas envolventes", "Sistema de classificação e ranking",
          "Recompensas atraentes"
        ];

        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Elementos de Jogos</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Nesta seção, você pode selecionar os elementos de jogos desejados. Alguns elementos são previamente selecionados com base nas suas escolhas de perfil de jogador. Escolha com cuidado e selecione apenas os elementos que deseja usar em seus jogos.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {allGameElements.map(element => (
                <div key={element} className="flex items-center">
                    <input
                    type="checkbox"
                    id={`element-${element}`}
                    name="gameElements.selectedElements"
                    value={element}
                    checked={activityData.gameElements.selectedElements.includes(element) || recommendedElements.has(element)}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`element-${element}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {element}
                    {recommendedElements.has(element) && <span className="text-xs text-blue-500 ml-1">(Sugerido)</span>}
                    </label>
                </div>
                ))}
            </div>

            <div className="mt-4">
              <label htmlFor="gameElements.otherElement" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Outro elemento de jogo:
              </label>
              <input
                type="text"
                id="gameElements.otherElement"
                name="gameElements.otherElement"
                value={activityData.gameElements.otherElement}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Descreva outro elemento"
              />
            </div>

            {/* Campos de narrativa aparecem se "Narrativas envolventes" for selecionado */}
            {activityData.gameElements.selectedElements.includes("Narrativas envolventes") && (
                <div className="mt-4 p-4 border border-blue-300 rounded-md bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Detalhes da Narrativa/Storytelling:</h4>
                    <div>
                        <label htmlFor="gameElements.narrativeTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Título da Narrativa:
                        </label>
                        <input
                            type="text"
                            id="gameElements.narrativeTitle"
                            name="gameElements.narrativeTitle"
                            value={activityData.gameElements.narrativeTitle}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Ex: A Jornada do Desenvolvedor"
                        />
                    </div>
                    <div className="mt-2">
                        <label htmlFor="gameElements.narrativeContent" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Conteúdo da Narrativa:
                        </label>
                        <textarea
                            id="gameElements.narrativeContent"
                            name="gameElements.narrativeContent"
                            value={activityData.gameElements.narrativeContent}
                            onChange={handleInputChange}
                            rows="5"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Descreva a história e o mundo da gamificação aqui."
                        ></textarea>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Futuramente, poderá haver integração com APIs de LLMs (como o Gemini API) para auxiliar na geração de rascunhos de narrativa.
                    </p>
                </div>
            )}
            
            <button
              onClick={() => openHelpModal(
                "Ajuda - Elementos de Jogos",
                `Descrição detalhada das mecânicas e componentes dos jogos:
                - Competição e Pressão de tempo: Considere adicionar rankings ou tabelas de liderança para que os jogadores possam ver onde se classificam em relação a outros jogadores. Também pode ser útil incluir recompensas para os jogadores que obtiverem pontuações ou tempos excepcionais.
                - Progressão baseada em habilidade, Nível, Pontos e Estatísticas: Certifique-se de que a progressão é gradual e não muito fácil nem muito difícil. Considere permitir que os jogadores personalizem suas estatísticas de acordo com suas preferências e estilo de jogo.
                - Feedback claro sobre o desempenho e Reconhecimento: Inclua feedback imediato após cada ação realizada pelo jogador, bem como reconhecimento por conquistas ou metas alcançadas. Os jogadores devem sentir que estão sendo constantemente recompensados por seu desempenho.
                - Interação social com outros jogadores e Reputação: Crie mecanismos para os jogadores se comunicarem e interagirem entre si, como fóruns ou bate-papo integrado. Considere permitir que os jogadores se formem em equipes, o que pode ajudar a incentivar a cooperação.
                - Comunicação facilitada com outros jogadores e Cooperação: Incentive a comunicação e cooperação entre os jogadores, fornecendo recompensas para tarefas que exigem trabalho em equipe. Considere fornecer ferramentas de colaboração, como compartilhamento de arquivos e calendários.
                - Personalização do personagem ou equipamento, Raridade e Economia: Ofereça opções de personalização que sejam atraentes para os jogadores e permitam que eles se expressem. Considere introduzir elementos de economia de jogo, como compras e vendas de itens, que possam ajudar a incentivar a competição e a colaboração.
                - Narrativas envolventes e Storytelling: Crie histórias envolventes que conectem os jogadores ao mundo do jogo e aos personagens. Considere oferecer opções de escolha ao longo da história, para que os jogadores possam sentir que têm controle sobre a narrativa.
                - Recompensas atraentes e Sensação: Certifique-se de que as recompensas sejam atraentes o suficiente para que os jogadores sintam que vale a pena perseguir. Também é importante que as recompensas sejam distribuídas de maneira justa e equilibrada, para que não haja desigualdades entre os jogadores.
                - Sistema de classificação, ranking e Pressão Social: Considere incluir tabelas de classificação ou rankings para que os jogadores possam ver onde se classificam em relação a outros jogadores. No entanto, tenha cuidado para não criar um ambiente tóxico ou prejudicial à saúde mental dos jogadores.

                Leitura Complementar:
                TODA, Armando M. et al. Analysing gamification elements in educational environments using an existing Gamification taxonomy. Smart Learning Environments, v. 6, n. 1, p. [cite_start]1-14, 2019. [cite: 147] DICHEVA, Darina et al. Gamification in education: A systematic mapping study. Journal of educational technology & society, v. 18, n. 3, p. 75-88, 2015.`
              )}
              className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Ajuda - Elementos de Jogos
            </button>
          </div>
        );
      case 6: // Etapa 6: Recompensas Oferecidas
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recompensas oferecidas</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Nesta seção, você encontrará 15 sugestões de recompensas para usar em sala de aula gamificada. Escolha de acordo com o perfil do jogador. Motive os alunos com certificados, pontos extras, prêmios físicos e experiências especiais.</p>
            {[
              "Pontos de bônus para a participação na aula.",
              "Conquistas digitais para metas alcançadas.",
              "Vantagens para jogos e desafios.",
              "Tempo extra para jogos e atividades divertidas.",
              "Destaque na apresentação de trabalhos.",
              "Acesso a recursos exclusivos (por exemplo, jogos, ferramentas, aplicativos).",
              "Brindes (por exemplo, canetas, adesivos, livros, chocolates).",
              "Certificados digitais.",
              "Oportunidades para liderar a turma em atividades.",
              "Acesso a vídeos, filmes ou jogos extras.",
              "Acesso a sala dos professores.",
              "Participação em eventos ou viagens.",
              "Reconhecimento público (por exemplo, menção em redes sociais ou na frente da turma).",
              "Oportunidades para mentorar colegas.",
              "Prêmios em dinheiro ou descontos.",
            ].map(reward => (
              <div key={reward} className="flex items-center">
                <input
                  type="checkbox"
                  id={`reward-${reward}`}
                  name="rewardsOffered.selectedRewards"
                  value={reward}
                  checked={activityData.rewardsOffered.selectedRewards.includes(reward)}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`reward-${reward}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {reward}
                </label>
              </div>
            ))}
            <div className="mt-2">
              <label htmlFor="rewardsOffered.otherReward" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Outra recompensa específica:
              </label>
              <input
                type="text"
                id="rewardsOffered.otherReward"
                name="rewardsOffered.otherReward"
                value={activityData.rewardsOffered.otherReward}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Descreva outra recompensa"
              />
            </div>
            <button
              onClick={() => openHelpModal(
                "Ajuda - Recompensas Oferecidas",
                `Relações entre os perfis de jogadores e as recompensas sugeridas:
                Jogador competitivo:
                • Pontos de bônus para a participação na aula,
                • Vantagens para jogos e desafios,
                • Acesso a recursos exclusivos,
                • Certificados digitais,
                • Oportunidades para liderar a turma em atividades,
                • Prêmios em dinheiro ou descontos.

                Jogador cooperativo:
                • Conquistas digitais para metas alcançadas,
                • Destaque na apresentação de trabalhos,
                • Acesso a uma "sala VIP" exclusiva para alunos de destaque,
                • Participação em eventos ou viagens,
                • Oportunidades para mentorar colegas.

                Jogador imersivo:
                • Tempo extra para jogos e atividades divertidas,
                • Acesso a recursos exclusivos,
                • Acesso a vídeos,
                • Filmes ou jogos extras,
                • Participação em eventos ou viagens,
                • Reconhecimento público.
                
                Jogador de realização:
                • Pontos de bônus para a participação na aula,
                • Conquistas digitais para metas alcançadas,
                • Destaque na apresentação de trabalhos,
                • Acesso a recursos exclusivos,
                • Certificados digitais,
                • Oportunidades para liderar a turma em atividades.
                
                Jogador social:
                • Acesso a recursos exclusivos,
                • Brindes,
                • Participação em eventos ou viagens,
                • Reconhecimento público,
                • Oportunidades para mentorar colegas.
                
                Aqui estão algumas dicas para alinhar recompensas com objetivos estabelecidos:
                - Defina claramente os objetivos: Antes de estabelecer recompensas, é importante ter objetivos claros e definidos. Isso pode incluir metas de aprendizagem, habilidades sociais, etc.
                - Relacione recompensas aos objetivos: Verifique se as recompensas escolhidas são relevantes e estão relacionadas aos objetivos estabelecidos. Por exemplo, se o objetivo é melhorar a colaboração em equipe, recompensar os alunos por trabalhar juntos em projetos pode ser uma boa ideia.
                - Use recompensas progressivas: Ofereça recompensas progressivas que estimulem o progresso e o sucesso contínuo em relação aos objetivos estabelecidos. Por exemplo, recompensas crescentes para cada nível de aprendizagem alcançado.
                - Personalize as recompensas: Alinhe as recompensas às preferências e interesses individuais dos alunos. Isso pode aumentar a motivação para atingir os objetivos.
                - Monitorar e ajustar: Verifique regularmente se as recompensas estão alinhadas aos objetivos e faça ajustes se necessário. É importante mantê-las relevantes e significativas para os alunos.
                
                Leitura Complementar:
                ALCARÁ, Adriana Rosecler; GUIMARÃES, Sueli Édi Rufini. A Instrumentalidade como uma estratégia motivacional. Psicologia Escolar e Educacional, v. 11, p. [cite_start]177-178, 2007. [cite: 147] HAMARI, Juho; ERANTI, Veikko. Framework for Designing and Evaluating Game Achievements. In: Digra conference. 2011. p. 9966.
                BROPHY, Jere. Research on motivation in education: Past, present, and future. Advances in motivation and achievement: The role of context, v. 11, p. 1-44, 1999.
                PRZYBYLSKI, Andrew K. et al. Having to versus wanting to play: Background and consequences of harmonious versus obsessive engagement in video games. CyberPsychology & behavior, v. 12, n. 5, p. 485-492, 2009.`
              )}
              className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Ajuda - Recompensas Oferecidas
            </button>
          </div>
        );
      case 7: // Etapa 7: Ações Recompensadas
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ações Recompensadas</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Lista de 15 sugestões de ações para ganhar recompensas. Escolha as que mais se adequam a você. As recompensas são limitadas e serão concedidas com base no desempenho e no progresso em relação às metas estabelecidas.</p>
            {[
              "Participação ativa nas discussões em sala de aula",
              "Conclusão de tarefas antes do prazo estipulado",
              "Atingir uma pontuação elevada em um jogo educacional",
              "Colaboração com outros alunos em projetos de grupo",
              "Contribuição criativa em atividades de escrita ou arte",
              "Demonstrar pensamento crítico em tarefas desafiadoras",
              "Responder corretamente a perguntas de revisão de material",
              "Auxiliar um colega com dificuldades em uma tarefa",
              "Apresentar um trabalho com excelência",
              "Atender prontamente as solicitações do professor",
              "Realizar atividades extras em casa para aprofundar o aprendizado",
              "Ser responsável pelo cuidado e organização do material escolar",
              "Demonstração de habilidades de liderança em atividades em grupo",
            ].map(action => (
              <div key={action} className="flex items-center">
                <input
                  type="checkbox"
                  id={`action-${action}`}
                  name="rewardedActions.selectedActions"
                  value={action}
                  checked={activityData.rewardedActions.selectedActions.includes(action)}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`action-${action}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {action}
                </label>
              </div>
            ))}
            <div className="mt-2">
              <label htmlFor="rewardedActions.otherAction" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Outra:
              </label>
              <input
                type="text"
                id="rewardedActions.otherAction"
                name="rewardedActions.otherAction"
                value={activityData.rewardedActions.otherAction}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Descreva outra ação"
              />
            </div>
            <button
              onClick={() => openHelpModal(
                "Ajuda - Ações Recompensadas",
                `Aqui estão algumas dicas para estabelecer ações claras e significativas que serão recompensadas na sala de aula gamificada:\n\n- Identificar comportamentos desejáveis: Identifique comportamentos que você deseja incentivar, como participação ativa, colaboração, trabalho em equipe, responsabilidade, etc.\n- Especificar as ações: Especifique claramente as ações que resultarão na recompensa. Por exemplo, responder corretamente a uma pergunta, completar uma atividade em grupo, etc.\n- Ajuste as ações às habilidades dos alunos: Assegure-se de que as ações recompensadas estejam alinhadas ao nível de habilidade dos alunos. Não é justo recompensar comportamentos que eles ainda não tenham condições de realizar.\n- Fazer a recompensa significativa: Verifique se a recompensa é algo que os alunos realmente desejam ou valorizam. Isso aumentará a motivação para atingir as ações recompensadas.\n- Dê feedback imediato: Forneça feedback imediato após a realização de uma ação recompensada. Isso ajudará a manter a motivação e a direção dos alunos.\n- Mantenha a variedade: Mantenha a recompensa interessante e variada para evitar o cansaço ou a perda de motivação.\n- Envolva os alunos na definição das ações recompensadas: Peça aos alunos para participarem da definição das ações recompensadas. Isso aumentará a autoresponsabilidade e o envolvimento na Gamificação.\n\nLeitura Complementar:\nHAMARI, Juho; KOIVISTO, Jonna; SARSA, Harri. Does gamification work?--a literature review of empirical studies on gamification. In: 2014 47th Hawaii international conference on system sciences. Ieee, 2014. p. [cite_start]3025-3034. [cite: 147] DICHEVA, Darina et al. Gamification in education: A systematic mapping study. Journal of educational technology & society, v. 18, n. 3, p. [cite_start]75-88, 2015. [cite: 147] DETERDING, Sebastian et al. Gamification. using game-design elements in non-gaming contexts. In: CHI'11 extended abstracts on human factors in computing systems. 2011. p. 2425-2428.\n\nBERKMAN, Elliot T. The neuroscience of goals and behavior change. Consulting Psychology Journal: Practice and Research, v. 70, n. 1, p. 28, 2018.`
              )}
              className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Ajuda - Ações Recompensadas
            </button>
          </div>
        );
      case 8: // Etapa 8: Regras da Gamificação (e Opções de Compartilhamento)
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Regras da Gamificação</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Nesta seção, encontrará sugestões de regras gerais para uma sala de aula gamificada. Elas promovem um ambiente de aprendizado engajador e divertido. Adapte e personalize as sugestões de acordo com as necessidades da sua turma.</p>
            {[
              "Respeite as regras do jogo e as decisões do professor em todas as atividades.",
              "Seja respeitoso e colaborativo com outros jogadores em todas as atividades.",
              "Entenda as regras do jogo e como elas se aplicam a cada atividade.",
              "Busque sempre aprender e se esforçar para alcançar seus objetivos em cada atividade.",
              "Comunique-se com outros jogadores de forma clara e objetiva em todas as atividades.",
              "Proteja a privacidade e a segurança de todos os jogadores em todas as atividades.",
              "Use dispositivos eletrônicos apenas para fins educacionais relacionados ao jogo.",
              "Respeite as regras e políticas da instituição em todas as atividades.",
              "Mantenha-se atualizado com as atualizações nas regras do jogo em todas as atividades.",
              "Busque sempre a supervisão do professor em todas as atividades.",
            ].map(rule => (
              <div key={rule} className="flex items-center">
                <input
                  type="checkbox"
                  id={`rule-${rule}`}
                  name="gamificationRules.generalRules"
                  value={rule}
                  checked={activityData.gamificationRules.generalRules.includes(rule)}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`rule-${rule}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {rule}
                </label>
              </div>
            ))}
            <div className="mt-2">
              <label htmlFor="gamificationRules.specificRules" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Regras específicas da atividade planejada:
              </label>
              <textarea
                id="gamificationRules.specificRules"
                name="gamificationRules.specificRules"
                value={activityData.gamificationRules.specificRules}
                onChange={handleInputChange}
                rows="3"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Descreva as regras específicas aqui"
              ></textarea>
            </div>
            {/* Opção de Compartilhamento (RF011.1) */}
            <div className="mt-4 flex items-center">
                <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={activityData.isPublic}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Compartilhar esta atividade com outros professores (tornar pública)?
                </label>
            </div>
            <button
              onClick={() => openHelpModal(
                "Ajuda - Regras da Gamificação",
                `Aqui estao algumas dicas para alinhar regras com objetivos e ações recompensadas no contexto de uma sala de aula gamificada:\n\n- Estabelecer regras claras: Estabeleça regras claras que sustentem os objetivos e as ações recompensadas.\n- Verificar consistência: Verifique se as regras sao consistentes com os objetivos e ações recompensadas.\n- Comunicar claramente: Comunique as regras claramente aos alunos, de forma clara e objetiva.\n- Envolver os alunos na definicao das regras: Peça aos alunos para participarem da definicao das regras para incentivar o envolvimento e a responsabilidade.\n- Mantenha-se flexível: Mantenha-se flexível em relacao às regras e esteja pronto para fazer ajustes se necessário.\n- Monitorar a eficácia das regras: Monitorar a eficácia das regras para avaliar se elas estao realmente alinhadas com os objetivos e ações recompensadas.\n- Ofereça ajuda e suporte: Ofereça ajuda e suporte aos alunos que precisam de apoio para alcançar os critérios estabelecidos.\n\nLeitura Complementar:\nZICHERMANN, Gabe; CUNNINGHAM, Christopher. Gamification by design: Implementing game mechanics in web and mobile apps. " O'Reilly Media, Inc.", 2011.\nTEKINBAS, Katie Salen; ZIMMERMAN, Eric. Rules of play: Game design fundamentals. MIT press, 2003.\nKAPP, Karl M. The gamification of learning and instruction: game-based methods and strategies for training and education. John Wiley & Sons, 2012.`
              )}
              className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Ajuda - Regras da Gamificação
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 dark:text-white">
        Criar Nova Atividade Gamificada
      </h2>

      {/* Barra de Progresso */}
      <div className="w-full max-w-4xl bg-gray-200 rounded-full h-4 dark:bg-gray-700 mb-8">
        <div
          className="bg-blue-600 h-4 rounded-full"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>

      <div className="w-full max-w-4xl bg-gray-50 p-6 rounded-lg shadow-inner dark:bg-gray-700">
        {renderStep()}

        {/* Botões de Navegação */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out dark:bg-gray-700 dark:hover:bg-gray-800"
            >
              Anterior
            </button>
          )}
          <button
            onClick={handleNext}
            className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              currentStep === totalSteps ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out dark:bg-blue-700 dark:hover:bg-blue-800`}
          >
            {currentStep === totalSteps ? 'Concluir e Salvar' : 'Próximo'}
          </button>
        </div>
      </div>

      {/* Modal de Ajuda */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-xl w-full mx-4 dark:bg-gray-800 dark:text-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{helpContent.title}</h3>
            <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-300">{helpContent.text}</p>
            <div className="mt-6 text-right">
              <button
                onClick={closeHelpModal}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityCreationPage;