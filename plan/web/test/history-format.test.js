import { test } from 'node:test'
import assert from 'node:assert/strict'
import { historyValue, historyDelta, wideValues } from '../src/screens/history-format.js'

test('missing metric differs from zero; percent deltas are percentage points', () => {
  assert.equal(historyValue(null, 'rub'), 'Нет данных')
  assert.match(historyValue(0, 'rub'), /^0/)
  assert.equal(historyDelta({ delta: null, unit: 'rub' }), 'Нет сравнения')
  assert.equal(historyDelta({ delta: 0, unit: 'months' }), 'Без изменений')
  assert.equal(historyDelta({ delta: -6, unit: 'percent' }), '−6 п. п.')
  assert.equal(historyDelta({ delta: .6, unit: 'months' }), '+0,6 мес.')
})

test('large unbroken amounts use full-width values on narrow screens', () => {
  assert.equal(wideValues({ before: 999999999999, after: 888888888888, unit: 'rub' }), true)
  assert.equal(wideValues({ before: 120000, after: 140000, unit: 'rub' }), false)
})
