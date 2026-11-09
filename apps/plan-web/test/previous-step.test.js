import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server, Component
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
  Component = (await server.ssrLoadModule('/src/screens/PreviousStepBridge.jsx')).default
})
after(async () => { await server?.close() })
const step = { id: 'old', title: 'Первый месяц подушки', status: 'done', actions_total: 3, actions_done: 1, metric: { title: 'Подушка', unit: 'months', before: .4, after: 1.2, delta: .8 } }
function render(overrides = {}, props = {}) {
  return renderToStaticMarkup(createElement(Component, { context: { status: 'ready', parent_checkup_id: 'parent', as_of: '2026-10', completed_at: '2026-10-05T00:00:00Z', steps: [{ ...step, ...overrides }] }, ...props }, createElement('div', null, 'Текущий шаг')))
}
test('manual completion does not claim all actions; current step remains separate', () => {
  const html = render()
  assert.match(html, /Завершён вручную/)
  assert.match(html, /Отмечено 1 из 3/)
  assert.match(html, /Текущий шаг/)
  assert.match(html, /не подтверждает/)
})
test('legacy actions and unknown metrics are explicit; offline opening is disabled', () => {
  const html = render({ actions_total: null, actions_done: null, metric: { ...step.metric, before: null, delta: null } }, { readOnly: true })
  assert.match(html, /нет списка отдельных действий/)
  assert.match(html, /Нет данных/)
  assert.match(html, /Нет сравнения/)
  assert.match(html, /disabled=""/)
})
