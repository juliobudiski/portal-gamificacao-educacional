// frontend/src/components/activity/creation_steps/Step1_Activity.jsx
import React, { useState, useEffect } from 'react';
import {
  FaCode, FaTools, FaUsers, FaFrown, FaTasks, FaHeadSideVirus, FaProjectDiagram, FaBug,
  FaRocket, FaComments, FaBalanceScale, FaHeartbeat, FaCogs,
  FaBriefcase, FaCalendarTimes, FaGlobeAmericas, FaBookReader, FaHistory, FaPenFancy,
  FaTheaterMasks, FaChartLine, FaCalculator, FaBullhorn, FaLightbulb, FaPalette,
  FaStethoscope, FaBrain
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";

const CNPQ_AREAS = {
  "Ciências Exatas e da Terra": ["Ciência da Computação", "Matemática", "Física", "Química", "Astronomia", "Estatística"],
  "Engenharias": ["Engenharia de Software", "Engenharia Civil", "Engenharia Elétrica", "Engenharia Mecânica", "Engenharia de Produção"],
  "Ciências Humanas": ["Educação", "História", "Filosofia", "Sociologia", "Psicologia", "Antropologia"],
  "Ciências Sociais Aplicadas": ["Administração", "Direito", "Design", "Comunicação", "Economia", "Arquitetura"],
  "Linguística, Letras e Artes": ["Artes", "Letras", "Linguística", "Música", "Cinema"],
  "Ciências da Saúde": ["Medicina", "Enfermagem", "Odontologia", "Educação Física", "Fisioterapia"],
  "Outros": ["Multidisciplinar", "Geral"]
};

// MAPEAMENTO TEÓRICO
const SUBDOMAINS_COMPUTING = [
  "Fundamentos e Programação Introdutória",
  "Engenharia de Software e Projetos",
  "Testes e Qualidade de Software"
];

const SUBDOMAIN_PROBLEMS = {
  "Fundamentos e Programação Introdutória": [
    { text: "Barreira de abstração: foco na sintaxe em vez da lógica algorítmica.", icon: <FaCode /> },
    { text: "Medo de errar e frustração com depuração (debugging).", icon: <FaTools /> }
  ],
  "Engenharia de Software e Projetos": [
    { text: "Dificuldade de colaboração e adoção de papéis (ex: Scrum).", icon: <FaUsers /> },
    { text: "Dificuldade em visualizar consequências a longo prazo (débito técnico).", icon: <FaProjectDiagram /> }
  ],
  "Testes e Qualidade de Software": [
    { text: "Percepção de testes como atividade tediosa e secundária.", icon: <FaBug /> },
    { text: "Baixo engajamento para atingir alta cobertura de código.", icon: <FaChartLine /> }
  ]
};

const PROBLEM_SETS = {
  "Exatas": [
    { text: "Dificuldade com abstração lógica e matemática.", icon: <FaBrain /> },
    { text: "Dificuldade em aplicar teoria na prática.", icon: <FaTools /> },
    { text: "Frustração com erros técnicos ou bugs constantes.", icon: <FaFrown /> },
    { text: "Falta de motivação em disciplinas muito teóricas.", icon: <FaBookReader /> },
    { text: "Dificuldade em trabalhar em equipe (soft skills).", icon: <FaUsers /> }
  ],
  "Humanas": [
    { text: "Dificuldade com grande volume de leitura.", icon: <FaBookReader /> },
    { text: "Falta de engajamento em debates em sala.", icon: <FaComments /> },
    { text: "Dificuldade em conectar fatos históricos com o presente.", icon: <FaHistory /> },
    { text: "Bloqueio na escrita ou produção textual.", icon: <FaPenFancy /> },
    { text: "Timidez para expor ideias em público.", icon: <FaHeadSideVirus /> }
  ],
  "Saude": [
    { text: "Dificuldade em memorizar anatomia e termos técnicos.", icon: <FaBrain /> },
    { text: "Ansiedade e insegurança em procedimentos práticos.", icon: <FaHeartbeat /> },
    { text: "Dificuldade em relacionar teoria com a clínica.", icon: <FaStethoscope /> },
    { text: "Falta de tato/empatia no atendimento simulado.", icon: <FaUsers /> },
    { text: "Sobrecarga com o volume de conteúdo.", icon: <FaBookReader /> }
  ],
  "Sociais": [
    { text: "Dificuldade em entender legislações complexas.", icon: <FaBalanceScale /> },
    { text: "Falta de visão sistêmica de mercado.", icon: <FaChartLine /> },
    { text: "Dificuldade com análise de dados e estatísticas.", icon: <FaCalculator /> },
    { text: "Timidez em apresentações e oratória.", icon: <FaBullhorn /> },
    { text: "Bloqueio criativo em projetos de solução.", icon: <FaLightbulb /> }
  ],
  "Artes": [
    { text: "Bloqueio criativo (síndrome da página em branco).", icon: <FaPalette /> },
    { text: "Dificuldade com o domínio técnico de ferramentas.", icon: <FaTools /> },
    { text: "Insegurança ao expor trabalhos a críticas.", icon: <FaFrown /> },
    { text: "Dificuldade em fundamentar escolhas artísticas.", icon: <FaPenFancy /> },
    { text: "Falta de repertório ou referências.", icon: <FaTheaterMasks /> }
  ],
  "Geral": [
    { text: "Falta de motivação e interesse no assunto.", icon: <FaFrown /> },
    { text: "Dificuldade em gerenciar o tempo.", icon: <FaTasks /> },
    { text: "Ansiedade e estresse com prazos.", icon: <FaHeartbeat /> },
    { text: "Dificuldade de concentração durante a aula.", icon: <FaHeadSideVirus /> },
    { text: "Falta de percepção da aplicabilidade no mercado.", icon: <FaBriefcase /> }
  ]
};

function Step1_InitialDetails({ activityData, handleInputChange, setActivityData }) {
  const { openHelp } = useHelpModal();
  const [selectedGreatArea, setSelectedGreatArea] = useState(activityData.greatArea || "");
  const [displayedProblems, setDisplayedProblems] = useState(PROBLEM_SETS["Geral"]);
  const isComputingArea = activityData.areaKnowledge === "Ciência da Computação" || activityData.areaKnowledge === "Engenharia de Software";
  // Sincroniza Grande Área ao carregar (Edição)
  useEffect(() => {
    if (activityData.areaKnowledge && !selectedGreatArea) {
      const foundGreatArea = Object.keys(CNPQ_AREAS).find(key =>
        CNPQ_AREAS[key].includes(activityData.areaKnowledge)
      );
      if (foundGreatArea) {
        setSelectedGreatArea(foundGreatArea);
        setActivityData(prev => ({ ...prev, greatArea: foundGreatArea }));
      }
    }
  }, [activityData.areaKnowledge, selectedGreatArea, setActivityData]);

  // Atualiza a lista de problemas (Divulgação Progressiva)
  useEffect(() => {
    let specificSet = [];

    // Prioridade 1: Subdomínio de Computação selecionado
    if (isComputingArea && activityData.subdomain && SUBDOMAIN_PROBLEMS[activityData.subdomain]) {
      specificSet = SUBDOMAIN_PROBLEMS[activityData.subdomain];
    }
    // Prioridade 2: Grande Área selecionada
    else if (selectedGreatArea) {
      switch (selectedGreatArea) {
        case "Ciências Exatas e da Terra":
        case "Engenharias": specificSet = PROBLEM_SETS["Exatas"]; break;
        case "Ciências Humanas": specificSet = PROBLEM_SETS["Humanas"]; break;
        case "Ciências da Saúde": specificSet = PROBLEM_SETS["Saude"]; break;
        case "Ciências Sociais Aplicadas": specificSet = PROBLEM_SETS["Sociais"]; break;
        case "Linguística, Letras e Artes": specificSet = PROBLEM_SETS["Artes"]; break;
        default: specificSet = [];
      }
    }

    if (specificSet.length > 0) {
      // Mistura com os genéricos para manter variedade
      setDisplayedProblems([...specificSet, ...PROBLEM_SETS["Geral"].slice(0, 3)]);
    } else {
      setDisplayedProblems(PROBLEM_SETS["Geral"]);
    }
  }, [selectedGreatArea, activityData.subdomain, activityData.areaKnowledge, isComputingArea]);

  const handleGreatAreaChange = (e) => {
    const newGreatArea = e.target.value;
    setSelectedGreatArea(newGreatArea);
    setActivityData(prev => ({
      ...prev,
      greatArea: newGreatArea,
      areaKnowledge: "",
      subdomain: "" // Limpa o subdomínio se trocar a área
    }));
  };

  const handleAreaKnowledgeChange = (e) => {
    handleInputChange(e);
    // Limpa o subdomínio se selecionar uma área que não seja computação/engenharia
    const val = e.target.value;
    if (val !== "Ciência da Computação" && val !== "Engenharia de Software") {
      setActivityData(prev => ({ ...prev, subdomain: "" }));
    }
  };

  const handleProblemSelection = (problemText) => {
    const currentProblems = activityData.currentScenario.problems;
    const newProblems = currentProblems.includes(problemText)
      ? currentProblems.filter(p => p !== problemText)
      : [...currentProblems, problemText];

    setActivityData(prevData => ({
      ...prevData,
      currentScenario: { ...prevData.currentScenario, problems: newProblems },
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text">
          Definindo o Cenário
        </h2>
        <p className="mt-2 text-secondary-text">
          Comece definindo a área de conhecimento. Isso ajustará as sugestões do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-secondary-text">Título da Atividade *</label>
          <input
            type="text"
            name="title"
            value={activityData.title}
            onChange={handleInputChange}
            className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:ring-teal-500 sm:text-sm"
            placeholder="Ex: A Jornada do Herói em Java"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">Grande Área (CNPq) *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaGlobeAmericas />
            </div>
            <select
              required
              value={selectedGreatArea}
              onChange={handleGreatAreaChange}
              className={`pl-10 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border rounded-md focus:ring-teal-500 sm:text-sm 
                ${!selectedGreatArea ? 'border-red-300 dark:border-red-900' : 'border-border-color dark:border-gray-600'} 
              `}
            >
              <option value="">Selecione...</option>
              {Object.keys(CNPQ_AREAS).map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">Área Específica *</label>
          <select
            required
            name="areaKnowledge"
            value={activityData.areaKnowledge || ""}
            onChange={handleInputChange}
            disabled={!selectedGreatArea}
            className={`block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border rounded-md focus:ring-teal-500 sm:text-sm disabled:opacity-50
               ${!activityData.areaKnowledge ? 'border-red-300 dark:border-red-900' : 'border-border-color dark:border-gray-600'}
            `}
          >
            <option value="">{selectedGreatArea ? "Selecione..." : "Aguardando Grande Área"}</option>
            {selectedGreatArea && CNPQ_AREAS[selectedGreatArea].map(subArea => (
              <option key={subArea} value={subArea}>{subArea}</option>
            ))}
          </select>
        </div>
        {/* --- NOVO DROPDOWN CONDICIONAL (SUBDOMÍNIO) --- */}
        {isComputingArea && (
          <div className="md:col-span-2 animate-fade-in">
            <label className="block text-sm font-medium text-teal-600 dark:text-teal-400 mb-1">Subdomínio da Computação (Opcional para focar a estratégia)</label>
            <select
              name="subdomain"
              value={activityData.subdomain || ""}
              onChange={handleInputChange}
              className="block w-full px-4 py-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700 rounded-md focus:ring-teal-500 sm:text-sm"
            >
              <option value="">Geral / Não focar em um subdomínio específico</option>
              {SUBDOMAINS_COMPUTING.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="pt-4 border-t dark:border-gray-700">
        <h3 className="text-lg font-semibold text-primary-text">
          Quais desafios seus alunos enfrentam em <span className="text-teal-600">{selectedGreatArea || "Geral"}</span>?
        </h3>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedProblems.map((problem) => {
            const isSelected = activityData.currentScenario.problems.includes(problem.text);
            return (
              <div
                key={problem.text}
                onClick={() => handleProblemSelection(problem.text)}
                className={`
                  group relative flex cursor-pointer flex-col items-center justify-start space-y-3 rounded-xl border p-4 text-center transition-all duration-200
                  ${isSelected
                    ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/40'
                    : 'border-border-color bg-secondary-bg hover:border-teal-400 hover:shadow-lg dark:bg-primary-bg'
                  }
                `}
              >
                <div className={`text-3xl ${isSelected ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-500'}`}>
                  {problem.icon}
                </div>
                <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-secondary-text'}`}>
                  {problem.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => openHelp('analise_preliminar')}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Ajuda
      </button>
    </div>
  );
}

export default Step1_InitialDetails;