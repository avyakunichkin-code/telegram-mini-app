import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const out=new URL('../../design-lab/board-game/qa-mqx-current/',import.meta.url);
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('tg_miniapp_token','synthetic-catalog-check'));
await page.route(url=>url.pathname.startsWith('/api/'),route=>route.fulfill({json:route.request().url().includes('/user/me') ? {id:1,username:'Демо'} : []}));
try {
  await page.goto('http://127.0.0.1:5176/?style=ink#/dev/mqx');
  for(const width of [1440,390]) for(const theme of ['light','dark']) {
    await page.setViewportSize({width,height:1000});
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    const primitive=page.locator('[data-catalog-demo=primitives]');
    await primitive.getByRole('button',{name:'Завершить ход',exact:true}).click();
    assert.match(await primitive.getByRole('status').textContent(),/главного действия/);
    const seg=page.locator('[data-catalog-demo=segment]');
    await seg.getByRole('tab',{name:'Действия',exact:true}).click();
    assert.equal(await seg.getByRole('tab',{name:'Действия',exact:true}).getAttribute('aria-selected'),'true');
    assert.match(await seg.getByRole('tabpanel').textContent(),/покупки/);
    await seg.getByRole('tab',{name:'Мои (2)',exact:true}).click();
    assert.match(await seg.getByRole('status').textContent(),/мои позиции/);
    await seg.getByRole('tab',{name:'Добавить',exact:true}).click();
    const dash=page.locator('[data-catalog-demo=dashboard]');
    const needs=await dash.locator('.mqx-bg-need__bar').evaluateAll(nodes=>nodes.map(el=>({height:getComputedStyle(el).height,border:getComputedStyle(el).borderTopWidth,fillEdge:getComputedStyle(el.firstElementChild).boxShadow})));
    assert.equal(needs.length,4);
    for(const bar of needs)assert.deepEqual(bar,{height:'6px',border:'0px',fillEdge:'none'});
    const flat=await dash.locator('.mqx-bg-money__cell, .mqx-bg-goal').evaluateAll(nodes=>nodes.map(el=>({border:getComputedStyle(el).borderTopWidth,shadow:getComputedStyle(el).boxShadow,background:getComputedStyle(el).backgroundColor})));
    assert.equal(flat.length,4);
    for(const surface of flat)assert.deepEqual(surface,{border:'0px',shadow:'none',background:'rgba(0, 0, 0, 0)'});
    const chips=await dash.locator('.mqx-bg-act, .mqx-bg-salary--hot, .mqx-bg-events, .mqx-bg-cta').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).borderTopWidth));
    for(const border of chips)assert.equal(border,'0px');
    assert.equal(await dash.locator('.mqx-bg-turn').evaluate(el=>getComputedStyle(el).borderTopWidth),'2px');
    await dash.getByRole('button',{name:'Сбросить пример дашборда'}).click();
    assert.equal(await dash.locator('.mqx-bg-salary').count(),1);
    await dash.locator('.mqx-bg-salary').click();
    assert.equal(await dash.locator('.mqx-bg-salary').isDisabled(),true);
    assert.match(await dash.getByRole('status').textContent(),/62 500/);
    await dash.getByRole('button',{name:'Сбросить пример дашборда'}).click();
    for(const name of ['primitives','segment','dashboard']) {
      const section=page.locator(`[data-catalog-demo=${name}]`);
      await section.screenshot({path:fileURLToPath(new URL(`${name}-${theme}-${width}.png`,out))});
      assert.equal(await section.evaluate(el=>el.scrollWidth>el.clientWidth),false);
    }
    await page.getByRole('button',{name:'Открыть список имущества'}).click();
    await page.getByRole('button',{name:'Удалить актив в примере'}).click();
    await page.locator('.mqx-confirm-dialog').getByRole('button',{name:'Отмена',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Удалить актив в примере'}).count(),1);
    await page.getByRole('button',{name:'Удалить актив в примере'}).click();
    await page.locator('.mqx-confirm-dialog').getByRole('button',{name:'Удалить',exact:true}).click();
    await page.getByRole('button',{name:'Купить актив в примере'}).click();
    assert.equal(await page.getByRole('button',{name:'Удалить актив в примере'}).count(),1);
    await page.locator('.mqx-sheet[role=dialog]').screenshot({path:fileURLToPath(new URL(`actions-${theme}-${width}.png`,out))});
    await page.locator('.mqx-sheet__close').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  assert.deepEqual(errors,[]);
  await fs.writeFile(new URL('verification.json',out),JSON.stringify({ok:true,widths:[1440,390],themes:['light','dark'],checks:['primitives','segment switching','salary and reset','cancel/delete/buy in capital sheet'],errors},null,2));
  console.log('PASS: four current MQX sections, light/dark at 1440/390, actions and confirm, no overflow/errors.');
} catch(error) {
  console.error({errors,body:(await page.locator('body').innerText()).slice(0,1500)});
  await page.screenshot({path:fileURLToPath(new URL('failure.png',out)),fullPage:true});
  throw error;
} finally { await browser.close(); }
