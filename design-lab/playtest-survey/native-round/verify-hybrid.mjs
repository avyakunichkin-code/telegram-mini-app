import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const round=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(path.resolve(round,'../../../frontend-react/package.json'));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],errors=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto('http://127.0.0.1:4178/playtest-survey/native-round/');
 await page.evaluate(()=>document.fonts.ready);
 const root=page.locator('#variant-h');
 for(const [width,height] of [[360,640],[390,744],[1440,950]])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height});await page.selectOption('#theme',theme);
  for(let step=0;step<3;step++){
   await page.selectOption('#step',String(step));
   for(const state of (step===2?['form','sending','error']:['form'])){
    await page.selectOption('#state',state);
    const fits=await root.locator('.content').evaluate(el=>el.scrollHeight<=el.clientHeight+1);
    assert.equal(fits,true,`no content scroll: ${width}/${height} ${theme} step ${step} ${state}`);
    assert.equal(await root.locator('.content').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,`no inner horizontal overflow: ${width} step ${step}`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    checks.push({width,height,theme,step,state});
   }
   await page.selectOption('#state','form');
   if(width===390&&theme==='light')await root.screenshot({path:path.join(round,`qa/hybrid-step-${step+1}.png`)});
  }
 }
 await page.click('#reset');
 for(let step=0;step<3;step++){
  for(const field of await root.locator('fieldset').all())await field.locator('input').first().check();
  if(step===2){await root.locator('textarea').fill('Свой синтетический отзыв');await root.getByRole('button',{name:'Назад',exact:true}).click();await root.getByRole('button',{name:'Дальше',exact:true}).click();assert.equal(await root.locator('textarea').inputValue(),'Свой синтетический отзыв');await page.selectOption('#state','error');assert.equal(await root.locator('input:checked').count(),2);}
  await root.getByRole('button',{name:step===2?'Отправить ответы':'Дальше',exact:true}).click();
 }
 assert.equal(await root.getByText('Спасибо за ответы!',{exact:true}).count(),1);
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(round,'qa/hybrid-verification.json'),JSON.stringify({ok:true,checks,errors,interactions:['three grouped steps','back retains answers and free text','error/retry/success']},null,2));
 console.log(`PASS: ${checks.length} hybrid checks; no inner scrolling at 360x640/390x744/desktop; free text/back/retry.`);
}finally{await browser.close();}
