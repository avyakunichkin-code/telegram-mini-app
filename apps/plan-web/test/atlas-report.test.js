import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server, Report, fixture
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
  Report = (await server.ssrLoadModule('/src/screens/atlas/AtlasReport.jsx')).default
  const context = { window: {} }
  runInNewContext(readFileSync(new URL('../../../design-lab/plan-checkup/atlas-report-round/fixture.js', import.meta.url), 'utf8'), context)
  fixture = JSON.parse(JSON.stringify(context.window.ATLAS_FIXTURE.current))
})
after(async () => { await server?.close() })
function render(mutate = () => {}) {
  const report = structuredClone(fixture)
  report.steps = []
  mutate(report)
  return renderToStaticMarkup(createElement(Report, { checkup: { id: 'test', entry_question: 'overview' }, report, onReport() {} }))
}
test('approved shorthand only describes green areas and a yellow reserve gap', () => {
  assert.match(render(), /Есть остаток\. Не хватает запаса\./)
})
test('positive cashflow must not hide red debt or protection in the main answer', () => {
  for (const key of ['debts', 'protection']) {
    const html = render(report => {
      report.areas.find(a => a.key === key).light = 'red'
      report.entry_answer.verdict = 'fail'
      report.entry_answer.text = 'Нужен разбор: есть красная область.'
    })
    assert.doesNotMatch(html, /Есть остаток\. Не хватает запаса\./)
    assert.match(html, /Нужен разбор: есть красная область\./)
  }
})
