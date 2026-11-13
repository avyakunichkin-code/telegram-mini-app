import assert from 'node:assert/strict'
import test from 'node:test'

import { ApiError, createApiClient, parseErrorBody } from '../src/index.js'

function fakeFetch(status, body, { json = true } = {}) {
  const calls = []
  const impl = async (url, init) => {
    calls.push({ url, init })
    return {
      status,
      ok: status >= 200 && status < 300,
      headers: { get: () => (json ? 'application/json' : 'text/plain') },
      json: async () => body,
      text: async () => String(body),
    }
  }
  return { impl, calls }
}

test('Bearer, base URL и тело JSON', async () => {
  const { impl, calls } = fakeFetch(200, { ok: true })
  const call = createApiClient({ baseUrl: 'https://api.test', getToken: () => 't1', fetchImpl: impl })
  assert.deepEqual(await call('POST', '/api/x', { a: 1 }), { ok: true })
  assert.equal(calls[0].url, 'https://api.test/api/x')
  assert.equal(calls[0].init.headers.Authorization, 'Bearer t1')
  assert.equal(calls[0].init.body, '{"a":1}')
})

test('204 → null, без токена нет Authorization', async () => {
  const { impl, calls } = fakeFetch(204, null)
  const call = createApiClient({ fetchImpl: impl })
  assert.equal(await call('DELETE', '/api/me'), null)
  assert.equal(calls[0].init.headers.Authorization, undefined)
})

test('Idempotency-Key: по правилу приложения, явный заголовок важнее', async () => {
  const { impl, calls } = fakeFetch(200, {})
  const call = createApiClient({ fetchImpl: impl, idempotent: (m, p) => m === 'POST' && p === '/api/pay' })
  await call('POST', '/api/pay?x=1')
  await call('POST', '/api/other')
  await call('POST', '/api/pay', undefined, { 'Idempotency-Key': 'fixed' })
  assert.ok(calls[0].init.headers['Idempotency-Key'])
  assert.equal(calls[1].init.headers['Idempotency-Key'], undefined)
  assert.equal(calls[2].init.headers['Idempotency-Key'], 'fixed')
})

test('ошибка формата Plan → ApiError с code', async () => {
  const { impl } = fakeFetch(409, { error: { code: 'checkup_completed', message: 'Уже завершён' } })
  const call = createApiClient({ fetchImpl: impl })
  await assert.rejects(call('POST', '/api/c'), (err) => {
    assert.ok(err instanceof ApiError)
    assert.equal(err.status, 409)
    assert.equal(err.code, 'checkup_completed')
    assert.equal(err.message, 'Уже завершён')
    return true
  })
})

test('ошибка FastAPI detail: строка и список', () => {
  assert.equal(parseErrorBody({ detail: 'Not authenticated' }).message, 'Not authenticated')
  assert.equal(parseErrorBody({ detail: [{ msg: 'a' }, { msg: 'b' }] }).message, 'a b')
  assert.equal(parseErrorBody('oops').message, 'oops')
})

test('сеть недоступна → status 0 и колбэк', async () => {
  let failed = 0
  const call = createApiClient({
    fetchImpl: async () => {
      throw new TypeError('Failed to fetch')
    },
    onNetworkFailure: () => failed++,
    offlineMessage: 'Нет сети',
  })
  await assert.rejects(call('GET', '/api/x'), (err) => err.status === 0 && err.message === 'Нет сети')
  assert.equal(failed, 1)
})
