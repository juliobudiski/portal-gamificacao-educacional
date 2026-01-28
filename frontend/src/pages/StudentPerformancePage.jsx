import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Search, Award, Clock, CheckCircle, BookOpen, Target, TrendingUp, XCircle } from 'lucide-react';
import { useAuthOperations } from '../hooks/useAuthOperations';
import FeedbackModal from '../components/FeedbackModal';


// Componente de Badge Refatorado para usar cores semânticas
const StatusBadge = ({ status }) => {
  const styles = {
    // Usando as variáveis semânticas definidas no tailwind.config.js
    completed: "bg-success-bg text-success border border-success/20",
    in_progress: "bg-yellow-100 text-accent-yellow dark:bg-yellow-900/30 border border-accent-yellow/20",
    not_started: "bg-primary-bg text-secondary-text border border-secondary-text/20",
  };

  const labels = {
    completed: "Concluído",
    in_progress: "Em Andamento",
    not_started: "Não Iniciado"
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status] || styles.not_started}`}>
      {labels[status] || "Não Iniciado"}
    </span>
  );
};

// NOVO COMPONENTE: Gráfico de Distribuição de Notas (Visualização Rápida)
const ScoreDistributionChart = ({ students, maxScore }) => {
  const activeStudents = students.filter(s => s.status !== 'not_started');
  if (activeStudents.length === 0) return null;

  // Se maxScore for 0 (erro ou atividade sem pontos), evita divisão por zero
  const safeMaxScore = maxScore > 0 ? maxScore : 100;

  const distribution = {
    low: 0,    // < 50%
    medium: 0, // 50% - 79%
    high: 0    // >= 80%
  };

  activeStudents.forEach(s => {
    const percentage = (s.points_earned / safeMaxScore) * 100;
    if (percentage >= 80) distribution.high++;
    else if (percentage >= 50) distribution.medium++;
    else distribution.low++;
  });

  const total = activeStudents.length;
  const getPct = (val) => total > 0 ? (val / total) * 100 : 0;

  return (
    <div className="bg-secondary-bg p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
      <h3 className="text-sm font-semibold text-secondary-text mb-3 flex items-center gap-2">
        <TrendingUp size={16} /> Distribuição de Desempenho
        <span className="text-xs font-normal text-gray-500">(Baseado no total de {safeMaxScore} pontos)</span>
      </h3>
      <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div style={{ width: `${getPct(distribution.high)}%` }} className="bg-success h-full" title={`Alta Performance: ${distribution.high}`} />
        <div style={{ width: `${getPct(distribution.medium)}%` }} className="bg-accent-yellow h-full" title={`Média Performance: ${distribution.medium}`} />
        <div style={{ width: `${getPct(distribution.low)}%` }} className="bg-red-400 h-full" title={`Baixa Performance: ${distribution.low}`} />
      </div>
      <div className="flex justify-between mt-2 text-xs text-secondary-text">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success"></div>Alta (80%+)</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent-yellow"></div>Média (50-79%)</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div>Baixa (&lt;50%)</div>
      </div>
    </div>
  );
};

const StudentPerformancePage = () => {
  const { user, logout } = useContext(AuthContext); // Pegamos o logout do contexto

  // Estados de Filtro
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const { performAuthRequest } = useAuthOperations();
  // Estados de Dados (Inicializado com estrutura segura)
  const [performanceData, setPerformanceData] = useState({ stats: { total_students: 0 }, students: [] });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const checkFeedback = async () => {
      // Adicione um pequeno delay para não impactar o LCP (Largest Contentful Paint)
      setTimeout(async () => {
        const response = await performAuthRequest('/api/feedback/check-eligibility', 'GET');
        if (response.success && response.data.show_modal) {
          setShowFeedback(true);
        }
      }, 2000); // Aparece 2 segundos após carregar o dashboard
    };
    checkFeedback();
  }, []);
  // Função auxiliar para lidar com erros de Token (401)
  const handleFetchError = (response) => {
    if (response.status === 401) {
      console.warn("Sessão expirada. Redirecionando para login...");
      logout(); // Desloga o usuário e força novo login
      return true; // Indica que houve erro crítico
    }
    return false;
  };

  // 1. Carregar Filtros (Turmas e Atividades)
  useEffect(() => {
    if (!user) return;

    const fetchFilters = async () => {
      try {
        const response = await fetch(`/api/analytics/professor/filters`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (handleFetchError(response)) return;
        if (!response.ok) throw new Error("Falha ao buscar filtros");

        const data = await response.json();
        setClasses(data.classes || []);
        setActivities(data.activities || []);

        // Seleciona a primeira turma automaticamente se houver
        if (data.classes && data.classes.length > 0) setSelectedClass(data.classes[0].id);
      } catch (error) {
        console.error("Erro ao carregar filtros", error);
      }
    };

    fetchFilters();
  }, [user, logout]); // Adicionado logout nas dependências

  // 2. Carregar Dados de Desempenho
  useEffect(() => {
    if (!selectedClass) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        let url = `/api/analytics/professor/performance?class_id=${selectedClass}`;
        if (selectedActivity) url += `&activity_id=${selectedActivity}`;
        if (searchTerm) url += `&search=${searchTerm}`;

        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (handleFetchError(response)) return;
        if (!response.ok) throw new Error("Falha ao buscar desempenho");

        const data = await response.json();
        setPerformanceData(data);
      } catch (error) {
        console.error("Erro ao carregar desempenho", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedClass, selectedActivity, searchTerm, user, logout]);

  return (
    <div className="p-6 min-h-screen bg-primary-bg text-primary-text transition-colors duration-300">
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} userRole="aluno" />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Desempenho da Turma</h1>
        <p className="text-secondary-text">
          Acompanhe métricas detalhadas de engajamento e aprendizado.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-secondary-bg p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between transition-colors duration-300">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-secondary-text mb-1">Turma</label>
            <select
              className="p-2 border rounded bg-primary-bg text-primary-text border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-accent-teal focus:outline-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="" disabled>Selecione uma turma</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-secondary-text mb-1">Atividade</label>
            <select
              className="p-2 border rounded bg-primary-bg text-primary-text border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-accent-teal focus:outline-none"
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
            >
              <option value="">Visão Geral (Todas)</option>
              {activities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Buscar aluno..."
            className="pl-10 p-2 border rounded w-full bg-primary-bg text-primary-text border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-accent-teal focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* DASHBOARD DE MÉTRICAS (Agora com 4 Colunas) */}
      {!loading && performanceData?.stats?.total_students > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

            {/* 1. Engajamento / Narrativas */}
            <div className="bg-secondary-bg p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3 shadow-sm">
              <div className="p-3 rounded-full bg-info-bg text-info">
                {selectedActivity ? <BookOpen size={24} /> : <Clock size={24} />}
              </div>
              <div>
                <p className="text-xs text-secondary-text uppercase font-bold">
                  {selectedActivity ? "Narrativas Lidas" : "Total de Alunos"}
                </p>
                <p className="text-2xl font-bold text-info">
                  {selectedActivity
                    ? performanceData.stats.total_narratives_read
                    : performanceData.stats.total_students}
                </p>
              </div>
            </div>

            {/* 2. Pontuação Média */}
            <div className="bg-secondary-bg p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3 shadow-sm">
              <div className="p-3 rounded-full bg-primary-bg text-accent-purple">
                <Award size={24} />
              </div>
              <div>
                <p className="text-xs text-secondary-text uppercase font-bold">
                  {selectedActivity ? "Média de Pontos" : "XP Médio"}
                </p>
                <p className="text-2xl font-bold text-accent-purple">
                  {performanceData.stats.average_score ?? 0}
                </p>
              </div>
            </div>

            {/* 3. Precisão / Conclusão */}
            <div className="bg-secondary-bg p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3 shadow-sm">
              <div className="p-3 rounded-full bg-primary-bg text-success">
                {selectedActivity ? <Target size={24} /> : <CheckCircle size={24} />}
              </div>
              <div>
                <p className="text-xs text-secondary-text uppercase font-bold">
                  {selectedActivity ? "Precisão Média" : "Conclusão Geral"}
                </p>
                <p className="text-2xl font-bold text-success">
                  {selectedActivity
                    ? `${performanceData.stats.average_accuracy}%`
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* 4. Status Conclusão (Contagem) */}
            <div className="bg-secondary-bg p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3 shadow-sm">
              <div className="p-3 rounded-full bg-primary-bg text-accent-yellow">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-xs text-secondary-text uppercase font-bold">Alunos Concluídos</p>
                <p className="text-2xl font-bold text-accent-yellow">
                  {performanceData.stats.completed_count} <span className="text-sm text-secondary-text font-normal">/ {performanceData.stats.total_students}</span>
                </p>
              </div>
            </div>
          </div>

          {/* NOVO: Gráfico de Distribuição (Só aparece se tiver atividade selecionada) */}
          {selectedActivity && (
            <ScoreDistributionChart students={performanceData.students} />
          )}
        </>
      )}

      {/* TABELA */}
      <div className="bg-secondary-bg rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-12 text-center text-secondary-text">Carregando dados...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-primary-bg text-secondary-text uppercase text-xs font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-4">Aluno</th>
                  {selectedActivity ? (
                    <>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" title="Questões respondidas corretamente">Acertos</th>
                      <th className="p-4 text-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" title="Questões respondidas incorretamente">Erros</th>
                      <th className="p-4 text-center" title="Total de vezes que respondeu (inclui repetições)">Tentativas (Quiz)</th>
                      <th className="p-4 text-center" title="Porcentagem de acerto">Precisão</th>
                      <th className="p-4 text-center" title="Quantas vezes abriu telas de história">Leituras</th>
                      <th className="p-4 text-center">Pontos</th>
                    </>
                  ) : (
                    <>
                      <th className="p-4 text-center">Nível Global (XP)</th>
                      <th className="p-4 text-right">Localização</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {performanceData?.students && performanceData.students.length > 0 ? (
                  performanceData.students.map((student) => (
                    <tr key={student.id} className="hover:bg-primary-bg transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden text-secondary-text">
                          {student.avatar ? <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{student.name.charAt(0)}</div>}
                        </div>
                        <div>
                          <p className="font-semibold text-primary-text">{student.name}</p>
                          <p className="text-xs text-secondary-text">{student.email}</p>
                        </div>
                      </td>
                      {selectedActivity ? (
                        <>
                          <td className="p-4 text-center"><StatusBadge status={student.status} /></td>

                          {/* ACERTOS */}
                          <td className="p-4 text-center bg-green-50/50 dark:bg-green-900/10">
                            <div className="flex items-center justify-center gap-1 text-success font-bold">
                              <CheckCircle size={14} /> {student.correct_count}
                            </div>
                          </td>

                          {/* ERROS */}
                          <td className="p-4 text-center bg-red-50/50 dark:bg-red-900/10">
                            <div className="flex items-center justify-center gap-1 text-red-500 font-bold">
                              <XCircle size={14} /> {student.wrong_count}
                            </div>
                          </td>

                          {/* TENTATIVAS TOTAIS */}
                          <td className="p-4 text-center text-secondary-text font-mono">
                            {student.total_responses}
                          </td>

                          {/* PRECISÃO */}
                          <td className="p-4 text-center">
                            <span className={`font-mono font-bold ${student.accuracy >= 70 ? 'text-success' : student.accuracy >= 50 ? 'text-accent-yellow' : 'text-red-400'}`}>{student.accuracy}%</span>
                          </td>

                          {/* LEITURAS */}
                          <td className="p-4 text-center text-secondary-text">
                            <div className="flex items-center justify-center gap-1"><BookOpen size={14} /> {student.narratives_read}</div>
                          </td>

                          <td className="p-4 text-center font-mono text-primary-text font-bold">{student.points_earned}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 text-center font-mono text-accent-purple font-bold">XP: {student.global_xp}</td>
                          <td className="p-4 text-right text-sm text-secondary-text">{student.last_location || 'Desconhecido'}</td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="p-8 text-center text-secondary-text">{classes.length === 0 ? "Nenhuma turma." : "Nenhum aluno."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPerformancePage;