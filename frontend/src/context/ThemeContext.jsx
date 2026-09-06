import React, { createContext, useState, useEffect, useContext } from 'react';

/**
 * ThemeContext
 * 
 * Architectural intent: Encapsulates theme preference (light/dark) state and side-effects
 * (DOM manipulation, localStorage persistence). Adheres to the Single Responsibility Principle
 * by isolating theme logic from UI components, allowing components to consume and toggle
 * the theme without knowing how it is applied to the document.
 */
// Cria o contexto
const ThemeContext = createContext();

// Hook customizado para facilitar o uso do contexto
export const useTheme = () => useContext(ThemeContext);

// Componente Provedor que irá encapsular a aplicação
export const ThemeProvider = ({ children }) => {
    // Inicializa o estado buscando o tema no localStorage ou usando 'light' como padrão
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    // Efeito que é executado sempre que o estado 'theme' muda
    useEffect(() => {
        const root = window.document.documentElement; // Acessa o elemento <html>

        // Remove a classe do tema anterior para evitar conflitos
        const oldTheme = theme === 'dark' ? 'light' : 'dark';
        root.classList.remove(oldTheme);

        // Adiciona a classe do tema atual ao elemento <html>
        root.classList.add(theme);

        // Salva a preferência do usuário no localStorage
        localStorage.setItem('theme', theme);
    }, [theme]); // O array de dependências garante que o efeito rode apenas quando 'theme' mudar

    // Função para alternar o tema
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    // Fornece o estado 'theme' e a função 'toggleTheme' para os componentes filhos
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
