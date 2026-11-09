import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { fileURLToPath } from 'node:url'
import { chromium } from '../../../apps/plan-web/node_modules/playwright/index.mjs'
const context={window:{}}
runInNewContext(await readFile(new URL('./precision-model.js',import.meta.url),'utf8'),context)
const {analyze,broad}=context.window.PrecisionModel
assert.equal(analyze({}).level,'empty')
assert.equal(analyze({incomes:[{min:100,max:110}]}).level,'refined')
assert.equal(analyze({incomes:[{min:0,max:0}]}).total,0)
assert.equal(analyze({incomes:[{min:0,max:100}]}).level,'draft')
assert.equal(analyze({incomes:[{min:85,max:85}],expenses:[{min:0,max:15}]}).level,'refined')
assert.equal(analyze({incomes:[{min:50,max:50}],expenses:[{min:0,max:50}]}).level,'approximate')
assert.equal(analyze({liabilities:[{monthly_payment:100,estimated:true}]}).candidate.key,'liabilities')
assert.equal(analyze({incomes:[{min:1,max:100}],expenses:[{min:100,max:1000}]}).candidate.key,'expenses')
assert.equal(broad(100,300),false);assert.equal(broad(100,301),true);assert.equal(broad(0,100),true);assert.equal(broad(0,0),false);assert.equal(broad(-1,10),false)
const qa=new URL('./qa/',import.meta.url);await mkdir(qa,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
const results=['Pure model: thresholds 50/85%, 1.1 exact ratio, estimated loan, max-weight candidate, broad >3 and zero boundaries: PASS']
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}})
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto(new URL('./index.html',import.meta.url).href)
 await page.evaluate(()=>document.fonts.ready)
 for(const width of [375,701,1050,1440]){
  await page.setViewportSize({width,height:width===375?812:1000})
  for(const value of ['inline','guide']){
   await page.locator(`[name=variant][value=${value}]`).check()
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${value}/${width} overflow`)
   if(width===375||width===1440)await page.screenshot({path:fileURLToPath(new URL(`${value}-${width}.png`,qa)),fullPage:true})
  }
 }
 assert.equal(await page.locator('#precision').innerText(),'Приблизительные данные')
 assert.equal(await page.locator('#warning').isVisible(),true)
 assert.equal(await page.locator('#save').isEnabled(),true)
 await page.locator('#exact').click();await page.locator('#min').fill('60000')
 assert.equal(await page.locator('#precision').innerText(),'Уточнённые данные')
 assert.equal(await page.locator('#warning').isVisible(),false)
 assert.ok((await page.locator('#guide-title').innerText()).includes('кредиты'))
 await page.locator('#goto').click()
 assert.equal(await page.locator('#section-title').innerText(),'Кредиты')
 assert.equal(await page.locator('#ranged').isDisabled(),true)
 for(const key of ['incomes','expenses','liabilities','savings']){
  await page.locator(`[data-key=${key}]`).click();assert.equal(await page.locator('#precision').isVisible(),true)
 }
 await page.selectOption('#state','error')
 await page.locator('#max').fill('90000')
 await page.locator('#save').click();await page.locator('#error').waitFor()
 assert.equal(await page.locator('#max').inputValue(),'90000')
 await page.locator('#retry').click();await page.waitForFunction(()=>document.querySelector('#notice').textContent==='Сохранено в демо')
 await page.selectOption('#state','zero')
 assert.equal(await page.locator('#warning').isVisible(),true)
 assert.equal(await page.locator('#save').isEnabled(),true)
 await page.locator('#min').fill('110000')
 assert.equal(await page.locator('#invalid').isVisible(),true)
 assert.equal(await page.locator('#save').isDisabled(),true)
 await page.selectOption('#state','offline')
 assert.equal(await page.locator('#min').isDisabled(),true)
 await page.selectOption('#state','saving')
 assert.equal(await page.locator('#next').isDisabled(),true)
 await page.selectOption('#state','empty')
 assert.equal(await page.locator('#precision').innerText(),'Нет сумм для оценки')
 assert.deepEqual(errors,[])
 results.push('A/B at 375/701/1050/1440: no overflow; precision on all 4 demo sections; broad range saves; exact raises level; correct next section; errors preserve input/retry; zero/invalid/saving/offline/empty: PASS')
 await writeFile(new URL('results.json',qa),JSON.stringify({status:'PASS',results},null,2));console.log(results.join('\n'))
}finally{await browser.close()}
