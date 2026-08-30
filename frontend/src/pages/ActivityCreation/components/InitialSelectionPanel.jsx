import React from 'react';

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
      <div className="bg-secondary-bg dark:bg-primary-bg p-8 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-accent-purple to-accent-teal bg-clip-text text-transparent">
          Como você gostaria de começar?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div id="tour-start-scratch" className="relative bg-secondary-bg rounded-2xl shadow-xl overflow-hidden border border-[var(--border-color)] hover:border-accent-yellow/50 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-teal/5 to-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 p-6 flex flex-col items-center text-center h-full">
              <div className="mb-4 bg-gradient-to-r from-accent-yellow to-accent-teal p-1 rounded-full">
                <div className="bg-primary-bg rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <h4 className="text-xl font-semibold text-primary-text mb-2">Iniciar do Zero</h4>
              <p className="text-secondary-text mb-6 flex-grow">Comece com um formulário completamente vazio e personalize cada detalhe.</p>
              <button onClick={handleStartFromScratch} className="w-full py-3 px-6 bg-gradient-to-r from-accent-yellow to-accent-teal text-white dark:text-primary-bg font-bold rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 transform hover:-translate-y-0.5 transition-all duration-300 ease-out">
                Atividade em Branco
              </button>
            </div>
          </div>

          <div className="relative bg-secondary-bg rounded-2xl shadow-xl overflow-hidden border border-[var(--border-color)] hover:border-accent-purple/50 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/5 to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 p-6 flex flex-col items-center text-center h-full">
              <div className="mb-4 bg-gradient-to-r from-accent-purple to-accent-teal p-1 rounded-full">
                <div className="bg-primary-bg rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-xl font-semibold text-primary-text mb-2">Escolher um Template</h4>
              <p className="text-secondary-text mb-6 flex-grow">Use um de nossos templates predefinidos para agilizar a criação.</p>
              <button id="tour-choose-scratch" onClick={handleShowTemplates} className="w-full py-3 px-6 bg-gradient-to-r from-accent-purple to-accent-teal text-white dark:text-primary-bg font-bold rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 transform hover:-translate-y-0.5 transition-all duration-300 ease-out">
                Ver Templates
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary-bg dark:bg-primary-bg p-8 rounded-lg shadow-md mt-6">
      <h4 className="text-xl font-bold text-center mb-6 bg-gradient-to-r from-accent-purple to-accent-yellow bg-clip-text text-transparent">
        Templates Predefinidos
      </h4>
      {loadingTemplates ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-teal"></div>
          <p className="mt-4 text-secondary-text">Carregando templates...</p>
        </div>
      ) : templateError ? (
        <div className="bg-danger-bg border border-danger/20 text-danger p-4 rounded-xl text-center"><p>Erro: {templateError}</p></div>
      ) : templates.length === 0 ? (
        <div className="bg-info-bg border border-info/20 text-info p-4 rounded-xl text-center"><p>Nenhum template disponível no momento.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="relative bg-secondary-bg rounded-2xl shadow-xl p-6 border border-[var(--border-color)] hover:border-accent-teal/50 transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/5 to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-r from-accent-purple to-accent-yellow p-1 rounded-full">
                    <div className="bg-primary-bg rounded-full p-2"><span className="text-2xl">{template.icon}</span></div>
                  </div>
                </div>
                <h5 className="text-lg font-semibold text-primary-text text-center mb-2">{template.name}</h5>
                <p className="text-secondary-text text-sm mb-4 flex-grow text-center">{template.description}</p>
                <button onClick={() => handleSelectTemplate(template.data)} className="mt-auto py-2 px-4 bg-gradient-to-r from-accent-purple to-accent-teal text-white dark:text-primary-bg font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">
                  Usar Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8 text-center">
        <button onClick={handleBackToInitialSelection} className="py-2 px-4 border border-accent-teal/30 rounded-xl shadow-sm text-sm font-medium text-primary-text bg-secondary-bg hover:bg-primary-bg transition duration-300">
          <span className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar para Seleção Inicial
          </span>
        </button>
      </div>
    </div>
  );
}

export default InitialSelectionPanel;
