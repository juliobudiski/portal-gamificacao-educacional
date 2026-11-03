import React from 'react';
import { useTheme } from '../context/ThemeContext'; // Importa nosso hook customizado
import { Sun, Moon } from 'lucide-react';

/**
 * @component ThemeToggleButton
 * @description
 * Floating UI component allowing global toggle between Light and Dark modes.
 * 
 * Architectural Decisions:
 * - Decoupled State Management: Relies entirely on `useTheme` context hook, remaining stateless itself and focusing solely on presentation and action triggering.
 */


const ThemeToggleButton = ({ className = '' }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-3 bg-gray-200 dark:bg-primary-bg text-primary-text dark:text-secondary-text rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:bg-accent-yellow dark:hover:bg-accent-yellow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-yellow ${className || 'fixed bottom-24 right-6 z-40'}`}
            aria-label="Alternar tema"
            title={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
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