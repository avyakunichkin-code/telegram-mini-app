import os from 'node:os'
import { projectPython } from '../../scripts/lib/project-runtime.mjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'

/**
 * E2E прототипа ТВОЙ ПЛАН (CS-11, plan/docs/specs/SPEC_plan-v1.md) в системном Google Chrome.
 * Стенд свой: plan-api на 8021 (БД `plan` — временный файл SQLite на прогон: у `sqlite://` одно соединение
 * на все потоки, параллельные запросы веба его ломают; миграции при старте в dev) и Vite на 5191 —
 * не пересекается с dev (8020/5190). Python — `E2E_PYTHON` или `plan/.venv`.
 * Запуск: `npm run test:e2e`.
 */
const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const python = projectPython(root, 'plan', process.env.E2E_PYTHON)

const apiPort = Number(process.env.E2E_API_PORT || 8021)
const webPort = Number(process.env.E2E_WEB_PORT || 5191)
const E2E_API = `http://127.0.0.1:${apiPort}`
const E2E_WEB = `http://127.0.0.1:${webPort}`

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: E2E_WEB,
    channel: 'chrome',
    locale: 'ru-RU',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Узкий телефон — проверка ROADMAP P0 «путь на 375 px»; десктоп — вторая ширина из критерия P0.
    { name: 'mobile-375', use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
  ],
  webServer: [
    {
      command: `"${python}" "${path.join(here, 'e2e', 'api_server.py')}" ${apiPort}`,
      cwd: path.join(root, 'plan', 'api'),
      url: `${E2E_API}/api/health`,
      env: {
        PYTHONIOENCODING: 'utf-8',
        PLAN_CORS_ORIGINS: E2E_WEB,
        PLAN_DATABASE_URL: `sqlite:///${path.join(os.tmpdir(), `plan-e2e-${Date.now()}.db`).replaceAll('\\', '/')}`,
        PYTHONPATH: [path.join(root, 'shared/packages/platform/src'), path.join(root, 'shared/packages/fincore/src')].join(path.delimiter),
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: process.env.E2E_PREVIEW === '1' ? `npx vite preview --host 127.0.0.1 --port ${webPort} --strictPort` : `npx vite --host 127.0.0.1 --port ${webPort} --strictPort`,
      cwd: here,
      url: E2E_WEB,
      env: { PLAN_API_URL: E2E_API },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
