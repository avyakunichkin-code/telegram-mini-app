import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server, blocks
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
  blocks = await server.ssrLoadModule('/src/screens/ReportBlocks.jsx')
})
after(async () => { await server?.close() })
const render = (name, props) => renderToStaticMarkup(createElement(blocks[name], props))

test('reserve without expenses asks for input and never divides by zero', () => {
  const html = render('ReserveVessel', { area: { title: 'Подушка', light: 'red', metrics: { cushion: 0, months: 0, target_months: 6, goals_realistic: true } }, outflow: 0 })
  assert.match(html, /Уточните расходы/)
  assert.match(html, /Цель в рублях появится/)
  assert.doesNotMatch(html, /NaN|Infinity/)
})

test('reserve uses family target from API and caps vessel without hiding money', () => {
  const html = render('ReserveVessel', { area: { title: 'Подушка', light: 'green', metrics: { cushion: 900000, months: 9, target_months: 6, goals_realistic: true } }, outflow: 100000 })
  assert.match(html, /900\u00a0000/)
  assert.match(html, /600\u00a0000/)
  assert.match(html, /height:100%/)
})

test('ticket shows monthly contribution, never the entire reserve target as one transfer', () => {
  const html = render('StepResult', { cushion: 100000, step: { rule_key: 'cushion_target', numbers: { target: 600000, monthly: 10000 } } })
  assert.match(html, /110\u00a0000/)
  assert.doesNotMatch(html, /700\u00a0000/)
  const other = render('StepResult', { cushion: 100000, step: { rule_key: 'stop_deficit', numbers: { gap: 20000 } } })
  assert.match(other, /следующем чекапе/)
  assert.doesNotMatch(other, /120\u00a0000/)
})

test('zero forecast endpoint remains zero, with no illustrative growth', () => {
  const series = [{ month: '2026-11', liquid: 0 }]
  const html = render('ForecastTracks', { forecast: { base: series, pessimistic: series }, starting: 0 })
  assert.match(html, /0\u00a0₽/)
  assert.doesNotMatch(html, /672|283|15\u00a0000/)
})
