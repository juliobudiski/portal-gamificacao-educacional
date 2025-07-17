// frontend/src/components/AvatarSelectionModal.jsx
import React from 'react';

// Lista de avatares. Adicione os caminhos para as suas imagens aqui.
// Coloque as imagens na pasta `frontend/public/avatars/`
const avatars = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
  '/avatars/avatar5.png',
  '/avatars/avatar6.png',
];

function AvatarSelectionModal({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl max-w-2xl w-full">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Escolha seu novo Avatar</h3>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
          {avatars.map((avatarUrl) => (
            <div key={avatarUrl} className="cursor-pointer" onClick={() => onSelect(avatarUrl)}>
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-transparent hover:border-blue-500 transition-all duration-200"
              />
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="py-2 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvatarSelectionModal;