import { chromium } from '../../../web/node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import { mkdir,writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const qa=new URL('./qa/compact/',import.meta.url)
await mkdir(qa,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
const results=[]
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'ru-RU'})
 const errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)})
 await page.goto(new URL('./index.html',import.meta.url).href)
 await page.evaluate(()=>document.fonts.ready)
 assert.equal(await page.getByRole('heading',{level:1}).innerText(),'Как у нас дела в целом?')
 for(const width of [375,701,1050,1440]){
  await page.setViewportSize({width,height:width===375?812:1000})
  for(const panel of ['answer','forecast','stress','debts','history']){
   await page.locator(`#tab-${panel}`).click()
   assert.equal(await page.getByRole('tabpanel').count(),1)
   assert.equal(await page.locator(`#${panel}`).isVisible(),true)
   assert.equal(await page.locator(`#tab-${panel}`).getAttribute('aria-selected'),'true')
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}/${panel}`)
   if(width===375||width===1440){await page.evaluate(()=>document.activeElement?.blur());await page.screenshot({path:fileURLToPath(new URL(`${panel}-${width}.png`,qa)),fullPage:true})}
  }
  results.push(`${width}px: 5 distinct tabs, one panel, no horizontal overflow`)
 }
 await page.locator('#tab-answer').click()
 await page.keyboard.press('ArrowRight')
 assert.equal(await page.locator('#tab-forecast').evaluate(e=>e===document.activeElement),true)
 await page.keyboard.press('End')
 assert.equal(await page.locator('#history').isVisible(),true)
 await page.keyboard.press('Home')
 assert.equal(await page.locator('#answer').isVisible(),true)
 await page.locator('#tab-stress').click()
 for(let i=0;i<4;i++){await page.locator(`[data-scenario="${i}"]`).click();assert.equal(await page.locator(`[data-scenario="${i}"]`).getAttribute('aria-pressed'),'true');assert.ok((await page.locator('.scenario-assumption').innerText()).length>10)}
 await page.locator('#tab-history').click()
 await page.selectOption('#history-before','0')
 assert.ok((await page.locator('.history-comparison').innerText()).includes('+90'))
 await page.locator('.archive-details>summary').click()
 await page.locator('[data-open-report="0"]').click()
 await page.keyboard.press('Escape')
 assert.equal(await page.locator('dialog').isVisible(),false)
 for(const hs of ['single','empty','loading','error','versions']){await page.selectOption('#history-state',hs);assert.ok((await page.locator('#history-content').innerText()).length>20)}
 await page.selectOption('#state','offline')
 assert.equal(await page.locator('[data-action]:disabled').count(),9)
 assert.equal(await page.locator('#history-before').count(),0)
 await page.selectOption('#state','save-error')
 await page.locator('#tab-answer').click()
 await page.locator('#live-steps>.step>summary').click()
 await page.locator('[data-action]').first().check()
 await page.waitForFunction(()=>!document.querySelector('[data-action]').disabled)
 assert.equal(await page.locator('[data-action]').first().isChecked(),false)
 await page.locator('#retry-action').click()
 await page.waitForFunction(()=>document.querySelector('[data-action]').checked)
 for(const mode of ['loading','empty','error']){await page.selectOption('#state',mode);assert.equal(await page.locator('#report').isHidden(),true)}
 await page.selectOption('#state','ready')
 assert.deepEqual(errors,[])
 results.push('Arrow/Home/End tabs; scenario assumptions; history, dialog, offline, rollback/retry, global states: PASS')
 results.push('No JS errors or failed resources; calculation fixture unchanged')
 await writeFile(new URL('results.json',qa),JSON.stringify({status:'PASS',results},null,2))
 console.log(results.join('\n'))
}finally{await browser.close()}
