import { Routes, Route, Link } from 'react-router-dom';
import './App.css'; // Mantenha ou remova se não for usar os estilos padrão

// Importe os componentes das suas novas páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UserProfilePage from './pages/UserProfilePage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import ActivityCreationPage from './pages/ActivityCreationPage';
import ActivityBankPage from './pages/ActivityBankPage';
import ClassManagementPage from './pages/ClassManagementPage';
import StudentPerformancePage from './pages/StudentPerformancePage';
import StudentActivityPage from './pages/StudentActivityPage';
import JoinClassPage from './pages/JoinClassPage';
import NotFoundPage from './pages/NotFoundPage'; // Renomeei para ser consistente com o padrão Page

function App() {
  return (
    <div className="App">
      <nav>
        {/* Barra de navegação simples - Você pode estilizar isso depois */}
        <ul>
          <li><Link to="/">Início</Link></li> {/* Pode ser a Home/Dashboard inicial */}
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/cadastro">Cadastro</Link></li>
          <li><Link to="/recuperar-senha">Recuperar Senha</Link></li>
          {/* Adicione links para outras páginas importantes conforme for desenvolvendo */}
          <li><Link to="/perfil">Perfil</Link></li>
          <li><Link to="/professor/dashboard">Dashboard Prof.</Link></li>
          <li><Link to="/aluno/dashboard">Dashboard Aluno</Link></li>
        </ul>
      </nav>

      <Routes>
        {/* Rotas de Autenticação/Conta */}
        <Route path="/" element={<LoginPage />} /> {/* Rota inicial pode ser a de login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
        <Route path="/perfil" element={<UserProfilePage />} />

        {/* Rotas do Professor */}
        <Route path="/professor/dashboard" element={<TeacherDashboardPage />} />
        <Route path="/professor/criar-atividade" element={<ActivityCreationPage />} />
        <Route path="/professor/banco-atividades" element={<ActivityBankPage />} />
        <Route path="/professor/gerenciar-turmas" element={<ClassManagementPage />} />
        <Route path="/professor/desempenho-alunos" element={<StudentPerformancePage />} />

        {/* Rotas do Aluno */}
        <Route path="/aluno/dashboard" element={<StudentDashboardPage />} />
        <Route path="/aluno/entrar-turma" element={<JoinClassPage />} />
        <Route path="/aluno/atividade/:id" element={<StudentActivityPage />} /> {/* Exemplo de rota com ID */}
        {/* RF008.2 Visualização de Turmas - pode ser parte do StudentDashboard ou uma rota separada */}
        {/* RF010 Progresso e Feedback - pode ser parte do StudentActivityPage ou StudentDashboard */}

        {/* Rota para 404 - Página Não Encontrada */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;