import React from 'react';
import { useTheme } from '../context/ThemeContext'; // Importa nosso hook customizado
import { Sun, Moon } from 'lucide-react'; // Importa os ícones que já estão no projeto

const ThemeToggleButton = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="fixed bottom-5 right-5 z-[100] p-3 bg-gray-200 dark:bg-gray-800 text-primary-text dark:text-gray-200 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:bg-accent-yellow dark:hover:bg-accent-yellow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-yellow"
            aria-label="Alternar tema"
        >
            {theme === 'light' ? (
                <Moon className="w-6 h-6" /> // Mostra o ícone da lua no modo claro
            ) : (
                <Sun className="w-6 h-6" /> // Mostra o ícone do sol no modo escuro
            )}
        </button>
    );
};

export default ThemeToggleButton;
