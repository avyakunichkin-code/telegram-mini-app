import assert from 'node:assert/strict'
import test from 'node:test'

import { rub } from './format.js'
import { areaSummary, goalBar, heroFor, isWideRange, nextStep, normalizeRow, precisionOf, precisionTip, previousCells, stepStatus, toNum } from './logic.js'
import { sectionOrder } from './sections.js'

const R = (min, max = min) => ({ min, max })

test('toNum: пробелы, запятая, мусор', () => {
  assert.equal(toNum('150 000'), 150000)
  assert.equal(toNum('12,5'), 12.5)
  assert.equal(toNum(''), '')
  assert.equal(toNum('abc'), '')
})

test('normalizeRow: диапазон и числа приводятся, необязательное пустое — null', () => {
  const row = normalizeRow('liabilities', { title: 'Карта', balance: '1000', annual_rate: '', monthly_payment: '100', term_months_left: '', overdue_amount: null })
  assert.equal(row.balance, 1000)
  assert.equal(row.annual_rate, 0)
  assert.equal(row.term_months_left, null)
  assert.deepEqual(normalizeRow('incomes', { member_id: 'm', amount: { min: '5', max: '' } }).amount, { min: 5, max: 0 })
  assert.equal(normalizeRow('expenses', { title: 'x', amount: R(1) }).category_key, 'other')
})

test('мастер «точно / диапазон»: широкая вилка — предупреждение, не ошибка', () => {
  assert.equal(isWideRange(R(50_000, 200_000)), true)
  assert.equal(isWideRange(R(50_000, 150_000)), false)
  assert.equal(isWideRange(R(0, 100)), false)
  assert.equal(isWideRange(R(100)), false)
})

test('точность: как на сервере — точное ≤ ×1,1, вес по max, оценённый кредит снижает', () => {
  const data = {
    incomes: [{ amount: R(100_000) }],
    expenses: [{ amount: R(40_000, 80_000) }],
    savings: [{ amount: R(0) }],
    liabilities: [{ monthly_payment: 20_000, estimated: true }],
  }
  const p = precisionOf(data)
  assert.equal(p.share, 100_000 / 200_000)
  assert.equal(p.level, 'approximate')
  assert.equal(p.worst, 'expenses')
  assert.match(precisionTip(data), /Расходы/)
})

test('точность: пусто — черновая без подсказки; всё точно — уточнённая', () => {
  assert.deepEqual(precisionOf({}), { share: 0, level: 'draft', worst: null })
  assert.equal(precisionTip({}), null)
  assert.equal(precisionOf({ incomes: [{ amount: R(100, 105) }] }).level, 'refined')
  assert.match(precisionTip({ liabilities: [{ monthly_payment: 5, estimated: true }] }), /оценён по платежу/)
})

test('отчёт: главная цифра по вопросу со входа', () => {
  assert.deepEqual(heroFor({ numbers: { dti_after: 55.6 } }), [56, ['% дохода', 'уйдёт на платежи']])
  assert.deepEqual(heroFor({ numbers: { months_until_negative: null } }), ['12+', ['месяцев', 'бюджет выдерживает']])
  assert.equal(heroFor({ numbers: { months_until_negative: 4 } })[1][0], 'месяца')
  assert.equal(heroFor({ numbers: {} }), null)
})

test('отчёт: плитки светофора C2', () => {
  assert.deepEqual(areaSummary({ key: 'budget', metrics: { savings_rate: 0.12 } }), ['12 %', 'норма сбережений'])
  assert.deepEqual(areaSummary({ key: 'budget', metrics: { savings_rate: null } }), ['—', 'нет дохода'])
  assert.deepEqual(areaSummary({ key: 'debts', metrics: { dti_percent: 34.4, overdue: 0 } }), ['34 %', 'платежи от дохода'])
  assert.equal(areaSummary({ key: 'debts', metrics: { dti_percent: 34, overdue: 5000 } })[1], `просрочка ${rub(5000)}`)
  assert.deepEqual(areaSummary({ key: 'cushion', metrics: { months: 0.5, target_months: 3 } }), ['0,5 мес.', 'цель 3 мес.'])
  assert.deepEqual(areaSummary({ key: 'protection', metrics: {}, flags: [{ text: 'нет полиса' }, { text: 'b' }] }), ['2 флага', 'нет полиса'])
  assert.deepEqual(areaSummary({ key: 'protection', metrics: {}, flags: [] }), ['в порядке', 'пробелов не видно'])
})

test('шаги: выделяется первый несделанный; всё сделано — ничего', () => {
  const steps = [{ id: 1, status: 'done' }, { id: 2, status: 'dismissed' }, { id: 3, status: 'suggested' }]
  assert.equal(nextStep(steps).id, 3)
  assert.equal(nextStep([{ status: 'done' }]), null)
})

test('порядок мастера задаёт вопрос со входа', () => {
  assert.equal(sectionOrder('debts')[0], 'liabilities')
  assert.equal(new Set(sectionOrder('overview')).size, sectionOrder('overview').length)
})

test('повторный чекап R2: было → стало, пустое — прочерк', () => {
  const cells = previousCells({
    metrics: {
      cushion_months: { before: 0.4, now: 1.23 },
      dti_percent: { before: 36.4, now: 31 },
      free_cashflow: { before: 21_400, now: null },
    },
  })
  assert.deepEqual(cells.map((c) => c.value), ['0,4 → 1,2', '36 → 31 %', '+21 → —'])
  assert.deepEqual(stepStatus('dismissed'), ['не подошло', 'st-no'])
  assert.deepEqual(stepStatus('weird'), ['в работе', 'st-open'])
})

test('прогресс цели G2: доля накопленного и риска прошлого раза', () => {
  assert.deepEqual(goalBar({ target_amount: 250_000, saved_amount: 80_000, progress: { saved_before: 20_000 } }), { now: 32, before: 8 })
  assert.deepEqual(goalBar({ target_amount: 100, saved_amount: 150, progress: null }), { now: 100, before: null })
  assert.deepEqual(goalBar({ target_amount: 0, saved_amount: 5 }), { now: 0, before: null })
})
