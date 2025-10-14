/** @type {import('tailwindcss').Config} */
export default {
  // Habilita a estratégia de modo escuro baseada em classe
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/react-roulette-pro/dist/index.css",
  ],
  theme: {
    extend: {
      colors: {
        // Cores definidas como variáveis CSS para facilitar a troca de tema
        'primary-bg': 'var(--background-primary)',
        'primary-text': 'var(--text-primary)',
        'secondary-bg': 'var(--background-secondary)',
        'header-bg': 'var(--header-background)',
        'card-bg': 'var(--card-background)',
        'secondary-text': 'var(--text-secondary)',
        // Mantém suas cores de acentuação
        'accent-yellow': '#ffbd30',
        'accent-teal': '#69e8cb',
        'accent-purple': '#9570d9',
      },
      // Adiciona uma animação sutil para a entrada dos menus
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out forwards',
      }
    },
  },
  plugins: [],
}
