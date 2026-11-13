import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'

const round = new URL('../../design-lab/plan-checkup/direction-round/', import.meta.url)
const output = new URL('../test-results/report-lab/', import.meta.url)
const allowed = new Set(['index.html', 'blocks.css', 'blocks.js', 'lab-base.css'])
const server = createServer(async (req, res) => {
  const file = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html'
  if (!allowed.has(file)) { res.writeHead(404).end(); return }
  try {
    const body = await readFile(new URL(file, round))
    res.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'text/html')
    res.end(body)
  } catch { res.writeHead(500).end() }
})
let browser
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(`http://127.0.0.1:${server.address().port}/`)
  await mkdir(output, { recursive: true })
  let count = 0
  for (const width of [375, 700, 701, 768, 792, 1024, 1050, 1051, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const filter of ['report', 'selected', 'all', 'metrics', 'forecast', 'answer', 'step']) {
      await page.locator(`[data-filter="${filter}"]`).click()
      for (const state of ['ready', 'loading', 'empty', 'error', 'disabled']) {
        await page.locator('#state').selectOption(state)
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}/${filter}/${state}: overflow`)
        if (filter === 'report') {
          assert.equal(await page.locator('.report-overview[aria-label="Четыре области"] article').count(), 4)
          assert.deepEqual(await page.locator('[data-option]').evaluateAll(nodes => nodes.map(n => n.dataset.option)), ['F2', 'A2', 'S1', 'M1'])
          if (state === 'ready') {
            const layout = await page.evaluate(() => {
              const rect = selector => document.querySelector(selector).getBoundingClientRect()
              return {
                page: rect('.report-page').width,
                forecast: rect('.report-forecast .option').width,
                answer: rect('.report-answer [data-option="A2"]').width,
                step: rect('.report-answer [data-option="S1"]').width,
                clipped: [...document.querySelectorAll('.report-page .track strong, .report-page .track-arrow')].some(el => {
                  const child = el.getBoundingClientRect(), card = el.closest('.specimen').getBoundingClientRect()
                  return child.right > card.right + 1 || child.left < card.left - 1
                }),
              }
            })
            assert.ok(Math.abs(layout.forecast - layout.page) < 2, `${width}: forecast must fill the report width (${JSON.stringify(layout)})`)
            assert.ok(Math.abs(layout.answer - layout.step) < 2, `${width}: answer and step use equal columns`)
            assert.equal(layout.clipped, false, `${width}: forecast content clipped`)
            assert.ok(await page.locator('.underlined-money .lab-money').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 40), 'A2 amount keeps its typographic scale')
            assert.ok(await page.locator('.lab-money').evaluateAll(nodes => nodes.every(el => {
              const range = document.createRange(); range.selectNodeContents(el)
              return range.getClientRects().length === 1
            })), 'amounts stay on one line')
          }
        }
        if (state === 'disabled') assert.equal(await page.locator('.block-button:enabled').count(), 0)
        count++
      }
    }
    await page.locator('[data-filter="report"]').click()
    await page.locator('#state').selectOption('ready')
    await page.screenshot({ path: fileURLToPath(new URL(`report-${width}.png`, output)), fullPage: true })
  }
  await page.locator('[data-option="A2"] [data-action="why"]').click()
  assert.match(await page.locator('[data-option="A2"] .interaction-feedback').innerText(), /36 000/)
  await page.locator('[data-option="S1"] [data-action="done"]').click()
  assert.equal(await page.locator('[data-option="S1"] [data-action="done"]').getAttribute('aria-pressed'), 'true')
  await page.locator('[data-filter="selected"]').click()
  assert.equal(await page.locator('[data-option="S1"] [data-action="done"]').getAttribute('aria-pressed'), 'true')
  assert.deepEqual(errors, [])
  console.log(`PASS: ${count} layout/state combinations, explanation and step action; screenshots ${fileURLToPath(output)}`)
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
