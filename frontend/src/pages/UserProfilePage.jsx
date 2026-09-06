// frontend/src/pages/UserProfilePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAnalytics from '../hooks/useAnalytics';
import { 
  FaUser, 
  FaLock, 
  FaUniversity, 
  FaKey, 
  FaSignOutAlt, 
  FaTrashAlt, 
  FaMapMarkerAlt, 
  FaGift, 
  FaRobot, 
  FaCamera, 
  FaEye, 
  FaEyeSlash,
  FaShieldAlt,
  FaAward,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";
import AvatarSelectionModal from '../components/AvatarSelectionModal';
import { useToast } from '../context/ToastContext';

/**
 * UserProfilePage
 * 
 * Architectural intent: Serves as the centralized user configuration hub, aggregating distinct domain
 * concerns (profile settings, API integrations, location rewards, security) into a unified interface.
 * It acts as a Container component managing complex local state for tabs and forms, while delegating
 * API interactions to decouple presentation from network logic.
 */
function UserProfilePage() {
  const { user, logout, updateUserData, getToken } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { logEvent } = useAnalytics('user_profile', user?.token);

  // Estados principais
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'ai_config' | 'location'
  const [locationInfo, setLocationInfo] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Estados de formulário
  const [apiKeys, setApiKeys] = useState({ gemini_api_key: '', openai_api_key: '' });
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);

  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateAvatar = async (avatarUrl) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ avatar_url: avatarUrl })
      });

      if (!response.ok) throw new Error('Falha ao atualizar o avatar.');

      const data = await response.json();
      updateUserData(data);
      setShowAvatarModal(false);
      showToast('Avatar atualizado com sucesso!', 'success');
    } catch (error) {
      console.error("Erro ao atualizar avatar:", error);
      showToast('Erro ao atualizar seu avatar.', 'error');
    }
  };

  const hasLocationAvatar = React.useMemo(() => {
    if (!user?.unlocked_global_avatars) return false;
    return user.unlocked_global_avatars.some(avatar => avatar.url.includes('avatar3.webp'));
  }, [user?.unlocked_global_avatars]);

  // Efeito para buscar as chaves de API
  useEffect(() => {
    const fetchApiKeys = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/api-keys`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setApiKeys({
            gemini_api_key: data.gemini_api_key || '',
            openai_api_key: data.openai_api_key || ''
          });
        }
      } catch (error) {
        console.error("Erro ao buscar chaves de API:", error);
      }
    };
    fetchApiKeys();
  }, [getToken]);

  // Efeito para buscar as informações de localização do usuário
  useEffect(() => {
    const fetchLocationInfo = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/location-info`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setLocationInfo(data);
        }
      } catch (error) {
        console.error("Erro ao buscar informações de localização:", error);
      }
    };

    if (hasLocationAvatar) {
      fetchLocationInfo();
    }
  }, [hasLocationAvatar, getToken]);

  const handleForceLocationRequest = useCallback(() => {
    setLocationStatus('Solicitando permissão de GPS...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationStatus('Permissão concedida! Resgatando recompensa...');

        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/unlock-location-avatar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ latitude, longitude })
          });

          if (!response.ok) throw new Error('Falha ao resgatar a recompensa.');

          const data = await response.json();
          updateUserData(data);
          showToast('🏆 Recompensa desbloqueada! Seu novo avatar está na sua galeria.', 'success');
          setLocationStatus('Recompensa desbloqueada com sucesso!');
        } catch (error) {
          console.error("Erro ao desbloquear avatar de localização:", error);
          setLocationStatus('Ocorreu um erro ao tentar resgatar sua recompensa.');
          showToast('Erro ao resgatar o avatar de localização.', 'error');
        }
      },
      (error) => {
        setLocationStatus(`Erro ao obter localização: ${error.message}`);
        showToast('Permissão de localização negada ou indisponível.', 'warning');
      }
    );
  }, [getToken, updateUserData, showToast]);

  const handleSaveApiKeys = async () => {
    setSavingKeys(true);
    
    if (apiKeys.gemini_api_key && apiKeys.gemini_api_key.trim() !== '') {
      try {
        showToast('Validando chave da API Gemini com os servidores...', 'info');
        const testResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/test-api-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify({ gemini_api_key: apiKeys.gemini_api_key })
        });
        
        if (!testResponse.ok) {
          const errorData = await testResponse.json();
          showToast(errorData.message || 'Chave de API Gemini inválida.', 'error');
          setSavingKeys(false);
          return;
        }
      } catch (error) {
        console.error(error);
        showToast('Erro de rede ao validar a chave.', 'error');
        setSavingKeys(false);
        return;
      }
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(apiKeys)
      });
      if (!response.ok) throw new Error('Falha ao salvar as chaves.');
      showToast('Chaves de API validadas e salvas com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar as chaves de API.', 'error');
    } finally {
      setSavingKeys(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showToast('As senhas não coincidem.', 'warning');
    }
    if (passwordData.newPassword.length < 6) {
      return showToast('A nova senha deve ter pelo menos 6 caracteres.', 'warning');
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ 
          old_password: passwordData.oldPassword, 
          new_password: passwordData.newPassword 
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao alterar a senha.');
      
      showToast('Senha alterada com sucesso!', 'success');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const displayAvatar = user?.profile_picture
    ? (user.profile_picture.startsWith('/avatars/') ? user.profile_picture : `${serverUrl}${user.profile_picture}`)
    : '/avatars/default_avatar.webp';

  const normalAvatars = user?.unlocked_global_avatars?.filter(a => a.type !== 'special') || [];
  const specialAvatars = user?.unlocked_global_avatars?.filter(a => a.type === 'special') || [];

  if (!user) return null;

  const roleLabels = {
    professor: { label: 'Professor(a)', bg: 'bg-purple-500/10 text-accent-purple border-purple-500/30' },
    aluno: { label: 'Estudante', bg: 'bg-teal-500/10 text-accent-teal border-teal-500/30' },
    admin: { label: 'Administrador', bg: 'bg-amber-500/10 text-accent-yellow border-amber-500/30' }
  };

  const userRoleConfig = roleLabels[user.role] || roleLabels.aluno;

  return (
    <>
      {showAvatarModal && (
        <AvatarSelectionModal
          onSelect={handleUpdateAvatar}
          onClose={() => setShowAvatarModal(false)}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-secondary-bg border border-border-color rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-danger">
              <FaExclamationTriangle className="text-3xl" />
              <h3 className="text-xl font-bold text-primary-text">Excluir Conta</h3>
            </div>
            <p className="text-sm text-secondary-text leading-relaxed">
              Esta ação é <strong className="text-danger">irreversível</strong>. Todos os seus dados, turmas, atividades e avatares desbloqueados serão apagados permanentemente.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-border-color text-primary-text hover:bg-hover-bg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  showToast('Solicitação de exclusão recebida. Entre em contato com o suporte para finalizar.', 'info');
                }}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-danger text-white hover:bg-danger/90 transition-colors shadow-lg shadow-danger/20"
              >
                Sim, Excluir Minha Conta
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-primary-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* HERO BANNER PROFILE HEADER */}
          <div className="relative overflow-hidden rounded-3xl bg-secondary-bg border border-border-color shadow-2xl">
            {/* Mesh Banner Background */}
            <div className="h-36 sm:h-48 bg-gradient-to-r from-teal-600 via-purple-600 to-indigo-700 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] opacity-60"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Profile Info Overlay */}
            <div className="px-6 pb-6 pt-0 sm:px-8 relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 mb-4 sm:mb-0 gap-6">
                
                {/* Avatar with Floating Edit Badge */}
                <div className="relative group">
                  <img 
                    src={displayAvatar} 
                    alt="Avatar" 
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-secondary-bg object-cover shadow-2xl transition-transform duration-300 group-hover:scale-105" 
                  />
                  <button 
                    onClick={() => setShowAvatarModal(true)}
                    title="Alterar Avatar"
                    className="absolute bottom-1 right-1 p-2.5 bg-accent-teal text-white dark:text-gray-900 rounded-full shadow-lg hover:bg-accent-teal/90 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-teal"
                  >
                    <FaCamera className="w-4 h-4" />
                  </button>
                </div>

                {/* Main User Text Details */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h1 className="text-3xl font-extrabold text-primary-text tracking-tight">{user.name}</h1>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${userRoleConfig.bg} self-center sm:self-auto`}>
                      {userRoleConfig.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-secondary-text">{user.email}</p>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={handleLogout}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-danger hover:bg-danger/90 transition-all shadow-md shadow-danger/20 hover:scale-105 active:scale-95"
                  >
                    <FaSignOutAlt /> Sair
                  </button>
                </div>
              </div>

              {/* Quick Stats Strip */}
              <div className="mt-6 pt-6 border-t border-border-color grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-2xl bg-primary-bg/60 border border-border-color/60">
                  <span className="block text-xs font-semibold text-secondary-text uppercase tracking-wider">Avatares</span>
                  <span className="text-xl font-black text-accent-teal flex items-center justify-center gap-1.5 mt-0.5">
                    <FaAward className="text-base" /> {user?.unlocked_global_avatars?.length || 0}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-primary-bg/60 border border-border-color/60">
                  <span className="block text-xs font-semibold text-secondary-text uppercase tracking-wider">Status</span>
                  <span className="text-xl font-black text-accent-purple flex items-center justify-center gap-1.5 mt-0.5">
                    <FaShieldAlt className="text-base" /> Ativo
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-primary-bg/60 border border-border-color/60">
                  <span className="block text-xs font-semibold text-secondary-text uppercase tracking-wider">Perfil</span>
                  <span className="text-xl font-black text-accent-yellow flex items-center justify-center gap-1.5 mt-0.5">
                    <FaUser className="text-base" /> {userRoleConfig.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN TABBED CONTENT AREA */}
          <div className="space-y-6">
            
            {/* Tab Navigation Pill Bar */}
            <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-secondary-bg border border-border-color shadow-sm">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-accent-teal text-white dark:text-gray-900 shadow-md shadow-accent-teal/20 scale-[1.02]'
                    : 'text-secondary-text hover:text-primary-text hover:bg-hover-bg'
                }`}
              >
                <FaUser /> Perfil & Avatares
              </button>

              {user.role === 'professor' && (
                <button
                  onClick={() => setActiveTab('ai_config')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'ai_config'
                      ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/20 scale-[1.02]'
                      : 'text-secondary-text hover:text-primary-text hover:bg-hover-bg'
                  }`}
                >
                  <FaRobot /> Integrações de IA (BYOK)
                </button>
              )}

              <button
                onClick={() => setActiveTab('location')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'location'
                    ? 'bg-accent-yellow text-white dark:text-gray-900 shadow-md shadow-accent-yellow/20 scale-[1.02]'
                    : 'text-secondary-text hover:text-primary-text hover:bg-hover-bg'
                }`}
              >
                <FaMapMarkerAlt /> Localização & Conquistas
              </button>

              {!user.google_id && (
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'security'
                      ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/20 scale-[1.02]'
                      : 'text-secondary-text hover:text-primary-text hover:bg-hover-bg'
                  }`}
                >
                  <FaLock /> Segurança & Senha
                </button>
              )}
            </div>

            {/* TAB 1: PERFIL & AVATARES */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Galeria de Avatares */}
                <div className="bg-secondary-bg p-6 sm:p-8 rounded-3xl border border-border-color shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-border-color pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-primary-text flex items-center gap-2">
                        <FaAward className="text-accent-teal" /> Galeria de Avatares
                      </h3>
                      <p className="text-xs text-secondary-text mt-1">Avatares que você desbloqueou ao longo da sua jornada no portal.</p>
                    </div>
                    <button 
                      onClick={() => setShowAvatarModal(true)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20 transition-colors border border-accent-teal/30"
                    >
                      Trocar Avatar
                    </button>
                  </div>

                  {/* Avatares Especiais */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-accent-yellow flex items-center gap-1.5">
                      ★ Avatares Especiais & Raros ({specialAvatars.length})
                    </h4>
                    {specialAvatars.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 p-4 rounded-2xl bg-primary-bg/50 border border-border-color/60">
                        {specialAvatars.map(avatar => (
                          <div key={avatar.url} className="flex flex-col items-center group relative">
                            <img 
                              src={avatar.url} 
                              alt={avatar.name} 
                              title={avatar.name} 
                              className="w-16 h-16 rounded-full border-2 border-accent-yellow object-cover shadow-md transition-transform group-hover:scale-110" 
                            />
                            <span className="text-[10px] text-center text-secondary-text mt-1 truncate max-w-full font-medium">{avatar.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-secondary-text italic p-4 rounded-2xl bg-primary-bg/30 border border-border-color/40">
                        Nenhum avatar especial desbloqueado ainda. Continue participando de atividades!
                      </p>
                    )}
                  </div>

                  {/* Avatares Normais */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-secondary-text flex items-center gap-1.5">
                      Avatares Padrão ({normalAvatars.length})
                    </h4>
                    {normalAvatars.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 p-4 rounded-2xl bg-primary-bg/50 border border-border-color/60">
                        {normalAvatars.map(avatar => (
                          <div key={avatar.url} className="flex flex-col items-center group relative">
                            <img 
                              src={avatar.url} 
                              alt={avatar.name} 
                              title={avatar.name} 
                              className="w-16 h-16 rounded-full border-2 border-border-color object-cover shadow-sm transition-transform group-hover:scale-110" 
                            />
                            <span className="text-[10px] text-center text-secondary-text mt-1 truncate max-w-full font-medium">{avatar.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-secondary-text italic p-4 rounded-2xl bg-primary-bg/30 border border-border-color/40">
                        Nenhum avatar normal disponível.
                      </p>
                    )}
                  </div>
                </div>

                {/* Zona de Perigo */}
                <div className="bg-secondary-bg p-6 rounded-3xl border border-danger/20 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-danger flex items-center gap-2">
                    <FaTrashAlt /> Configurações de Conta
                  </h3>
                  <p className="text-xs text-secondary-text">
                    Deseja encerrar ou remover sua conta do portal? Esta ação apagará seus registros permanentemente.
                  </p>
                  <div>
                    <button 
                      onClick={() => setShowDeleteConfirmModal(true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-danger bg-danger-bg border border-danger/30 hover:bg-danger-bg/80 transition-colors flex items-center gap-2"
                    >
                      <FaTrashAlt /> Excluir Conta Permanentemente
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: INTEGRAÇÕES DE IA (PROFESSOR - BYOK) */}
            {activeTab === 'ai_config' && user.role === 'professor' && (
              <div className="bg-secondary-bg p-6 sm:p-8 rounded-3xl border border-border-color shadow-xl space-y-6 animate-fade-in">
                <div className="border-b border-border-color pb-4">
                  <h3 className="text-xl font-bold text-primary-text flex items-center gap-2">
                    <FaRobot className="text-accent-purple" /> Configurações de IA (BYOK - Bring Your Own Key)
                  </h3>
                  <p className="text-xs text-secondary-text mt-1">
                    Configure suas próprias chaves de API para geração ilimitada de quizzes e narrativas sem consumir a cota global da instituição.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Chave Gemini */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary-text">
                      Chave da API Google Gemini
                    </label>
                    <div className="relative">
                      <input
                        type={showGeminiKey ? "text" : "password"}
                        className="w-full p-3.5 pr-12 rounded-2xl bg-primary-bg border border-border-color text-sm text-primary-text focus:ring-2 focus:ring-accent-purple focus:outline-none transition-all font-mono"
                        placeholder="AIzaSy..."
                        value={apiKeys.gemini_api_key}
                        onChange={e => setApiKeys({ ...apiKeys, gemini_api_key: e.target.value })}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition-colors"
                      >
                        {showGeminiKey ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <p className="text-[11px] text-secondary-text">
                      Obtenha gratuitamente no Google AI Studio (aizaSy...).
                    </p>
                  </div>

                  {/* Chave OpenAI */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary-text">
                      Chave da API OpenAI (Opcional)
                    </label>
                    <div className="relative">
                      <input
                        type={showOpenAIKey ? "text" : "password"}
                        className="w-full p-3.5 pr-12 rounded-2xl bg-primary-bg border border-border-color text-sm text-primary-text focus:ring-2 focus:ring-accent-purple focus:outline-none transition-all font-mono"
                        placeholder="sk-..."
                        value={apiKeys.openai_api_key}
                        onChange={e => setApiKeys({ ...apiKeys, openai_api_key: e.target.value })}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition-colors"
                      >
                        {showOpenAIKey ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <p className="text-[11px] text-secondary-text">
                      Utilizada como fallback secundário para modelos GPT-4 (sk-...).
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border-color">
                    <button 
                      onClick={handleSaveApiKeys} 
                      disabled={savingKeys}
                      className="w-full sm:w-auto px-6 py-3 bg-accent-purple text-white font-bold rounded-2xl hover:bg-accent-purple/90 transition-all shadow-lg shadow-accent-purple/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      {savingKeys ? "Testando e Salvando..." : <><FaKey /> Validar e Salvar Chaves</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LOCALIZAÇÃO & CONQUISTAS */}
            {activeTab === 'location' && (
              <div className="bg-secondary-bg p-6 sm:p-8 rounded-3xl border border-border-color shadow-xl space-y-6 animate-fade-in">
                <div className="border-b border-border-color pb-4">
                  <h3 className="text-xl font-bold text-primary-text flex items-center gap-2">
                    <FaMapMarkerAlt className="text-accent-yellow" /> Recompensas por Localização
                  </h3>
                  <p className="text-xs text-secondary-text mt-1">
                    Conquistas especiais desbloqueadas ao registrar sua localização no portal.
                  </p>
                </div>

                {hasLocationAvatar ? (
                  <div className="p-6 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-3">
                    <div className="flex items-center gap-3 text-accent-teal">
                      <FaCheckCircle className="text-2xl" />
                      <h4 className="font-bold text-lg text-primary-text">Avatar "Explorador" Desbloqueado!</h4>
                    </div>
                    {locationInfo ? (
                      <p className="text-sm text-secondary-text">
                        Sua localização registrada é: <strong className="text-primary-text font-bold">{`${locationInfo.city}, ${locationInfo.state} - ${locationInfo.country}`}</strong>
                      </p>
                    ) : (
                      <p className="text-sm text-secondary-text">Carregando detalhes do seu registro de localização...</p>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-amber-500/20 rounded-2xl text-accent-yellow">
                        <FaGift className="text-3xl" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-lg text-primary-text">Avatar Exclusivo de Explorador</h4>
                        <p className="text-xs text-secondary-text leading-relaxed">
                          Permita o acesso à sua localização geográfica uma única vez para desbloquear a insignia e o avatar exclusivo "Explorador" para o seu perfil.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleForceLocationRequest} 
                      className="w-full sm:w-auto px-6 py-3 bg-accent-yellow text-white dark:text-gray-900 font-bold rounded-2xl hover:bg-accent-yellow/90 transition-all shadow-lg shadow-accent-yellow/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                    >
                      <FaMapMarkerAlt /> Liberar GPS e Resgatar Recompensa
                    </button>
                    {locationStatus && <p className="text-xs font-semibold text-accent-yellow">{locationStatus}</p>}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SEGURANÇA & SENHA */}
            {activeTab === 'security' && !user.google_id && (
              <div className="bg-secondary-bg p-6 sm:p-8 rounded-3xl border border-border-color shadow-xl space-y-6 animate-fade-in">
                <div className="border-b border-border-color pb-4">
                  <h3 className="text-xl font-bold text-primary-text flex items-center gap-2">
                    <FaLock className="text-accent-purple" /> Alterar Senha de Acesso
                  </h3>
                  <p className="text-xs text-secondary-text mt-1">
                    Mantenha sua conta protegida atualizando sua senha periodicamente.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
                  {/* Senha Atual */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary-text">Senha Atual</label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        required
                        className="w-full p-3.5 pr-12 rounded-2xl bg-primary-bg border border-border-color text-sm text-primary-text focus:ring-2 focus:ring-accent-purple focus:outline-none transition-all"
                        value={passwordData.oldPassword}
                        onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition-colors"
                      >
                        {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {/* Nova Senha */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary-text">Nova Senha</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength="6"
                        className="w-full p-3.5 pr-12 rounded-2xl bg-primary-bg border border-border-color text-sm text-primary-text focus:ring-2 focus:ring-accent-purple focus:outline-none transition-all"
                        value={passwordData.newPassword}
                        onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition-colors"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary-text">Confirmar Nova Senha</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength="6"
                        className="w-full p-3.5 pr-12 rounded-2xl bg-primary-bg border border-border-color text-sm text-primary-text focus:ring-2 focus:ring-accent-purple focus:outline-none transition-all"
                        value={passwordData.confirmPassword}
                        onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition-colors"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={isChangingPassword}
                      className="w-full sm:w-auto px-6 py-3 bg-accent-purple text-white font-bold rounded-2xl hover:bg-accent-purple/90 transition-all shadow-lg shadow-accent-purple/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      {isChangingPassword ? "Alterando Senha..." : "Atualizar Senha"}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

        </div>
      </div>
    </>
  );
}

export default UserProfilePage;