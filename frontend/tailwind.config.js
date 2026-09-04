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
        'border-color': 'var(--border-color)',
        'hover-bg-color': 'var(--hover-bg-color)',

        // --- CORES DE DESTAQUE ATUALIZADAS ---
        // Em vez de um valor fixo, agora usam as variáveis do index.css
        'accent-yellow': 'var(--color-accent-yellow)',
        'accent-teal': 'var(--color-accent-teal)',
        'accent-purple': 'var(--color-accent-purple)',

        // --- NOVAS CORES SEMÂNTICAS ---
        'success': 'var(--color-success)',
        'success-bg': 'var(--color-success-bg)',
        'danger': 'var(--color-danger)',
        'danger-bg': 'var(--color-danger-bg)',
        'info': 'var(--color-info)',
        'info-bg': 'var(--color-info-bg)',
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
  plugins: [
    require('@tailwindcss/typography'),
  ],
}