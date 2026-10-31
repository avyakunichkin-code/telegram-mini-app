import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

/**
 * UI-сценарии ТВОЙ ХОД в настоящем браузере (системный Google Chrome, без скачивания браузеров).
 * Стенд изолирован от локальной разработки: свой backend на SQLite (порт 8011) и свой Vite (5181).
 * Запуск: `npm run test:e2e` (см. e2e/README.md).
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(here, '../backend');
const python = process.env.E2E_PYTHON || path.join(backendDir, '.venv', 'Scripts', 'python.exe');
const dbFile = path.join(os.tmpdir(), `tvoy-hod-e2e-${process.pid}.db`).replace(/\\/g, '/');

// Порты стенда: не пересекаются с dev (8000/5173) и соседними сессиями; переопределяются env.
const apiPort = Number(process.env.E2E_API_PORT || 8011);
const webPort = Number(process.env.E2E_WEB_PORT || 5181);
const E2E_API = `http://localhost:${apiPort}`;
const E2E_WEB = `http://localhost:${webPort}`;
// Воркеры наследуют env процесса конфигурации — fixtures.js берёт адрес API отсюда.
process.env.E2E_API_URL = E2E_API;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Один backend на SQLite — сценарии идут последовательно, у каждого свой пользователь.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: E2E_WEB,
    channel: 'chrome',
    ...devices['Pixel 7'],
    // Pixel 7 = мобильный viewport 412×915 + touch; ЦА играет с телефона.
    locale: 'ru-RU',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'mobile-chrome' }],
  webServer: [
    {
      command: `"${python}" -m uvicorn main:app --port ${apiPort}`,
      cwd: backendDir,
      url: `${E2E_API}/api/health`,
      env: {
        DATABASE_URL: `sqlite:///${dbFile}`,
        PYTHONIOENCODING: 'utf-8',
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${webPort} --strictPort`,
      cwd: here,
      url: E2E_WEB,
      env: {
        VITE_API_BASE_URL: E2E_API,
        VITE_BASE_PATH: '/',
        // Свой кэш пред-сборки зависимостей: общий node_modules/.vite с dev-сервером рвал соединения.
        VITE_CACHE_DIR: 'node_modules/.vite-e2e',
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
