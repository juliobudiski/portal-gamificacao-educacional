// frontend/src/pages/UserProfilePage.jsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AvatarSelectionModal from '../components/AvatarSelectionModal';
import { useProfileManagement } from '../hooks/useProfileManagement';
import { usePasswordManagement } from '../hooks/usePasswordManagement';
import { 
  FaUser, 
  FaLock, 
  FaGraduationCap, 
  FaMedal, 
  FaSignOutAlt, 
  FaUniversity, 
  FaBook, 
  FaKey, 
  FaEdit, 
  FaCheck 
} from "react-icons/fa";

function UserProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Estados para controle de UI
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [showProfileCompletionForm, setShowProfileCompletionForm] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Estados locais para formulário de perfil (Professor)
  const [profileInstitutionName, setProfileInstitutionName] = useState(user?.institutionName || '');
  const [profileDiscipline, setProfileDiscipline] = useState(user?.discipline || '');

  // Hooks personalizados
  const {
    messages: profileMessages, // { error: string, success: string }
    isLoading: profileLoading,
    updateProfile,
    updateAvatar
  } = useProfileManagement();

  const {
    passwordData,
    message: passwordMessage,
    handleChange: handlePasswordChange,
    changePassword
  } = usePasswordManagement();

  // Se o usuário não estiver carregado, não renderiza nada
  if (!user) {
    return null; 
  }

  // Funções
  const handleSelectAvatar = useCallback(async (avatarUrl) => {
    await updateAvatar(avatarUrl);
    setShowAvatarModal(false);
  }, [updateAvatar]);

  const handleCloseModal = useCallback(() => {
    setShowAvatarModal(false);
  }, []);

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    await updateProfile({
      institution_name: profileInstitutionName,
      discipline: profileDiscipline
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    await changePassword();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define a URL base do servidor
  const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const displayAvatar = user.profile_picture 
    ? (user.profile_picture.startsWith('/avatars/') ? user.profile_picture : `${serverUrl}${user.profile_picture}`)
    : `https://ui-avatars.com/api/?name=${user.name}&background=random`;

  return (
    <>
      {showAvatarModal && (
        <AvatarSelectionModal 
          onSelect={handleSelectAvatar}
          onClose={handleCloseModal}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-[#2c3135] to-[#1a1e22] flex justify-center py-12 px-4">
        <div className="max-w-xl w-full space-y-8 bg-[#3a4046] p-8 rounded-2xl shadow-2xl border border-[#4a525a]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-[#ffbd30] to-[#ff9d00] rounded-full mb-4">
              <FaUser className="text-2xl text-[#2c3135]" />
            </div>
            <h2 className="text-center text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#69e8cb] to-[#9570d9]">
              Meu Perfil
            </h2>
          </div>
          
          {/* Informações do Usuário */}
          <div className="space-y-6 text-left border-t border-[#4a525a] pt-8 text-center">
            <div className="flex flex-col items-center pt-4">
              <div className="relative group">
                <img 
                  src={displayAvatar}
                  alt="Foto de Perfil" 
                  className="w-28 h-28 rounded-full border-4 border-[#69e8cb] object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd30]/20 to-[#9570d9]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              {user.google_id && (
                <p className="text-sm text-[#69e8cb] mt-2 flex items-center justify-center">
                  <span className="bg-[#ffbd30]/10 px-2 py-1 rounded-full">Logado com Google</span>
                </p>
              )}
            </div>
            
            <div className="space-y-3 bg-[#2c3135]/50 p-5 rounded-xl border border-[#4a525a]">
              <p className="text-gray-200 text-lg flex items-center">
                <span className="w-6 h-6 bg-[#ffbd30] rounded-full flex items-center justify-center mr-2">
                  <FaUser className="text-xs text-[#2c3135]" />
                </span>
                <span className="font-semibold mr-2">Nome:</span> 
                <span className="text-[#69e8cb]">{user.name || 'Não informado'}</span>
              </p>
              <p className="text-gray-200 text-lg flex items-center">
                <span className="w-6 h-6 bg-[#9570d9] rounded-full flex items-center justify-center mr-2">
                  <FaGraduationCap className="text-xs text-white" />
                </span>
                <span className="font-semibold mr-2">Email:</span> 
                <span className="text-[#69e8cb]">{user.email}</span>
              </p>
              <p className="text-gray-200 text-lg flex items-center">
                <span className="w-6 h-6 bg-[#69e8cb] rounded-full flex items-center justify-center mr-2">
                  <FaLock className="text-xs text-[#2c3135]" />
                </span>
                <span className="font-semibold mr-2">Tipo de Perfil:</span> 
                <span className={`px-2 py-1 rounded-full ${
                  user.role === 'aluno' 
                    ? 'bg-[#9570d9]/20 text-[#9570d9]' 
                    : 'bg-[#ffbd30]/20 text-[#ffbd30]'
                }`}>
                  {user.role === 'aluno' ? 'Aluno' : 'Professor'}
                </span>
              </p>
            </div>
          </div>

          {/* Personalização */}
          <div className="border-t border-[#4a525a] pt-8">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#69e8cb] to-[#9570d9] mb-4 flex items-center">
              <FaUser className="mr-2" /> Personalização
            </h3>
            
            {/* Mensagens de avatar */}
            {profileMessages.avatarError && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 mb-4 rounded-xl text-center">
                {profileMessages.avatarError}
              </div>
            )}
            {profileMessages.avatarSuccess && (
              <div className="bg-green-500/20 border border-green-500 text-green-300 p-3 mb-4 rounded-xl text-center">
                {profileMessages.avatarSuccess}
              </div>
            )}
            
            <button
              onClick={() => setShowAvatarModal(true)}
              className="mt-2 w-full py-3 px-4 rounded-xl shadow-lg text-sm font-medium text-[#2c3135] bg-gradient-to-r from-[#ffbd30] to-[#ff9d00] hover:from-[#ff9d00] hover:to-[#ffbd30] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center"
              disabled={profileLoading}
            >
              <FaEdit className="mr-2" />
              {profileLoading ? 'Carregando...' : 'Escolher novo Avatar'}
            </button>
          </div>

          {/* Formulário para Completar/Editar Perfil (Professor) */}
          {user.role === 'professor' && (
            <div className="space-y-4 border-t border-[#4a525a] pt-8">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#69e8cb] to-[#9570d9] mb-4 flex items-center">
                <FaUniversity className="mr-2" /> Informações Profissionais
              </h3>
              
              <button 
                onClick={() => setShowProfileCompletionForm(!showProfileCompletionForm)} 
                className="w-full py-3 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#9570d9] to-[#7a55c4] hover:from-[#7a55c4] hover:to-[#9570d9] transition-all duration-300 flex items-center justify-center"
                disabled={profileLoading}
              >
                <FaEdit className="mr-2" />
                {showProfileCompletionForm ? 'Cancelar Edição' : 'Completar / Editar Informações'}
              </button>
              
              {showProfileCompletionForm && (
                <form onSubmit={handleSubmitProfile} className="space-y-4 mt-4 p-5 bg-[#2c3135]/50 rounded-xl border border-[#4a525a]">
                  {/* Mensagens de perfil */}
                  {profileMessages.error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-xl text-center">
                      {profileMessages.error}
                    </div>
                  )}
                  {profileMessages.success && (
                    <div className="bg-green-500/20 border border-green-500 text-green-300 p-3 rounded-xl text-center">
                      {profileMessages.success}
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="profileInstitutionName" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <FaUniversity className="mr-2 text-[#ffbd30]" /> Instituição de Ensino:
                    </label>
                    <input 
                      type="text" 
                      id="profileInstitutionName" 
                      value={profileInstitutionName} 
                      onChange={(e) => setProfileInstitutionName(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-[#2c3135] border border-[#4a525a] text-gray-200 rounded-xl focus:ring-2 focus:ring-[#69e8cb] focus:border-transparent transition-all" 
                      placeholder="Ex: Universidade XYZ"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="profileDiscipline" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <FaBook className="mr-2 text-[#ffbd30]" /> Disciplina/Matéria:
                    </label>
                    <input 
                      type="text" 
                      id="profileDiscipline" 
                      value={profileDiscipline} 
                      onChange={(e) => setProfileDiscipline(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-[#2c3135] border border-[#4a525a] text-gray-200 rounded-xl focus:ring-2 focus:ring-[#69e8cb] focus:border-transparent transition-all" 
                      placeholder="Ex: Engenharia de Software"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full py-3 px-4 text-sm font-medium text-[#2c3135] bg-gradient-to-r from-[#69e8cb] to-[#4dd1b3] hover:from-[#4dd1b3] hover:to-[#69e8cb] rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center"
                    disabled={profileLoading}
                  >
                    <FaCheck className="mr-2" />
                    {profileLoading ? 'Salvando...' : 'Salvar Informações'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Seção de Conquistas (Apenas para Alunos) */}
          {user.role === 'aluno' && (
            <div className="space-y-4 border-t border-[#4a525a] pt-8">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd30] to-[#ff9d00] mb-4 flex items-center">
                <FaMedal className="mr-2" /> Minhas Conquistas
              </h3>
              <div className="p-5 bg-gradient-to-br from-[#2c3135]/50 to-[#1a1e22]/50 border border-[#4a525a] rounded-xl text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#ffbd30] to-[#ff9d00] rounded-full flex items-center justify-center">
                    <FaMedal className="text-2xl text-[#2c3135]" />
                  </div>
                </div>
                <p className="text-[#69e8cb] font-medium">
                  Em breve, suas medalhas e insígnias aparecerão aqui!
                </p>
                <div className="mt-4 h-2 bg-[#2c3135] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#69e8cb] to-[#9570d9] rounded-full"
                    style={{ width: '45%' }}
                  ></div>
                </div>
                <p className="text-gray-400 text-sm mt-2">Progresso: 45%</p>
              </div>
            </div>
          )}
          
          {/* Alteração de Senha (Apenas para login tradicional) */}
          {!user.google_id && (
            <div className="space-y-4 border-t border-[#4a525a] pt-8">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#69e8cb] to-[#4dd1b3] mb-4 flex items-center">
                <FaKey className="mr-2" /> Segurança
              </h3>
              
              <button 
                onClick={() => setShowPasswordChangeForm(!showPasswordChangeForm)}
                className="w-full py-3 px-4 rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-[#9570d9] to-[#7a55c4] hover:from-[#7a55c4] hover:to-[#9570d9] transition-all duration-300 flex items-center justify-center"
              >
                <FaLock className="mr-2" />
                {showPasswordChangeForm ? 'Cancelar' : 'Alterar Senha'}
              </button>
              
              {showPasswordChangeForm && (
                <form onSubmit={handleChangePassword} className="space-y-4 mt-4 p-5 bg-[#2c3135]/50 rounded-xl border border-[#4a525a]">
                  {/* Mensagem de senha */}
                  {passwordMessage && (
                    <div className={`p-3 rounded-xl text-center border ${
                      passwordMessage.includes('Erro') || passwordMessage.includes('inválida') 
                        ? 'bg-red-500/20 border-red-500 text-red-300' 
                        : 'bg-green-500/20 border-green-500 text-green-300'
                    }`}>
                      {passwordMessage}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <FaKey className="mr-2 text-[#ffbd30]" /> Senha Atual:
                    </label>
                    <input 
                      type="password" 
                      name="currentPassword"
                      value={passwordData.currentPassword} 
                      onChange={handlePasswordChange}
                      required 
                      className="mt-1 block w-full px-4 py-3 bg-[#2c3135] border border-[#4a525a] text-gray-200 rounded-xl focus:ring-2 focus:ring-[#69e8cb] focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <FaKey className="mr-2 text-[#69e8cb]" /> Nova Senha:
                    </label>
                    <input 
                      type="password" 
                      name="newPassword"
                      value={passwordData.newPassword} 
                      onChange={handlePasswordChange}
                      required 
                      className="mt-1 block w-full px-4 py-3 bg-[#2c3135] border border-[#4a525a] text-gray-200 rounded-xl focus:ring-2 focus:ring-[#69e8cb] focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <FaKey className="mr-2 text-[#9570d9]" /> Confirmar Nova Senha:
                    </label>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      value={passwordData.confirmPassword} 
                      onChange={handlePasswordChange}
                      required 
                      className="mt-1 block w-full px-4 py-3 bg-[#2c3135] border border-[#4a525a] text-gray-200 rounded-xl focus:ring-2 focus:ring-[#69e8cb] focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full py-3 px-4 text-sm font-medium text-[#2c3135] bg-gradient-to-r from-[#69e8cb] to-[#4dd1b3] hover:from-[#4dd1b3] hover:to-[#69e8cb] rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center"
                  >
                    <FaCheck className="mr-2" /> Confirmar Alteração
                  </button>
                </form>
              )}
            </div>
          )}
        
          {/* Botão Sair */}
          <div className="border-t border-[#4a525a] pt-8">
            <button 
              onClick={handleLogout}
              className="w-full py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-[#ff6b6b] to-[#ff4f4f] hover:from-[#ff4f4f] hover:to-[#ff6b6b] transition-all duration-300 flex items-center justify-center"
            >
              <FaSignOutAlt className="mr-2" /> Sair
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default UserProfilePage;