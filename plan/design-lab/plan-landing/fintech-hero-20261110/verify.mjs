import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(dir, '../../../../game/landing/package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const failures = [];
page.on('pageerror', error => failures.push(error.message));
page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
const output = path.join(dir, process.env.PLAN_LANDING_URL ? 'qa/published' : 'qa');
fs.mkdirSync(output, { recursive: true });
try {
  await page.goto(process.env.PLAN_LANDING_URL || 'http://127.0.0.1:4190/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('button', { name: 'Только необходимые' }).click();
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('form,input').count(), 0);
  assert.equal(await page.evaluate(() => window.CookieConsent.allowed('analytics')), false);
  for (const width of [1440, 1024, 768, 390, 375, 320]) {
    await page.setViewportSize({ width, height: 960 });
    await page.evaluate(() => scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    await page.evaluate(() => document.fonts.ready);
    const data = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      images: [...document.images].filter(im => !im.complete || !im.naturalWidth).map(im => im.src),
      anchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.hash),
      duplicateIds: [...document.querySelectorAll('[id]')].map(e => e.id).filter((id, index, all) => all.indexOf(id) !== index),
    }));
    if (data.overflow) console.log(await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, elements: [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth).map(e => ({ tag: e.tagName, class: e.className, right: e.getBoundingClientRect().right })).slice(0, 20) })));
    assert.deepEqual(data, { overflow: false, images: [], anchors: [], duplicateIds: [] }, `layout ${width}: ${JSON.stringify(data)}`);
    if ([1440, 390, 320].includes(width)) await page.screenshot({ path: path.join(output, `full-${width}.png`), fullPage: true });
    if ([1440, 390].includes(width)) {
      await page.screenshot({ path: path.join(output, `hero-${width}.png`) });
      await page.locator('#report').screenshot({ path: path.join(output, `report-${width}.png`) });
    }
  }
  for (const key of ['income', 'child', 'prices', 'decision']) {
    await page.locator(`[data-scenario="${key}"]`).click();
    assert.equal(await page.locator(`[data-scenario="${key}"]`).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-scenario][aria-pressed=true]').count(), 1);
  }
  for (const key of ['mortgage', 'debts', 'resilience', 'goal']) {
    await page.locator(`[data-question="${key}"]`).click();
    assert.match(await page.locator('#scenario-label').innerText(), /^Вопрос/);
    assert.equal(await page.locator('[data-scenario][aria-pressed=true]').count(), 0);
  }
  await page.locator('.plan-explanation summary').click();
  assert.equal(await page.locator('.plan-explanation').getAttribute('open'), '');
  const step = page.locator('[data-demo-step]');
  await step.click();
  assert.equal(await step.getAttribute('aria-pressed'), 'true');
  assert.match(await page.locator('.plan-demo-status').innerText(), /Деньги не переводились/);
  await step.click();
  assert.equal(await step.getAttribute('aria-pressed'), 'false');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#cc-banner').count(), 0);
  assert.equal(await page.locator('[data-demo-step]').getAttribute('aria-pressed'), 'false');
  assert.deepEqual(failures, []);
  console.log('PASS: 1440/1024/768/390/375/320, images/anchors/IDs, 4 scenarios, 4 questions, explanation, step/reset/reload, cookie persistence; no runtime/resource errors.');
} finally { await browser.close(); }
