import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/telegram-mini-app/'
  const apiTarget = (env.VITE_API_BASE_URL || 'https://telegram-mini-app-zwfs.onrender.com').replace(/\/$/, '')

  return {
    plugins: [react()],
    base,
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    /**
     * lottie-web выполняет AE-выражения через eval — роллап честно предупреждает.
     * Отключаем только этот известный случай; см. node_modules/lottie-web/.../lottie.js.
     */
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        onwarn(warning, handler) {
          if (warning.code === 'EVAL') return
          const text = String(warning.message || '')
          if (text.includes('Use of direct') && text.includes('eval') && text.includes('lottie')) return
          handler(warning)
        },
      },
    },
  }
})
