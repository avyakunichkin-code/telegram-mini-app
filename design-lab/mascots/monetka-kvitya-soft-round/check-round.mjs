import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../../frontend-react/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const dir=path.dirname(fileURLToPath(import.meta.url));
const qa=path.join(dir,'qa');await fs.mkdir(qa,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],httpErrors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)httpErrors.push(`${r.status()} ${r.url()}`)});
await page.goto('http://127.0.0.1:4175/mascots/monetka-kvitya-soft-round/');
await page.evaluate(()=>document.fonts.ready);
async function ready(){await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0))}
try{
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:1000});
  for(const theme of ['light','dark']){
   if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme-toggle').click();
   for(const variant of ['a']){
    await ready();
    for(const caption of await page.locator('#caption option').allTextContents()){
     await page.locator('#caption').selectOption({label:caption});
     assert.equal(await page.locator('.coin-live img').getAttribute('alt'),'Монетка: '+caption);
    }
    for(const state of ['default','joy','think']){
     await page.locator('#receipt-state').selectOption(state);await ready();
     assert.equal(await page.locator('.receipt-paper').getAttribute('data-receipt-state'),state);
    }
    await page.locator('#receipt-state').selectOption('default');
    await page.locator('#caption').selectOption({label:'НОВЫЙ ХОД'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await page.locator('.coin-live svg').count(),0);
    assert.equal(await page.locator('.receipt-total dd').textContent(),'+10 700 ₽');
    if(width!==768){
     await page.locator('.mascot-contexts').screenshot({path:path.join(qa,`contexts-${variant}-${theme}-${width}.png`)});
    }
    checks.push({width,theme,variant,captions:8,images:'loaded',overflow:false});
   }
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:4175/mascots/monetka-kvitya-soft-round/?variant=a');await ready();
 await page.locator('#emotion-set').screenshot({path:path.join(qa,'emotions-desktop.png')});
 await page.locator('.compare-grid').screenshot({path:path.join(qa,'comparison.png')});
 await page.screenshot({path:path.join(qa,'desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(qa,'mobile.png'),fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);
 await fs.writeFile(path.join(qa,'verification.json'),JSON.stringify({ok:true,checks,errors,httpErrors},null,2)+'\n');
 console.log('PASS: 6 viewport/theme combinations, 8 coin scenarios and 3 receipt states each, images loaded, no overflow or errors.');
}finally{await browser.close()}
