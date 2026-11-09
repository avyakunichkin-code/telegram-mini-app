import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const round=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(path.resolve(round,'../../../frontend-react/package.json'));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'chrome'});
const checks=[],errors=[];
await fs.mkdir(path.join(round,'qa'),{recursive:true});
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto('http://127.0.0.1:4178/period-close/clear-result-round/');await page.evaluate(()=>document.fonts.ready);
 const result=page.locator('#result');
 for(const [width,height] of [[360,640],[390,744],[1440,950]])for(const theme of ['light','dark'])for(const variant of ['a','b']){
  await page.setViewportSize({width,height});await page.selectOption('#theme',theme);await page.selectOption('#variant',variant);
  for(const scenario of ['normal','simple','negative','overdue','mismatch','historical','events']){
   await page.selectOption('#scenario',scenario);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no page horizontal overflow');
   assert.equal(await result.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'no result horizontal overflow');
   assert.equal(await result.locator('.result-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'no content horizontal overflow');
   if(['normal','simple'].includes(scenario))assert.equal(await result.locator('.result-scroll').evaluate(el=>el.scrollHeight<=el.clientHeight+1),true,`compact normal ${width}/${variant}/${scenario}`);
   assert.ok((await result.locator('#next').boundingBox()).height>=44,'44px CTA');
   const footer=await result.locator('.result-footer').boundingBox();const stage=await page.locator('.stage').boundingBox();assert.ok(footer.y+footer.height<=stage.y+stage.height+1,'footer within stage');
   if(variant==='b'&&scenario==='historical'){assert.equal(await result.locator('.compare').count(),0);assert.ok((await result.innerText()).includes('50 133 ₽'),'actual balance still visible');}
   if(scenario==='normal'){assert.equal(await result.locator('.operations li').count(),3);assert.ok((await result.innerText()).includes('Увеличили вклад, не счёт'));}
   if(width===390&&theme==='light')await result.screenshot({path:path.join(round,`qa/${variant}-${scenario}.png`)});
   checks.push({width,height,theme,variant,scenario});
  }
 }
 await page.selectOption('#variant','a');await page.selectOption('#scenario','normal');
 await result.locator('summary').click();assert.equal(await result.locator('details').getAttribute('open'),'');
 await result.locator('#next').click();assert.equal(await result.isVisible(),false);
 await page.click('#reopen');assert.equal(await result.isVisible(),true);assert.equal(await result.locator('#title').evaluate(el=>document.activeElement===el),true);
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(round,'qa/verification.json'),JSON.stringify({ok:true,checks,errors},null,2));
 console.log(`PASS: ${checks.length} states, compact normal cases, cash/deposit separation, missing forecast fallback, details/reopen.`);
}finally{await browser.close();}
