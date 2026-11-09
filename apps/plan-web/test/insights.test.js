import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server, Insights, fixture
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
  Insights = (await server.ssrLoadModule('/src/screens/atlas/Insights.jsx')).default
  const context = { window: {} }
  runInNewContext(readFileSync(new URL('../../../design-lab/plan-checkup/insights-round/fixture.js', import.meta.url), 'utf8'), context)
  fixture = JSON.parse(JSON.stringify(context.window.FIXTURE))
})
after(async () => { await server?.close() })
const render = insights => renderToStaticMarkup(createElement(Insights, { insights }))

test('surplus family shows plan, reserve, debts and decision limits', () => {
  const html = render(fixture.main.insights)
  for (const text of ['Куда направить', 'Запас', 'платежей уходит на проценты', 'Выше расчётного предела', 'Стоит перепроверить']) assert.ok(html.includes(text), text)
  assert.doesNotMatch(html, /undefined|NaN|null/)
})

test('deficit family leads with fixes and says wants cannot close the gap', () => {
  const html = render(fixture.strained.insights)
  assert.match(html, /Исправьте перед выводами: 3/)
  assert.match(html, /Только сокращением необязательных трат разрыв не закрыть/)
  assert.match(html, /не гасится/)
  assert.doesNotMatch(html, /Пределы решения|undefined|NaN/)
})

test('legacy final report without insights is explained and not invented', () => {
  const html = render(undefined)
  assert.match(html, /задним числом он не пересчитывается/)
  assert.doesNotMatch(html, /Куда направить/)
})

test('empty optional blocks are omitted', () => {
  const html = render({ ...fixture.main.insights, runway: null, debt_costs: null, decision_limits: null, data_checks: [] })
  assert.match(html, /Данные выглядят полными/)
  assert.doesNotMatch(html, /Запас хода|Цена долгов|Пределы решения/)
})
