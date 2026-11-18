import { chromium } from '@playwright/test'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

// Built application with synthetic HTTP fixtures; no live user/account/database.
const scope = { window: {} }
runInNewContext(await readFile(new URL('../../design-lab/plan-checkup/atlas-report-round/fixture.js', import.meta.url), 'utf8'), scope)
const report = JSON.parse(JSON.stringify(scope.window.ATLAS_FIXTURE.current))
report.steps.forEach((s,i) => { s.id = `atlas-step-${i}` })
const ck = { id: report.checkup_id, status: 'completed', completed_at:'2026-11-07T10:30:00+03:00', as_of: report.as_of, entry_question: 'overview', members: [], data: { incomes: [], savings: [{ amount: { min:270000,max:270000 },is_safety_fund:true }] } }
const old = { ...ck, id:'previous', as_of:'2026-10', report_available:true }
const list = [{...ck,report_available:true},old]
let failSave = true, failOpen = false
const output = new URL('../test-results/atlas/', import.meta.url)
await mkdir(output,{recursive:true})
const browser = await chromium.launch({channel:'chrome',headless:true})
try {
 const page = await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'})
 const errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(()=>localStorage.setItem('plan.token','synthetic.'+btoa(JSON.stringify({sub:'synthetic-owner',exp:4102444800}))+'.not-a-signature'))
 await page.route('https://atlas.test/**',async route=>{
  const url=new URL(route.request().url()), path=url.pathname
  const json=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
  if(path==='/api/meta')return json({})
  if(path==='/api/me')return json({user:{id:'synthetic-owner'},members:[]})
  if(path==='/api/checkups')return json(list)
  if(path.includes('/compare/'))return json({before:{...old,areas:report.areas},after:{...ck,areas:report.areas},metrics:[{key:'free_cashflow',title:'Остаток',unit:'rub',before:40000,after:45000,delta:5000}],versions_differ:false})
  if(path==='/api/checkups/previous/report'&&failOpen)return json({error:{code:'unavailable',message:'Не удалось открыть сохранённый отчёт'}},503)
  if(path.endsWith('/report'))return json(report)
  if(path.startsWith('/api/checkups/'))return json(path.endsWith('/previous')?old:ck)
  if(path.startsWith('/api/steps/')){
   if(failSave){failSave=false;return json({error:{code:'unavailable',message:'Повторите сохранение'}},503)}
   const parts=path.split('/'),step=report.steps.find(s=>s.id===parts[3]),body=route.request().postDataJSON()
   if(parts[4]==='actions'){step.actions.find(a=>a.key===decodeURIComponent(parts[5])).done=body.done;step.status=step.actions.every(a=>a.done)?'done':'suggested'}
   else {step.status=body.status;if(body.status==='suggested'&&step.actions.every(a=>a.done))step.actions.at(-1).done=false}
   return json(step)
  }
  if(path.startsWith('/api/'))return json({error:{code:'unknown',message:path}},404)
  const file = path==='/'?'index.html':path.slice(1)
  if(file.includes('..'))return route.fulfill({status:404})
  const contentType=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.woff2')?'font/woff2':'text/html'
  return route.fulfill({body:await readFile(new URL(`../dist/${file}`,import.meta.url)),contentType})
 })
 await page.goto('https://atlas.test/')
 await page.getByRole('tab',{name:'Ответ',exact:true}).waitFor()
 for(const width of [375,701,1050,1440]){
  await page.setViewportSize({width,height:width===375?812:1000})
  for(const name of ['Ответ','Прогноз','Устойчивость','Долги','История']){
   await page.getByRole('tab',{name,exact:true}).click()
   assert.equal(await page.getByRole('tabpanel').count(),1)
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}/${name}: overflow`)
   if(width===375||width===1440)await page.screenshot({path:fileURLToPath(new URL(`${width}-${name}.png`,output)),fullPage:true})
  }
 }
 await page.getByRole('tab',{name:'Прогноз',exact:true}).click()
 assert.notEqual(await page.locator('.atlas-report .chart-label').first().evaluate(e=>getComputedStyle(e).display),'none')
 assert.notEqual(await page.locator('.tone-pess').evaluate(e=>getComputedStyle(e).strokeDasharray),'none')
 await page.getByRole('tab',{name:'Ответ',exact:true}).click()
 const step=page.locator('.first-step-ticket')
 await step.locator(':scope>summary').click()
 const checks=step.locator('.plan-step-list input')
 await checks.first().click()
 await step.getByText('Не удалось сохранить. Прогресс не изменён.').waitFor()
 assert.equal(await checks.first().isChecked(),false)
 await step.getByRole('button',{name:'Повторить сохранение'}).click()
 await page.waitForFunction(()=>document.querySelector('.first-step-ticket input').checked)
 assert.ok((await step.locator('.atlas-step-progress').innerText()).includes('1 из 3'))
 for(let i=1;i<await checks.count();i++){await checks.nth(i).click();await page.waitForFunction(()=>document.querySelector('.first-step-ticket .plan-step-actions').getAttribute('aria-busy')==='false')}
 await step.locator('.atlas-complete').waitFor()
 await step.locator(':scope>summary').click()
 assert.equal(await step.locator('.atlas-complete').isVisible(),true)
 await page.reload()
 await page.locator('.first-step-ticket .atlas-complete').waitFor()
 await page.getByRole('tab',{name:'История',exact:true}).click()
 failOpen=true
 await page.locator('.h-mobile-archive>summary').click()
 await page.locator('.h-mobile-archive').getByRole('button',{name:'Открыть отчёт ↗'}).last().click()
 await page.getByRole('alert').filter({hasText:'Не удалось открыть сохранённый отчёт'}).waitFor()
 await page.getByRole('tab',{name:'Ответ',exact:true}).click()
 await page.locator('.first-step-ticket>summary').click()
 await page.waitForFunction(()=>Boolean(localStorage.getItem('plan.last-report.v1')))
 await page.evaluate(()=>window.dispatchEvent(new Event('offline')))
 await page.getByText(/Офлайн · только чтение/).waitFor()
 assert.equal(await page.locator('.first-step-ticket input:disabled').count(),3)
 assert.deepEqual(errors,[])
 const summary='PASS: built React app; 5 tabs x 4 widths; chart labels/dashes; save failure/retry; partial/completed persisted status; history error; offline disabled; no JS errors. Synthetic HTTP fixtures, not live backend.'
 await writeFile(new URL('result.txt',output),summary)
 console.log(summary)
} finally {await browser.close()}
