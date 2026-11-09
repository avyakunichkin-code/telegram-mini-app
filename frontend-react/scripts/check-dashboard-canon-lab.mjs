import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const dir=new URL('../../design-lab/dashboard/current-page-round/',import.meta.url);
const out=new URL('qa/',dir);await fs.mkdir(out,{recursive:true});
const manifest=JSON.parse(await fs.readFile(new URL('../canon.manifest.json',dir),'utf8'));
assert.equal(manifest.page_parity.canonical_page_round.path,'design-lab/dashboard/current-page-round/');
for(const block of manifest.blocks)assert.equal(block.canonical_rounds[0].path,manifest.page_parity.canonical_page_round.path);
const baseCss=await fs.readFile(new URL('lab-base.css',dir),'utf8');
assert.equal(baseCss.slice(baseCss.indexOf('\n')+1),await fs.readFile(new URL('runtime.css',dir),'utf8'),'sync-lab must use the current runtime snapshot');
for(const name of ['lab-base.css','runtime.css','reference.js'])assert.deepEqual(await fs.readFile(new URL(name,dir)),await fs.readFile(new URL('../parity-generated-page-round/blocks/page/'+name,dir)));
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage();const errors=[],httpErrors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)httpErrors.push(`${r.status()} ${r.url()}`)});
async function hierarchy(root){
 const bars=await root.locator('.mqx-bg-need__bar').evaluateAll(ns=>ns.map(e=>({height:getComputedStyle(e).height,border:getComputedStyle(e).borderTopWidth,fill:getComputedStyle(e.firstElementChild).boxShadow})));
 assert.equal(bars.length,4);for(const bar of bars)assert.deepEqual(bar,{height:'6px',border:'0px',fill:'none'});
 const flat=await root.locator('.mqx-bg-money__cell,.mqx-bg-goal').evaluateAll(ns=>ns.map(e=>({border:getComputedStyle(e).borderTopWidth,shadow:getComputedStyle(e).boxShadow,bg:getComputedStyle(e).backgroundColor})));
 assert.equal(flat.length,4);for(const item of flat)assert.deepEqual(item,{border:'0px',shadow:'none',bg:'rgba(0, 0, 0, 0)'});
 assert.equal(await root.locator('.mqx-bg-turn').evaluate(e=>getComputedStyle(e).borderTopWidth),'2px');
}
try {
 await page.goto('http://127.0.0.1:4175/dashboard/current-page-round/');
 for(const width of [1440,390])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:1000});await page.selectOption('#theme',theme);
  for(const state of ['ready','paid','events','risk','loading','error','empty']){
   await page.selectOption('#state',state);const main=page.locator('#dashboard');
   if(['ready','paid','events','risk'].includes(state)){
    await hierarchy(main);await main.locator('img').evaluateAll(async ns=>Promise.all(ns.map(e=>e.decode())));
    assert.equal(await main.locator('.mqx-bg-cta').isDisabled(),state==='events');
    assert.equal(await main.locator('.mqx-bg-salary--quiet').count(),state==='paid'?1:0);
    if(state==='risk')assert.match(await main.locator('.mqx-bg-close-preview').textContent(),/−8 500/);
   }else assert.equal(await main.locator('.mqx-bg-turn').count(),0);
   const box=await main.boundingBox();assert.ok(box.x>=-1&&box.x+box.width<=width+1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(['ready','paid','risk'].includes(state))await main.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-${state}.png`,out))});
   checks.push({width,theme,state});
  }
 }
 await page.selectOption('#state','ready');await page.locator('.mqx-bg-salary').click();assert.equal(await page.locator('#state').inputValue(),'paid');
 for(const href of await page.locator('a').evaluateAll(ns=>ns.map(e=>e.href))){const r=await page.request.get(href);assert.equal(r.status(),200,href);}
 await page.goto('http://127.0.0.1:4175/dashboard/parity-generated-page-round/');
 const frame=page.frameLocator('iframe');await frame.locator('.mqx-bg-turn').waitFor();await hierarchy(frame.locator('#dashboard'));
 await page.goto('http://127.0.0.1:4175/dashboard/parity-generated-page-round/blocks/page/index.html');
 for(const href of await page.locator('a').evaluateAll(ns=>ns.map(e=>e.href))){const r=await page.request.get(href);assert.equal(r.status(),200,href);}
 assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);
 await fs.writeFile(new URL('verification.json',out),JSON.stringify({ok:true,checks,generatedParity:'same bytes + native hierarchy + working navigation',errors,httpErrors},null,2));
 console.log('PASS: canonical dashboard, 28 viewport/theme/state combinations, generated parity and navigation.');
}finally{await browser.close()}
