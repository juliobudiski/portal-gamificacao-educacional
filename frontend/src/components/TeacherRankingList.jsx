// frontend/src/components/admin/TeacherRankingList.jsx

import React, { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext'; // Importando o hook de autenticação

/**
 * Lista de Ranking de Professores
 * 
 * Renderiza a tabela de classificação (leaderboard) dos educadores com base em suas
 * contribuições (criações, engajamento e clones) na plataforma.
 */


const TeacherRankingList = ({ title, rankingData, isLoading, error }) => {
  const { user } = useAuth(); // Pegando o usuário logado do contexto

  if (isLoading) {
    return (
      <div className="bg-secondary-bg text-primary-text p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-secondary-text">{title}</h3>
        <p>Carregando ranking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-secondary-bg text-primary-text p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-red-400">{title}</h3>
        <p>Não foi possível carregar o ranking. Tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary-bg text-primary-text p-6 rounded-2xl shadow-lg border border-border-color">
      <h3 className="text-2xl font-bold mb-6 text-center text-primary-text">{title}</h3>
      <ul className="space-y-3">
        {rankingData.map((teacher, index) => {
          const isCurrentUser = teacher.id === user.id;
          let rankColor = 'text-secondary-text';
          if (teacher.rank === 1) rankColor = 'text-yellow-400';
          if (teacher.rank === 2) rankColor = 'text-secondary-text';
          if (teacher.rank === 3) rankColor = 'text-yellow-600';

          return (
            <li
              key={index}
              className={`flex items-center p-3 rounded-lg transition-all duration-300 ${isCurrentUser ? 'bg-[#ffbd30]/20 border-l-4 border-[#ffbd30]' : 'bg-[#495057]'} ${teacher.rank <= 3 ? 'font-bold' : ''}`}
            >
              <span className={`text-xl font-bold w-12 text-center ${rankColor}`}>{teacher.rank}°</span>
              <img
                src={teacher.avatar_url || `/avatars/avatar1.webp`} // Caminho para um avatar padrão
                alt={`Avatar de ${teacher.name}`}
                className="w-12 h-12 rounded-full mr-4 border-2 border-gray-600 object-cover"
              />
              <span className="flex-1 text-lg text-secondary-text">{teacher.name} {isCurrentUser && "(Você)"}</span>
              <div className="text-right">
                <span className="text-xl font-bold text-[#69e8cb]">{teacher.score}</span>
                <p className="text-xs text-secondary-text">atividades</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

TeacherRankingList.propTypes = {
  title: PropTypes.string.isRequired,
  rankingData: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
};

export default TeacherRankingList;