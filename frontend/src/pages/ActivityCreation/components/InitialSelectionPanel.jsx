import React from 'react';

/**
 * InitialSelectionPanel
 * 
 * Architectural intent: Manages the initial branching logic for creating a new activity (scratch vs templates).
 * Isolated as a presentational component, it receives its behavior and state via Dependency Injection (props),
 * keeping the UI stateless and completely decoupled from the activity creation context logic.
 */


function InitialSelectionPanel({
  showTemplateList,
  handleStartFromScratch,
  handleShowTemplates,
  handleSelectTemplate,
  handleBackToInitialSelection,
  loadingTemplates,
  templateError,
  templates
}) {
  if (!showTemplateList) {
    return (
      <div className="bg-secondary-bg/80 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border-color mt-6 max-w-5xl mx-auto">
        <h3 className="text-3xl font-extrabold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-teal">
          Como você gostaria de começar?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div id="tour-start-scratch" className="relative bg-primary-bg/50 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-border-color hover:border-accent-yellow/60 transition-all duration-500 group transform hover:-translate-y-2 cursor-pointer" onClick={handleStartFromScratch}>
            <div className="absolute inset-0 bg-gradient-to-br from-accent-teal/10 via-transparent to-accent-yellow/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 p-8 flex flex-col items-center text-center h-full">
              <div className="mb-6 bg-gradient-to-br from-accent-yellow to-accent-teal p-1 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                <div className="bg-primary-bg rounded-xl p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <h4 className="text-2xl font-bold text-primary-text mb-3">Iniciar do Zero</h4>
              <p className="text-secondary-text mb-8 flex-grow text-lg">Comece com um formulário completamente vazio e personalize cada mínimo detalhe da sua atividade.</p>
              <button className="w-full py-4 px-6 bg-gradient-to-r from-accent-yellow to-[#ffa000] text-gray-900 font-bold rounded-xl shadow-lg group-hover:shadow-[0_0_20px_rgba(255,189,48,0.4)] transition-all duration-300">
                Criar Atividade em Branco
              </button>
            </div>
          </div>

          <div className="relative bg-primary-bg/50 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-border-color hover:border-accent-purple/60 transition-all duration-500 group transform hover:-translate-y-2 cursor-pointer" onClick={handleShowTemplates}>
            <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 via-transparent to-accent-teal/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 p-8 flex flex-col items-center text-center h-full">
              <div className="mb-6 bg-gradient-to-br from-accent-purple to-accent-teal p-1 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                <div className="bg-primary-bg rounded-xl p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-2xl font-bold text-primary-text mb-3">Escolher um Template</h4>
              <p className="text-secondary-text mb-8 flex-grow text-lg">Use um de nossos templates predefinidos de gamificação para agilizar a criação.</p>
              <button id="tour-choose-scratch" className="w-full py-4 px-6 bg-gradient-to-r from-accent-purple to-[#8a42e5] text-white font-bold rounded-xl shadow-lg group-hover:shadow-[0_0_20px_rgba(157,78,221,0.4)] transition-all duration-300">
                Ver Galeria de Templates
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary-bg/80 backdrop-blur-xl p-8 lg:p-10 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border-color mt-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <h4 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-yellow">
          Templates Predefinidos
        </h4>
        <button onClick={handleBackToInitialSelection} className="group flex items-center py-2 px-5 border border-border-color rounded-full shadow-sm text-sm font-bold text-secondary-text bg-primary-bg hover:bg-hover-bg-color hover:border-accent-teal/50 hover:text-accent-teal transition-all duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Voltar
        </button>
      </div>

      {loadingTemplates ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-teal"></div>
          <p className="text-secondary-text font-medium animate-pulse">Carregando galeria de templates...</p>
        </div>
      ) : templateError ? (
        <div className="bg-danger-bg/80 backdrop-blur-sm border border-danger/30 text-danger p-6 rounded-2xl text-center shadow-lg"><p className="font-medium text-lg">Erro: {templateError}</p></div>
      ) : templates.length === 0 ? (
        <div className="bg-info-bg/80 backdrop-blur-sm border border-info/30 text-info p-6 rounded-2xl text-center shadow-lg"><p className="font-medium text-lg">Nenhum template disponível no momento.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map(template => (
            <div key={template.id} className="relative bg-primary-bg/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-border-color hover:border-accent-teal/50 hover:shadow-[0_8px_30px_rgba(105,232,203,0.15)] transition-all duration-500 group overflow-hidden flex flex-col transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-br from-accent-purple to-accent-yellow p-1 rounded-2xl shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                    <div className="bg-primary-bg rounded-xl p-4 flex items-center justify-center min-w-[4rem] min-h-[4rem]">
                        <span className="text-4xl">{template.icon}</span>
                    </div>
                  </div>
                </div>
                <h5 className="text-xl font-extrabold text-primary-text text-center mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent-purple group-hover:to-accent-yellow transition-all duration-300">{template.name}</h5>
                <p className="text-secondary-text text-sm leading-relaxed mb-8 flex-grow text-center">{template.description}</p>
                <button onClick={() => handleSelectTemplate(template.data)} className="mt-auto w-full py-3 px-6 bg-primary-bg text-accent-purple font-bold border border-accent-purple/30 rounded-xl shadow-sm group-hover:bg-gradient-to-r group-hover:from-accent-purple group-hover:to-[#8a42e5] group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_0_15px_rgba(157,78,221,0.4)] transition-all duration-300">
                  Usar Este Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InitialSelectionPanel;