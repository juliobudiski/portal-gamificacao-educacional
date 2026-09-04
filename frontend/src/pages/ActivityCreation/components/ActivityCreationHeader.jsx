import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaSync, FaGamepad } from 'react-icons/fa';

function ActivityCreationHeader({ isEditMode, showInitialSelection, autoSaveStatus, lastSavedAt }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-accent-purple/20 via-accent-teal/20 to-accent-yellow/20 p-8 lg:p-12 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] mb-10 border border-border-color backdrop-blur-md">
      {/* Luzes Internas do Header */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mt-20 -mr-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-teal/10 rounded-full blur-[60px] -mb-20 -ml-20 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
            <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow mb-3">
              {isEditMode ? 'Editar Atividade' : 'Criar Nova Atividade Gamificada'}
            </h1>
            <p className="text-secondary-text font-medium text-lg max-w-2xl">
              Siga as etapas para criar uma experiência de aprendizado épica e envolvente.
            </p>
        </div>
        <div className="w-20 h-20 bg-primary-bg/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-border-color/50 shadow-inner transform rotate-12 hover:rotate-0 transition-transform duration-500 hidden md:flex">
            <FaGamepad className="text-4xl text-accent-teal opacity-80" />
        </div>
      </div>

      {/* INDICADOR DE AUTOSAVE */}
      {!showInitialSelection && autoSaveStatus !== 'idle' && (
        (() => {
          let statusConfig = { borderColor: 'border-gray-300', icon: null, text: '' };
          switch (autoSaveStatus) {
            case 'saving':
              statusConfig = { borderColor: 'border-accent-yellow/50', icon: <FaSync className="animate-spin text-accent-yellow" />, text: 'Salvando...' };
              break;
            case 'saved':
              statusConfig = {
                borderColor: 'border-green-500/50', icon: <FaCheckCircle className="text-green-500" />,
                text: lastSavedAt ? `Salvo ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Salvo'
              };
              break;
            case 'error':
              statusConfig = { borderColor: 'border-red-500/50', icon: <FaTimesCircle className="text-red-500" />, text: 'Erro ao salvar' };
              break;
            default: return null;
          }
          return (
            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20 animate-fade-in">
              <div className={`bg-primary-bg/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 border shadow-lg transition-all duration-300 ${statusConfig.borderColor}`}>
                <div className="text-sm">{statusConfig.icon}</div>
                <div><p className="font-bold text-xs text-primary-text tracking-wider uppercase">{statusConfig.text}</p></div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}

export default ActivityCreationHeader;
