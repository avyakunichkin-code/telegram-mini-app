import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '../../../web/node_modules/playwright/index.mjs'
const qa = new URL('./qa/', import.meta.url)
await mkdir(qa, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []
try {
  const page = await browser.newPage()
  page.on('pageerror', e => errors.push(e.message))
  page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure()?.errorText))
  for (const variant of ['A', 'B']) {
    for (const width of [375, 701, 1050, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(new URL('./index.html', import.meta.url).href)
      await page.evaluate(() => document.fonts.ready)
      await page.selectOption('#variant', variant)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${variant}/${width}: overflow`)
      if (variant === 'B') {
        for (const panel of ['sensitivity', 'scenario', 'action']) {
          await page.locator(`[data-panel=${panel}]`).click()
          assert.equal(await page.locator('.panel:visible').count(), 1)
          assert.equal(await page.locator(`#${panel}`).isVisible(), true)
        }
        await page.locator('[data-panel=scenario]').click()
      }
      await page.locator('#contribution').fill('15000')
      assert.match(await page.locator('#scenario-note').innerText(), /не хватает/)
      assert.equal(await page.locator('#reserve').innerText(), '—')
      await page.locator('#contribution').fill('')
      assert.match(await page.locator('#scenario-note').innerText(), /Введите/)
      await page.locator('#contribution').fill('-1')
      assert.equal(await page.locator('#available').innerText(), '—')
      await page.locator('#reset').click()
      assert.match(await page.locator('#available').innerText(), /10\s000/)
      await page.locator('#contribution').fill('5000')
      for (const state of ['loading', 'empty', 'error', 'offline']) {
        await page.selectOption('#state', state)
        assert.ok((await page.locator('#notice').innerText()).length)
        if (['loading', 'empty'].includes(state)) assert.equal(await page.locator('#content').isVisible(), false)
        else assert.equal(await page.locator('#contribution').isDisabled(), true)
      }
      await page.selectOption('#state', 'ready')
      assert.equal(await page.locator('#contribution').inputValue(), '5000')
      if (variant === 'B') await page.locator('[data-panel=sensitivity]').click()
      await page.locator('#clarify').click()
      await page.locator('#income').fill('90000')
      assert.match(await page.locator('#income-result').innerText(), /-5\s000/)
      if (variant === 'B') await page.locator('[data-panel=action]').click()
      await page.locator('#done').check()
      assert.match(await page.locator('#action-result').innerText(), /только новыми данными/)
      if (variant === 'B') await page.locator('[data-panel=sensitivity]').click()
      await page.screenshot({ path: fileURLToPath(new URL(`${variant}-${width}.png`, qa)), fullPage: true })
    }
  }
  assert.deepEqual(errors, [])
  const result = 'PASS: A/B at 375/701/1050/1440; no overflow or JS/resource errors; wizard navigation, invalid/zero/excess contribution, range endpoint, action wording, loading/empty/error/offline and retained inputs. Lab only; no application/API/resume coverage.\n'
  await writeFile(new URL('results.txt', qa), result)
  console.log(result)
} finally { await browser.close() }
