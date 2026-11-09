import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const out=new URL('../../design-lab/board-game/qa-mqx-all/',import.meta.url);
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],httpErrors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)httpErrors.push(`${r.status()} ${r.url()}`)});
await page.addInitScript(()=>localStorage.setItem('tg_miniapp_token','synthetic-catalog-audit'));
await page.route(url=>url.pathname.startsWith('/api/'),route=>{
  assert.equal(route.request().method(),'GET','Catalog must not mutate backend');
  return route.fulfill({json:route.request().url().includes('/user/me') ? {id:1,username:'Демо'} : []});
});
try {
 for(const width of [1440,390]) for(const theme of ['light','dark']) {
  await page.setViewportSize({width,height:1000});
  await page.goto('http://127.0.0.1:5176/?style=ink#/dev/mqx');
  await page.locator('.mqx-catalog-section').first().waitFor();
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  await page.evaluate(()=>document.fonts.ready);
  const sections=page.locator('.mqx-catalog-section');
  assert.ok(await sections.count()>=25);
  const titles=[];
  for(let i=0;i<await sections.count();i++) {
    const section=sections.nth(i);
    const title=await section.locator('h2').first().textContent();titles.push(title);
    await section.scrollIntoViewIfNeeded();
    const box=await section.boundingBox();
    assert.ok(box.x>=-1 && box.x+box.width<=width+1,`Clipped section: ${title} ${JSON.stringify(box)}`);
    await section.locator('img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()))});
    assert.equal(await section.evaluate(el=>el.scrollWidth>el.clientWidth),false,`${width}/${theme}: ${title} ${JSON.stringify(await section.evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,overflow:[...el.querySelectorAll('*')].filter(n=>n.getBoundingClientRect().right>el.getBoundingClientRect().right+1).slice(0,8).map(n=>({cls:n.className,width:n.getBoundingClientRect().width}))})))}`);
    await section.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-${String(i+1).padStart(2,'0')}.png`,out))});
  }
  const form=sections.filter({has:page.getByRole('heading',{name:'Форма депозита — окно суммы ★ BG-4',exact:true})});
  assert.equal(await form.locator('.mqx-invest-rate').count(),1,'One rate chip');
  assert.equal(await form.locator('.mqx-sheet .mqx-invest-form').count(),1);
  const submit=form.getByRole('button',{name:'Открыть депозит',exact:true});
  const field=form.locator('#invest-amount-deposit');
  await field.fill('0');assert.equal(await submit.isDisabled(),true);
  await field.fill('120000');assert.equal(await submit.isEnabled(),true);
  await submit.click();assert.match(await form.getByRole('status').textContent(),/120.?000/);
  const computed=await submit.evaluate(el=>{const s=getComputedStyle(el);return {border:s.borderTopWidth,shadow:s.boxShadow,background:s.backgroundImage}});
  assert.equal(computed.border,'2px');assert.notEqual(computed.shadow,'none');assert.equal(computed.background,'none');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  checks.push({width,theme,sections:titles,deposit:'input/disabled/submit; native ink sheet; single rate',computed});
  console.log(`PASS: ${titles.length} sections at ${width}/${theme}`);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);
 await fs.writeFile(new URL('verification.json',out),JSON.stringify({ok:true,checks,errors,httpErrors},null,2));
} catch(error) {
 console.error({errors,httpErrors});
 await page.screenshot({path:fileURLToPath(new URL('failure.png',out)),fullPage:true});
 throw error;
} finally {await browser.close()}
