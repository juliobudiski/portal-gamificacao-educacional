// frontend/src/components/activity/creation_steps/Step1_Activity.jsx
import React, { useState, useEffect } from 'react';
import {
  FaCode, FaTools, FaUsers, FaFrown, FaTasks, FaHeadSideVirus,
  FaRocket, FaComments, FaBalanceScale, FaHeartbeat, FaCogs,
  FaBriefcase, FaCalendarTimes, FaGlobeAmericas, FaBookReader, FaHistory, FaPenFancy,
  FaTheaterMasks, FaChartLine, FaCalculator, FaBullhorn, FaLightbulb, FaPalette,
  FaStethoscope, FaBrain

} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";

// Dados baseados na Tabela de Áreas do Conhecimento do CNPq
const CNPQ_AREAS = {
  "Ciências Exatas e da Terra": ["Ciência da Computação", "Matemática", "Física", "Química", "Astronomia", "Estatística"],
  "Engenharias": ["Engenharia de Software", "Engenharia Civil", "Engenharia Elétrica", "Engenharia Mecânica", "Engenharia de Produção"],
  "Ciências Humanas": ["Educação", "História", "Filosofia", "Sociologia", "Psicologia", "Antropologia"],
  "Ciências Sociais Aplicadas": ["Administração", "Direito", "Design", "Comunicação", "Economia", "Arquitetura"],
  "Linguística, Letras e Artes": ["Artes", "Letras", "Linguística", "Música", "Cinema"],
  "Ciências da Saúde": ["Medicina", "Enfermagem", "Odontologia", "Educação Física", "Fisioterapia"],
  "Outros": ["Multidisciplinar", "Geral"]
};

// Problemas Dinâmicos por Grande Área
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
  "Sociais": [ // Sociais Aplicadas
    { text: "Dificuldade em entender legislações complexas.", icon: <FaBalanceScale /> },
    { text: "Falta de visão sistêmica de mercado.", icon: <FaChartLine /> },
    { text: "Dificuldade com análise de dados e estatísticas.", icon: <FaCalculator /> },
    { text: "Timidez em apresentações e oratória.", icon: <FaBullhorn /> },
    { text: "Bloqueio criativo em projetos de solução.", icon: <FaLightbulb /> }
  ],
  "Artes": [ // Linguística, Letras e Artes
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
  const [selectedGreatArea, setSelectedGreatArea] = useState("");
  const [displayedProblems, setDisplayedProblems] = useState(PROBLEM_SETS["Geral"]);

  // Sincroniza Grande Área ao carregar (Edição)
  useEffect(() => {
    if (activityData.areaKnowledge && !selectedGreatArea) {
      const foundGreatArea = Object.keys(CNPQ_AREAS).find(key =>
        CNPQ_AREAS[key].includes(activityData.areaKnowledge)
      );
      if (foundGreatArea) setSelectedGreatArea(foundGreatArea);
    }
  }, [activityData.areaKnowledge]);

  // Atualiza a lista de problemas quando a Grande Área muda
  useEffect(() => {
    if (!selectedGreatArea) {
      setDisplayedProblems(PROBLEM_SETS["Geral"]);
      return;
    }

    let specificSet = [];

    // Mapeia a String da Grande Área para a lista de problemas correta
    switch (selectedGreatArea) {
      case "Ciências Exatas e da Terra":
      case "Engenharias":
        specificSet = PROBLEM_SETS["Exatas"];
        break;

      case "Ciências Humanas":
        specificSet = PROBLEM_SETS["Humanas"];
        break;

      case "Ciências da Saúde":
        specificSet = PROBLEM_SETS["Saude"];
        break;

      case "Ciências Sociais Aplicadas":
        specificSet = PROBLEM_SETS["Sociais"];
        break;

      case "Linguística, Letras e Artes":
        specificSet = PROBLEM_SETS["Artes"];
        break;

      default:
        // Caso seja "Outros" ou não mapeado
        specificSet = [];
    }

    // Lógica de Combinação:
    // Se encontrou um set específico, mistura com os 3 primeiros problemas "Gerais" (ex: Gestão de tempo)
    // Isso garante variedade e consistência.
    if (specificSet && specificSet.length > 0) {
      setDisplayedProblems([...specificSet, ...PROBLEM_SETS["Geral"].slice(0, 3)]);
    } else {
      setDisplayedProblems(PROBLEM_SETS["Geral"]);
    }
  }, [selectedGreatArea]);

  const handleGreatAreaChange = (e) => {
    setSelectedGreatArea(e.target.value);
    setActivityData(prev => ({ ...prev, areaKnowledge: "" }));
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
      {/* CABEÇALHO */}
      <div>
        <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text">
          Definindo o Cenário
        </h2>
        <p className="mt-2 text-secondary-text">
          Comece definindo a área de conhecimento. Isso ajustará as sugestões do sistema.
        </p>
      </div>

      {/* FORMULÁRIO BÁSICO */}
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

        {/* GRANDE ÁREA */}
        <div>
          {/* Adicionei o * para indicar obrigatoriedade visualmente */}
          <label className="block text-sm font-medium text-secondary-text mb-1">Grande Área (CNPq) *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaGlobeAmericas />
            </div>
            <select
              required // <--- Adicionei aqui (ajuda o navegador a entender que é obrigatório)
              value={selectedGreatArea}
              onChange={handleGreatAreaChange}
              className={`pl-10 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border rounded-md focus:ring-teal-500 sm:text-sm 
                ${!selectedGreatArea ? 'border-red-300 dark:border-red-900' : 'border-border-color dark:border-gray-600'} 
              `} // <--- Truque: Borda vermelha se estiver vazio
            >
              <option value="">Selecione...</option>
              {Object.keys(CNPQ_AREAS).map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ÁREA ESPECÍFICA */}
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">Área Específica *</label>
          <select
            required // <--- Adicionei aqui
            name="areaKnowledge"
            value={activityData.areaKnowledge || ""}
            onChange={handleInputChange}
            disabled={!selectedGreatArea}
            className={`block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border rounded-md focus:ring-teal-500 sm:text-sm disabled:opacity-50
               ${!activityData.areaKnowledge ? 'border-red-300 dark:border-red-900' : 'border-border-color dark:border-gray-600'}
            `} // <--- Truque: Borda vermelha se estiver vazio
          >
            <option value="">{selectedGreatArea ? "Selecione..." : "Aguardando Grande Área"}</option>
            {selectedGreatArea && CNPQ_AREAS[selectedGreatArea].map(subArea => (
              <option key={subArea} value={subArea}>{subArea}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SELEÇÃO DE PROBLEMAS DINÂMICA */}
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
        onClick={() => openHelp('analise_preliminar')} // Chama pelo ID
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Ajuda
      </button>
    </div>
  );
}

export default Step1_InitialDetails;