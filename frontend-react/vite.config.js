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
  },
  /**
   * lottie-web выполняет AE-выражения через eval — роллап честно предупреждает.
   * Отключаем только этот известный случай; см. node_modules/lottie-web/.../lottie.js.
   */
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      onwarn(warning, handler) {
        if (warning.code === 'EVAL') return;
        const text = String(warning.message || '');
        if (text.includes('Use of direct') && text.includes('eval') && text.includes('lottie')) return;
        handler(warning);
      },
    },
  },
})