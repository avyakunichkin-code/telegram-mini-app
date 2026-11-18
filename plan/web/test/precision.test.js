import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { analyzePrecision, rangeState, estimatedAfterEdit, invalidNumericField } from '../src/precision.js'

const cases = JSON.parse(readFileSync(new URL('./fixtures/precision.json', import.meta.url),'utf8'))
test('UI precision matches existing server on every nonempty valid fixture', () => {
  for (const c of cases) {
    const result = analyzePrecision(c.data)
    assert.ok(Math.abs(result.share-c.expected.share)<1e-12,c.name)
    assert.equal(result.level,result.total===0?'empty':c.expected.level,c.name)
  }
})
test('hint selects the greatest uncertain weight, not the widest ratio; ties stable', () => {
  const value = analyzePrecision({incomes:[{amount:{min:1,max:100}}],expenses:[{amount:{min:100,max:1000}}]})
  assert.equal(value.candidate,'expenses')
  assert.equal(analyzePrecision({incomes:[{amount:{min:0,max:100}}],expenses:[{amount:{min:0,max:100}}]}).candidate,'incomes')
})
test('wide ranges are warnings above three, zero handled without division', () => {
  assert.equal(rangeState({min:100,max:300}).broad,false)
  assert.equal(rangeState({min:100,max:300.01}).broad,true)
  assert.equal(rangeState({min:0,max:100}).broad,true)
  assert.equal(rangeState({min:0,max:0}).broad,false)
})
test('blank, negative and reversed ranges cannot masquerade as exact zero', () => {
  for(const amount of [{min:'',max:100},{min:null,max:100},{min:-1,max:100},{min:101,max:100},{min:0,max:Infinity}]){
    assert.equal(rangeState(amount).valid,false)
    assert.equal(analyzePrecision({incomes:[{amount}]}).level,'invalid')
  }
})
test('estimated loan remains estimated after title/payment or only one contract field edit', () => {
  const row={estimated:true,balance:100000,annual_rate:18,monthly_payment:3000}
  assert.equal(estimatedAfterEdit(row,{title:'Новое имя'},new Set(['title'])),true)
  assert.equal(estimatedAfterEdit(row,{monthly_payment:4000},new Set(['monthly_payment'])),true)
  assert.equal(estimatedAfterEdit(row,{balance:90000},new Set(['balance'])),true)
  assert.equal(estimatedAfterEdit(row,{annual_rate:12},new Set(['balance','annual_rate'])),false)
  assert.equal(estimatedAfterEdit(row,{annual_rate:''},new Set(['balance','annual_rate'])),true)
})

test('blank or negative required scalar inputs cannot be normalized to an exact zero', () => {
  const meta={fields:[{key:'balance',type:'money',label:'Остаток'},{key:'term',type:'int',optional:true,label:'Срок'}]}
  assert.equal(invalidNumericField(meta,[{balance:'',term:null}]),'Остаток')
  assert.equal(invalidNumericField(meta,[{balance:-1,term:null}]),'Остаток')
  assert.equal(invalidNumericField(meta,[{balance:0,term:1.5}]),'Срок')
  assert.equal(invalidNumericField(meta,[{balance:0,term:null}]),null)
})
