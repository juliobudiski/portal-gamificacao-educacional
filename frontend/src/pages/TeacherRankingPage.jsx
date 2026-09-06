// frontend/src/pages/TeacherRankingPage.jsx

import React, { useState, useEffect } from 'react';
import TeacherRankingList from '../components/TeacherRankingList'; // Corrigido para o caminho correto
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

/**
 * TeacherRankingPage
 * 
 * Architectural intent: Acts as the presentation layer for the educator community ranking system.
 * It fetches and displays the leaderboard of top activity creators, delegating the actual rendering
 * of the list to the TeacherRankingList component to maintain high cohesion.
 */
const TeacherRankingPage = () => {
  const [creatorsRanking, setCreatorsRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken } = useAuth(); // Usando o hook useAuth para pegar a função getToken
  const navigate = useNavigate();

  // Define a URL base da API a partir das variáveis de ambiente
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setIsLoading(true);
        const token = getToken(); // Chamando a função para obter o token

        if (!token) {
          throw new Error('Usuário não autenticado. Não foi possível carregar o ranking.');
        }

        // Usando a variável API_URL para montar o endpoint
        const response = await fetch(`${API_URL}/api/rankings/teachers/creators`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          // Verifica se a mensagem de erro vem do backend, senão usa uma padrão
          throw new Error(errorData.message || 'Falha ao buscar os dados do ranking.');
        }

        const data = await response.json();
        setCreatorsRanking(data.ranking);
        setError(null);
      } catch (err) {
        // Define o erro como a mensagem do objeto de erro
        setError(err.message);
        console.error("Erro ao buscar ranking:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRanking();
  }, [getToken, API_URL]); // Adicionado API_URL às dependências

  return (
    <div className="min-h-screen bg-gradient-to-br bg-primary-bg  p-4 md:p-8">
      <div className="max-w-full mx-auto">
        <button 
            onClick={() => navigate(-1)} 
            className="group mb-6 flex items-center gap-2 text-secondary-text hover:text-accent-teal transition-colors font-bold uppercase tracking-widest text-sm"
        >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Voltar
        </button>
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary-text">
            Quadro de Honra dos Professores
          </h1>
          <p className="mt-2 text-xl text-secondary-text">
            Veja quem mais contribui com a plataforma!
          </p>
        </header>

        <main className="grid grid-cols-1 gap-8">
          <TeacherRankingList
            title="🏆 Top Criadores de Atividades"
            rankingData={creatorsRanking}
            isLoading={isLoading}
            error={error} // Passando a mensagem de erro (string) em vez do objeto
          />
          {/* Placeholder para o futuro ranking de avaliadores */}
          <div className="bg-secondary-bg text-primary-text p-6 rounded-2xl shadow-lg border border-dashed border-border-color">
            <h3 className="text-2xl font-bold mb-4 text-secondary-text">⭐ Top Avaliadores</h3>
            <p className="text-secondary-text">Em breve: um ranking para os professores que mais avaliam e fornecem feedback sobre atividades da comunidade.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherRankingPage;