/**
 * Экспорт скринов UI для лендинга (Playwright).
 *
 * Режимы:
 *   node scripts/capture-screens.mjs              — из живого приложения (по умолчанию)
 *   node scripts/capture-screens.mjs --source=lab — из актуальных design-lab макетов
 *
 * App (нужны backend + `npm run dev` в frontend-react):
 *   CAPTURE_APP_URL   — http://127.0.0.1:5173/telegram-mini-app/
 *   CAPTURE_API_URL   — http://127.0.0.1:8000
 *   CAPTURE_USERNAME  — pytest_user
 *   CAPTURE_PASSWORD  — secret
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const landingRoot = path.join(__dirname, '..');
const repoRoot = path.join(landingRoot, '..');
const outDir = path.join(landingRoot, 'public', 'screens');

const source = process.argv.includes('--source=lab') ? 'lab' : 'app';

const LAB_CAPTURES = [
  {
    name: 'dashboard',
    dir: 'design-lab/dashboard/goal-chain-round',
    selector: '.lab-states:first-of-type .mqx-dash-stack--unified',
    hide: `
      .lab-header, .lab-intro, .lab-page-order, .lab-states:not(:first-of-type) { display: none !important; }
      body { background: #f5f6f8 !important; padding: 12px !important; margin: 0 !important; }
      .lab-main, .lab-wrap { padding: 0 !important; max-width: none !important; }
    `,
  },
  {
    name: 'capital',
    dir: 'design-lab/capital-page/flows-round',
    selector: '.phone',
    hide: `
      .lab-header, .lab-wrap > .lab-section__label { display: none !important; }
      body { background: #f5f6f8 !important; padding: 12px !important; margin: 0 !important; }
      .lab-main, .lab-wrap { padding: 0 !important; max-width: none !important; }
    `,
  },
  {
    name: 'events',
    dir: 'design-lab/events/layout-round',
    selector: '#l1 .ev-card-shell:first-child',
    hide: `
      .lab-header, .lab-intro, .lab-pick-banner, .lab-section:not(#l1),
      .lab-dual > .ev-card-shell:not(:first-child) { display: none !important; }
      body { background: #f5f6f8 !important; padding: 12px !important; margin: 0 !important; }
      .lab-main, .lab-wrap { padding: 0 !important; max-width: none !important; }
    `,
  },
];

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fileUrlFor(dir) {
  const indexPath = path.join(repoRoot, dir, 'index.html');
  return `file:///${indexPath.replace(/\\/g, '/')}`;
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    console.error('Установите Playwright: cd landing && npm install -D playwright && npx playwright install chromium');
    process.exit(1);
  }
}

async function captureLab(browser) {
  for (const job of LAB_CAPTURES) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width: 460, height: 1500 } });
      await page.goto(fileUrlFor(job.dir), { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.addStyleTag({ content: job.hide });
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      await wait(900);
      const loc = page.locator(job.selector).first();
      await loc.waitFor({ state: 'visible', timeout: 15000 });
      const pngPath = path.join(outDir, `${job.name}-${theme}.png`);
      await loc.screenshot({ path: pngPath, animations: 'disabled' });
      console.log('✓', `${job.name}-${theme}.png`, '(lab)');
      await page.close();
    }
  }
}

async function apiLogin(page, { apiUrl, username, password }) {
  const token = await page.evaluate(
    async ({ apiUrl, username, password }) => {
      const res = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`login ${res.status}: ${text}`);
      }
      const data = await res.json();
      localStorage.setItem('tg_miniapp_token', data.access_token);
      return data.access_token;
    },
    { apiUrl, username, password },
  );
  return token;
}

async function captureApp(browser) {
  const baseUrl = (process.env.CAPTURE_APP_URL || 'http://127.0.0.1:5173/telegram-mini-app/').replace(
    /\/?$/,
    '/',
  );
  const apiUrl = (process.env.CAPTURE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  const username = process.env.CAPTURE_USERNAME || 'pytest_user';
  const password = process.env.CAPTURE_PASSWORD || 'secret';

  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({
      viewport: { width: 420, height: 1500 },
      deviceScaleFactor: 2,
    });

    await page.goto(`${baseUrl}#/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await apiLogin(page, { apiUrl, username, password });
    await page.goto(`${baseUrl}#/`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.waitForFunction(
      () =>
        document.querySelector('.mqx-screen--game') ||
        document.querySelector('.mqx-start-menu__profile'),
      { timeout: 45000 },
    );

    const continueBtn = page.getByRole('button', { name: 'Продолжить' }).first();
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
      await page.waitForSelector('.mqx-screen--game', { timeout: 60000 });
    }

    await page.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t);
    }, theme);
    await wait(1200);

    const goalToggle = page.locator('.mqx-goal-dash__toggle').first();
    if ((await goalToggle.count()) > 0) {
      const expanded = await goalToggle.getAttribute('aria-expanded');
      if (expanded !== 'true') await goalToggle.click();
      await wait(400);
    }

    const gameShell = page.locator('.mqx-screen--game').first();
    await gameShell.waitFor({ state: 'visible', timeout: 15000 });
    await page.screenshot({
      path: path.join(outDir, `dashboard-${theme}.png`),
      animations: 'disabled',
      clip: await gameShell.boundingBox(),
    });
    console.log('✓', `dashboard-${theme}.png`, '(app)');

    await page.getByRole('button', { name: 'Финансы' }).click();
    await page.locator('.mqx-capital-page').waitFor({ state: 'visible', timeout: 20000 });
    await wait(600);
    const incomeAcc = page.locator('#capital-flows-income').first();
    if ((await incomeAcc.count()) > 0) {
      const open = await incomeAcc.getAttribute('open');
      if (!open) await incomeAcc.locator('summary').click().catch(() => {});
    }
    await wait(400);
    await page.screenshot({
      path: path.join(outDir, `capital-${theme}.png`),
      animations: 'disabled',
      clip: await gameShell.boundingBox(),
    });
    console.log('✓', `capital-${theme}.png`, '(app)');

    await page.goto(`${baseUrl}#/dev/mqx`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t);
    }, theme);
    const eventCard = page.locator('.mqx-events-card').first();
    await eventCard.waitFor({ state: 'visible', timeout: 20000 });
    await eventCard.scrollIntoViewIfNeeded();
    await wait(400);
    await eventCard.screenshot({
      path: path.join(outDir, `events-${theme}.png`),
      animations: 'disabled',
    });
    console.log('✓', `events-${theme}.png`, '(app /dev/mqx)');

    await page.close();
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch();

  try {
    if (source === 'lab') {
      await captureLab(browser);
    } else {
      try {
        await captureApp(browser);
      } catch (err) {
        console.warn('App capture failed:', err.message);
        console.warn('Fallback → design-lab. For app: backend + npm run dev, pytest profile.');
        await captureLab(browser);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`Готово: ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
