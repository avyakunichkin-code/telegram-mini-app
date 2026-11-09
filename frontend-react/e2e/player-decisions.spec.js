import { E2E_API, expect, startNewGameFromMenu, test } from './fixtures.js';

async function prepare({page, request, player}) {
  await startNewGameFromMenu(page);
  const headers={Authorization:`Bearer ${player.token}`};
  const skipped=await request.patch(`${E2E_API}/api/game/guidance`,{headers,data:{action:'skip_all'}});
  expect(skipped.ok()).toBeTruthy();
  await page.reload();
  await page.getByRole('button',{name:'Зарплата, получить'}).click();
  return headers;
}

test('цель A открывает перевод с резервом расходов, подтверждение делает один реальный перевод',async({page,request,player},testInfo)=>{
  const headers=await prepare({page,request,player});
  const before=(await (await request.get(`${E2E_API}/api/game/bootstrap`,{headers})).json()).overview;
  const target=Number(before.total_monthly_outflow)*2;
  const amount=Math.min(target-Number(before.safety_fund_balance),Number(before.cash_balance)-Number(before.total_monthly_outflow));
  expect(amount).toBeGreaterThan(0);
  await page.route('**/api/game/bootstrap?*',async route=>{
    const response=await route.fetch();const body=await response.json();
    const goal={key:'preview_safety',type:'safety_fund_months',title:'Запас на 2 хода',enabled:true,available:true,met:false,progress:Number(body.overview.safety_fund_balance)/target,detail:{current:Number(body.overview.safety_fund_balance),target}};
    body.overview.victory={...body.overview.victory,current_goal_key:goal.key,goals:[goal],win_reached:false};
    await route.fulfill({response,json:body});
  });
  let posts=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/contribute-to-safety-fund'))posts++;});
  await page.reload();
  // Компактная цель А (канон 06.11): действие на карточке, подробности — в раскрытии.
  const card=page.getByRole('region',{name:'Запас на 2 хода',exact:true});await expect(card).toBeVisible();
  await card.screenshot({path:testInfo.outputPath('goal-approved.png')});
  await expect(page.getByTestId('goal-next-step')).toBeHidden();
  await card.getByText('Все шаги и подробности').click();
  await expect(page.getByTestId('goal-next-step')).toBeVisible();
  await card.getByRole('button',{name:'Пополнить подушку'}).click();
  const dialog=page.getByRole('dialog',{name:'В подушку',exact:true});
  await expect(dialog).toBeVisible();expect(posts).toBe(0);
  const input=dialog.getByRole('textbox',{name:'Сумма',exact:true});
  expect(Number((await input.inputValue()).replace(/\s/g,''))).toBe(amount);
  await dialog.getByRole('button',{name:'Положить в подушку',exact:true}).click();
  await expect(dialog).toBeHidden();expect(posts).toBe(1);
  const after=(await (await request.get(`${E2E_API}/api/game/bootstrap`,{headers})).json()).overview;
  expect(Number(before.cash_balance)-Number(after.cash_balance)).toBe(amount);
});

test('потребности A: прогноз бездействия, окно помощи и cooldown',async({page,request,player},testInfo)=>{
  await prepare({page,request,player});let locked=false;
  await page.route('**/api/game/bootstrap?*',async route=>{
    const response=await route.fetch();const body=await response.json();
    body.overview.needs={comfort:60,status:6,social:55,health:65};
    body.overview.needs_meta={...body.overview.needs_meta,model:'set_point',periods_to_zero_if_idle:{status:1}};
    body.overview.treat_self={...body.overview.treat_self,available:!locked,cooldown_periods_remaining:locked?3:0};
    await route.fulfill({response,json:body});
  });
  // Recovery свёрнут под «как восстановить» (канон 06.11).
  const expand=()=>page.getByText('как восстановить').click();
  await page.reload();const card=page.getByTestId('needs-recovery');
  await expect(card).toBeHidden();await expand();
  await expect(card).toContainText('Если ничего не менять');await expect(card).toContainText('1 ход до нуля');
  await card.getByRole('button',{name:'Порадовать себя',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Порадовать себя',exact:true});await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Закрыть',exact:true}).click();
  locked=true;await page.reload();await expand();await expect(card.getByRole('button',{name:'Порадовать себя',exact:true})).toBeDisabled();await expect(card).toContainText('через 3 хода');
  for(const width of [360,390,1440]){
    await page.setViewportSize({width,height:900});
    expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBeTruthy();
  }
  await page.screenshot({path:testInfo.outputPath('needs-approved.png')});
});

test('последствия B: альтернативы не складываются, выбор остаётся одной кнопкой',async({page},testInfo)=>{
  await page.goto('/#/dev/mqx');
  const demo=page.getByTestId('player-decisions-demo');await expect(demo).toBeVisible();
  const choice=demo.getByRole('button',{name:'Поехать сейчас по кредитке',exact:true});
  await expect(choice).toContainText('Со счёта сейчас');await expect(choice).toContainText('Ход 11');await expect(choice).toContainText('Ход 14');await expect(choice).toContainText('альтернативны');
  await expect(choice).toHaveAccessibleDescription(/Ход 11/);
  await choice.screenshot({path:testInfo.outputPath('events-approved.png')});
  await choice.click();await expect(demo.locator('p[role="status"]')).toContainText('Решение принято');
});
