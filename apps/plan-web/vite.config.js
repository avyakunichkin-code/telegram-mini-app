import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Прототип: /api проксируется на plan-api (uvicorn :8020)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': process.env.PLAN_API_URL || 'http://127.0.0.1:8020' },
  },
})
