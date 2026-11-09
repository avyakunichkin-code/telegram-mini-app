import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDraftCache, DRAFT_KEY } from '../src/draft.js'
const jwt = (sub = 'a') => `h.${Buffer.from(JSON.stringify({sub, exp:4000000000})).toString('base64url')}.s`
function fixture() {
  const map = new Map(), storage = {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}
  let token = jwt(), now = 1000000
  const cache = createDraftCache({ storage:()=>storage, token:()=>token, now:()=>now })
  const ck = {id:'ck1',status:'draft',data:{incomes:[{amount:{min:1,max:2}}]}}
  return {cache,map,ck,token:v=>{token=v},now:v=>{now=v}}
}
test('unfinished values and estimated-loan edits survive; raw session not stored; conflicts detected', async () => {
  const f=fixture(), rows=[{amount:{min:'',max:'100'}}]
  assert.equal(await f.cache.save(f.ck,'incomes',rows,[[0,['balance']]]),true)
  assert.deepEqual((await f.cache.load(f.ck)).rows,rows)
  assert.deepEqual((await f.cache.load(f.ck)).fields,[[0,['balance']]])
  assert.ok(!f.map.get(DRAFT_KEY).includes(jwt()))
  f.ck.data.incomes=[]
  assert.equal((await f.cache.load(f.ck)).conflict,true)
})
test('logout pending write cannot resurrect snapshot',async()=>{
  const f=fixture(), pending=f.cache.save(f.ck,'incomes',[])
  f.cache.clear();f.token(null)
  assert.equal(await pending,false);assert.equal(f.map.size,0)
})
test('wrong session, completed checkup, expiry and corrupt storage fail closed',async()=>{
  for(const mode of ['session','completed','ttl','corrupt']){
    const f=fixture();await f.cache.save(f.ck,'incomes',[])
    if(mode==='session')f.token(jwt('b'))
    if(mode==='completed')f.ck.status='completed'
    if(mode==='ttl')f.now(1000000+86400001)
    if(mode==='corrupt')f.map.set(DRAFT_KEY,'bad')
    assert.equal(await f.cache.load(f.ck),null);assert.equal(f.map.size,0)
  }
})
test('denied storage is reported instead of promising persistence',async()=>{
  const cache=createDraftCache({storage:()=>{throw Error('denied')},token:()=>jwt()})
  assert.equal(await cache.save({id:'a',status:'draft',data:{}},'incomes',[]),false)
  assert.equal(await cache.load({id:'a'}),null)
  const deniedToken=createDraftCache({token:()=>{throw Error('denied')}})
  assert.equal(await deniedToken.save({id:'a',status:'draft',data:{}},'incomes',[]),false)
  assert.equal(await deniedToken.load({id:'a'}),null)
})
