// frontend/src/components/AvatarSelectionModal.jsx
import React, { memo, useContext } from 'react';
import { useAuth } from '../context/AuthContext';

// Envolvemos o componente com React.memo para evitar re-renderizações
// desnecessárias quando as props (onSelect, onClose) não mudam.
const AvatarSelectionModal = memo(function AvatarSelectionModal({ onSelect, onClose }) {
  // Log para quando o componente é renderizado e quais props ele recebe
  console.log('--- [Debug] Componente AvatarSelectionModal renderizado ---');
  console.log('[Debug] Props recebidas:', { onSelect, onClose });
  const { user } = useAuth();
  const unlockedAvatars = user?.unlocked_global_avatars || [];


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-primary-bg p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-border-color">
        <h3 className="text-2xl font-bold text-primary-text mb-6 text-center">Escolha seu novo Avatar</h3>

        {unlockedAvatars.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6 max-h-[50vh] overflow-y-auto pr-2">
            {unlockedAvatars.map((avatar) => (
              <div
                key={avatar.url}
                className="cursor-pointer group flex flex-col items-center gap-2"
                onClick={() => onSelect(avatar.url)}
              >
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  title={avatar.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-transparent group-hover:border-accent-yellow transition-all duration-200 transform group-hover:scale-110"
                />
                <span className="text-xs text-secondary-text text-center">{avatar.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-secondary-text my-8">Você ainda não desbloqueou nenhum avatar.</p>
        )}

        <div className="text-center">
          <button
            onClick={onClose}
            className="py-2 px-6 bg-red-600 hover:bg-red-700 text-primary-text font-semibold rounded-lg shadow-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
});

export default AvatarSelectionModal;