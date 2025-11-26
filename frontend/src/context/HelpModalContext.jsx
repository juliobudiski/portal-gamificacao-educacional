import React, { createContext, useContext, useState, useCallback } from 'react';
import { helpContent } from '../data/helpContent';
import HelpModal from '../components/HelpModal'; // Importamos o visual aqui para encapsular

const HelpModalContext = createContext();

export const HelpModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(null);

  // useCallback garante que a função não seja recriada desnecessariamente
  const openHelp = useCallback((key) => {
    if (helpContent[key]) {
      setActiveKey(key);
      setIsOpen(true);
    } else {
      console.warn(`[Gamefica.Edu Dev Warning]: A chave de ajuda "${key}" não foi encontrada no dicionário helpContent.`);
    }
  }, []);

  const closeHelp = useCallback(() => {
    setIsOpen(false);
    // Pequeno delay para limpar o conteúdo apenas após a animação de saída (opcional)
    setTimeout(() => setActiveKey(null), 300); 
  }, []);

  return (
    <HelpModalContext.Provider value={{ openHelp, closeHelp }}>
      {children}
      
      {/* Renderizamos o Modal aqui. 
        Assim, ele "flutua" sobre toda a aplicação e não precisa ser importado em cada página.
      */}
      <HelpModal 
        isOpen={isOpen} 
        contentKey={activeKey} 
        onClose={closeHelp} 
      />
    </HelpModalContext.Provider>
  );
};

// Hook personalizado para facilitar a importação nos componentes
export const useHelpModal = () => {
  const context = useContext(HelpModalContext);
  if (!context) {
    throw new Error('useHelpModal deve ser usado dentro de um HelpModalProvider');
  }
  return context;
};