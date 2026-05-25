import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const PWA_ICONS = [
  { src: 'pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: 'pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: 'pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
]

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/telegram-mini-app/'
  const apiTarget = (env.VITE_API_BASE_URL || 'https://telegram-mini-app-zwfs.onrender.com').replace(/\/$/, '')

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: ['favicon.svg', 'pwa/apple-touch-icon.png', 'pwa/icon-192.png', 'pwa/icon-512.png'],
        manifest: {
          name: 'ТВОЙ ХОД',
          short_name: 'ТВОЙ ХОД',
          description: 'Игра по финансовой грамотности — периоды, баланс, решения.',
          theme_color: '#6D28D9',
          background_color: '#F5F6F8',
          display: 'standalone',
          orientation: 'portrait',
          lang: 'ru',
          start_url: `${base}#/`,
          scope: base,
          icons: PWA_ICONS,
        },
        workbox: {
          // HashRouter: без NavigationRoute — иначе iOS Safari часто отдаёт пустую/старую страницу.
          globPatterns: ['**/*.{js,css,html,ico,svg,woff2}', 'pwa/**/*.png', 'favicon.svg'],
          globIgnores: [
            '**/assets/monetka-*.png',
            '**/assets/monetka-*.webp',
            '**/assets/logo-full*.png',
            '**/assets/logo-full*.webp',
            '**/assets/logo-compact*.png',
          ],
          navigateFallback: null,
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        },
        devOptions: {
          enabled: mode === 'development',
        },
      }),
    ],
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
