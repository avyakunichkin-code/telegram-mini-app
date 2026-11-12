import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server, Component
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
  Component = (await server.ssrLoadModule('/src/screens/GoalRoutes.jsx')).default
})
after(async () => { await server?.close() })
const goal = { id: 'g', title: 'Первый взнос', target_amount: 1200000, saved_amount: 300000, target_month: '2029-11', monthly_needed: 25000, progress: { before: 240000, delta: 60000, months: 3, before_as_of: '2026-08', observed_monthly: 20000, estimated_month: '2030-08' } }
const render = (patch = {}, progress = {}) => renderToStaticMarkup(createElement(Component, { goals: [{ ...goal, ...patch, progress: { ...goal.progress, ...progress } }], asOf: '2026-11', available: 28000 }))
test('observed pace and needed contribution are separate, estimate uses saved context', () => {
  const html = render()
  assert.match(html, /Темп ниже нужного/)
  assert.match(html, /авг 2030/)
  assert.match(html, /3 месяца/)
  assert.match(html, /не распределён по целям/)
})
test('achievement replaces forecast with congratulations, no claim of buying apartment', () => {
  const html = render({ saved_amount: 1200000 }, { achieved: true })
  assert.match(html, /Вы это сделали!/)
  assert.match(html, /нужная сумма собрана/)
  assert.doesNotMatch(html, /При наблюдаемом темпе/)
})
test('unknown pace, missing deadline and changed target remain explicit', () => {
  const html = render({ target_month: null, monthly_needed: null }, { observed_monthly: null, estimated_month: null, months: 0, target_changed: true, previous_target_amount: 1000000 })
  assert.match(html, /Добавьте срок/)
  assert.match(html, /не прошёл месяц/)
  assert.match(html, /Сумма цели изменилась/)
  assert.match(html, /Пока нельзя оценить/)
})
