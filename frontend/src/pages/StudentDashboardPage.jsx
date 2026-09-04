// src/pages/StudentDashboardPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaChalkboardTeacher, FaChevronRight,
  FaTrophy, FaUserGraduate
} from 'react-icons/fa';
import { BookOpen, Target, Lightbulb, TrendingUp } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import { useAuthOperations } from '../hooks/useAuthOperations';
import { useTutorial } from '../context/TutorialContext';
import { STUDENT_DASHBOARD_STEPS } from '../data/tutorialSteps';

const DAILY_TIPS = [
  "Divida problemas grandes em partes pequenas antes de começar a codificar.",
  "Dormir bem ajuda a fixar o que você aprendeu. Não vire a noite programando!",
  "Sempre leia as mensagens de erro (logs). Elas geralmente dizem exatamente o que está errado.",
  "Peça ajuda no fórum! A comunidade existe para isso.",
  "Revise o código antigo para ver o quanto você evoluiu.",
  "Use nomes descritivos para suas variáveis em vez de 'a', 'b', 'x'.",
  "Teste seu código com diferentes entradas antes de enviar a missão.",
  "Lembre-se: todo dev sênior já foi um júnior com muitas dúvidas.",
  "Existem muitos caminhos para resolver o mesmo problema em TI.",
  "Faça pausas! A solução para aquele bug pode vir enquanto você toma um café."
];

const ClassCard = ({ classInfo }) => {
  return (
    <div className="group bg-secondary-bg/60 backdrop-blur-xl rounded-3xl border border-border-color/40 p-6 flex flex-col justify-between hover:-translate-y-2 hover:shadow-2xl hover:border-accent-yellow/50 transition-all duration-500 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-primary-text mb-2 tracking-tight">{classInfo.name}</h3>
        <div className="flex items-center text-sm font-medium text-secondary-text mb-4">
          <FaChalkboardTeacher className="mr-2 text-accent-teal" />
          <span>{classInfo.professor_name}</span>
        </div>
        <p className="text-secondary-text text-sm leading-relaxed mb-6">{classInfo.description}</p>
      </div>
      
      <div className="relative z-10 flex justify-between items-end mt-4 pt-4 border-t border-border-color/30">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-secondary-text block mb-1">Atividades</span>
          <span className="text-lg font-bold text-accent-teal">
            {classInfo.activities_count}
          </span>
        </div>
        <Link
          to={`/classes/${classInfo.id}`}
          className="flex items-center gap-2 font-bold text-accent-yellow hover:text-yellow-300 transition-colors uppercase text-sm tracking-wider"
        >
          Acessar Sala <FaChevronRight />
        </Link>
      </div>
    </div>
  );
};

ClassCard.propTypes = {
  classInfo: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    professor_name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    activities_count: PropTypes.number.isRequired
  }).isRequired
};

const ActivityCard = ({ activity }) => {
  const navigate = useNavigate();
  const isExpired = activity.expiresAt ? new Date(activity.expiresAt) < new Date() : false;

  const handleAccess = () => {
    if (!isExpired) {
      navigate(`/activities/${activity.id}`);
    }
  };

  return (
    <div className={`group relative bg-secondary-bg/60 backdrop-blur-xl p-5 rounded-2xl border border-border-color/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-500 ${isExpired ? 'opacity-50 grayscale' : 'hover:-translate-y-1 hover:shadow-xl hover:border-accent-teal/50'}`}>
      <div className="flex-1">
        <h4 className="font-bold text-xl text-primary-text mb-1 tracking-tight">{activity.title}</h4>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-secondary-text bg-primary-bg/50 px-2 py-1 rounded-md">
            {activity.class_name}
          </span>
          {isExpired && (
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
              Encerrada
            </span>
          )}
        </div>
      </div>
      
      <button
        onClick={handleAccess}
        disabled={isExpired}
        className={`w-full md:w-auto font-bold rounded-xl text-sm py-3 px-6 transition-all duration-300 uppercase tracking-wider shadow-lg ${isExpired
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-accent-teal to-[#4dd1b3] text-[#2c3135] hover:scale-105 active:scale-95'
          }`}
      >
        {isExpired ? 'Bloqueada' : 'Iniciar Jornada'}
      </button>
    </div>
  );
};

ActivityCard.propTypes = {
  activity: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    class_name: PropTypes.string.isRequired,
    expiresAt: PropTypes.string
  }).isRequired
};

export default function StudentDashboardPage() {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const { performAuthRequest } = useAuthOperations();
  const { startTour } = useTutorial();
  const location = useLocation();

  useEffect(() => {
    const shouldForce = location.state?.forceTour === true && !window.hasForcedTourStudent;
    const timer = setTimeout(() => {
      if (shouldForce) window.hasForcedTourStudent = true;
      startTour(STUDENT_DASHBOARD_STEPS, 'student_dashboard_v1', shouldForce);
    }, 500);
    return () => clearTimeout(timer);
  }, [startTour, location.state]);

  useEffect(() => {
    const checkFeedback = async () => {
      setTimeout(async () => {
        const response = await performAuthRequest('/api/analytics/feedback/check-eligibility', 'GET');
        if (response.success && response.data.show_modal) {
          setShowFeedback(true);
        }
      }, 2000);
    };
    checkFeedback();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Token não encontrado");

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-accent-teal border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-secondary-text font-medium uppercase tracking-widest">Carregando Dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500/50 p-8 rounded-3xl max-w-lg text-center backdrop-blur-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Ops, algo deu errado.</h2>
          <p className="text-secondary-text">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const relevantActivities = dashboardData?.pendingActivities
    .filter(activity => {
      const isAvailable = activity.expiresAt ? new Date(activity.expiresAt) > new Date() : true;
      const isNotCompleted = !activity.is_completed;
      return isAvailable && isNotCompleted;
    })
    .sort((a, b) => {
      if (!a.expiresAt) return 1;
      if (!b.expiresAt) return -1;
      return new Date(a.expiresAt) - new Date(b.expiresAt);
    })
    .slice(0, 5);

  const tipIndex = Math.floor(Date.now() / 86400000) % DAILY_TIPS.length;
  const currentTip = DAILY_TIPS[tipIndex];
  const { global_level_info, total_achievements } = dashboardData.performance;
  const progressPercent = (global_level_info.xp_current / global_level_info.xp_to_next_level) * 100;

  return (
    <div className="min-h-screen bg-primary-bg relative overflow-hidden transition-colors duration-500 pb-16">
      {/* Background Decorativo Glassmorphism */}
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-accent-teal/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-accent-purple/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      
      <div className="p-4 md:p-8 relative z-10 max-w-7xl mx-auto">
        <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} userRole="aluno" />
        
        {/* Banner: Dica do Dia */}
        <div className="bg-secondary-bg/60 backdrop-blur-md border border-accent-purple/30 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between shadow-2xl mb-12 hover:border-accent-purple/60 transition-colors duration-500">
          <div className="flex items-center gap-5 w-full">
            <div className="bg-accent-purple/20 p-4 rounded-2xl flex-shrink-0 relative overflow-hidden">
               <div className="absolute inset-0 bg-accent-purple/20 animate-pulse"></div>
               <Lightbulb className="text-accent-yellow w-8 h-8 relative z-10 drop-shadow-[0_0_15px_rgba(255,189,48,0.8)]" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-bold text-accent-purple uppercase tracking-widest mb-1.5">
                Sabedoria do Mestre
              </h3>
              <p className="text-primary-text font-medium text-sm md:text-base leading-relaxed">
                "{currentTip}"
              </p>
            </div>
          </div>
        </div>

        {/* Header Profissional */}
        <header className="mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Bem-vindo de volta,<br className="md:hidden" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow via-[#ffcc5c] to-accent-teal">{user?.name || 'Aluno'}</span>!
          </h1>
          <p className="text-lg md:text-xl text-secondary-text font-light">
            Sua jornada acadêmica aguarda. Continue avançando!
          </p>
        </header>

        <main className="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:gap-12">
          
          {/* Coluna Principal */}
          <div className="xl:col-span-2 space-y-12">
            
            {/* Secção Turmas */}
            <section id="tour-classes-section">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-accent-yellow/20 rounded-xl">
                  <BookOpen className="w-7 h-7 text-accent-yellow" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-primary-text">Minhas Turmas</h2>
              </div>
              
              {dashboardData.classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dashboardData.classes.map(cls => (
                    <ClassCard key={cls.id} classInfo={cls} />
                  ))}
                </div>
              ) : (
                <div className="bg-secondary-bg/40 backdrop-blur-sm border border-dashed border-border-color/50 rounded-3xl p-10 text-center">
                  <p className="text-secondary-text text-lg">Você não está em nenhuma guilda escolar no momento.</p>
                  <Link to="/aluno/entrar-turma" className="mt-4 inline-block font-bold text-accent-teal hover:underline">Entrar em uma turma</Link>
                </div>
              )}
            </section>

            {/* Secção Atividades */}
            <section id="tour-activities-section">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-accent-teal/20 rounded-xl">
                  <Target className="w-7 h-7 text-accent-teal" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-primary-text">Missões Pendentes</h2>
              </div>

              {relevantActivities.length > 0 ? (
                <div className="space-y-4">
                  {relevantActivities.map(activity => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="bg-secondary-bg/40 backdrop-blur-sm border border-dashed border-border-color/50 rounded-3xl p-10 text-center">
                  <p className="text-secondary-text text-lg">Sem missões pendentes. Você está em dia com seu treinamento!</p>
                </div>
              )}
            </section>
          </div>

          {/* Coluna Lateral (Painel Glassmorphism) */}
          <aside className="space-y-8">
             <div className="sticky top-24 space-y-8">
               
               {/* Painel de Desempenho */}
               <section id="tour-xp-display" className="bg-secondary-bg/80 backdrop-blur-2xl rounded-3xl p-8 border border-accent-purple/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                 <div className="flex items-center gap-3 mb-8 justify-center">
                   <TrendingUp className="w-6 h-6 text-accent-purple" />
                   <h2 className="text-2xl font-extrabold tracking-tight text-center">Status Global</h2>
                 </div>
                 
                 <div className="space-y-8">
                    {/* Nível */}
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                         <FaUserGraduate className="text-2xl text-white drop-shadow-md" />
                      </div>
                      <div>
                         <span className="text-xs font-bold uppercase tracking-widest text-secondary-text block mb-1">Nível de Mestre</span>
                         <span className="text-3xl font-black text-primary-text">{global_level_info.level}</span>
                      </div>
                    </div>

                    {/* Barra de XP */}
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-secondary-text uppercase tracking-wider">Experiência</span>
                        <span className="text-accent-teal">{global_level_info.xp_current} <span className="text-secondary-text">/ {global_level_info.xp_to_next_level}</span></span>
                      </div>
                      <div className="h-3 w-full bg-primary-bg rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div 
                           className="h-full bg-gradient-to-r from-accent-teal to-green-400 rounded-full shadow-[0_0_10px_rgba(105,232,203,0.8)] relative"
                           style={{ width: `${progressPercent}%` }}
                        >
                        </div>
                      </div>
                    </div>

                    {/* Conquistas */}
                    <div className="flex items-center gap-5 p-4 bg-primary-bg/50 rounded-2xl border border-border-color/30">
                       <div className="p-3 bg-accent-yellow/20 rounded-xl">
                          <FaTrophy className="text-2xl text-accent-yellow drop-shadow-[0_0_8px_rgba(255,189,48,0.5)]" />
                       </div>
                       <div>
                          <span className="text-xs font-bold uppercase tracking-widest text-secondary-text block mb-0.5">Medalhas de Honra</span>
                          <span className="text-xl font-black text-primary-text">{total_achievements}</span>
                       </div>
                    </div>
                 </div>
               </section>

               {/* Ações Rápidas */}
               <section className="bg-secondary-bg/60 backdrop-blur-xl rounded-3xl p-6 border border-border-color/40 shadow-xl">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-secondary-text text-center mb-5">Atalhos</h3>
                 <div className="space-y-3">
                   <Link to="/aluno/entrar-turma" className="flex items-center justify-center w-full py-3.5 px-4 bg-gradient-to-r from-accent-yellow to-[#ffa000] hover:from-[#ffa000] hover:to-[#ffbd30] text-[#2c3135] rounded-xl font-bold uppercase tracking-wide text-sm transition-all shadow-lg hover:shadow-accent-yellow/30 active:scale-95">
                     Ingressar em Turma
                   </Link>
                   <Link to="/aluno/minhas-atividades" className="flex items-center justify-center w-full py-3.5 px-4 bg-transparent border-2 border-accent-teal text-accent-teal hover:bg-accent-teal/10 rounded-xl font-bold uppercase tracking-wide text-sm transition-all active:scale-95">
                     Explorar Arquivos
                   </Link>
                 </div>
               </section>
             </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
