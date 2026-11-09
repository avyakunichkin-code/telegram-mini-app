import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(repo, 'design-lab/mascots/pet-style-round/qa/react');
await fs.mkdir(out,{recursive:true});
const origin = 'http://127.0.0.1:5176/';
const pairs = [
  ['mq_game_basic_v1','student','Студент'],
  ['mq_game_tight_budget_v1','professional','Профессионал'],
  ['mq_game_mortgage_stress_v1','manager','Руководитель'],
  ['mq_game_debt_stack_v1','entrepreneur','Предприниматель'],
];
const browser = await chromium.launch({channel:'chrome',headless:true});
const context = await browser.newContext({viewport:{width:1440,height:1000},locale:'ru-RU'});
const page = await context.newPage();
const errors = [], httpErrors = [], checks = [];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.status()>=400)httpErrors.push(`${response.status()} ${response.url()}`)});
// Synthetic UI-only fixtures: no backend, database, real profile or credential access.
await context.addInitScript(()=>localStorage.setItem('tg_miniapp_token','synthetic-mascot-preview'));
await context.route(url=>url.pathname.startsWith('/api/'),async route=>{
  const url = new URL(route.request().url());
  let data;
  if(url.pathname==='/api/user/me')data={id:1,username:'Проверка маскотов'};
  else if(url.pathname==='/api/game/profiles')data=pairs.map(([key,,title],i)=>({id:i+1,name:`Демо ${title}`,starter_template_key:key,period_index:1,cash_balance:12000,is_active:i===0}));
  else if(url.pathname==='/api/game/templates')data=pairs.map(([key,,title],i)=>({template_key:key,title,difficulty_rank:i+1,highlights:['Доход ~50 000 ₽/мес','Чистый старт — без долгов']}));
  else throw new Error(`Unexpected API in UI-only preview: ${url.pathname}`);
  await route.fulfill({json:data});
});
async function loaded(locator){
  await locator.evaluateAll(async nodes=>{await Promise.all(nodes.map(img=>img.decode()))});
  assert.ok(await locator.evaluateAll(nodes=>nodes.every(img=>img.complete&&img.naturalWidth>0)));
}
try{
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});
    await page.goto(origin+'#/dev/mqx');
    await page.locator('.mqx-catalog-mascots').waitFor();
    const family=page.locator('.mqx-catalog-mascots');
    await loaded(family.locator('img'));
    assert.equal(await family.locator('.mqx-catalog-mascots__card').count(),4);
    assert.equal(await family.locator('picture[data-size=avatar]').count(),4);
    assert.equal(await family.evaluate(el=>el.scrollWidth>el.clientWidth),false);
    for(let i=0;i<pairs.length;i++){
      await family.locator('.mqx-catalog-mascots__card').nth(i).screenshot({path:path.join(out,`${pairs[i][1]}-${width}.png`)});
    }
    const cashAvatar=page.locator('.mqx-bg-money__avatar picture').first();
    assert.equal(await cashAvatar.getAttribute('data-size'),'avatar');
    await loaded(cashAvatar.locator('img'));
    await family.screenshot({path:path.join(out,`family-${width}.png`)});
    const guides=page.locator('.mqx-guide-mascots');
    await loaded(guides.locator('img'));
    assert.equal(await guides.locator('[data-mascot=monetka]').count(),7);
    assert.equal(await guides.locator('[data-mascot=kvitya]').count(),3);
    assert.equal(await guides.locator('svg').count(),0);
    await guides.screenshot({path:path.join(out,`guides-${width}.png`)});
    await page.getByRole('button',{name:'Показать итоги периода'}).click();
    const receipt=page.locator('.mqx-pclose-sheet');
    await loaded(receipt.locator('[data-mascot=kvitya] img'));
    assert.equal(await receipt.locator('.mqx-pclose-row').count(),6);
    assert.equal(await receipt.evaluate(el=>el.scrollWidth>el.clientWidth),false);
    await receipt.screenshot({path:path.join(out,`kvitya-summary-${width}.png`)});
    await receipt.getByRole('button',{name:'Закрыть',exact:true}).click();
    const fallback=family.locator('picture source');
    await fallback.evaluateAll(nodes=>nodes.forEach(node=>node.media='not all'));
    await loaded(family.locator('img'));
    assert.ok(await family.locator('img').evaluateAll(nodes=>nodes.every(img=>img.currentSrc.endsWith('.png'))));
    checks.push(`catalog ${width}: all pairs/sizes, PNG fallback, no overflow`);
    const contracts=await page.evaluate(async()=>{
      const p=await import('/src/components/mqx/brand/personaPortraits.js');
      const c=await import('/src/components/mqx/brand/personaCompanions.js');
      return [p.getPersonaPortrait('unknown'),p.getPersonaPortrait('mq_game_basic_v1','unknown'),c.getPersonaCompanion('unknown'),c.getPersonaCompanion('mq_game_basic_v1','unknown'),p.getPersonaPortrait('mq_game_basic_v1','constructor'),c.getPersonaCompanion('mq_game_basic_v1','constructor')];
    });
    assert.deepEqual(contracts,[null,null,null,null,null,null]);
    // Real React menu and picker, with synthetic API responses.
    await page.goto(origin+'#/');
    await page.getByRole('button',{name:/^Новая игра/}).waitFor();
    await loaded(page.locator('.mqx-pg-save img'));
    await page.getByRole('button',{name:/^Все сохранения/}).click();
    await page.locator('.mqx-pg-save-row').first().waitFor();
    await loaded(page.locator('.mqx-pg-save-row img'));
    await page.keyboard.press('Escape');
    // Reload closes the sheet and restores the normal start screen.
    await page.goto(origin+'#/');
    await page.getByRole('button',{name:/^Новая игра/}).click();
    await page.getByRole('heading',{name:'Выбери жизнь'}).waitFor();
    assert.equal(await page.locator('.mqx-persona-companion').count(),0);
    for(const [,slug,title] of pairs){
      const radio=page.getByRole('radio',{name:new RegExp(title)});
      await radio.click();
      assert.equal(await radio.getAttribute('aria-checked'),'true');
      await loaded(radio.locator('img'));
      assert.equal(await radio.locator('picture').getAttribute('data-persona'),slug);
    }
    await page.screenshot({path:path.join(out,`picker-${width}.png`),fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    checks.push(`menu/saves/picker ${width}: all four roles, no companions before selection`);
  }
  assert.deepEqual(errors,[]); assert.deepEqual(httpErrors,[]);
  await fs.writeFile(path.join(out,'verification.json'),JSON.stringify({ok:true,checks,pageErrors:errors,httpErrors,fixtures:'synthetic API only; no backend writes'},null,2)+'\n');
  console.log('PASS: React catalogue, all four portraits/companions, sizes, unknown keys, PNG fallback, menu, saves and selection at 1440/390px.');
}catch(error){
  await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});
  throw error;
}finally{await browser.close()}
