// frontend/src/pages/TeacherDashboardPage.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom'; // <--- Importante
import { TEACHER_DASHBOARD_STEPS } from '../data/tutorialSteps';
import { useTutorial } from '../context/TutorialContext';
import { useAuthOperations } from '../hooks/useAuthOperations';
import FeedbackModal from '../components/FeedbackModal';

function TeacherDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { startTour } = useTutorial();
  const [showFeedback, setShowFeedback] = useState(false);
  const { performAuthRequest } = useAuthOperations();

  useEffect(() => {
    // Verifica se veio do botão "Ver Tutorial" com ordem de força
    const shouldForce = location.state?.forceTour === true;

    // Se forçar OU se o usuário nunca viu (a lógica interna do startTour cuida do 'nunca viu')
    // Adicionamos um pequeno delay para garantir que os elementos carregaram
    const timer = setTimeout(() => {
      startTour(TEACHER_DASHBOARD_STEPS, 'teacher_dashboard_v1', shouldForce);
    }, 500);

    return () => clearTimeout(timer);
  }, [startTour, location.state]);

  // Se o usuário não estiver logado ou não for professor, redireciona
  if (!user || user.role !== 'professor') {
    navigate('/login');
    return null;
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br bg-primary-bg  p-4 md:p-8">
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} userRole="professor" />
      <div className="max-w-full mx-auto">
        {/* Cabeçalho com gradiente */}
        <header className="mb-12 text-center bg-gradient-to-r from-[#ffbd30] to-[#ffa000] p-6 rounded-2xl shadow-2xl border-b-4 border-[#ffcc5c]">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#2c3135]">
            Painel do Professor
          </h1>
          <p className="mt-2 text-xl text-[#2c3135]">
            Olá, <span className="font-semibold bg-secondary-bg/30 px-2 py-1 rounded-md">{user.name}</span>! Gerencie suas atividades e turmas.
          </p>
        </header>

        <main id="tour-professor-dashboard" >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Card para Gerenciar Turmas */}
            <Link id="tour-dash-classes"
              to="/professor/gerenciar-turmas"
              className="group block p-6 bg-secondary-bg rounded-2xl shadow-xl hover:shadow-2xl border-l-4 border-[#69e8cb] hover:border-[#ffbd30] transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#69e8cb]/20 to-[#69e8cb]/50 mb-6 group-hover:from-[#ffbd30]/20 group-hover:to-[#ffbd30]/50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#69e8cb] group-hover:text-[#ffbd30] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-primary-text">Gerenciar Turmas</h3>
              <p className="mt-2 text-secondary-text">Crie, visualize e edite suas turmas.</p>
              <div className="mt-4 flex items-center text-[#69e8cb] group-hover:text-[#ffbd30] transition-colors">
                <span>Acessar</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>

            {/* Card para Criar Atividade */}
            <Link id="tour-dash-create-btn"
              to="/professor/criar-atividade"
              className="group block p-6 bg-secondary-bg rounded-2xl shadow-xl hover:shadow-2xl border-l-4 border-[#ffbd30] hover:border-[#9570d9] transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#ffbd30]/20 to-[#ffbd30]/50 mb-6 group-hover:from-[#9570d9]/20 group-hover:to-[#9570d9]/50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#ffbd30] group-hover:text-[#9570d9] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6M6 6h12v12H6V6z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-primary-text">Criar Atividade</h3>
              <p className="mt-2 text-secondary-text">Elabore novas atividades para seus alunos.</p>
              <div className="mt-4 flex items-center text-[#ffbd30] group-hover:text-[#9570d9] transition-colors">
                <span>Acessar</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>

            {/* Card para Banco de Atividades */}
            <Link id="tour-dash-bank"
              to="/professor/banco-atividades"
              className="group block p-6 bg-secondary-bg rounded-2xl shadow-xl hover:shadow-2xl border-l-4 border-[#9570d9] hover:border-[#69e8cb] transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#9570d9]/20 to-[#9570d9]/50 mb-6 group-hover:from-[#69e8cb]/20 group-hover:to-[#69e8cb]/50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#9570d9] group-hover:text-[#69e8cb] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-primary-text">Banco de Atividades</h3>
              <p className="mt-2 text-secondary-text">Reutilize e gerencie suas atividades criadas.</p>
              <div className="mt-4 flex items-center text-[#9570d9] group-hover:text-[#69e8cb] transition-colors">
                <span>Acessar</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>

            {/* Card para Desempenho de Alunos */}
            <Link id="tour-dash-performance"
              to="/professor/desempenho-alunos"
              className="group block p-6 bg-secondary-bg rounded-2xl shadow-xl hover:shadow-2xl border-l-4 border-[#69e8cb] hover:border-[#ffbd30] transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#69e8cb]/20 to-[#69e8cb]/50 mb-6 group-hover:from-[#ffbd30]/20 group-hover:to-[#ffbd30]/50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#69e8cb] group-hover:text-[#ffbd30] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-primary-text">Desempenho Alunos</h3>
              <p className="mt-2 text-secondary-text">Acompanhe o progresso dos seus alunos.</p>
              <div className="mt-4 flex items-center text-[#69e8cb] group-hover:text-[#ffbd30] transition-colors">
                <span>Acessar</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>

            {/* Card para Dashboard */}
            <Link id="tour-dash-ranking"
              to="/professor/ranking"
              className="group block p-6 bg-secondary-bg rounded-2xl shadow-xl hover:shadow-2xl border-l-4 border-[#ffbd30] hover:border-[#9570d9] transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#ffbd30]/20 to-[#ffbd30]/50 mb-6 group-hover:from-[#9570d9]/20 group-hover:to-[#9570d9]/50 transition-all">
                {/* Ícone de Troféu */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#ffbd30] group-hover:text-[#9570d9] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" transform="rotate(180 12 12)" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" transform="scale(0.8) translate(3, 3)" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-primary-text">Ranking de Professores</h3>
              <p className="mt-2 text-secondary-text">Veja sua posição e a dos seus colegas.</p>
              <div className="mt-4 flex items-center text-[#ffbd30] group-hover:text-[#9570d9] transition-colors">
                <span>Acessar</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>

            {/* Card para Configurações */}
            <Link
              to="/perfil"
              className="group block p-6 bg-secondary-bg rounded-2xl shadow-xl hover:shadow-2xl border-l-4 border-[#9570d9] hover:border-[#69e8cb] transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#9570d9]/20 to-[#9570d9]/50 mb-6 group-hover:from-[#69e8cb]/20 group-hover:to-[#69e8cb]/50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#9570d9] group-hover:text-[#69e8cb] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-primary-text">Minhas Configurações</h3>
              <p className="mt-2 text-secondary-text">Personalize sua conta e preferências.</p>
              <div className="mt-4 flex items-center text-[#9570d9] group-hover:text-[#69e8cb] transition-colors">
                <span>Acessar</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>
          </div>
        </main>

        {/* Rodapé com informações */}
        <footer className="mt-16 text-center text-secondary-text text-sm border-t border-[#3e4a52] pt-6">
          <p>Portal de Gamificação Educacional • Painel do Professor</p>
          <p className="mt-1">Acessado como: {user.email}</p>
        </footer>
      </div>
    </div>
  );
}

export default TeacherDashboardPage;