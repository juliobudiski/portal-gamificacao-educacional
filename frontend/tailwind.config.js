// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  // Altere 'media' para 'class'
  darkMode: 'class', // <--- Mude aqui!
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}