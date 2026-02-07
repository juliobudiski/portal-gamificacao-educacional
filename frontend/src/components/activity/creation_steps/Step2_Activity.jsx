// frontend/src/components/activity/creation_steps/Step2_Activity.jsx
import React, { useState, useEffect } from 'react';
import {
  FaGamepad, FaBullseye, FaBrain, FaLightbulb, FaGraduationCap,
  FaStar, FaUsers, FaProjectDiagram, FaCalculator, FaMicroscope,
  FaComments, FaBookReader, FaLandmark, FaHandsHelping, FaRocket, FaTools,
  FaHeartbeat, FaStethoscope, FaDna, // Saúde
  FaBalanceScale, FaBriefcase, FaChartLine, // Sociais Aplicadas
  FaPalette, FaTheaterMasks, FaPenNib // Artes e Linguística
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";

// Definição local para garantir funcionamento imediato
// (Futuramente, você pode mover isso para um arquivo 'utils/constants.js' para não repetir código)
const CNPQ_AREAS = {
  "Ciências Exatas e da Terra": ["Ciência da Computação", "Matemática", "Física", "Química", "Astronomia", "Estatística"],
  "Engenharias": ["Engenharia de Software", "Engenharia Civil", "Engenharia Elétrica", "Engenharia Mecânica", "Engenharia de Produção"],
  "Ciências Humanas": ["Educação", "História", "Filosofia", "Sociologia", "Psicologia", "Antropologia"],
  "Ciências Sociais Aplicadas": ["Administração", "Direito", "Design", "Comunicação", "Economia", "Arquitetura"],
  "Linguística, Letras e Artes": ["Artes", "Letras", "Linguística", "Música", "Cinema"],
  "Ciências da Saúde": ["Medicina", "Enfermagem", "Odontologia", "Educação Física", "Fisioterapia"],
  "Outros": ["Multidisciplinar", "Geral"]
};

// Objetivos Pedagógicos Específicos por Grande Área
const OBJECTIVE_SETS = {
  "Exatas": [
    { text: "Melhorar o raciocínio lógico e algorítmico", icon: <FaCalculator /> },
    { text: "Conectar teoria abstrata com aplicação prática", icon: <FaProjectDiagram /> },
    { text: "Reduzir a frustração com erros técnicos", icon: <FaTools /> },
    { text: "Desenvolver persistência na resolução de problemas", icon: <FaBrain /> },
    { text: "Estimular a experimentação e testes", icon: <FaMicroscope /> }
  ],
  "Humanas": [
    { text: "Estimular o pensamento crítico e argumentação", icon: <FaComments /> },
    { text: "Fomentar debates e troca de perspectivas", icon: <FaUsers /> },
    { text: "Aumentar interesse por leitura e textos teóricos", icon: <FaBookReader /> },
    { text: "Conectar contexto histórico/social com a atualidade", icon: <FaLandmark /> },
    { text: "Desenvolver empatia e visão social", icon: <FaHandsHelping /> }
  ],
  "Saude": [
    { text: "Memorização de anatomia, processos e protocolos", icon: <FaBrain /> },
    { text: "Treinar tomada de decisão clínica sob pressão", icon: <FaHeartbeat /> },
    { text: "Humanização do atendimento ao paciente", icon: <FaHandsHelping /> },
    { text: "Precisão técnica em procedimentos práticos", icon: <FaStethoscope /> },
    { text: "Compreensão de sistemas biológicos complexos", icon: <FaDna /> }
  ],
  "Sociais": [ // Sociais Aplicadas (Direito, Admin, Economia)
    { text: "Resolução de conflitos e negociação", icon: <FaBalanceScale /> },
    { text: "Visão estratégica de mercado e negócios", icon: <FaBriefcase /> },
    { text: "Análise de cenários e tomada de decisão", icon: <FaChartLine /> },
    { text: "Desenvolver liderança e gestão de equipes", icon: <FaUsers /> },
    { text: "Ética profissional e responsabilidade", icon: <FaLandmark /> }
  ],
  "Artes": [ // Linguística, Letras e Artes
    { text: "Estimular a expressão criativa e originalidade", icon: <FaPalette /> },
    { text: "Interpretação de texto e fluência verbal", icon: <FaPenNib /> },
    { text: "Desenvolvimento de portfólio e projetos visuais", icon: <FaProjectDiagram /> },
    { text: "Sensibilidade estética e artística", icon: <FaTheaterMasks /> },
    { text: "Capacidade de dar e receber feedbacks (crítica)", icon: <FaComments /> }
  ],
  "Geral": [
    { text: "Aumentar a motivação e o engajamento", icon: <FaBullseye /> },
    { text: "Melhorar a colaboração e trabalho em equipe", icon: <FaUsers /> },
    { text: "Promover autonomia no aprendizado", icon: <FaRocket /> },
    { text: "Fixação de conteúdo de forma lúdica", icon: <FaGamepad /> },
    { text: "Desenvolver criatividade e inovação", icon: <FaLightbulb /> }
  ]
};

function Step2_DesiredScenario({ activityData, handleInputChange, setActivityData }) {
  const { openHelp } = useHelpModal();
  const [displayedObjectives, setDisplayedObjectives] = useState(OBJECTIVE_SETS["Geral"]);
  const [detectedAreaName, setDetectedAreaName] = useState("");

  // --- AUTOMAGIA: Detecta a área vinda do Step 1 ---
  useEffect(() => {
    // 1. Pega a sub-área salva no Step 1 (ex: "Cinema")
    const currentSubArea = activityData.areaKnowledge;

    if (!currentSubArea) {
      setDisplayedObjectives(OBJECTIVE_SETS["Geral"]);
      return;
    }

    // 2. Procura qual é a Grande Área correspondente
    let foundGreatAreaKey = "Outros";
    // Itera sobre o objeto CNPQ_AREAS atualizado para encontrar a chave correta
    for (const [key, values] of Object.entries(CNPQ_AREAS)) {
      if (values.includes(currentSubArea)) {
        foundGreatAreaKey = key;
        break;
      }
    }

    setDetectedAreaName(foundGreatAreaKey);

    // 3. Seleciona o conjunto de cards adequado usando SWITCH para clareza
    let specificObjectives = [];

    switch (foundGreatAreaKey) {
      case "Ciências Exatas e da Terra":
      case "Engenharias":
        specificObjectives = OBJECTIVE_SETS["Exatas"];
        break;

      case "Ciências Humanas":
        specificObjectives = OBJECTIVE_SETS["Humanas"];
        break;

      case "Ciências da Saúde":
        specificObjectives = OBJECTIVE_SETS["Saude"];
        break;

      case "Ciências Sociais Aplicadas":
        specificObjectives = OBJECTIVE_SETS["Sociais"];
        break;

      case "Linguística, Letras e Artes":
        specificObjectives = OBJECTIVE_SETS["Artes"];
        break;

      default:
        specificObjectives = []; // Caso Outros/Geral
    }

    // 4. Combina Específicos + Gerais (mantendo "Colaboração" sempre acessível)
    if (specificObjectives.length > 0) {
      setDisplayedObjectives([...specificObjectives, ...OBJECTIVE_SETS["Geral"].slice(0, 3)]);
    } else {
      setDisplayedObjectives(OBJECTIVE_SETS["Geral"]);
    }

  }, [activityData.areaKnowledge]);


  // Manipulador de Seleção (Toggle)
  const handleObjectiveSelection = (objectiveText) => {
    const currentObjectives = activityData.desiredScenario.objectives;
    const newObjectives = currentObjectives.includes(objectiveText)
      ? currentObjectives.filter(o => o !== objectiveText)
      : [...currentObjectives, objectiveText];

    setActivityData(prevData => ({
      ...prevData,
      desiredScenario: { ...prevData.desiredScenario, objectives: newObjectives },
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* HEADER INTELIGENTE: Mostra que o sistema sabe a área */}
      <div>
        <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text">
          Cenário Desejado
        </h2>
        <p className="mt-2 text-secondary-text dark:text-secondary-text">
          {detectedAreaName && detectedAreaName !== "Outros"
            ? <span>Considerando o foco em <span className="text-teal-600 font-semibold">{detectedAreaName}</span>, quais são suas metas?</span>
            : "Selecione os principais objetivos que você deseja alcançar com esta atividade."
          }
        </p>
      </div>

      {/* GRID DE CARDS DINÂMICO */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayedObjectives.map((objective) => {
          const isSelected = activityData.desiredScenario.objectives.includes(objective.text);
          return (
            <div
              key={objective.text}
              onClick={() => handleObjectiveSelection(objective.text)}
              className={`
                group relative flex h-full cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-5 text-center transition-all duration-200
                ${isSelected
                  ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40 ring-2 ring-teal-500/20'
                  : 'border-border-color bg-secondary-bg hover:border-teal-400 hover:shadow-lg dark:border-border-color dark:bg-primary-bg dark:hover:border-teal-500'
                }
              `}
            >
              <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-secondary-text group-hover:text-teal-500 dark:text-secondary-text dark:group-hover:text-teal-400'}`}>
                {objective.icon}
              </div>
              <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-secondary-text dark:text-secondary-text'}`}>
                {objective.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* INPUT PARA OBJETIVO PERSONALIZADO */}
      <div className="pt-4 border-t dark:border-gray-700">
        <label htmlFor="desiredScenario.otherObjective" className="block text-sm font-medium text-secondary-text dark:text-secondary-text">
          Outro objetivo em mente? (Opcional)
        </label>
        <input
          type="text"
          id="desiredScenario.otherObjective"
          name="desiredScenario.otherObjective"
          value={activityData.desiredScenario.otherObjective || ''}
          onChange={handleInputChange}
          className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          placeholder="Ex: Preparar alunos para a Olimpíada de Conhecimento..."
        />
      </div>

      <button
        onClick={() => openHelp('cenario_desejado')} // Chama pelo ID
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Ajuda
      </button>
    </div>
  );
}

export default Step2_DesiredScenario;