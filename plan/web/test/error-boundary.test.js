import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import * as React from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'

let server, ErrorBoundary, ErrorScreen
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
  ;({ ErrorBoundary, ErrorScreen } = await server.ssrLoadModule('/src/ErrorBoundary.jsx'))
})
after(async () => { await server?.close() })

test('ErrorBoundary: без сбоя показывает содержимое', () => {
  const html = render(React.createElement(ErrorBoundary, null, React.createElement('p', null, 'ok')))
  assert.equal(html, '<p>ok</p>')
})

test('ErrorBoundary: ошибка переводит в состояние сбоя', () => {
  assert.deepEqual(ErrorBoundary.getDerivedStateFromError(new Error('boom')), { failed: true })
})

test('ErrorScreen: объясняет сбой и предлагает обновить страницу', () => {
  const html = render(React.createElement(ErrorScreen, { onReload() {} }))
  assert.match(html, /role="alert"/)
  assert.match(html, /Обновить страницу/)
})
