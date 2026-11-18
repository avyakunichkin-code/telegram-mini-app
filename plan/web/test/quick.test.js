import assert from 'node:assert/strict'
import test from 'node:test'
import { groupDigits, parseMoney, quickProblem } from '../src/quick.js'

const range = (min, max = min) => ({ min, max })
const valid = { income: range(100000, 150000), must_expenses: range(60000), debt_payments: range(0), savings: range(0), children: 0 }

test('groupDigits разбивает разряды и прячет ноль', () => {
  assert.equal(groupDigits(1500000), '1 500 000')
  assert.equal(groupDigits(999), '999')
  assert.equal(groupDigits(0), '0')
  assert.equal(groupDigits(''), '')
})

test('parseMoney понимает разряды, копейки и мусор', () => {
  assert.equal(parseMoney('1 500 000'), 1500000)
  assert.equal(parseMoney('150000,50'), 150000)
  assert.equal(parseMoney('12a3'), 123)
  assert.equal(parseMoney(''), '')
})

test('quickProblem пропускает заполненную анкету с нулевыми кредитами и запасом', () => {
  assert.equal(quickProblem(valid), null)
})

test('quickProblem требует ответ про доход и расходы, но принимает осознанный ноль', () => {
  assert.match(quickProblem({ ...valid, income: range('') }), /доход/)
  assert.match(quickProblem({ ...valid, must_expenses: range('') }), /расходы/)
  assert.equal(quickProblem({ ...valid, income: range(0), must_expenses: range(0) }), null)
})

test('quickProblem ловит перепутанные границы', () => {
  assert.match(quickProblem({ ...valid, savings: range(500, 100) }), /Запас/)
})
