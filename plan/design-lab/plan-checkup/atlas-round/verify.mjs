import { chromium } from '../../../web/node_modules/playwright/index.mjs'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const dir = new URL('./qa/', import.meta.url)
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const results = []
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
  await page.goto(new URL('./index.html', import.meta.url).href)
  await page.evaluate(() => document.fonts.ready)
  for (const variant of ['map', 'action']) {
    await page.locator(`[name=variant][value=${variant}]`).check()
    for (const width of [375, 701, 1050, 1440]) {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 })
      const geometry = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }))
      assert.ok(geometry.scroll <= geometry.width, `${variant} ${width}: horizontal overflow ${geometry.scroll}`)
      await page.screenshot({ path: fileURLToPath(new URL(`${variant}-${width}.png`, dir)), fullPage: true })
      results.push(`${variant} / ${width}px: no horizontal overflow`)
    }
  }
  await page.setViewportSize({ width: 375, height: 812 })
  for (const state of ['loading', 'empty', 'error', 'offline', 'saving', 'save-error']) {
    await page.selectOption('#state', state)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${state}: overflow`)
    if (state === 'offline' || state === 'saving') {
      assert.equal(await page.locator('[data-action]:disabled').count(), 2)
      assert.equal(await page.locator('#dismiss').isDisabled(), true)
    }
    if (state === 'loading') assert.equal(await page.locator('#report').isHidden(), true)
    if (state === 'error') {
      await page.locator('[data-retry]').click()
      assert.equal(await page.locator('#report').isVisible(), true)
      await page.selectOption('#state', state)
    }
    if (state === 'empty') {
      await page.locator('[data-demo-start]').click()
      assert.equal(await page.locator('#report').isVisible(), true)
      await page.selectOption('#state', state)
    }
    await page.screenshot({ path: fileURLToPath(new URL(`state-${state}-375.png`, dir)), fullPage: true })
    results.push(`${state}: visible; boundary behavior checked`)
  }
  await page.selectOption('#state', 'save-error')
  await page.locator('[data-action=expenses]').check()
  await page.waitForFunction(() => !document.querySelector('[data-action=expenses]').disabled)
  assert.equal(await page.locator('[data-action=expenses]').isChecked(), false)
  assert.equal(await page.locator('#save-error').isVisible(), true)
  await page.locator('#retry-save').click()
  await page.waitForFunction(() => document.querySelector('#progress').textContent.includes('1 из 2'))
  assert.equal(await page.locator('[data-action=expenses]').isChecked(), true)
  await page.locator('[data-action=payments]').check()
  await page.waitForFunction(() => document.querySelector('#progress').textContent.includes('шаг завершён'))
  await page.locator('[data-action=payments]').uncheck()
  await page.waitForFunction(() => document.querySelector('#progress').textContent === 'Выполнено 1 из 2')
  await page.locator('#dismiss').click()
  assert.equal(await page.locator('[data-action]:disabled').count(), 2)
  await page.locator('#restore').click()
  assert.equal(await page.locator('[data-action]:disabled').count(), 0)
  await page.locator('.navigation a[href="#goal"]').click()
  assert.equal(await page.evaluate(() => location.hash), '#goal')
  await page.locator('[name=variant][value=map]').check()
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'state')
  results.push('Save failure rolls back; retry confirms once; completed step reopens; dismiss/restore; navigation; keyboard focus: PASS')
  assert.deepEqual(errors, [])
  results.push('No JS errors or failed resources')
  await writeFile(new URL('results.json', dir), JSON.stringify({ results, status: 'PASS' }, null, 2))
  console.log(results.join('\n'))
} finally {
  await browser.close()
}
