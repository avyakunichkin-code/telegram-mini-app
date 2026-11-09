import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '../../../apps/plan-web/node_modules/playwright/index.mjs'
const qa = new URL('./qa/', import.meta.url)
await mkdir(qa, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []
try {
  const page = await browser.newPage()
  page.on('pageerror', e => errors.push(e.message))
  page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure()?.errorText))
  const noOverflow = async label => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: overflow`)
  for (const width of [375, 701, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(new URL('./index.html', import.meta.url).href)
    await page.evaluate(() => document.fonts.ready)
    for (const variant of ['A', 'B']) for (const family of ['main', 'strained']) {
      await page.selectOption('#variant', variant); await page.selectOption('#case', family); await page.selectOption('#state', 'ready')
      assert.equal(await page.locator('#block-checks').isVisible(), true)
      await noOverflow(`${variant}/${family}/${width}`)
      if (variant === 'B') {
        const count = await page.locator('[data-tab]').count()
        for (let i = 0; i < count; i++) { await page.locator('[data-tab]').nth(i).click(); await noOverflow(`${family}/${width}/tab${i}`) }
        await page.locator('[data-tab=money]').click()
      }
      if (family === 'strained') assert.match(await page.locator('#block-money').innerText(), /Не хватает/)
      await page.screenshot({ path: fileURLToPath(new URL(`${variant}-${family}-${width}.png`, qa)), fullPage: true })
      for (const state of ['loading', 'legacy', 'error', 'offline']) {
        await page.selectOption('#state', state)
        assert.ok((await page.locator('#notice').innerText()).length)
        assert.equal(await page.locator('#content').isVisible(), state === 'offline')
      }
    }
  }
  for (const c of Object.values(await page.evaluate(() => window.FIXTURE))) {
    const p = c.insights.cash_plan
    if (p.mode === 'surplus') assert.equal(Math.round(p.allocations.reduce((s, a) => s + a.amount, 0) * 100), Math.round(p.free_cashflow * 100))
  }
  assert.deepEqual(errors, [])
  const result = 'PASS: A/B x 2 families at 375/701/1440; no overflow or JS/resource errors; tabs, deficit, loading/legacy/error/offline; allocations sum to free cashflow. Lab only, no app integration.\n'
  await writeFile(new URL('results.txt', qa), result)
  console.log(result)
} finally { await browser.close() }
