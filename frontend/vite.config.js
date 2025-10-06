import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Garante que o servidor seja acessível na rede
    allowedHosts: [
      'greatly-december-constructed-conflict.trycloudflare.com'
    ]
  }
})

