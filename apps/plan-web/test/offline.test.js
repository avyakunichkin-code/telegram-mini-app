import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createReportCache, REPORT_CACHE_KEY } from '../src/offline.js'

const jwt = (sub, exp = 2000000000, salt = 'session') => `header.${Buffer.from(JSON.stringify({ sub, exp })).toString('base64url')}.${salt}`
function fixture() {
  const map = new Map(), storage = { getItem: key => map.get(key) ?? null, setItem: (k, v) => map.set(k, v), removeItem: key => map.delete(key) }
  let token = jwt('user'), now = Date.parse('2026-11-05T10:00:00Z')
  const cache = createReportCache({ storage: () => storage, token: () => token, now: () => now })
  return { cache, map, setToken: value => { token = value }, setNow: value => { now = value } }
}
function data(id = 'ck_1', completed = '2026-11-05T09:00:00Z') {
  return {
    checkup: { id, status: 'completed', as_of: '2026-11', completed_at: completed, members: [{ label: 'Private member' }], data: { incomes: [{ private: true }], savings: [{ kind: 'account', is_safety_fund: true, amount: { min: 100, max: 200 } }] } },
    report: { final: true, checkup_id: id, as_of: '2026-11', precision: 'draft', free_cashflow: 123, net_worth: 456, metrics_base: { outflow: 100 }, entry_answer: { text: 'Сохранённый ответ' }, areas: ['budget', 'debts', 'cushion', 'protection'].map(key => ({ key, title: key, light: 'green', metrics: { income: 100, outflow: 100, free_cashflow: 0, savings_rate: 0, dti_percent: 0, total_debt: 0, overdue: 0, cushion: 0, months: 0, target_months: 3, investments: 0 } })), forecast: { base: [{ liquid: 100 }], pessimistic: [{ liquid: 50 }] }, steps: [], scenarios: [], goals: [], debt_strategy: {} },
  }
}

test('only completed reports; snapshot excludes raw questionnaire, members and token', async () => {
  const f = fixture(), { checkup, report } = data()
  assert.equal(await f.cache.save('user', { ...checkup, status: 'draft' }, { ...report, final: false }), false)
  assert.equal(f.map.size, 0)
  assert.equal(await f.cache.save('user', checkup, report), true)
  const saved = await f.cache.load()
  assert.equal(saved.report.free_cashflow, 123)
  assert.equal(saved.checkup.offline_starting, 150)
  const raw = f.map.get(REPORT_CACHE_KEY)
  assert.ok(!raw.includes('Private member') && !raw.includes('private') && !raw.includes(jwt('user')))
})

test('older opened report cannot replace latest; step progress of same report refreshes', async () => {
  const f = fixture(), latest = data(), old = data('ck_old', '2026-10-01T00:00:00Z')
  await f.cache.save('user', latest.checkup, latest.report)
  assert.equal(await f.cache.save('user', old.checkup, old.report), false)
  await f.cache.save('user', latest.checkup, { ...latest.report, steps: [{ status: 'done' }] })
  assert.equal((await f.cache.load()).report.steps[0].status, 'done')
})

test('logout while hashing cannot resurrect financial data', async () => {
  const f = fixture(), d = data()
  const pending = f.cache.save('user', d.checkup, d.report)
  f.cache.clear(); f.setToken(null)
  assert.equal(await pending, false)
  assert.equal(await f.cache.load(), null)
  assert.equal(f.map.size, 0)
})

test('different user or different session cannot read cache; expiry fails closed', async () => {
  for (const token of [jwt('other'), jwt('user', 2000000000, 'new-session'), jwt('user', 1)]) {
    const f = fixture(), d = data()
    await f.cache.save('user', d.checkup, d.report)
    f.setToken(token)
    assert.equal(await f.cache.load(), null)
    assert.equal(f.map.size, 0)
  }
  const f = fixture(), d = data()
  assert.equal(await f.cache.save('other', d.checkup, d.report), false)
})

test('malformed, old schema and unavailable storage gracefully disable offline copy', async () => {
  const f = fixture(), d = data()
  for (const raw of ['bad json', '{"version":0}', JSON.stringify({ ...d, version: 1 })]) {
    f.map.set(REPORT_CACHE_KEY, raw)
    assert.equal(await f.cache.load(), null)
  }
  const denied = createReportCache({ storage: () => { throw Error('denied') } })
  assert.equal(await denied.save('user', d.checkup, d.report), false)
  assert.equal(await denied.load(), null)
})

test('partially corrupted metrics are rejected before rendering', async () => {
  const f = fixture(), d = data()
  await f.cache.save('user', d.checkup, d.report)
  const broken = JSON.parse(f.map.get(REPORT_CACHE_KEY))
  delete broken.report.areas[1].metrics.dti_percent
  f.map.set(REPORT_CACHE_KEY, JSON.stringify(broken))
  assert.equal(await f.cache.load(), null)
})
