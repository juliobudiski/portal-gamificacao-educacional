import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Garante que o servidor seja acessível na rede
    allowedHosts: true,
    proxy: {
      // Isso diz: "Tudo que começar com /api, mande para o Flask na porta 5000"
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

