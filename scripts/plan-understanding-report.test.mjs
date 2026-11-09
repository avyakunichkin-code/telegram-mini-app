import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summarize, TASKS } from './plan-understanding-report.mjs'
const session=()=>({viewport:'mobile',tasks:Object.fromEntries(TASKS.map(t=>[t,'independent'])),difficulties:[]})
test('understanding report keeps assistance, errors and unobserved separate',()=>{
  const a=session(),b=session();b.tasks.transfer='assisted';b.tasks.resume='unobserved';b.difficulties=['transfer','transfer']
  const r=summarize({dataset:'synthetic',build:'fixture',variant:'A',sessions:[a,b]})
  assert.equal(r.tasks.transfer.independent,1);assert.equal(r.tasks.transfer.assisted,1)
  assert.equal(r.tasks.resume.unobserved,1);assert.equal(r.difficulties.transfer,1)
  assert.equal(r.human_evidence,false)
})
test('empty sample is explicit; raw questionnaires and incomplete records rejected',()=>{
  const input={dataset:'synthetic',build:'fixture',variant:'A',sessions:[]}
  assert.equal(summarize(input).sessions,0)
  assert.throws(()=>summarize({...input,email:'no'}))
  assert.throws(()=>summarize({...input,dataset:'real'}))
  const s=session();delete s.tasks.resume
  assert.throws(()=>summarize({...input,sessions:[s]}))
})
test('observations on synthetic cases remain distinct from test fixtures; empty template is not human evidence',()=>{
  const input={dataset:'synthetic_case_observations',build:'local-checkout-01',variant:'A',sessions:[]}
  assert.equal(summarize(input).human_evidence,false)
  const observed=summarize({...input,sessions:[session()]})
  assert.equal(observed.dataset,'synthetic_case_observations')
  assert.equal(observed.human_evidence,true)
  assert.equal(observed.sessions,1)
  assert.equal(summarize({...input,dataset:'synthetic',sessions:[session()]}).human_evidence,false)
})
test('observer records accept only closed categories and explicit outcomes',()=>{
  const input={dataset:'synthetic_case_observations',build:'local',variant:'A',sessions:[session()]}
  for(const bad of [{...session(),email:'no'},{...session(),difficulties:['salary:123']},{...session(),tasks:{...session().tasks,transfer:'pending'}},{...session(),viewport:'unknown'}]){
    assert.throws(()=>summarize({...input,sessions:[bad]}))
  }
})
