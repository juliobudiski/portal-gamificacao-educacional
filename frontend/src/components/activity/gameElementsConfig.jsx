// src/components/activity/gameElementsConfig.js
import React from 'react';
import { 
    FaBookOpen, FaQuestionCircle, FaTrophy, FaComments, FaStore, 
    FaBullseye, FaMedal, FaDice
} from 'react-icons/fa';

/**
 * MÓDULO CENTRAL DE CONFIGURAÇÃO DOS CARDS
 * Esta é a ÚNICA fonte de verdade para os cards do dashboard.
 * 
 * @module gameElementsConfig
 * @description Configuração centralizada para os elementos de jogo no dashboard.
 *              Define propriedades, ícones e condições de exibição para cada card.
 */

/**
 * @typedef {Object} CardConfig
 * @property {string} key - Identificador único do card
 * @property {string} title - Título exibido no card
 * @property {string} description - Descrição do card
 * @property {JSX.Element} icon - Componente de ícone do React
 * @property {string} color - Classe de cor para estilização (deve corresponder às classes do Tailwind)
 * @property {Function} isEnabled - Função que determina se o card está habilitado
 *           @param {string[]} elements - Lista de elementos de jogo ativos
 *           @param {string} [userRole] - Papel do usuário (ex: 'aluno', 'professor')
 *           @returns {boolean} Status de habilitação do card
 */

/**
 * Configuração principal dos cards do dashboard
 * @type {CardConfig[]}
 * 
 * // TODO: Adicionar sistema de validação para cores compatíveis com o tema
 * // TODO: Implementar cache para resultados das funções isEnabled
 */
export const cardsConfig = [
  {
    key: 'narrative',
    title: "Narrativa",
    description: "Comece a jornada e entenda a história desta atividade.",
    icon: <FaBookOpen className="text-3xl text-yellow-400" />,
    color: "yellow",
    // Verifica se elementos contém storytelling
    isEnabled: (elements) => elements.includes("Narrativas envolventes") || elements.includes("Storytelling")
  },
  {
    key: 'quiz',
    title: "Desafio Principal",
    description: "Teste suas habilidades, ganhe pontos e avance na atividade.",
    icon: <FaQuestionCircle className="text-3xl text-blue-400" />,
    color: "blue",
    // Habilita se houver sistema de pontuação ou puzzles
    isEnabled: (elements) => elements.includes("Sistema de pontuação") || elements.includes("Quebra-cabeça")
  },
  {
    key: 'leaderboard',
    title: "Ranking da Atividade",
    description: "Veja sua posição em comparação com outros participantes.",
    icon: <FaTrophy className="text-3xl text-purple-400" />,
    color: "purple",
    // Disponível apenas para alunos com sistema de ranking
    isEnabled: (elements, userRole) => userRole === 'aluno' && elements.includes("Sistema de classificação e ranking")
  },
  {
    key: 'mission',
    title: "Objetivos da Missão",
    description: "Consulte as metas e as regras para completar a atividade.",
    icon: <FaBullseye className="text-3xl text-red-400" />,
    color: "red",
    // Exibe quando houver objetivos definidos
    isEnabled: (elements) => elements.includes("Objetivo (missão, meta do jogo)")
  },
  {
    key: 'achievements',
    title: "Minhas Conquistas",
    description: "Veja todas as medalhas e recompensas que você desbloqueou.",
    icon: <FaMedal className="text-3xl text-orange-400" />,
    color: "orange",
    // Habilita para sistemas de recompensas/reconhecimento
    isEnabled: (elements) => 
      elements.includes("Conquistas digitais para metas alcançadas") || 
      elements.includes("Reconhecimento") ||
      elements.includes("Recompensas atraentes")
  },
  {
    key: 'roulette',
    title: "Roleta da Sorte",
    description: "Gire a roleta para ter a chance de ganhar bônus e prêmios.",
    icon: <FaDice className="text-3xl text-rose-400" />,
    color: "rose",
    // Disponível apenas para alunos com elementos de sorte
    isEnabled: (elements, userRole) => userRole === 'aluno' && elements.includes("Chance (sorte e probabilidade)")
  },
  {
    key: 'store',
    title: "Loja de Recompensas",
    description: "Use seus pontos para adquirir vantagens e itens.",
    icon: <FaStore className="text-3xl text-pink-400" />,
    color: "pink",
    // Habilita para alunos com sistema monetário
    isEnabled: (elements, userRole) => userRole === 'aluno' && elements.includes("Economia (sistema monetário)")
  },
  {
    key: 'chat',
    title: "Chat da Atividade",
    description: "Converse e colabore com outros participantes.",
    icon: <FaComments className="text-3xl text-green-400" />,
    color: "green",
    // Ativa quando houver sistema de chat
    isEnabled: (elements) => elements.includes("Chat ou sistema de mensagens")
  },
];