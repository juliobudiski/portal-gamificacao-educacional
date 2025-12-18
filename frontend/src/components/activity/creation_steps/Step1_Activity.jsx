// frontend/src/components/steps/Step1_InitialDetails.jsx
// Verificado 09/12/2025 - OK

import React, { useState, useEffect } from 'react';
import {
  FaCode, FaTools, FaUsers, FaFrown, FaTasks, FaHeadSideVirus,
  FaRocket, FaComments, FaBalanceScale, FaHeartbeat, FaCogs,
  FaBriefcase, FaCalendarTimes, FaGlobeAmericas
} from 'react-icons/fa';
import { useHelpModal } from "../../../context/HelpModalContext";
// Dados baseados na Tabela de Áreas do Conhecimento do CNPq (Simplificada para o contexto)
const CNPQ_AREAS = {
  "Ciências Exatas e da Terra": [
    "Ciência da Computação",
    "Matemática",
    "Probabilidade e Estatística",
    "Física",
    "Química",
    "Astronomia"
  ],
  "Engenharias": [
    "Engenharia de Software", // Adicionado 
    "Engenharia Elétrica",
    "Engenharia Civil",
    "Engenharia Mecânica",
    "Engenharia de Produção"
  ],
  "Ciências Humanas": [
    "Educação",
    "Psicologia",
    "Sociologia",
    "Filosofia",
    "História"
  ],
  "Ciências Sociais Aplicadas": [
    "Administração",
    "Economia",
    "Direito",
    "Comunicação",
    "Design"
  ],
  "Linguística, Letras e Artes": [
    "Linguística",
    "Letras",
    "Artes"
  ],
  "Outros": [
    "Multidisciplinar",
    "Geral"
  ]
};
/**
 * Componente para a Etapa 1 do formulário de criação de atividades.
 * Coleta o título, a descrição e os principais desafios enfrentados pelos alunos.
 * @param {object} props - As propriedades passadas do componente pai.
 * @param {object} props.activityData - O objeto de estado que contém todos os dados do formulário.
 * @param {function} props.handleInputChange - A função para manipular mudanças em inputs de texto e textareas.
 * @param {function} props.setActivityData - A função para definir o estado da atividade diretamente, usada para campos complexos como arrays.
 */
function Step1_InitialDetails({ activityData, handleInputChange, setActivityData }) {
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
  const { openHelp } = useHelpModal();
  // Estado local para controlar a "Grande Área" selecionada (Filtro do segundo select)
  const [selectedGreatArea, setSelectedGreatArea] = useState("");
  // Efeito para sincronizar a Grande Área caso a activityData já venha preenchida (Edição)
  useEffect(() => {
    if (activityData.areaKnowledge && !selectedGreatArea) {
      // Procura em qual Grande Área a área específica se encontra
      const foundGreatArea = Object.keys(CNPQ_AREAS).find(key =>
        CNPQ_AREAS[key].includes(activityData.areaKnowledge)
      );
      if (foundGreatArea) {
        setSelectedGreatArea(foundGreatArea);
      } else {
        // Fallback se não achar (ex: importação antiga)
        setSelectedGreatArea("Outros");
      }
    }
  }, [activityData.areaKnowledge]);
  /**
   * Manipula a seleção de problemas a partir dos cards.
   * Adiciona o problema ao array se ele não existir, ou o remove se já existir,
   * atualizando o estado no componente pai.
   * @param {string} problemText - O texto do problema que foi clicado.
   */
  const handleProblemSelection = (problemText) => {
    const currentProblems = activityData.currentScenario.problems;
    const newProblems = currentProblems.includes(problemText)
      ? currentProblems.filter(p => p !== problemText)
      : [...currentProblems, problemText];

    // Atualiza o estado no componente pai.
    // Usar setActivityData é mais direto para atualizar um array.
    setActivityData(prevData => ({
      ...prevData,
      currentScenario: {
        ...prevData.currentScenario,
        problems: newProblems,
      },
    }));
  };

  // Manipula a mudança da Grande Área (apenas visual/filtro)
  const handleGreatAreaChange = (e) => {
    setSelectedGreatArea(e.target.value);
    // Limpa a área específica quando a grande área muda para evitar inconsistência
    setActivityData(prev => ({ ...prev, areaKnowledge: "" }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SEÇÃO 1: Título e Descrição da Atividade */}
      <div id="tour-step-scenario-inputs">
        <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text">
          Definindo o Cenário da Atividade
        </h2>
        <p className="mt-2 text-secondary-text dark:text-secondary-text">
          Para começar, dê um nome e descreva o propósito geral da sua atividade gamificada.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-secondary-text dark:text-secondary-text">
            Título da Atividade <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={activityData.title}
            onChange={handleInputChange}
            className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            placeholder="Ex: A Jornada do Herói em Java"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-secondary-text dark:text-secondary-text">
            Descrição da Atividade
          </label>
          <textarea
            id="description"
            name="description"
            value={activityData.description}
            onChange={handleInputChange}
            rows="1"
            className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            placeholder="Um resumo sobre o que é a atividade."
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-text dark:text-secondary-text mb-1">
            Grande Área (CNPq)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaGlobeAmericas />
            </div>
            <select
              value={selectedGreatArea}
              onChange={handleGreatAreaChange}
              className="pl-10 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            >
              <option value="">Selecione a Grande Área...</option>
              {Object.keys(CNPQ_AREAS).map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-text dark:text-secondary-text mb-1">
            Área de Conhecimento <span className="text-red-500">*</span>
          </label>
          <select
            name="areaKnowledge"
            value={activityData.areaKnowledge || ""}
            onChange={handleInputChange}
            disabled={!selectedGreatArea}
            className="block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {selectedGreatArea ? "Selecione a Área específica..." : "Selecione a Grande Área primeiro"}
            </option>
            {selectedGreatArea && CNPQ_AREAS[selectedGreatArea].map(subArea => (
              <option key={subArea} value={subArea}>{subArea}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SEÇÃO 2: Seleção de Problemas com Cards */}
      <div className="pt-4">
        <h3 className="text-lg font-semibold text-primary-text dark:text-primary-text">
          Quais desafios seus alunos enfrentam?
        </h3>
        <p className="mt-1 text-sm text-secondary-text dark:text-secondary-text">
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
                    : 'border-border-color bg-secondary-bg hover:border-teal-400 hover:shadow-lg dark:border-border-color dark:bg-primary-bg dark:hover:border-teal-500'
                  }
                `}
              >
                <div className={`text-4xl ${isSelected ? 'text-teal-500' : 'text-secondary-text group-hover:text-teal-500 dark:text-secondary-text dark:group-hover:text-teal-400'}`}>
                  {problem.icon}
                </div>
                <p className={`text-sm font-medium ${isSelected ? 'text-teal-800 dark:text-teal-100' : 'text-secondary-text dark:text-secondary-text'}`}>
                  {problem.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 3: Campo Aberto e Botão de Ajuda */}
      <div className="pt-4">
        <label htmlFor="currentScenario.otherProblem" className="block text-sm font-medium text-secondary-text dark:text-secondary-text">
          Outro desafio não listado? (Opcional)
        </label>
        <input
          type="text"
          id="currentScenario.otherProblem"
          name="currentScenario.otherProblem"
          value={activityData.currentScenario.otherProblem}
          onChange={handleInputChange}
          className="mt-1 block w-full px-4 py-2 bg-secondary-bg dark:bg-primary-bg border border-border-color dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          placeholder="Descreva outro problema específico"
        />
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