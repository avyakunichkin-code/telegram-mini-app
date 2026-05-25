/**
 * Экспорт скринов UI из design-lab для лендинга.
 * Требует: npx playwright install chromium (один раз).
 *
 * Запуск из landing/: node scripts/capture-screens.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const landingRoot = path.join(__dirname, '..');
const repoRoot = path.join(landingRoot, '..');
const outDir = path.join(landingRoot, 'public', 'screens');

const CAPTURES = [
  {
    name: 'dashboard-light',
    dir: 'design-lab/dashboard',
    setup: async (page) => {
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
      });
      await page.evaluate(() => {
        document.querySelector('[data-skin-btn="s5"]')?.click();
      });
    },
    selector: '.lab-phone--featured .lab-phone__shell',
  },
  {
    name: 'dashboard-dark',
    dir: 'design-lab/dashboard',
    setup: async (page) => {
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await page.evaluate(() => {
        document.querySelector('[data-skin-btn="s5"]')?.click();
      });
    },
    selector: '.lab-phone--featured .lab-phone__shell',
  },
  {
    name: 'events-light',
    dir: 'design-lab/events/layout-round',
    setup: async (page) => {
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    },
    selector: '#l1 .ev-card-shell:first-child .ev-m2',
  },
  {
    name: 'events-dark',
    dir: 'design-lab/events/layout-round',
    setup: async (page) => {
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    },
    selector: '#l1 .ev-card-shell:first-child .ev-m2',
  },
  {
    name: 'capital-light',
    dir: 'design-lab/capital-page',
    setup: async (page) => {
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    },
    selector: '#phone-demo',
  },
  {
    name: 'capital-dark',
    dir: 'design-lab/capital-page',
    setup: async (page) => {
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    },
    selector: '#phone-demo',
  },
];

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fileUrlFor(dir) {
  const indexPath = path.join(repoRoot, dir, 'index.html');
  return `file:///${indexPath.replace(/\\/g, '/')}`;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('Установите Playwright: cd landing && npm install -D playwright && npx playwright install chromium');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const hideBase = `
    .lab-header, .lab-intro, .lab-legend,
    .lab-wrap > .lab-pick-banner, .lab-section__label, .lab-section__note,
    body { background: #0f1115 !important; padding: 16px !important; margin: 0 !important; }
    .lab-main, .lab-wrap { padding: 0 !important; max-width: none !important; }
    .lab-phone__tag { display: none !important; }
  `;
  const hideDashboard = `${hideBase}
    .lab-intro, .lab-legend { display: none !important; }
    .lab-phone--tile:not(.lab-phone--featured) { display: none !important; }
    .lab-gallery { display: flex !important; justify-content: center !important; }
  `;
  const hideEvents = `${hideBase}
    .lab-dual > .ev-card-shell:not(:first-child), .lab-section:not(#l1) { display: none !important; }
  `;
  const hideCapital = `${hideBase}
    .lab-section:not(:has(#phone-demo)) { display: none !important; }
  `;

  for (const job of CAPTURES) {
    const url = fileUrlFor(job.dir);
    const hideChrome = job.dir.includes('dashboard')
      ? hideDashboard
      : job.dir.includes('events')
        ? hideEvents
        : hideCapital;
    const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.addStyleTag({ content: hideChrome });
    await job.setup(page);
    await wait(1200);
    const loc = page.locator(job.selector).first();
    await loc.waitFor({ state: 'visible', timeout: 15000 });
    const pngPath = path.join(outDir, `${job.name}.png`);
    await loc.screenshot({ path: pngPath, animations: 'disabled' });
    console.log('✓', job.name);
    await page.close();
  }

  await browser.close();
  console.log(`Готово: ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
