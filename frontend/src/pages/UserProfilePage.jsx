// frontend/src/pages/UserProfilePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AvatarSelectionModal from '../components/AvatarSelectionModal'; // Importa o novo componente

function UserProfilePage() {
  const { user, logout, updateUserData } = useAuth();
  const navigate = useNavigate();

  // Se o usuário não estiver carregado, não renderiza nada para evitar erros.
  // O useEffect abaixo cuidará do redirecionamento.
  if (!user) {
    return null; 
  }

  // Estados para controle de visibilidade dos formulários
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [showProfileCompletionForm, setShowProfileCompletionForm] = useState(false);

  // Estados para o formulário de alteração de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('');

  // Estados para o formulário de completar perfil (Professor)
  const [profileInstitutionName, setProfileInstitutionName] = useState(user?.institutionName || '');
  const [profileDiscipline, setProfileDiscipline] = useState(user?.discipline || '');
  const [profileMessage, setProfileMessage] = useState('');

  const [showAvatarModal, setShowAvatarModal] = useState(false); // Estado para controlar o modal


  // Efeito para redirecionar se o usuário não estiver logado
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Função para o aluno/professor selecionar um novo avatar
  const handleSelectAvatar = async (avatarUrl) => {
      setAvatarMessage('Atualizando avatar...');
      try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/select-avatar`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ avatar_url: avatarUrl }),
          });

          const data = await response.json();

          if (response.ok) {
              setAvatarMessage('Avatar atualizado com sucesso!');
              if (data.user) {
                  updateUserData(data.user); // Atualiza o contexto
              }
              setShowAvatarModal(false); // Fecha o modal
          } else {
              setAvatarMessage(data.message || 'Erro ao selecionar o avatar.');
          }
      } catch (error) {
          setAvatarMessage('Erro de conexão ao selecionar o avatar.');
      } finally {
          setTimeout(() => setAvatarMessage(''), 3000);
      }
  };

  // Define a URL base do servidor para construir o caminho das imagens
  const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';



  // Função para lidar com a alteração de senha
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');

    if (newPassword !== confirmNewPassword) {
      setMessage('Erro: A nova senha e a confirmação não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('Erro: A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Buscando o token mais recente
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Senha alterada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setShowPasswordChangeForm(false);
          setMessage('');
        }, 2000);
      } else {
        setMessage(data.message || 'Erro ao alterar a senha.');
      }
    } catch (error) {
      setMessage('Erro de conexão ao tentar alterar a senha.');
    }
  };

  // Função para lidar com o envio do formulário de perfil (Professor)
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    console.log("--- Iniciando handleSubmitProfile ---");

    const token = localStorage.getItem('token');
    if (!token) {
        console.error("DEBUG: Token de autorização não encontrado.");
        setProfileMessage("Erro: Você não está autenticado.");
        return;
    }

    const payload = {
        institution_name: profileInstitutionName,
        discipline: profileDiscipline,
    };
    console.log("DEBUG: Enviando payload:", payload);

    // --- MUDANÇA PRINCIPAL AQUI ---
    // Trocamos a variável de ambiente pela URL direta para garantir que funcione.
    const apiUrl = 'http://127.0.0.1:5000/api/user/update-profile'; 
    console.log("DEBUG: URL da API (hardcoded):", apiUrl);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });

        console.log(`DEBUG: Status da resposta: ${response.status}`);
        const data = await response.json();
        console.log("DEBUG: Resposta do servidor:", data);

        if (response.ok) {
            setProfileMessage('Informações salvas com sucesso!');
            if (data.user) {
                updateUserData(data.user);
            }
            setTimeout(() => {
                setProfileMessage('');
                setShowProfileCompletionForm(false);
            }, 2000);
        } else {
            console.error("DEBUG: Erro do servidor:", data.message);
            setProfileMessage(data.message || 'Erro ao salvar informações.');
        }
    } catch (error) {
        console.error("--- ERRO NO CATCH ---", error);
        setProfileMessage('Erro de conexão. Verifique se o servidor backend está rodando.');
    }
  };


  // Função para lidar com o logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Decide qual avatar exibir
  const displayAvatar = user.profile_picture 
      ? (user.profile_picture.startsWith('/avatars/') ? user.profile_picture : `${serverUrl}${user.profile_picture}`)
      : `https://ui-avatars.com/api/?name=${user.name}&background=random`;


  return (
        <>
            {/* O Modal de seleção de avatares */}
            {showAvatarModal && (
                <AvatarSelectionModal 
                    onSelect={handleSelectAvatar}
                    onClose={() => setShowAvatarModal(false)}
                />
            )}

            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center py-12 px-4">
                <div className="max-w-xl w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                            Meu Perfil
                        </h2>
                    </div>
                    
                    {/* Informações do Usuário */}
                    <div className="space-y-4 text-left border-t border-gray-200 dark:border-gray-700 pt-8 text-center">
                        <div className="flex flex-col items-center pt-4">
                            <img 
                                src={displayAvatar}
                                alt="Foto de Perfil" 
                                className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover"
                            />
                             {user.google_id && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Logado com Google</p>
                            )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-200 text-lg"><span className="font-semibold">Nome:</span> {user.name || 'Não informado'}</p>
                        <p className="text-gray-700 dark:text-gray-200 text-lg"><span className="font-semibold">Email:</span> {user.email}</p>
                        <p className="text-gray-700 dark:text-gray-200 text-lg"><span className="font-semibold">Tipo de Perfil:</span> {user.role === 'aluno' ? 'Aluno' : 'Professor'}</p>
                    </div>

                    {/* Botão para abrir a galeria de avatares */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                         <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white">Personalização</h3>
                         {avatarMessage && <div className={`text-center p-2 mt-4 rounded ${avatarMessage.includes('Erro') ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>{avatarMessage}</div>}
                         <button
                            onClick={() => setShowAvatarModal(true)}
                            className="mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                        >
                            Escolher novo Avatar
                        </button>
                    </div>

                    {/* Formulário para Completar/Editar Perfil (Professor) <-- RE-ADICIONADO */}
                    {user.role === 'professor' && (
                        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8">
                             <h3 className="text-xl font-bold text-gray-900 dark:text-white">Informações Profissionais</h3>
                             <button onClick={() => setShowProfileCompletionForm(!showProfileCompletionForm)} className="w-full py-2 px-4 border rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                                {showProfileCompletionForm ? 'Cancelar Edição' : 'Completar / Editar Informações'}
                             </button>
                            {showProfileCompletionForm && (
                                <form onSubmit={handleSubmitProfile} className="space-y-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    {profileMessage && <div className={`text-center p-2 rounded ${profileMessage.includes('Erro') ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>{profileMessage}</div>}
                                    <div>
                                        <label htmlFor="profileInstitutionName" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Instituição de Ensino:</label>
                                        <input type="text" id="profileInstitutionName" value={profileInstitutionName} onChange={(e) => setProfileInstitutionName(e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:text-white" placeholder="Ex: Universidade XYZ"/>
                                    </div>
                                    <div>
                                        <label htmlFor="profileDiscipline" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Disciplina/Matéria:</label>
                                        <input type="text" id="profileDiscipline" value={profileDiscipline} onChange={(e) => setProfileDiscipline(e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:text-white" placeholder="Ex: Engenharia de Software"/>
                                    </div>
                                    <button type="submit" className="w-full py-2 px-4 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">Salvar Informações</button>
                                </form>
                            )}
                        </div>
                    )}



                    {/* Seção de Conquistas (Apenas para Alunos) */}
                    {user.role === 'aluno' && (
                        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Minhas Conquistas</h3>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                                <p className="text-gray-500 dark:text-gray-400">Em breve, suas medalhas e insígnias aparecerão aqui!</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Alteração de Senha (Apenas para login tradicional) */}
                    {!user.google_id && (
                        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Segurança</h3>
                            <button onClick={() => setShowPasswordChangeForm(!showPasswordChangeForm)}
                                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                {showPasswordChangeForm ? 'Cancelar' : 'Alterar Senha'}
                            </button>
                            {showPasswordChangeForm && (
                                <form onSubmit={handleChangePassword} className="space-y-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    {message && <div className={`text-center p-2 rounded ${message.startsWith('Erro') ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>{message}</div>}
                                    <div>
                                        <label>Senha Atual:</label>
                                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:text-white"/>
                                    </div>
                                    <div>
                                        <label>Nova Senha:</label>
                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:text-white"/>
                                    </div>
                                    <div>
                                        <label>Confirmar Nova Senha:</label>
                                        <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:text-white"/>
                                    </div>
                                    <button type="submit" className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">Confirmar Alteração</button>
                                </form>
                            )}
                        </div>
                    )}
                
                    {/* Botão Sair */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                        <button onClick={handleLogout}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default UserProfilePage;
