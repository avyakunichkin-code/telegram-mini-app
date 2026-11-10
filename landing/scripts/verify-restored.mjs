import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
});
try {
  await page.goto(process.env.LANDING_TEST_URL || 'http://127.0.0.1:4178/');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.hero-art').waitFor();
  await page.evaluate(async () => {
    await Promise.all([...document.images].map(image => {
      image.loading = 'eager';
      return image.decode();
    }));
  });
  assert(await page.locator('.hero-art').evaluate(image => image.complete && image.naturalWidth > 0));
  await page.getByRole('button', { name: 'Только необходимые' }).click();
  assert.equal(await page.evaluate(() => window.CookieConsent.allowed('analytics')), false);
  const output = '../.codex-state/landing-recovery';
  fs.mkdirSync(output, { recursive: true });
  for (const width of [1440, 390, 375]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow at ${width}`);
    assert.deepEqual(await page.evaluate(() => [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.src)), []);
    await page.screenshot({ path: `${output}/${width}.png`, fullPage: true });
    for (const choice of ['trip', 'save', 'meet']) {
      await page.locator(`[data-choice=${choice}]`).click();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'result');
      assert(await page.locator('#result a').getAttribute('href'));
      await page.locator('#reset').click();
      assert.equal(await page.evaluate(() => document.activeElement.dataset.choice), 'trip');
    }
  }
  await page.locator('#how').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  assert(await page.locator('#mobile-cta').evaluate(element => element.classList.contains('is-visible')));
  await page.locator('.choice-card').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#mobile-cta').evaluate(element => element.classList.contains('is-visible')), false);
  await page.reload();
  assert.equal(await page.locator('#cc-banner').count(), 0);
  assert.equal(await page.evaluate(() => window.CookieConsent.allowed('analytics')), false);
  assert.deepEqual(errors, []);
  console.log('PASS: 1440/390/375 px, images, all choices/reset/focus, mobile CTA, cookie persistence, no runtime/resource errors.');
} finally {
  await browser.close();
}
