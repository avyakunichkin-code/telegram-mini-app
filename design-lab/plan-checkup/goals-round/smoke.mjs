import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../../../apps/plan-web/package.json', import.meta.url))
const { chromium } = require('@playwright/test')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', e => errors.push(e.message))
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
mkdirSync(new URL('./qa/', import.meta.url), { recursive: true })
try {
  await page.goto('http://127.0.0.1:4175/plan-checkup/goals-round/')
  await page.locator('#state option').first().waitFor({ state: 'attached' })
  const states = await page.locator('#state option').evaluateAll(options => options.map(o => o.value))
  let count = 0
  for (const width of [375, 701, 1050, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const v of ['A', 'B', 'C']) {
      await page.locator(`[data-variant=${v}]`).click()
      for (const state of states) {
        await page.selectOption('#state', state)
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error(`overflow ${width}/${v}/${state}`)
        if (!(await page.locator('#preview').innerText()).trim()) throw Error('empty preview')
        count++
      }
      await page.selectOption('#state', 'normal')
      await page.screenshot({ path: fileURLToPath(new URL(`./qa/${v}-${width}.png`, import.meta.url)), fullPage: true })
      if (v === 'B') {
        await page.selectOption('#state', 'done')
        await page.locator('.achievement h2').waitFor()
        await page.screenshot({ path: fileURLToPath(new URL(`./qa/B-done-${width}.png`, import.meta.url)), fullPage: true })
        await page.evaluate(() => { document.querySelector('.achievement-copy>p').textContent = 'Первый взнос на большую квартиру для всей семьи в новом городе — нужная сумма собрана.' })
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error(`long title overflow ${width}`)
      }
    }
  }
  await page.selectOption('#state', 'error')
  await page.locator('#retry').click()
  if (await page.locator('#state').inputValue() !== 'normal') throw Error('retry failed')
  await page.selectOption('#state', 'empty')
  await page.locator('#retry').click()
  await page.selectOption('#state', 'normal')
  await page.locator('details summary').click()
  if (!(await page.locator('details').getAttribute('open') !== null)) throw Error('details failed')
  if (errors.length) throw Error(errors.join('\n'))
  console.log(`PASS: ${count} variant/state/viewport combinations; retry, empty CTA, details; no page or HTTP errors`)
} finally { await browser.close() }
