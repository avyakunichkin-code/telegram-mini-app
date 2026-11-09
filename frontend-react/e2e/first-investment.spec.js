import { E2E_API, expect, playTurnOne, startNewGameFromMenu, test } from './fixtures.js';

async function prepare({page,request,player}) {
  await startNewGameFromMenu(page);
  await playTurnOne(page);
  const headers={Authorization:`Bearer ${player.token}`};
  await request.patch(`${E2E_API}/api/game/guidance`,{headers,data:{action:'skip_all'}});
  await page.reload();
  await expect(page.locator('.mqx-guidance-strip')).toBeHidden();
  await page.getByRole('button',{name:'Зарплата, получить'}).click();
  await page.getByRole('button',{name:'Вложить',exact:true}).click();
  await page.getByRole('tab',{name:'Детали',exact:true}).click();
  await expect(page.getByText('Пока нет вкладов и облигаций.',{exact:true})).toBeVisible();
  return headers;
}

test.describe('Первое вложение · компактный A',()=>{
  test.use({allowedConsoleErrors:[/503|Service Unavailable/]});
  for(const product of ['deposit','bond'])test(`${product}: прямой вход, компактность, ошибка и покупка`,async({page,request,player},testInfo)=>{
    const headers=await prepare({page,request,player});
    const before=(await (await request.get(`${E2E_API}/api/game/bootstrap`,{headers})).json()).overview.cash_balance;
    await page.getByRole('button',{name:product==='deposit'?'Открыть вклад':'Купить облигации',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:product==='deposit'?'Вклад':'Облигации',exact:true});
    await expect(dialog.getByRole('button',{name:/Открыть вклад|Купить облигации/})).toBeDisabled();
    const amount=dialog.getByRole('textbox',{name:'Сумма',exact:true});
    await amount.fill('999999999');
    await expect(dialog.getByRole('alert')).toContainText('не хватает');
    await expect(dialog.getByRole('button',{name:/Открыть вклад|Купить облигации/})).toBeDisabled();
    await dialog.getByRole('button',{name:/10\s000/}).click();
    await expect(amount).toHaveValue(/^10\s000$/);
    const original=page.viewportSize();
    for(const [width,height] of [[360,640],[390,744],[1440,950]])for(const theme of ['light','dark']){
      await page.setViewportSize({width,height});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
      await expect.poll(async()=>{const box=await dialog.boundingBox();return Math.abs(box.y+box.height-height);}).toBeLessThan(2);
      expect((await dialog.boundingBox()).height).toBeLessThanOrEqual(400);
      expect(await dialog.locator('.mqx-first-investment__submit').evaluate(el=>getComputedStyle(el).color)).toBe('rgb(255, 255, 255)');
      expect(await dialog.locator('.mqx-sheet__body').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBeTruthy();
      expect(await dialog.locator('.mqx-sheet__body').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBeTruthy();
      for(const button of await dialog.getByRole('button').all())expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
      if(width===360&&theme==='light')await page.screenshot({path:testInfo.outputPath(`${product}-compact-360.png`)});
    }
    await page.setViewportSize(original);await page.evaluate(()=>document.documentElement.dataset.theme='light');
    const endpoint=product==='deposit'?'deposit/open':'bond/buy';
    await page.route(`**/api/invest/${endpoint}`,r=>r.fulfill({status:503,json:{detail:'Не удалось выполнить операцию. Попробуй ещё раз.'}}),{times:1});
    await dialog.getByRole('button',{name:/Открыть вклад|Купить облигации/}).click();
    await expect(dialog.getByRole('alert')).toContainText('Не удалось');await expect(amount).toHaveValue(/^10\s000$/);
    await dialog.getByRole('button',{name:/Открыть вклад|Купить облигации/}).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('tab',{name:'Детали',exact:true})).toHaveAttribute('aria-selected','true');
    await expect(page.getByRole('tab',{name:'Детали',exact:true})).toBeFocused();
    await expect(page.getByText('Пока нет вкладов и облигаций.',{exact:true})).toBeHidden();
    const positions=await (await request.get(`${E2E_API}/api/invest/positions`,{headers})).json();
    expect(positions).toHaveLength(1);expect(positions[0].kind).toBe(product);expect(Number(positions[0].principal)).toBe(10000);
    const after=(await (await request.get(`${E2E_API}/api/game/bootstrap`,{headers})).json()).overview.cash_balance;
    expect(Number(before)-Number(after)).toBe(10000);
  });
  test('фокус, Escape, одна покупка при повторе и блокировка закрытия во время запроса',async({page,request,player})=>{
    await prepare({page,request,player});
    await page.getByRole('button',{name:'Открыть вклад',exact:true}).click();
    let dialog=page.getByRole('dialog',{name:'Вклад',exact:true});
    await expect(dialog.getByRole('heading')).toBeFocused();await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button',{name:'Закрыть',exact:true})).toBeFocused();
    await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('button',{name:/10\s000/})).toBeFocused();
    await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
    await expect(page.getByRole('tab',{name:'Действия',exact:true})).toBeFocused();
    await page.getByRole('tab',{name:'Детали',exact:true}).click();await page.getByRole('button',{name:'Открыть вклад',exact:true}).click();
    dialog=page.getByRole('dialog',{name:'Вклад',exact:true});await dialog.getByRole('textbox',{name:'Сумма',exact:true}).fill('10000');
    let release;const gate=new Promise(r=>release=r);let requests=0;
    await page.route('**/api/invest/deposit/open',async route=>{requests++;await gate;await route.continue();});
    await dialog.getByRole('button',{name:/Открыть вклад/}).click();await expect(dialog.getByRole('button',{name:'Выполняем…'})).toBeDisabled();
    await page.keyboard.press('Escape');await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button',{name:'Закрыть',exact:true})).toBeDisabled();
    await dialog.locator('form').evaluate(f=>f.requestSubmit());expect(requests).toBe(1);
    release();await expect(dialog).toBeHidden();expect(requests).toBe(1);
  });
  for(const source of ['overview','positions'])test(`покупка подтверждена, но не загрузился ${source}: повтор обновляет только данные`,async({page,request,player})=>{
    const headers=await prepare({page,request,player});
    await page.getByRole('button',{name:'Открыть вклад',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Вклад',exact:true});
    await dialog.getByRole('textbox',{name:'Сумма',exact:true}).fill('10000');
    let posts=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/invest/deposit/open'))posts++;});
    const url=source==='overview'?'**/api/finance/overview':'**/api/invest/positions';
    await page.route(url,r=>r.fulfill({status:503,json:{detail:'Synthetic refresh failure'}}),{times:1});
    await dialog.getByRole('button',{name:/Открыть вклад/}).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('alert').filter({hasText:'Покупка выполнена'})).toBeVisible();
    await expect(page.getByText('Пока нет вкладов и облигаций.',{exact:true})).toBeHidden();
    await expect(page.getByRole('button',{name:'Открыть вклад',exact:true})).toBeHidden();
    await page.getByRole('button',{name:'Обновить данные',exact:true}).click();
    await expect(page.getByRole('tab',{name:'Детали',exact:true})).toHaveAttribute('aria-selected','true');
    await expect(page.getByRole('tab',{name:'Детали',exact:true})).toBeFocused();
    expect(posts).toBe(1);
    const positions=await (await request.get(`${E2E_API}/api/invest/positions`,{headers})).json();expect(positions).toHaveLength(1);
  });
});
