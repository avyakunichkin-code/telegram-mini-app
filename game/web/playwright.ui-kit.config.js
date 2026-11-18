import { defineConfig } from '@playwright/test';

// Native control contracts need the actual Game adapter and CSS, without API/auth.
const port = Number(process.env.E2E_UIKIT_PORT || 5183);
export default defineConfig({
  testDir: './e2e',
  testMatch: ['ui-kit.spec.js', 'run-finale.spec.js'],
  workers: 1,
  timeout: 30_000,
  reporter: 'list',
  use: { baseURL: `http://localhost:${port}`, channel: 'chrome', locale: 'ru-RU' },
  projects: [
    { name: 'mobile', use: { viewport: { width: 375, height: 812 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npx vite --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    env: { VITE_BASE_PATH: '/', VITE_CACHE_DIR: 'node_modules/.vite-ui-kit' },
    reuseExistingServer: false,
  },
});
