import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/telegram-mini-app/',  // <-- имя репозитория
  server: {
    proxy: {
      '/api': {
        target: 'https://telegram-mini-app-zwfs.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})