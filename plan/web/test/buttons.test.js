import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import * as React from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'

let server, Plan
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
  ;({ Button: Plan } = await server.ssrLoadModule('/src/components.jsx'))
})
after(async () => { await server?.close() })

for (const name of ['Plan']) {
  test(`${name}: busy cannot be overridden by disabled=false`, () => {
    const html = render(React.createElement(Plan,
      { busy: true, disabled: false, 'aria-busy': false }, 'Продолжить'))
    assert.match(html, /disabled=""/)
    assert.match(html, /aria-busy="true"/)
    assert.doesNotMatch(html, / busy=/)
    if (name === 'Plan') assert.match(html, /Секунду…/)
  })
  test(`${name}: native types, disabled and theme classes survive`, () => {
    const Component = Plan
    const html = render(React.createElement(Component, { className: 'extra' }, 'Дальше'))
    assert.match(html, /type="button"/)
    assert.match(html, /class="btn btn-primary extra"/)
    assert.doesNotMatch(html, /disabled=/)
    assert.match(render(React.createElement(Component, { type: 'submit', disabled: true }, 'Войти')), /type="submit"[^>]*disabled=""/)
  })
}
