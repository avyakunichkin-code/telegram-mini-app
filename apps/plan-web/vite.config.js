import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const here = path.dirname(fileURLToPath(import.meta.url))
const packages = path.resolve(here, '../../packages')

// /api проксируется на plan-api (uvicorn :8020). Общие JS-пакеты (SPL-403) — по алиасу из packages/.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@tvoy/api-client': path.join(packages, 'api-client/src/index.js') },
  },
  server: {
    fs: { allow: [here, packages] },
    proxy: { '/api': process.env.PLAN_API_URL || 'http://127.0.0.1:8020' },
  },
})
