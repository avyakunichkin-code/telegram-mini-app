import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const round=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(path.resolve(round,'../../../frontend-react/package.json'));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'chrome'});
const errors=[],checks=[];
await fs.mkdir(path.join(round,'qa'),{recursive:true});
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto('http://127.0.0.1:4178/capital-page/first-investment-round/');
 await page.evaluate(()=>document.fonts.ready);
 const root=page.locator('#preview');
 for(const [width,height] of [[360,640],[390,744],[1440,950]])for(const theme of ['light','dark'])for(const variant of ['a','b']){
  await page.setViewportSize({width,height});await page.selectOption('#theme',theme);await page.selectOption('#variant',variant);
  for(const state of ['empty','loading','locked','zero','error','busy','success']){
   await page.selectOption('#state',state);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`page width ${width}/${variant}/${state}`);
   assert.equal(await root.evaluate(e=>e.scrollWidth<=e.clientWidth+1),true,`preview width ${width}/${variant}/${state}`);
   for(const el of await root.locator('button').all())assert.ok((await el.boundingBox()).height>=44,'44px controls');
   if(state==='busy')assert.equal(await root.getByRole('button',{name:'Выполняем…'}).isDisabled(),true);
   if(width===390&&theme==='light'){const file=path.join(round,`qa/${variant}-${state}.png`);if(await root.getByRole('dialog').count())await page.screenshot({path:file});else await root.screenshot({path:file});}
   checks.push({width,height,theme,variant,state});
  }
  for(const product of ['deposit','bond']){
   await page.click('#reset');
   if(variant==='b')await root.getByRole('button',{name:'Выбрать вложение',exact:true}).click();
   await root.locator(`[data-do="${product}"]`).click();
   const dialog=root.getByRole('dialog');
   await page.waitForFunction(()=>!document.querySelector('.sheet').getAnimations().some(a=>a.playState==='running'));
   const box=await dialog.boundingBox();assert.ok(Math.abs(box.y+box.height-height)<=2,'sheet anchored to viewport bottom');
   assert.equal(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'sheet horizontal fit');
   assert.equal(await dialog.locator('.sheet-footer').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1),true,'CTA visible');
   await dialog.locator('#amount').fill('90000');
   assert.equal(await dialog.locator('[data-do=submit]').isDisabled(),true);
   await dialog.locator('#amount').fill('50000');
   assert.equal(await dialog.getByRole('note').count(),1);
   await dialog.locator('[data-amount="10000"]').click();
   assert.ok((await dialog.innerText()).includes('70 000 ₽'));
   await dialog.locator('[data-do=submit]').click();
   await root.getByRole('status').waitFor();
   assert.equal(await root.getByText(product==='deposit'?'Вклад открыт':'Облигации куплены',{exact:true}).count(),1);
   assert.ok((await root.innerText()).includes('70 000 ₽'));
  }
 }
 await page.selectOption('#variant','a');await page.selectOption('#state','zero');await root.locator('[data-do=deposit]').click();
 assert.equal(await root.locator('[data-do=submit]').isDisabled(),true);
 await page.selectOption('#state','error');await root.locator('[data-do=submit]').click();
 await root.locator('.sheet [data-do=submit]:not(:disabled)').waitFor();
 assert.match(await root.locator('#amount').inputValue(),/^10\s000$/);
 await root.locator('[data-do=submit]').click();await root.getByRole('status').waitFor();
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(round,'qa/verification.json'),JSON.stringify({ok:true,checks,errors,flows:['both products in both variants','zero/excess invalid','expense warning','error retains amount and retry']},null,2));
 console.log(`PASS: ${checks.length} states, both purchase flows, validation, retry, 44px targets, no horizontal overflow.`);
}finally{await browser.close();}
