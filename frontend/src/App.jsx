import { Routes, Route, Link } from 'react-router-dom';
import './App.css'; // Mantenha ou remova se não for usar os estilos padrão
import PrivateRoute from './components/PrivateRoute'; // Certifique-se de que o caminho está correto
// Importe os componentes das suas novas páginas
import HomePage from './pages/HomePage'; // Certifique-se de que está importando a Homepage
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
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    // O fundo padrão será 'bg-gray-100', mas no modo escuro será 'dark:bg-gray-900'
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center p-4">
      <nav className="w-full max-w-4xl bg-blue-600 text-white p-4 rounded-lg shadow-md mb-8 mx-auto
                    dark:bg-blue-800"> {/* Cor da nav no modo escuro */}
        <ul className="flex justify-around">
          {/* Adicione 'dark:text-blue-200' e ajuste o hover para o dark mode */}
          <li><Link to="/" className="hover:underline px-4 py-2 rounded-md transition-colors duration-200 hover:bg-blue-700 dark:hover:bg-blue-900 dark:text-white">Início</Link></li>
          <li><Link to="/login" className="hover:underline px-4 py-2 rounded-md transition-colors duration-200 hover:bg-blue-700 dark:hover:bg-blue-900 dark:text-white">Login</Link></li>
          <li><Link to="/cadastro" className="hover:underline px-4 py-2 rounded-md transition-colors duration-200 hover:bg-blue-700 dark:hover:bg-blue-900 dark:text-white">Cadastro</Link></li>
          <li><Link to="/recuperar-senha" className="hover:underline px-4 py-2 rounded-md transition-colors duration-200 hover:bg-blue-700 dark:hover:bg-blue-900 dark:text-white">Recuperar Senha</Link></li>
          <li><Link to="/perfil" className="hover:underline px-4 py-2 rounded-md transition-colors duration-200 hover:bg-blue-700 dark:hover:bg-blue-900 dark:text-white">Perfil</Link></li>
          <li><Link to="/professor/dashboard" className="hover:underline px-4 py-2 rounded-md transition-colors duration-200 hover:bg-blue-700 dark:hover:bg-blue-900 dark:text-white">Dashboard Prof.</Link></li>
          <li><Link to="/aluno/dashboard" className="hover:underline px-4 py-2 rounded-md transition-colors duration-200 hover:bg-blue-700 dark:hover:bg-blue-900 dark:text-white">Dashboard Aluno</Link></li>
        </ul>
      </nav>

      <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg mx-auto
                    dark:bg-gray-800 dark:text-gray-100"> {/* Cor do conteúdo principal no modo escuro */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          
          {/* Rotas Protegidas - Apenas para usuários autenticados */}
          {/* Para rotas que qualquer usuário autenticado pode acessar, use PrivateRoute sem allowedRoles */}
          <Route element={<PrivateRoute />}>
            <Route path="/perfil" element={<UserProfilePage />} />
            {/* Adicione outras rotas que qualquer usuário logado pode acessar aqui */}
          </Route>

          {/* Rotas Protegidas - Apenas para Professores */}
          <Route element={<PrivateRoute allowedRoles={['professor']} />}>
            <Route path="/professor/dashboard" element={<TeacherDashboardPage />} />
            <Route path="/professor/criar-atividade" element={<ActivityCreationPage />} />
            <Route path="/professor/banco-atividades" element={<ActivityBankPage />} />
            <Route path="/professor/gerenciar-turmas" element={<ClassManagementPage />} />
            <Route path="/professor/desempenho-alunos" element={<StudentPerformancePage />} />
          </Route>

          {/* Rotas Protegidas - Apenas para Alunos */}
          <Route element={<PrivateRoute allowedRoles={['aluno']} />}>
            <Route path="/aluno/dashboard" element={<StudentDashboardPage />} />
            <Route path="/aluno/entrar-turma" element={<JoinClassPage />} />
            <Route path="/aluno/atividade/:id" element={<StudentActivityPage />} />
          </Route>

          {/* Rota para páginas não encontradas */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
