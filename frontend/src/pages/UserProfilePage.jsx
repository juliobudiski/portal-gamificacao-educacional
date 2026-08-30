// frontend/src/pages/UserProfilePage.jsx

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAnalytics from '../hooks/useAnalytics';
import { FaUser, FaLock, FaUniversity, FaBook, FaKey, FaSignOutAlt, FaTrashAlt, FaMapMarkerAlt, FaGift, FaRobot } from "react-icons/fa";
import AvatarSelectionModal from '../components/AvatarSelectionModal';
import { useToast } from '../context/ToastContext';

// Componente para um Card genérico
const ProfileCard = ({ icon, title, children, className }) => (
  <div className={`bg-primary-bg p-6 rounded-2xl shadow-xl border border-border-color ${className}`}>
    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-purple mb-4 flex items-center">
      {icon} {title}
    </h3>
    {children}
  </div>
);

function UserProfilePage() {
  const { user, logout, updateUserData, getToken } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { logEvent } = useAnalytics('user_profile', user?.token);

  const [locationInfo, setLocationInfo] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  const [apiKeys, setApiKeys] = useState({ gemini_api_key: '', openai_api_key: '' });
  const [savingKeys, setSavingKeys] = useState(false);
  const handleUpdateAvatar = async (avatarUrl) => {
    console.log("Selecionado novo avatar:", avatarUrl);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ avatar_url: avatarUrl })
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar o avatar.');
      }

      const data = await response.json();
      updateUserData(data); // Atualiza o contexto com o novo token que contém a foto atualizada
      setShowAvatarModal(false); // Fecha o modal após o sucesso

    } catch (error) {
      console.error("Erro ao atualizar avatar:", error);
      // Adicione um feedback visual para o usuário aqui, se desejar
    }
  };
  const hasLocationAvatar = React.useMemo(() => {
    if (!user?.unlocked_global_avatars) return false;
    // O ideal é verificar pela URL, que é um identificador mais único que o nome.
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
      // Evita chamadas desnecessárias se o token não existir
      const token = getToken();
      if (!token) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/location-info`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          // Se data for null (porque ainda não há lat/lon), o estado continua null
          setLocationInfo(data);
        }
      } catch (error) {
        console.error("Erro ao buscar informações de localização:", error);
      }
    };

    // A condição é: se o usuário TEM o avatar, ENTÃO busque as informações de localização.
    if (hasLocationAvatar) {
      fetchLocationInfo();
    }
    // A dependência em `hasLocationAvatar` garante que esta lógica rode
    // tanto no carregamento da página quanto logo após o avatar ser desbloqueado.
  }, [hasLocationAvatar, getToken]);

  const handleForceLocationRequest = useCallback(() => {
    setLocationStatus('Solicitando permissão...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationStatus('Permissão concedida! Desbloqueando sua recompensa...');

        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/unlock-location-avatar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json', // Essencial para o backend entender o body
              'Authorization': `Bearer ${getToken()}`
            },
            // Enviando as coordenadas no corpo da requisição
            body: JSON.stringify({ latitude, longitude })
          });

          if (!response.ok) throw new Error('Falha ao resgatar a recompensa.');

          const data = await response.json();
          updateUserData(data); // Isso atualiza o `user`, que atualiza `hasLocationAvatar`, que dispara o useEffect acima.

          alert('Recompensa desbloqueada! Seu novo avatar está na sua galeria.');
          setLocationStatus('Recompensa desbloqueada!');

        } catch (error) {
          console.error("Erro ao desbloquear avatar de localização:", error);
          setLocationStatus('Ocorreu um erro ao tentar resgatar sua recompensa.');
        }
      },
      (error) => {
        setLocationStatus(`Erro ao obter localização: ${error.message}`);
      }
    );
  }, [getToken, updateUserData]);

  const handleSaveApiKeys = async () => {
    setSavingKeys(true);
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
      showToast('Chaves de API salvas com sucesso!');
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar as chaves de API.');
    } finally {
      setSavingKeys(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const displayAvatar = user?.profile_picture
    ? (user.profile_picture.startsWith('/avatars/') ? user.profile_picture : `${serverUrl}${user.profile_picture}`)
    : `https://ui-avatars.com/api/?name=${user?.name}&background=random`;

  const normalAvatars = user?.unlocked_global_avatars?.filter(a => a.type !== 'special') || [];
  const specialAvatars = user?.unlocked_global_avatars?.filter(a => a.type === 'special') || [];

  if (!user) return null; // Evita renderizar a página sem dados do usuário

  return (
    <>
      {showAvatarModal && (
        <AvatarSelectionModal
          onSelect={handleUpdateAvatar}
          onClose={() => setShowAvatarModal(false)}
        />
      )}

      <div className="min-h-screen bg-primary-bg py-12 px-4">
        <div className="max-w-full mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-purple">
              Minhas Configurações
            </h1>
            <p className="text-secondary-text mt-2">Gerencie suas informações, avatares e segurança.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Coluna Esquerda: Perfil e Ações */}
            <div className="md:col-span-1 space-y-8">
              <ProfileCard icon={<FaUser className="mr-3" />} title="Perfil">
                <div className="flex flex-col items-center text-center">
                  <img src={displayAvatar} alt="Avatar" className="w-28 h-28 rounded-full border-4 border-accent-teal object-cover mb-4" />
                  <h2 className="text-2xl font-bold text-primary-text">{user.name}</h2>
                  <p className="text-secondary-text">{user.email}</p>
                  <button onClick={() => setShowAvatarModal(true)} className="mt-4 w-full py-2 px-4 bg-accent-yellow text-white dark:text-gray-900 font-semibold rounded-lg hover:bg-accent-yellow/90 transition-colors">
                    Alterar Avatar
                  </button>
                </div>
              </ProfileCard>

              <ProfileCard icon={<FaSignOutAlt className="mr-3" />} title="Ações da Conta">
                <div className="space-y-4">
                  <button onClick={handleLogout} className="w-full py-2 px-4 border border-transparent rounded-xl text-sm font-medium text-white dark:text-gray-900 bg-danger hover:bg-danger/90 transition-colors">
                    Sair
                  </button>
                  {/* --- CORREÇÃO: Botão de excluir ciente do tema --- */}
                  <button className="w-full py-2 px-4 rounded-xl text-sm font-medium text-danger bg-danger-bg border border-danger/50 hover:bg-danger-bg/80">
                    <FaTrashAlt className="inline mr-2" /> Excluir Conta
                  </button>
                </div>
              </ProfileCard>
            </div>

            {/* Coluna Direita: Detalhes e Configurações */}
            <div className="md:col-span-2 space-y-8">
              <ProfileCard icon={<FaMapMarkerAlt className="mr-3" />} title="Localização">
                {hasLocationAvatar ? (
                  // CASO 1: O usuário JÁ TEM o avatar "Explorador"
                  locationInfo ? (
                    // Mostra a localização que foi buscada pelo useEffect
                    <div>
                      <p className="text-secondary-text">Sua localização registrada é:</p>
                      <p className="text-lg font-semibold text-primary-text">{`${locationInfo.city}, ${locationInfo.state} - ${locationInfo.country}`}</p>
                    </div>
                  ) : (
                    // Mensagem de fallback enquanto a localização está sendo carregada ou se falhar
                    <p className="text-secondary-text">Carregando informações de localização...</p>
                  )
                ) : (
                  // CASO 2: O usuário AINDA NÃO TEM o avatar "Explorador"
                  // Mostra o card de recompensa com o botão
                  <div>
                    <div className="flex items-center p-4 bg-accent-yellow/10 border-l-4 border-accent-yellow rounded-lg">
                      <FaGift className="text-accent-yellow text-2xl mr-4" />
                      <div>
                        <h4 className="font-bold text-primary-text">Ganhe um Avatar Exclusivo!</h4>
                        <p className="text-secondary-text text-sm">Compartilhe sua localização para desbloquear o avatar "Explorador".</p>
                      </div>
                    </div>
                    <button onClick={handleForceLocationRequest} className="mt-4 w-full py-2 px-4 bg-accent-teal text-white dark:text-gray-900 font-semibold rounded-lg hover:bg-accent-teal/80">
                      Liberar Localização e Resgatar
                    </button>
                    {locationStatus && <p className="mt-2 text-sm text-accent-yellow">{locationStatus}</p>}
                  </div>
                )}
              </ProfileCard>

              <ProfileCard icon={<FaUser className="mr-3" />} title="Meus Avatares">
                <div>
                  <h4 className="font-semibold text-secondary-text border-b border-border-color pb-2 mb-4">Avatares Especiais</h4>
                  <div className="flex flex-wrap gap-4">
                    {specialAvatars.length > 0 ? specialAvatars.map(avatar => (
                      <img key={avatar.url} src={avatar.url} alt={avatar.name} title={avatar.name} className="w-16 h-16 rounded-full border-2 border-accent-yellow object-cover" />
                    )) : <p className="text-sm text-secondary-text">Nenhum avatar especial desbloqueado.</p>}
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-semibold text-secondary-text border-b border-border-color pb-2 mb-4">Avatares Normais</h4>
                  <div className="flex flex-wrap gap-4">
                    {normalAvatars.length > 0 ? normalAvatars.map(avatar => (
                      <img key={avatar.url} src={avatar.url} alt={avatar.name} title={avatar.name} className="w-16 h-16 rounded-full border-2 border-border-color object-cover" />
                    )) : <p className="text-sm text-secondary-text">Nenhum avatar normal desbloqueado.</p>}
                  </div>
                </div>
              </ProfileCard>

              {user.role === 'professor' && (
                <>
                  <ProfileCard icon={<FaUniversity className="mr-3" />} title="Informações Profissionais">
                    {/* Formulário de edição para professor aqui */}
                  </ProfileCard>

                  <ProfileCard icon={<FaRobot className="mr-3" />} title="Configurações de IA (BYOK)">
                    <div className="space-y-4">
                      <p className="text-sm text-secondary-text mb-4">
                        Configure suas próprias chaves para gerar conteúdo mais rapidamente e sem compartilhar o limite de cota do sistema.
                      </p>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Chave da API Google Gemini</label>
                        <input
                          type="password"
                          className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-border-color text-sm focus:ring-2 focus:ring-purple-500"
                          placeholder="AIzaSy..."
                          value={apiKeys.gemini_api_key}
                          onChange={e => setApiKeys({ ...apiKeys, gemini_api_key: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Chave da API OpenAI (Opcional)</label>
                        <input
                          type="password"
                          className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-border-color text-sm focus:ring-2 focus:ring-purple-500"
                          placeholder="sk-..."
                          value={apiKeys.openai_api_key}
                          onChange={e => setApiKeys({ ...apiKeys, openai_api_key: e.target.value })}
                        />
                      </div>

                      <button 
                        onClick={handleSaveApiKeys} 
                        disabled={savingKeys}
                        className="mt-4 w-full py-2 px-4 bg-accent-teal text-white dark:text-gray-900 font-semibold rounded-lg hover:bg-accent-teal/80 transition-colors flex justify-center items-center gap-2"
                      >
                        {savingKeys ? "Salvando..." : <><FaKey /> Salvar Chaves</>}
                      </button>
                    </div>
                  </ProfileCard>
                </>
              )}

              {!user.google_id && (
                <ProfileCard icon={<FaKey className="mr-3" />} title="Segurança">
                  {/* Formulário de alteração de senha aqui */}
                </ProfileCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default UserProfilePage;