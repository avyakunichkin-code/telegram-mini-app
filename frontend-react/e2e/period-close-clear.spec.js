import { E2E_API, expect, guidanceStrip, playTurnOne, startNewGameFromMenu, test } from './fixtures.js';

const sample={closed_period_index:1,new_balance:50133,cash_delta:25133,income_delta:62633,expense_delta:37500,safety_fund_delta:0,
  period_highlights:[{key:'expenses',label:'Расходы',amount:37500},{key:'bond_coupons',label:'Купоны',amount:133},{key:'deposit_interest',label:'Проценты',amount:117}]};

async function openWithSummary({page,request,player},summary){
  await startNewGameFromMenu(page);
  const headers={Authorization:`Bearer ${player.token}`};
  const skipped=await request.patch(`${E2E_API}/api/game/guidance`,{headers,data:{action:'skip_all'}});expect(skipped.ok()).toBeTruthy();
  await page.reload();await expect(guidanceStrip(page)).toBeHidden();
  await page.getByRole('button',{name:'Зарплата, получить'}).click();
  // Only the display DTO is synthetic; close itself uses the isolated real backend.
  await page.route('**/api/game/time/next',async route=>{const response=await route.fetch();const json=await response.json();json.period_close=summary;await route.fulfill({response,json});});
  await page.getByRole('button',{name:'Завершить ход и перейти к следующему'}).click();
  const dialog=page.locator('.mqx-close-clear');await expect(dialog).toBeVisible();return dialog;
}

async function layout(page,dialog,testInfo,name,compact=true){
  const original=page.viewportSize();
  for(const [width,height] of [[360,640],[390,744],[1440,950]])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    await expect.poll(async()=>await dialog.evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1)).toBeTruthy();
    expect(await dialog.locator('.mqx-close-clear__scroll').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBeTruthy();
    const card=await dialog.boundingBox();
    const content=await dialog.locator('.mqx-close-clear__scroll').boundingBox();expect(content.x+content.width).toBeLessThanOrEqual(card.x+card.width+1);
    for(const value of await dialog.locator('.mqx-close-clear__operations strong').all()){
      const box=await value.boundingBox();expect(box.x+box.width).toBeLessThanOrEqual(card.x+card.width-1);
    }
    if(compact)expect(await dialog.locator('.mqx-close-clear__scroll').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBeTruthy();
    const button=dialog.getByRole('button',{name:'Дальше',exact:true});expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
    expect(await button.evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1)).toBeTruthy();
    if(width===390&&theme==='light')await page.screenshot({path:testInfo.outputPath(`${name}-390.png`)});
  }
  await page.setViewportSize(original);await page.evaluate(()=>document.documentElement.dataset.theme='light');
}

test.describe('Итог хода · компактный A',()=>{
  test.beforeEach(({page})=>{page.on('requestfailed',r=>console.log('requestfailed',new URL(r.url()).pathname,r.failure()?.errorText));});
  test('три операции, отдельная капитализация, компактность и подробности',async({page,request,player},testInfo)=>{
    const dialog=await openWithSummary({page,request,player},sample);
    await expect(dialog.locator('.mqx-close-clear__balance')).toContainText(/50\s133/);
    await expect(dialog.locator('.mqx-close-clear__whole-turn')).toContainText(/За весь ход:\s*\+25\s133/);
    await expect(dialog.locator('.mqx-close-clear__operations li')).toHaveCount(3);
    await expect(dialog.locator('.mqx-close-clear__operations')).toContainText('Увеличили вклад, не счёт');
    await expect(dialog.locator('.mqx-juice-ritual__beats')).toHaveCount(0);
    await layout(page,dialog,testInfo,'normal');
    await dialog.locator('summary').click();await expect(dialog.locator('details')).toHaveAttribute('open','');
    await expect(dialog.locator('details')).toContainText('Оно не равно списанию при закрытии.');
    await layout(page,dialog,testInfo,'expanded',false);
    await dialog.getByRole('button',{name:'Дальше',exact:true}).click();await expect(dialog).toBeHidden();
  });
  test('минус, просрочка и сбой событий остаются видимыми',async({page,request,player},testInfo)=>{
    const dialog=await openWithSummary({page,request,player},{...sample,new_balance:-6500,cash_delta:-16500,overdue_added:2400,events_spawn_failed:true});
    await expect(dialog.getByRole('note').filter({hasText:'Счёт ушёл в минус'})).toBeVisible();
    await expect(dialog.getByRole('note').filter({hasText:/Просрочка/})).toContainText(/2\s400/);
    await expect(dialog.getByRole('status')).toContainText('Карточки этого хода не собрались');
    await layout(page,dialog,testInfo,'warnings',false);
    await dialog.getByRole('button',{name:'Дальше',exact:true}).click();await expect(dialog).toBeHidden();
  });
  test('старый итог без highlights сохраняет доходы и место процентов',async({page,request,player})=>{
    const dialog=await openWithSummary({page,request,player},{...sample,period_highlights:[],breakdown:[
      {type:'asset_income',title:'Доход от актива',amount:1000},
      {type:'deposit_interest',title:'Вклад',amount:117},
    ]});
    await expect(dialog.locator('.mqx-close-clear__operations')).toContainText('Доход от актива');
    await expect(dialog.locator('.mqx-close-clear__operations')).toContainText('Увеличили вклад, не счёт');
  });
  test('первый ход: фактический баланс, debrief и кнопка не перекрываются',async({page,player})=>{
    void player;await startNewGameFromMenu(page);const startCash=await playTurnOne(page);
    const dialog=page.locator('.mqx-close-clear');await expect(dialog).toBeVisible();
    const balanceText=await dialog.locator('.mqx-close-clear__balance strong').innerText();
    const deltaText=await dialog.locator('.mqx-close-clear__whole-turn strong').innerText();
    const balance=Number(balanceText.replace(/[^\d−-]/g,'').replace('−','-'));
    const delta=Number(deltaText.replace(/[^\d−-]/g,'').replace('−','-'));
    expect(delta).toBe(balance-startCash);
    const strip=guidanceStrip(page);await expect(strip).toContainText('Вот что');
    const card=await dialog.boundingBox(),guide=await strip.boundingBox();expect(card.y+card.height).toBeLessThanOrEqual(guide.y+1);
    await Promise.all([page.waitForResponse(r=>r.request().method()==='PATCH'&&r.url().endsWith('/api/game/guidance')),strip.getByRole('button',{name:'Понятно',exact:true}).click()]);
    await dialog.getByRole('button',{name:'Дальше',exact:true}).click();await expect(dialog).toBeHidden();
    await expect(guidanceStrip(page)).toContainText('Новый ход');
  });
});
