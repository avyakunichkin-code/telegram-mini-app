import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const require = createRequire(new URL('../../../frontend-react/package.json', import.meta.url));
const { chromium } = require('playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const url = new URL('index.html', import.meta.url).href;
try {
  await page.goto(url);
  await page.locator('.card').first().waitFor();
  assert.equal(await page.locator('.card').count(), 23);
  await page.locator('#search').fill('GAME-OWNER-18');
  assert.equal(await page.locator('.card').count(), 1);
  await page.locator('.card select').selectOption('working');
  await page.reload();
  await page.locator('#status').selectOption('working');
  assert.equal(await page.locator('.card').count(), 1);
  assert.equal(await page.locator('.card').getAttribute('id'), 'GAME-OWNER-18');
  await page.locator('#status').selectOption('all');
  assert.equal(await page.locator('.card').count(), 23);
  await page.locator('#sort').selectOption('title');
  const titles = await page.locator('.card h2').allTextContents();
  assert.deepEqual(titles, [...titles].sort((a, b) => a.localeCompare(b, 'ru')));
  await page.locator('#type').selectOption('Личный плейтест');
  assert.equal(await page.locator('.card').count(), 1);
  await page.locator('#type').selectOption('');
  await page.locator('#priority').selectOption('1');
  assert.ok(await page.locator('.card').count() > 0);
  await page.locator('#priority').selectOption('');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'tvoy-game-my-tasks.json');
  const input = page.locator('#import');
  await input.setInputFiles({ name: 'queue.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, marks: { 'GAME-OWNER-03': 'working' } })) });
  await page.locator('#message').filter({ hasText: 'восстановлены' }).waitFor();
  await page.locator('#status').selectOption('working');
  assert.equal(await page.locator('.card').getAttribute('id'), 'GAME-OWNER-03');
  await input.setInputFiles({ name: 'invalid.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, marks: { 'PLAN-OWNER-01': 'done' } })) });
  await page.locator('#message').filter({ hasText: 'Импорт не выполнен' }).waitFor();
  assert.equal(await page.locator('.card').getAttribute('id'), 'GAME-OWNER-03');
  await page.reload();
  await page.locator('.card').first().waitFor();
  mkdirSync(new URL('qa/', import.meta.url), { recursive: true });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: fileURLToPath(new URL(`qa/board-${width}.png`, import.meta.url)), fullPage: false });
  }
  await page.goto(url + '#GAME-OWNER-13');
  await page.locator('#GAME-OWNER-13').waitFor();
  assert.equal(await page.locator('#status').inputValue(), 'all');
  assert.deepEqual(errors, []);
  console.log('PASS: offline filters, sorting, status persistence, export/import isolation, deep links, 390/1440 geometry; no JS errors');
} finally {
  await context.close();
  await browser.close();
}
