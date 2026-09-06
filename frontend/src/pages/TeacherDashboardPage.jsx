// frontend/src/pages/TeacherDashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TEACHER_DASHBOARD_STEPS } from '../data/tutorialSteps';
import { useTutorial } from '../context/TutorialContext';
import { useAuthOperations } from '../hooks/useAuthOperations';
import FeedbackModal from '../components/FeedbackModal';
import { Users, PlusCircle, BookOpen, BarChart2, Award, Settings, ChevronRight } from 'lucide-react';

/**
 * TeacherDashboardPage
 * 
 * Architectural intent: Serves as the primary authenticated entry point for teachers, providing a centralized
 * routing hub for administrative and content creation tasks. It orchestrates the presentation of action cards
 * and manages access control, ensuring students cannot access educator-specific routes.
 */
export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { startTour } = useTutorial();
  const [showFeedback, setShowFeedback] = useState(false);
  const { performAuthRequest } = useAuthOperations();

  useEffect(() => {
    const shouldForce = location.state?.forceTour === true;
    const timer = setTimeout(() => {
      startTour(TEACHER_DASHBOARD_STEPS, 'teacher_dashboard_v1', shouldForce);
    }, 500);
    return () => clearTimeout(timer);
  }, [startTour, location.state]);

  if (!user || user.role !== 'professor') {
    navigate('/login');
    return null;
  }

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

  const dashboardCards = [
    {
      id: "tour-dash-classes",
      title: "Gerenciar Turmas",
      description: "Crie, visualize e edite suas turmas.",
      icon: Users,
      link: "/professor/gerenciar-turmas",
      color: "text-[#69e8cb]",
      bg: "bg-[#69e8cb]/10",
      borderHover: "hover:border-[#69e8cb]/50",
      shadowHover: "hover:shadow-[#69e8cb]/20"
    },
    {
      id: "tour-dash-create-btn",
      title: "Criar Atividade",
      description: "Elabore novas atividades para seus alunos.",
      icon: PlusCircle,
      link: "/professor/criar-atividade",
      color: "text-[#ffbd30]",
      bg: "bg-[#ffbd30]/10",
      borderHover: "hover:border-[#ffbd30]/50",
      shadowHover: "hover:shadow-[#ffbd30]/20"
    },
    {
      id: "tour-dash-bank",
      title: "Banco de Atividades",
      description: "Reutilize e gerencie suas atividades criadas.",
      icon: BookOpen,
      link: "/professor/banco-atividades",
      color: "text-[#9570d9]",
      bg: "bg-[#9570d9]/10",
      borderHover: "hover:border-[#9570d9]/50",
      shadowHover: "hover:shadow-[#9570d9]/20"
    },
    {
      id: "tour-dash-performance",
      title: "Desempenho Alunos",
      description: "Acompanhe o progresso dos seus alunos.",
      icon: BarChart2,
      link: "/professor/desempenho-alunos",
      color: "text-[#69e8cb]",
      bg: "bg-[#69e8cb]/10",
      borderHover: "hover:border-[#69e8cb]/50",
      shadowHover: "hover:shadow-[#69e8cb]/20"
    },
    {
      id: "tour-dash-ranking",
      title: "Ranking de Professores",
      description: "Veja sua posição e a dos seus colegas.",
      icon: Award,
      link: "/professor/ranking",
      color: "text-[#ffbd30]",
      bg: "bg-[#ffbd30]/10",
      borderHover: "hover:border-[#ffbd30]/50",
      shadowHover: "hover:shadow-[#ffbd30]/20"
    },
    {
      id: "tour-dash-settings",
      title: "Minhas Configurações",
      description: "Personalize sua conta e preferências.",
      icon: Settings,
      link: "/perfil",
      color: "text-[#9570d9]",
      bg: "bg-[#9570d9]/10",
      borderHover: "hover:border-[#9570d9]/50",
      shadowHover: "hover:shadow-[#9570d9]/20"
    }
  ];

  return (
    <div className="min-h-screen bg-primary-bg relative overflow-hidden transition-colors duration-500">
      {/* Background Decorativo Glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#9570d9]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#69e8cb]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      
      <div className="p-4 md:p-8 relative z-10 max-w-7xl mx-auto">
        <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} userRole="professor" />
        
        {/* Header Profissional */}
        <header className="mb-12 pt-8 pb-4 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-border-color/30">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd30] via-[#ffcc5c] to-[#ffa000]">
                Painel do Professor
              </span>
            </h1>
            <p className="text-lg md:text-xl text-secondary-text font-light">
              Bem-vindo de volta, <span className="font-semibold text-primary-text">{user.name}</span>!
            </p>
          </div>
          <div className="hidden md:block">
             <div className="px-6 py-3 bg-secondary-bg/40 backdrop-blur-md rounded-2xl border border-border-color/50 shadow-inner">
               <span className="text-sm font-medium text-secondary-text uppercase tracking-wider block mb-1">Status</span>
               <div className="flex items-center gap-2">
                 <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                 </span>
                 <span className="font-bold text-primary-text">Sistema Operacional</span>
               </div>
             </div>
          </div>
        </header>

        {/* Grid Principal */}
        <main id="tour-professor-dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {dashboardCards.map((card, idx) => (
              <Link 
                key={idx}
                id={card.id}
                to={card.link}
                className={`group relative p-8 rounded-3xl bg-secondary-bg/60 backdrop-blur-xl border border-border-color/40 shadow-lg transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl ${card.shadowHover} ${card.borderHover} overflow-hidden`}
              >
                {/* Efeito Hover Glow Radial no background do card */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`flex items-center justify-center h-16 w-16 rounded-2xl ${card.bg} mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner`}>
                    <card.icon className={`h-8 w-8 ${card.color}`} strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-primary-text mb-3 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary-text group-hover:to-secondary-text transition-all duration-300">
                    {card.title}
                  </h3>
                  
                  <p className="text-secondary-text font-medium leading-relaxed flex-grow">
                    {card.description}
                  </p>
                  
                  <div className={`mt-6 flex items-center text-sm font-bold uppercase tracking-widest ${card.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                    <span className="group-hover:mr-2 transition-all duration-300">Acessar Painel</span>
                    <ChevronRight className="h-4 w-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" strokeWidth={3} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>

        <footer className="mt-20 pt-8 border-t border-border-color/30 flex flex-col md:flex-row items-center justify-between text-secondary-text text-sm">
          <p className="font-medium">Portal de Gamificação Educacional</p>
          <p className="mt-2 md:mt-0 px-4 py-1.5 bg-secondary-bg/40 backdrop-blur-sm rounded-full border border-border-color/30">
            Acessado como: <span className="text-primary-text font-semibold">{user.email}</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
