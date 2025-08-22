// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/react-roulette-pro/dist/index.css",
  ],
  theme: {
    extend: {
      colors: {
        'dark-background': '#2c3135', // Cor de fundo do seu logo
        'accent-yellow': '#ffbd30', // Exemplo de cor de acentuação
        'accent-teal': '#69e8cb',
        'accent-purple': '#9570d9',
      },
    },
  },
  plugins: [],
}