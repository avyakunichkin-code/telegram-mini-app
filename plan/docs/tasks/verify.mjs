import assert from 'node:assert/strict'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '../../web/node_modules/playwright/index.mjs'
const root=new URL('./',import.meta.url),tasks=JSON.parse(readFileSync(new URL('tasks.json',root),'utf8'))
assert.equal(new Set(tasks.map(t=>t.id)).size,tasks.length)
for(const t of tasks){for(const path of [t.source,...(t.links||[]).map(x=>x[1]),`items/${t.id}.md`])assert.ok(existsSync(new URL(path,root)),path)}
const browser=await chromium.launch({channel:'chrome',headless:true})
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto(new URL('index.html',root).href)
 await page.evaluate(()=>localStorage.removeItem('tvoy-plan.owner-tasks.v1'));await page.reload()
 assert.equal(await page.locator('.card').count(),13)
 await page.selectOption('#status','all');assert.equal(await page.locator('.card').count(),15)
 await page.fill('#search','PLAN-OWNER-01');assert.equal(await page.locator('.card').count(),1)
 await page.getByLabel('Мой статус PLAN-OWNER-01',{exact:true}).selectOption('working');await page.reload()
 await page.selectOption('#status','working');assert.equal(await page.locator('.card').count(),1)
 assert.equal(await page.getByLabel('Мой статус PLAN-OWNER-01',{exact:true}).inputValue(),'working')
 const download=page.waitForEvent('download');await page.click('#export');assert.equal((await download).suggestedFilename(),'tvoy-plan-my-tasks.json')
 await page.locator('#import').setInputFiles({name:'marks.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,marks:{'PLAN-OWNER-02':'working'}}))})
 await page.waitForFunction(()=>document.getElementById('message').textContent.includes('восстановлены'))
 assert.equal(await page.locator('.card').count(),1);assert.equal(await page.getByLabel('Мой статус PLAN-OWNER-02',{exact:true}).inputValue(),'working')
 await page.locator('#import').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,marks:{'bad':'working'}}))})
 await page.waitForFunction(()=>document.getElementById('message').textContent.includes('Импорт не выполнен'))
 assert.equal(await page.locator('.card').count(),1)
 await page.selectOption('#status','all');await page.selectOption('#type','Исследование');assert.equal(await page.locator('.card').count(),2)
 await page.selectOption('#type','');await page.selectOption('#priority','1');assert.equal(await page.locator('.card').count(),5)
 await page.selectOption('#priority','');await page.selectOption('#sort','title')
 mkdirSync(new URL('qa/',root),{recursive:true})
 for(const width of [375,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:fileURLToPath(new URL(`qa/board-${width}.png`,root)),fullPage:false})}
 assert.deepEqual(errors,[])
 await page.evaluate(()=>localStorage.removeItem('tvoy-plan.owner-tasks.v1'))
 console.log('PASS: 15 unique tasks, all source/card links, search/filter/sort, persistence, export/import/invalid import, 375/1440 no overflow, no JS errors.')
}finally{await browser.close()}
