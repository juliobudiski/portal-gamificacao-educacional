// frontend/src/pages/UserProfilePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function UserProfilePage() {
  console.log('UserProfilePage: Componente renderizado.');
  const { user, logout, login, updateUserData} = useAuth();
  const navigate = useNavigate();

  console.log('UserProfilePage: Estado inicial do usuário:', user);

  // Estados para controle de visibilidade dos formulários
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [showProfileCompletionForm, setShowProfileCompletionForm] = useState(false);
  console.log('UserProfilePage: Estados de visibilidade inicializados.');

  // Estados para o formulário de alteração de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  console.log('UserProfilePage: Estados do formulário de senha inicializados.');

  // Estados para o formulário de completar perfil (Professor)
  const [profileInstitutionName, setProfileInstitutionName] = useState(user?.institutionName || '');
  const [profileDiscipline, setProfileDiscipline] = useState(user?.discipline || '');
  const [profileMessage, setProfileMessage] = useState('');
  console.log('UserProfilePage: Estados do formulário de perfil inicializados com:', { profileInstitutionName, profileDiscipline });

  // Flag para controlar se a atualização de perfil foi bem-sucedida
  const profileUpdateSuccessRef = useRef(false);
  console.log('UserProfilePage: useRef para profileUpdateSuccessRef inicializado.');

  // Efeito para redirecionar se o usuário não estiver logado e preencher campos
  useEffect(() => {
    console.log('UserProfilePage: useEffect executado. Verificando estado do usuário...');
    if (!user) {
      console.log('UserProfilePage: Usuário não logado, redirecionando para /login.');
      navigate('/login');
      return;
    }
    console.log('UserProfilePage: Usuário logado:', user);
    console.log('UserProfilePage: Dados do usuário no contexto (useEffect):', user);

    // Preenche os campos do perfil ao carregar ou quando o usuário é atualizado
    console.log('UserProfilePage: Preenchendo campos de perfil com dados do usuário.');
    setProfileInstitutionName(user.institutionName || '');
    setProfileDiscipline(user.discipline || '');
    console.log('UserProfilePage: Campos de perfil preenchidos:', { institution: user.institutionName, discipline: user.discipline });


    // Limpa a mensagem se o formulário de perfil for fechado por outros meios
    // ou se o usuário navegar para esta página e não houver um sucesso pendente.
    // Apenas limpa a mensagem se não foi um sucesso de atualização de perfil.
    if (!profileUpdateSuccessRef.current) {
        console.log('UserProfilePage: profileUpdateSuccessRef.current é false, limpando profileMessage.');
        setProfileMessage('');
    } else {
        console.log('UserProfilePage: profileUpdateSuccessRef.current é true, resetando a flag após exibição da mensagem.');
        // Reseta a flag após a mensagem ser exibida na nova renderização
        profileUpdateSuccessRef.current = false;
    }
    console.log('UserProfilePage: Limpando mensagem de senha.');
    setMessage(''); // Sempre limpa a mensagem de senha ao renderizar/re-renderizar

    
    


  }, [user, navigate]); // Dependências do useEffect

  if (!user) {
    console.log('UserProfilePage: Usuário é nulo na renderização, retornando null.');
    return null; // Ou um spinner de carregamento, enquanto o redirecionamento acontece
  }

  // Função para lidar com a alteração de senha
  const handleChangePassword = async (e) => {
    console.log('handleChangePassword: Função iniciada.');
    e.preventDefault();
    setMessage('');
    console.log('handleChangePassword: Mensagem de senha limpa.');

    if (newPassword !== confirmNewPassword) {
      console.log('handleChangePassword: Erro - Senhas não coincidem.');
      setMessage('Erro: A nova senha e a confirmação não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      console.log('handleChangePassword: Erro - Nova senha muito curta.');
      setMessage('Erro: A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      console.log('handleChangePassword: Tentando chamar a API de alteração de senha.');
      const response = await fetch('http://127.0.0.1:5000/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      console.log('handleChangePassword: Resposta da API recebida.', response);

      const data = await response.json();
      console.log('handleChangePassword: Dados da resposta da API:', data);

      if (response.ok) {
        console.log('handleChangePassword: Senha alterada com sucesso!');
        setMessage('Senha alterada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        console.log('handleChangePassword: Campos de senha limpos.');
        // Fecha o formulário após a mensagem de sucesso
        setTimeout(() => {
          console.log('handleChangePassword: Fechando formulário de alteração de senha.');
          setShowPasswordChangeForm(false);
          setMessage(''); // Limpa a mensagem após fechar o formulário
          console.log('handleChangePassword: Mensagem de senha limpa após fechar formulário.');
        }, 2000); // Exibe a mensagem por 2 segundos
      } else {
        console.log('handleChangePassword: Erro ao alterar a senha:', data.message);
        setMessage(data.message || 'Erro ao alterar a senha.');
      }
    } catch (error) {
      console.error('handleChangePassword: Erro ao alterar senha (catch):', error);
      setMessage('Erro de conexão ao tentar alterar a senha.');
    }
  };

  // Função para lidar com o envio do formulário de perfil (Professor)
  const handleSubmitProfile = async (e) => {
    console.log('handleSubmitProfile: Função iniciada.');
    e.preventDefault();
    setProfileMessage(''); // Limpa mensagens anteriores antes de uma nova tentativa
    console.log('handleSubmitProfile: Mensagem de perfil limpa.');

    try {
      console.log('handleSubmitProfile: Tentando chamar a API de atualização de perfil.');
      const response = await fetch('http://127.0.0.1:5000/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          institution_name: profileInstitutionName,
          discipline: profileDiscipline,
        }),
      });
      console.log('handleSubmitProfile: Resposta da API recebida.', response);

      const data = await response.json();
      console.log('handleSubmitProfile: Dados da resposta da API:', data);

      if (response.ok) {
        console.log('handleSubmitProfile: Informações do perfil salvas com sucesso!');
        setProfileMessage('Informações do perfil salvas com sucesso!');
        profileUpdateSuccessRef.current = true; // Define a flag de sucesso
        console.log('handleSubmitProfile: profileUpdateSuccessRef.current definido como true.');

        if (data.access_token) {
          console.log('handleSubmitProfile: Chamando updateUserData com novo access_token.');
          updateUserData({ access_token: data.access_token }); // <-- MUDANÇA AQUI
        } else if (data.user) {
          console.log('handleSubmitProfile: Chamando updateUserData com objeto user (sem novo token).');
          updateUserData(data.user); // <-- MUDANÇA AQUI (Fallback, se o backend não retornar token)
        }
        else {
          console.warn("handleSubmitProfile: Backend não retornou 'access_token' ou 'user' após atualização de perfil. O perfil pode não estar totalmente atualizado no frontend.");
        }

        // Atraso de 2 segundos para exibir a mensagem antes de esconder o formulário
        setTimeout(() => {
          console.log('handleSubmitProfile: Limpando mensagem de perfil e escondendo formulário.');
          setProfileMessage(''); // Limpa a mensagem
          setShowProfileCompletionForm(false); // Esconde o formulário
        }, 2000); // 2 segundos de atraso

      } else {
        console.log('handleSubmitProfile: Erro ao salvar informações do perfil:', data.message);
        setProfileMessage(data.message || 'Erro ao salvar informações do perfil.');
      }
    } catch (error) {
      console.error('handleSubmitProfile: Erro ao salvar perfil (catch):', error);
      setProfileMessage('Erro de conexão ao tentar salvar as informações do perfil.');
    }
  };

  // Função para lidar com o logout
  const handleLogout = () => {
    console.log('handleLogout: Função iniciada. Realizando logout...');
    logout();
    navigate('/login');
    console.log('handleLogout: Usuário deslogado e redirecionado para /login.');
  };

  console.log('UserProfilePage: Renderizando JSX do componente.');
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 dark:text-white">
        Meu Perfil
      </h2>
      <div className="w-full max-w-md space-y-4 text-center">
        {/* Informações do Usuário */}
        <p className="text-gray-700 dark:text-gray-200 text-lg">
          <span className="font-semibold">Nome:</span> {user.name || 'Não informado'}
        </p>
        <p className="text-gray-700 dark:text-gray-200 text-lg">
          <span className="font-semibold">Email:</span> {user.email}
        </p>
        <p className="text-gray-700 dark:text-gray-200 text-lg">
          <span className="font-semibold">Tipo de Perfil:</span> {user.role === 'aluno' ? 'Aluno' : 'Professor'}
        </p>
        {/* Novas informações do perfil do professor */}
        {user.role === 'professor' && user.institutionName && (
          <p className="text-gray-700 dark:text-gray-200 text-lg">
            <span className="font-semibold">Instituição:</span> {user.institutionName}
          </p>
        )}
        {user.role === 'professor' && user.discipline && (
          <p className="text-gray-700 dark:text-gray-200 text-lg">
            <span className="font-semibold">Disciplina:</span> {user.discipline}
          </p>
        )}

        {user.profile_picture && user.google_id && (
          <div className="mb-4">
            <img
              src={user.profile_picture}
              alt="Foto de Perfil do Google"
              className="w-24 h-24 rounded-full mx-auto border-2 border-blue-500"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Logado com Google</p>
          </div>
        )}

        <hr className="my-8 border-t border-gray-300 dark:border-gray-600" />

        {/* Menu de Ícones Condicional para Professor */}
        {user.role === 'professor' && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow-inner dark:bg-gray-700">
            <h3 className="text-xl font-bold text-gray-900 mb-4 dark:text-white">Opções do Professor</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/professor/gerenciar-turmas" className="flex flex-col items-center p-4 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:hover:bg-blue-800">
                <span role="img" aria-label="Gerenciar Turmas" className="text-3xl mb-2">🧑‍🏫</span>
                <span className="text-blue-800 font-semibold dark:text-blue-200 text-center">Gerenciar Turmas</span>
              </Link>
              <Link to="/professor/criar-atividade" className="flex flex-col items-center p-4 bg-green-100 rounded-lg hover:bg-green-200 transition-colors dark:bg-green-900 dark:hover:bg-green-800">
                <span role="img" aria-label="Criar Atividade" className="text-3xl mb-2">📝</span>
                <span className="text-green-800 font-semibold dark:text-green-200 text-center">Criar Atividade</span>
              </Link>
              <Link to="/professor/banco-atividades" className="flex flex-col items-center p-4 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors dark:bg-purple-900 dark:hover:bg-purple-800">
                <span role="img" aria-label="Banco de Atividades" className="text-3xl mb-2">📚</span>
                <span className="text-purple-800 font-semibold dark:text-purple-200 text-center">Banco de Atividades</span>
              </Link>
            </div>
          </div>
        )}

        <hr className="my-8 border-t border-gray-300 dark:border-gray-600" />

        {/* Botão para Completar/Editar Perfil do Professor */}
        {user.role === 'professor' && (
          <>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">Informações Complementares</h3>
            <button
              onClick={() => {
                console.log('Botão "Completar/Editar Informações Profissionais" clicado. showProfileCompletionForm antes:', showProfileCompletionForm);
                setShowProfileCompletionForm(!showProfileCompletionForm);
                setProfileMessage(''); // Limpa a mensagem ao abrir/fechar o formulário manualmente
                profileUpdateSuccessRef.current = false; // Reseta a flag
                console.log('Botão "Completar/Editar Informações Profissionais" clicado. showProfileCompletionForm depois:', !showProfileCompletionForm);
              }}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {showProfileCompletionForm ? 'Cancelar Edição de Informações' : 'Completar/Editar Informações Profissionais'}
            </button>
          </>
        )}

        {/* Formulário de Completar Perfil (condicionalmente visível) */}
        {user.role === 'professor' && showProfileCompletionForm && (
          <form onSubmit={handleSubmitProfile} className="w-full space-y-4 mt-4">
            {console.log('Renderizando formulário de completar perfil. profileMessage:', profileMessage)}
            {profileMessage && (
              <div className={`px-4 py-3 rounded relative ${profileMessage.startsWith('Erro') ? 'bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-100' : 'bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-100'}`} role="alert">
                <span className="block sm:inline">{profileMessage}</span>
              </div>
            )}
            <div>
              <label htmlFor="profileInstitutionName" className="block text-sm font-medium text-gray-700 text-left dark:text-gray-200">
                Nome da Instituição de Ensino:
              </label>
              <input
                type="text"
                id="profileInstitutionName"
                value={profileInstitutionName}
                onChange={(e) => {
                  console.log('Input Instituição: Novo valor:', e.target.value);
                  setProfileInstitutionName(e.target.value);
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ex: Universidade XYZ"
              />
            </div>
            <div>
              <label htmlFor="profileDiscipline" className="block text-sm font-medium text-gray-700 text-left dark:text-gray-200">
                Nome da Disciplina/Matéria:
              </label>
              <input
                type="text"
                id="profileDiscipline"
                value={profileDiscipline}
                onChange={(e) => {
                  console.log('Input Disciplina: Novo valor:', e.target.value);
                  setProfileDiscipline(e.target.value);
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ex: Engenharia de Software"
              />
            </div>
            <button
              type="submit"
              onClick={() => console.log('Botão de submit clicado!')} // NOVO LOG TEMPORÁRIO
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out dark:bg-green-700 dark:hover:bg-green-800"
            >
              Salvar Informações do Perfil
            </button>
          </form>
        )}

        <hr className="my-8 border-t border-gray-300 dark:border-gray-600" />

        {/* Botão para Alterar Senha (visível apenas para login tradicional) */}
        {!user.google_id && (
          <>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">Segurança da Conta</h3>
            <button
              onClick={() => {
                console.log('Botão "Alterar Senha" clicado. showPasswordChangeForm antes:', showPasswordChangeForm);
                setShowPasswordChangeForm(!showPasswordChangeForm);
                setMessage(''); // Limpa a mensagem ao abrir/fechar o formulário manualmente
                console.log('Botão "Alterar Senha" clicado. showPasswordChangeForm depois:', !showPasswordChangeForm);
              }}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out dark:bg-indigo-700 dark:hover:bg-indigo-800"
            >
              {showPasswordChangeForm ? 'Cancelar Alteração de Senha' : 'Alterar Senha'}
            </button>
          </>
        )}

        {/* Mensagem para usuários Google */}
        {user.google_id && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Você fez login usando o Google. Gerencie sua senha através da sua conta Google.
          </p>
        )}

        {/* Formulário de Alteração de Senha (condicionalmente visível) */}
        {!user.google_id && showPasswordChangeForm && (
          <form onSubmit={handleChangePassword} className="w-full space-y-4 mt-4">
            {console.log('Renderizando formulário de alteração de senha. message:', message)}
            {message && (
              <div className={`px-4 py-3 rounded relative ${message.startsWith('Erro') ? 'bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-100' : 'bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-100'}`} role="alert">
                <span className="block sm:inline">{message}</span>
              </div>
            )}
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 text-left dark:text-gray-200">
                Senha Atual
              </label>
              <input
                type="password"
                id="current-password"
                value={currentPassword}
                onChange={(e) => {
                  console.log('Input Senha Atual: Novo valor (oculto):', e.target.value ? '******' : '');
                  setCurrentPassword(e.target.value);
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 text-left dark:text-gray-200">
                Nova Senha
              </label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => {
                  console.log('Input Nova Senha: Novo valor (oculto):', e.target.value ? '******' : '');
                  setNewPassword(e.target.value);
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 text-left dark:text-gray-200">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                id="confirm-new-password"
                value={confirmNewPassword}
                onChange={(e) => {
                  console.log('Input Confirmar Nova Senha: Novo valor (oculto):', e.target.value ? '******' : '');
                  setConfirmNewPassword(e.target.value);
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-blue-600"
            >
              Alterar Senha
            </button>
          </form>
        )}

        {/* Botão Sair */}
        <button
          onClick={handleLogout}
          className="mt-8 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-600"
        >
          Sair
        </button>
      </div>
    </div>
  );
}

export default UserProfilePage;
