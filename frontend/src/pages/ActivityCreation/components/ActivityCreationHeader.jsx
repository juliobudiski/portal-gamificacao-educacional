import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaSync } from 'react-icons/fa';

function ActivityCreationHeader({ isEditMode, showInitialSelection, autoSaveStatus, lastSavedAt }) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-primary-text">
        {isEditMode ? 'Editar Atividade' : 'Criar Nova Atividade Gamificada'}
      </h1>
      <p className="mt-2 text-secondary-text">
        Siga as etapas para criar uma experiência de aprendizado envolvente.
      </p>

      {/* INDICADOR DE AUTOSAVE */}
      {!showInitialSelection && autoSaveStatus !== 'idle' && (
        (() => {
          let statusConfig = { borderColor: 'border-gray-300', icon: null, text: '' };
          switch (autoSaveStatus) {
            case 'saving':
              statusConfig = { borderColor: 'border-accent-yellow', icon: <FaSync className="animate-spin text-accent-yellow" />, text: 'Salvando alterações...' };
              break;
            case 'saved':
              statusConfig = {
                borderColor: 'border-green-500', icon: <FaCheckCircle className="text-green-500" />,
                text: lastSavedAt ? `Salvo às ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Alterações salvas'
              };
              break;
            case 'error':
              statusConfig = { borderColor: 'border-red-500', icon: <FaTimesCircle className="text-red-500" />, text: 'Erro ao salvar alterações' };
              break;
            default: return null;
          }
          return (
            <div className="fixed bottom-5 right-5 z-[60] animate-slide-in-right">
              <div className={`bg-secondary-bg border-l-4 px-6 py-4 rounded shadow-2xl flex items-center gap-4 min-w-[300px] max-w-md border border-[#3e4a52] transition-all duration-300 ${statusConfig.borderColor}`}>
                <div className="text-xl">{statusConfig.icon}</div>
                <div className="flex-1"><p className="font-medium text-sm md:text-base text-primary-text">{statusConfig.text}</p></div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}

export default ActivityCreationHeader;
