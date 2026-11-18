import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
const require = createRequire(new URL('./package.json', import.meta.url))
const { createServer } = await import(pathToFileURL(require.resolve('vite')).href)
import { fileURLToPath } from 'node:url'
const React = require('react')
const { default: react } = await import('@vitejs/plugin-react')
const { renderToStaticMarkup: render } = require('react-dom/server')

let server, Plan, Game
before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('./', import.meta.url)), configFile: false, plugins: [react()], resolve: { dedupe: ['react', 'react-dom'], alias: { '@tvoy/ui-kit': fileURLToPath(new URL('../../packages/ui-kit/src/index.js', import.meta.url)) } }, server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
  ;({ Button: Plan } = await server.ssrLoadModule(fileURLToPath(new URL('../../../plan/web/src/components.jsx', import.meta.url))))
  ;({ MqxButton: Game } = await server.ssrLoadModule(fileURLToPath(new URL('../../../game/web/src/components/mqx/primitives/MqxButton.jsx', import.meta.url))))
})
after(async () => { await server?.close() })

for (const name of ['Plan', 'Game']) {
  test(`${name}: busy cannot be overridden by disabled=false`, () => {
    const html = render(React.createElement(name === 'Plan' ? Plan : Game,
      { busy: true, disabled: false, 'aria-busy': false }, 'Продолжить'))
    assert.match(html, /disabled=""/)
    assert.match(html, /aria-busy="true"/)
    assert.doesNotMatch(html, / busy=/)
    if (name === 'Plan') assert.match(html, /Секунду…/)
  })
  test(`${name}: native types, disabled and theme classes survive`, () => {
    const Component = name === 'Plan' ? Plan : Game
    const html = render(React.createElement(Component, { className: 'extra' }, 'Дальше'))
    assert.match(html, /type="button"/)
    assert.match(html, /class="(?:btn btn-primary|mqx-btn mqx-btn--outline) extra"/)
    assert.doesNotMatch(html, /disabled=/)
    assert.match(render(React.createElement(Component, { type: 'submit', disabled: true }, 'Войти')), /type="submit"[^>]*disabled=""/)
  })
}
