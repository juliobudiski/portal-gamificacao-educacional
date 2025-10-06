// frontend/src/components/activity/AvatarCustomizationTab.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaStar } from 'react-icons/fa';

/**
 * Componente para personalização de avatares dentro de uma atividade.
 *
 * @param {object} props
 * @param {string} props.activityId - O ID da atividade atual.
 * @param {object} props.userProgress - O objeto de progresso do usuário, contendo avatares desbloqueados e equipado.
 * @param {Function} props.onReturn - Função para voltar ao tabuleiro.
 * @param {Function} props.onAvatarChange - Callback para atualizar o estado no componente pai após salvar.
 */
const AvatarCustomizationTab = ({ activityId, userProgress, onReturn, onAvatarChange }) => {
    const { user } = useAuth();

    // Estado para o avatar selecionado na UI (antes de salvar)
    const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(userProgress?.equipped_activity_avatar_url || null);

    // Estados para feedback da API
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Sincroniza o avatar selecionado com o progresso atual quando o componente é montado
    useEffect(() => {
        setSelectedAvatarUrl(userProgress?.equipped_activity_avatar_url || null);
    }, [userProgress]);

    // Limpa as mensagens de feedback após alguns segundos
    useEffect(() => {
        if (error || successMessage) {
            const timer = setTimeout(() => {
                setError('');
                setSuccessMessage('');
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [error, successMessage]);

    const handleSelectAvatar = (avatar) => {
        if (avatar.url !== selectedAvatarUrl) {
            setSelectedAvatarUrl(avatar.url);
        }
    };

    const handleSaveChanges = useCallback(async () => {
        if (selectedAvatarUrl === userProgress?.equipped_activity_avatar_url) return;

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/progress/${activityId}/avatar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ avatar_url: selectedAvatarUrl }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Falha ao salvar o avatar.');
            }

            setSuccessMessage('Avatar equipado com sucesso!');
            // Chama o callback para atualizar o estado no componente pai (ActivityPage)
            if (onAvatarChange) {
                onAvatarChange(selectedAvatarUrl);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [activityId, selectedAvatarUrl, user.token, onAvatarChange, userProgress?.equipped_activity_avatar_url]);

    const handlePromoteAvatar = useCallback(async (avatarToPromote) => {
        if (!window.confirm(`Tem certeza que deseja liberar "${avatarToPromote.name}" para ser usado em todo o portal?`)) {
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/progress/user/avatars/promote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ avatar: avatarToPromote }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Falha ao promover o avatar.');
            }

            setSuccessMessage(`"${avatarToPromote.name}" agora pode ser usado em seu perfil global!`);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user.token]);

    const unlockedAvatars = userProgress?.unlocked_activity_avatars || [];
    const isSaveDisabled = isLoading || selectedAvatarUrl === (userProgress?.equipped_activity_avatar_url || null);

    return (
        <div className="w-full max-w-4xl mx-auto p-4 text-white animate-fade-in">
            <button onClick={onReturn} className="absolute top-4 left-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200 transition-colors z-20">
                <FaArrowLeft />
                Voltar ao Tabuleiro
            </button>
            <header className="text-center mb-8 pt-8">
                <h1 className="text-4xl font-bold text-yellow-300">Meu Estilo na Atividade</h1>
                <p className="text-gray-400 mt-2">Escolha o avatar que te representará nesta jornada!</p>
            </header>

            {/* Layout Principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Coluna de Preview (Esquerda) */}
                <div className="md:col-span-1 flex flex-col items-center">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-300">Pré-visualização</h2>
                    <div className="w-48 h-48 rounded-full bg-gray-700/50 border-4 border-gray-600 flex items-center justify-center overflow-hidden shadow-lg">
                        <img
                            src={selectedAvatarUrl || user?.profile_picture || '/images/avatars/default.png'}
                            alt="Avatar selecionado"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Coluna de Opções (Direita) */}
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-300">Avatares Desbloqueados</h2>
                    {unlockedAvatars.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 bg-gray-800/50 p-4 rounded-lg">
                            {unlockedAvatars.map((avatar) => (
                                <div key={avatar.url} className="relative">
                                    <button
                                        onClick={() => handleSelectAvatar(avatar)}
                                        className={`w-full aspect-square rounded-lg border-4 transition-all duration-200 overflow-hidden focus:outline-none focus:ring-4
                                            ${selectedAvatarUrl === avatar.url ? 'border-yellow-400 ring-yellow-400/50' : 'border-gray-600 hover:border-gray-400'}`}
                                    >
                                        <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                                    </button>
                                    <p className="text-center text-sm mt-2 text-gray-300 truncate">{avatar.name}</p>
                                    {avatar.promotable && (
                                        <button
                                            onClick={() => handlePromoteAvatar(avatar)}
                                            disabled={isLoading}
                                            className="absolute top-1 right-1 p-1.5 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-colors disabled:bg-gray-500"
                                            title="Liberar para uso no perfil global"
                                        >
                                            <FaStar />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-800/50 rounded-lg">
                            <p className="text-gray-400">Você ainda não desbloqueou avatares nesta atividade.</p>
                            <p className="text-gray-500 text-sm">Continue jogando para ganhar novas aparências!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Rodapé com Ações e Feedback */}
            <footer className="mt-8 text-center">
                {/* Mensagens de Feedback */}
                <div className="h-8 mb-4 flex items-center justify-center">
                    {isLoading && <FaSpinner className="text-2xl animate-spin text-yellow-400" />}
                    {error && <p className="text-red-400 flex items-center gap-2"><FaExclamationTriangle /> {error}</p>}
                    {successMessage && <p className="text-green-400 flex items-center gap-2"><FaCheckCircle /> {successMessage}</p>}
                </div>

                <button
                    onClick={handleSaveChanges}
                    disabled={isSaveDisabled}
                    className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-500 transition-colors
                               disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    Equipar Avatar
                </button>
            </footer>
        </div>
    );
};

export default AvatarCustomizationTab;