import { defineConfig } from 'vite';

/** Отдельный деплой: base '/' по умолчанию. Для GitHub Pages в подпапке: BASE_PATH=/repo-name/ npm run build */
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
