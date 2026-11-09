import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const require = createRequire(new URL('../../../frontend-react/package.json', import.meta.url))
const { chromium } = require('@playwright/test')
const round = path.dirname(fileURLToPath(import.meta.url))
const qa = path.join(round,'qa'); await fs.mkdir(qa,{recursive:true})
const url = 'http://127.0.0.1:4175/mascots/pet-style-round/'
const browser = await chromium.launch({ executablePath:'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless:true })
const page = await browser.newPage({ viewport:{width:1440,height:1000},deviceScaleFactor:1 })
const errors = [], responses = [], checks = []
page.on('pageerror',error => errors.push(error.message))
page.on('response',r => {if(r.status()>=400) responses.push(`${r.status()} ${r.url()}`)})
await page.goto(url)
await page.evaluate(() => document.fonts.ready)
async function ready(){
  await page.evaluate(() => document.querySelectorAll('img').forEach(img => img.loading='eager'))
  await page.waitForFunction(() => [...document.images].every(img=>img.complete && img.naturalWidth>0))
}
for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:1000})
  for(const theme of ['light','dark']){
    if(await page.locator('html').getAttribute('data-theme')!==theme) await page.locator('#theme-toggle').click()
    for(const persona of ['student','pro','boss','biz']){
      await page.locator(`[data-persona=${persona}]`).click()
      for(const variant of ['a','b']){
        await page.locator(`[data-variant=${variant}]`).click()
        await ready()
        assert.equal(await page.locator(`[data-persona=${persona}]`).getAttribute('aria-pressed'),'true')
        assert.equal(await page.locator(`[data-variant=${variant}]`).getAttribute('aria-pressed'),'true')
        assert.ok((await page.locator('#meet-art').getAttribute('src')).includes(`${persona}-${variant}`))
        assert.ok((await page.locator('#pick-art').getAttribute('src')).endsWith('-person.webp'))
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow ${width}/${theme}/${persona}/${variant}`)
        checks.push({width,theme,persona,variant,images:'loaded',overflow:false})
      }
    }
  }
}
await page.setViewportSize({width:1440,height:1000})
await page.goto(url+'?persona=student&variant=a'); await ready()
await page.screenshot({path:path.join(qa,'desktop-light.png'),fullPage:true})
await page.locator('.compare-grid').screenshot({path:path.join(qa,'compare-student.png')})
await page.locator('.family').screenshot({path:path.join(qa,'family-a.png')})
await page.locator('[data-variant=b]').click(); await ready()
await page.locator('.family').screenshot({path:path.join(qa,'family-b.png')})
await page.locator('#theme-toggle').click()
await page.screenshot({path:path.join(qa,'desktop-dark.png'),fullPage:true})
await page.setViewportSize({width:390,height:844})
await page.goto(url+'?persona=student&variant=a'); await ready()
await page.screenshot({path:path.join(qa,'mobile.png'),fullPage:true})
await page.goto(url+'?persona=biz&variant=b'); await ready()
assert.equal(await page.locator('[data-persona=biz]').getAttribute('aria-pressed'),'true')
assert.equal(await page.locator('[data-variant=b]').getAttribute('aria-pressed'),'true')
assert.deepEqual(errors,[]); assert.deepEqual(responses,[])
await browser.close()
await fs.writeFile(path.join(qa,'browser-check.json'),JSON.stringify({ok:true,combinations:checks.length,checks,pageErrors:errors,httpErrors:responses,urlStateRestored:true},null,2)+'\n')
console.log(`PASS: ${checks.length} viewport/theme/persona/variant combinations; assets, URL restore and no overflow/errors.`)
