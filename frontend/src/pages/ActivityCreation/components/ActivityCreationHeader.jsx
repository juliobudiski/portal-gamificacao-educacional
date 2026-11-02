import React, { useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaSync, FaGamepad, FaEye, FaBolt, FaTimes, FaLayerGroup } from 'react-icons/fa';

/**
 * ActivityCreationHeader
 * 
 * Architectural intent: Serves as a pure, presentational component for the Activity Creation wizard header.
 * It solely depends on props to render its state (e.g., auto-save status, edit mode, pedagogical complexity), adhering to the
 * Single Responsibility Principle by decoupling visual feedback from the complex state management of the wizard.
 */

function ActivityCreationHeader({ isEditMode, showInitialSelection, autoSaveStatus, lastSavedAt, activityData }) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Calcula estimativa de complexidade com base nos elementos configurados
  const calculateComplexity = () => {
    if (!activityData) return { level: 'Iniciante', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', score: 1 };
    let score = 0;
    const stepsCount = activityData.gameBoard?.steps?.length || 0;
    const elementsCount = activityData.gameElements?.selectedElements?.length || 0;
    score += stepsCount * 2;
    score += elementsCount * 1.5;
    if (activityData.narrative?.introduction) score += 3;

    if (score >= 18) {
      return { level: 'Avançada', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', score };
    } else if (score >= 8) {
      return { level: 'Intermediária', color: 'text-accent-yellow', bg: 'bg-accent-yellow/10 border-accent-yellow/30', score };
    }
    return { level: 'Equilibrada', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', score };
  };

  const complexity = calculateComplexity();
  const stepsCount = activityData?.gameBoard?.steps?.length || 0;
  const elementsCount = activityData?.gameElements?.selectedElements?.length || 0;

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

            {/* BADGES METRICAS & PRÉVIA RÁPIDA (Melhoria 37 & 40) */}
            {!showInitialSelection && (
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider backdrop-blur-md ${complexity.bg} ${complexity.color}`} title="Medidor de densidade cognitiva e mecânicas">
                  <FaBolt className="text-xs" />
                  Complexidade: {complexity.level} ({stepsCount} passos, {elementsCount} mecânicas)
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="flex items-center gap-2 px-3.5 py-1 rounded-full border border-accent-teal/40 bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20 hover:scale-105 transition-all text-xs font-bold uppercase tracking-wider shadow-sm"
                  title="Visualizar resumo de como o aluno experimentará o fluxo"
                >
                  <FaEye /> Ver Prévia do Aluno
                </button>
              </div>
            )}
        </div>
        <div className="w-20 h-20 bg-primary-bg/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-border-color/50 shadow-inner transform rotate-12 hover:rotate-0 transition-transform duration-500 hidden md:flex">
            <FaGamepad className="text-4xl text-accent-teal opacity-80" />
        </div>
      </div>

      {/* INDICADOR DE AUTOSAVE EM NUVEM (Melhoria 43: Indicador de Salvamento em Nuvem) */}
      {!showInitialSelection && (
        (() => {
          let statusConfig = {
            borderColor: 'border-border-color',
            icon: <FaCheckCircle className="text-accent-teal text-xs" />,
            text: 'Pronto na Nuvem'
          };

          if (autoSaveStatus === 'saving') {
            statusConfig = {
              borderColor: 'border-accent-yellow/60 bg-accent-yellow/10',
              icon: <FaSync className="animate-spin text-accent-yellow text-xs" />,
              text: 'Sincronizando Nuvem...'
            };
          } else if (autoSaveStatus === 'saved') {
            statusConfig = {
              borderColor: 'border-green-500/60 bg-green-500/10',
              icon: <FaCheckCircle className="text-green-400 text-xs" />,
              text: lastSavedAt
                ? `Salvo na Nuvem às ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Salvo na Nuvem'
            };
          } else if (autoSaveStatus === 'error') {
            statusConfig = {
              borderColor: 'border-red-500/60 bg-red-500/10',
              icon: <FaTimesCircle className="text-red-400 text-xs" />,
              text: 'Erro de Sincronização'
            };
          }

          return (
            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20 animate-fade-in">
              <div className={`backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border shadow-lg transition-all duration-300 ${statusConfig.borderColor} bg-primary-bg/80`}>
                <span className="text-sm">☁️</span>
                {statusConfig.icon}
                <p className="font-bold text-[11px] text-primary-text tracking-wider uppercase">
                  {statusConfig.text}
                </p>
              </div>
            </div>
          );
        })()
      )}

      {/* MODAL DE PRÉVIA RÁPIDA (Melhoria 40: Visão do Aluno) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-secondary-bg border border-border-color rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-color pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-teal/20 text-accent-teal flex items-center justify-center font-bold">
                  <FaEye />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary-text">Prévia da Experiência do Aluno</h3>
                  <p className="text-xs text-secondary-text">Simulação da jornada linear e mecânicas visíveis</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-secondary-text hover:text-danger p-2 transition-colors"
                aria-label="Fechar"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm text-secondary-text">
              <div className="p-4 rounded-xl bg-primary-bg/50 border border-border-color">
                <span className="font-bold text-primary-text block mb-1">Título da Atividade:</span>
                <p className="text-base text-accent-teal font-semibold">{activityData?.title || '(Sem título definido)'}</p>
              </div>

              <div className="p-4 rounded-xl bg-primary-bg/50 border border-border-color">
                <span className="font-bold text-primary-text block mb-2 flex items-center gap-2">
                  <FaLayerGroup className="text-accent-yellow" /> Passos Estruturados no Tabuleiro ({stepsCount}):
                </span>
                {stepsCount > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {activityData.gameBoard.steps.map((st, i) => (
                      <li key={i} className="text-primary-text">
                        <span className="font-semibold">{st.title || `Passo ${i + 1}`}</span> - Tipo: <span className="text-accent-teal font-mono text-xs uppercase">{st.type || 'Geral'}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="italic text-secondary-text">Nenhum passo adicionado ainda na Etapa 6 (Tabuleiro).</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-primary-bg/50 border border-border-color">
                <span className="font-bold text-primary-text block mb-1">Mecânicas Ativas ({elementsCount}):</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {elementsCount > 0 ? (
                    activityData.gameElements.selectedElements.map((el, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-accent-teal/10 text-accent-teal border border-accent-teal/30 text-xs font-semibold">
                        {el}
                      </span>
                    ))
                  ) : (
                    <span className="italic text-secondary-text">Nenhuma mecânica selecionada.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 rounded-xl bg-accent-teal text-primary-bg font-bold hover:bg-accent-teal/90 transition-all text-sm"
              >
                Concluir Prévia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityCreationHeader;
