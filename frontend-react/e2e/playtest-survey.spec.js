import { E2E_API, expect, startNewGameFromMenu, test } from './fixtures.js';
import { SURVEY_STEPS } from '../src/utils/playtestSurvey.js';

async function prepare({page,request,player}) {
  await startNewGameFromMenu(page);
  const headers={Authorization:`Bearer ${player.token}`};
  const skipped=await request.patch(`${E2E_API}/api/game/guidance`,{headers,data:{action:'skip_all'}});
  expect(skipped.ok()).toBeTruthy();
  await page.reload();
  await expect(page.locator('.mqx-guidance-strip')).toBeHidden();
  return headers;
}
async function openFromMenu(page) {
  await page.getByRole('tab',{name:'Меню',exact:true}).click();
  await page.getByRole('button',{name:/Поделиться впечатлением/}).click();
  return page.getByRole('dialog');
}
async function answerStep(dialog) {
  for(const field of await dialog.locator('fieldset').all())await field.locator('input').first().check();
}
async function checkStepLayout(page, dialog, testInfo, step) {
  const original=page.viewportSize();
  for(const [width,height] of [[360,640],[390,744],[1440,950]])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
    expect(await dialog.locator('.mqx-sheet__body').evaluate(el=>el.scrollHeight<=el.clientHeight+1),`${step} ${width} ${theme}: no inner scroll`).toBeTruthy();
    expect(await dialog.locator('.mqx-sheet__body').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`${step} ${width} ${theme}: no horizontal overflow`).toBeTruthy();
    const box=await dialog.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y+box.height).toBeLessThanOrEqual(height+1);
    if(width===360&&theme==='light')await page.screenshot({path:testInfo.outputPath(`runtime-${step}-360.png`)});
  }
  await page.setViewportSize(original);
  await page.evaluate(()=>{document.documentElement.dataset.theme='light';});
}
test.describe('Нативный опрос',()=>{
  test.use({allowedConsoleErrors:[/503|Service Unavailable/]});
  test('все шаги, свободный отзыв, возврат, ошибка и подтверждённая отправка',async({page,request,player},testInfo)=>{
    const headers=await prepare({page,request,player});
    const dialog=await openFromMenu(page);
    const text='<b>Свой синтетический отзыв</b>';
    for(let step=0;step<SURVEY_STEPS.length;step++){
      await expect(dialog).toContainText('Шаг '+(step+1)+' из '+SURVEY_STEPS.length);
      if(step===0)await expect(dialog.getByRole('button',{name:'Дальше',exact:true})).toBeDisabled();
      await answerStep(dialog);
      if(SURVEY_STEPS[step].questions.some(q=>q.key==='difficulty'))await dialog.getByLabel('Нормально',{exact:true}).check();
      if(step===SURVEY_STEPS.length-1){
        await dialog.getByLabel(/Расскажи своими словами/).fill(text);
        await dialog.getByRole('button',{name:'Назад',exact:true}).click();
        await expect(dialog.locator('input:checked')).toHaveCount(SURVEY_STEPS[step-1].questions.length);
        await dialog.getByRole('button',{name:'Дальше',exact:true}).click();
        await expect(dialog.getByLabel(/Расскажи своими словами/)).toHaveValue(text);
      }
      await checkStepLayout(page,dialog,testInfo,'step'+(step+1));
      await page.screenshot({path:testInfo.outputPath('survey-step-'+(step+1)+'.png')});
      if(step<SURVEY_STEPS.length-1)await dialog.getByRole('button',{name:'Дальше',exact:true}).click();
    }
    await page.route('**/api/game/playtest-survey',async route=>{
      await route.fulfill({status:503,json:{detail:'Synthetic unavailable'}});
    },{times:1});
    await dialog.getByRole('button',{name:'Отправить ответы',exact:true}).click();
    await expect(dialog.getByRole('alert')).toContainText('Ответы на месте');
    await checkStepLayout(page,dialog,testInfo,'error');
    await expect(dialog.getByLabel(/Расскажи своими словами/)).toHaveValue(text);
    await dialog.getByRole('button',{name:'Отправить ответы',exact:true}).click();
    await expect(dialog).toContainText('Спасибо за ответы!');
    await dialog.getByRole('button',{name:'Вернуться в игру',exact:true}).click();
    await expect(dialog).toBeHidden();
    const b=await request.get(`${E2E_API}/api/game/bootstrap?survey_key=first_turns_v2`,{headers});
    const state=(await b.json()).playtest_survey;
    expect(state.state).toBe('submitted');
    const conflict=await request.post(`${E2E_API}/api/game/playtest-survey`,{headers,data:{profile_id:state.profile_id,survey_key:'first_turns_v2',answers:{salary:'yes',safety:'yes',safety_transfer:'yes',expense_buffer:'yes',close:'yes',close_result:'yes',blocked:false,difficulty:'easy',continue_playing:'yes'},comment:'Changed'}});
    expect(conflict.status()).toBe(409);
    await page.reload();
    await page.getByRole('tab',{name:'Меню',exact:true}).click();
    await expect(page.getByRole('button',{name:/Поделиться впечатлением/})).toContainText('Спасибо, ответ получен');
  });
  test('приглашение можно отложить; reload не возвращает его, меню остаётся',async({page,request,player})=>{
    await prepare({page,request,player});
    // Only eligibility is synthetic here; real counting is covered by backend integration.
    await page.route('**/api/game/bootstrap**',async route=>{
      const response=await route.fetch();const json=await response.json();
      if(json.playtest_survey?.state==='pending')json.playtest_survey={...json.playtest_survey,closed_turns:5,should_offer:true};
      await route.fulfill({response,json});
    });
    await page.reload();
    const dialog=page.getByRole('dialog');
    await expect(dialog).toContainText('Как тебе первые ходы?');
    await dialog.getByRole('button',{name:'Позже',exact:true}).click();
    await expect(dialog).toBeHidden();
    await page.reload();
    await expect(dialog).toBeHidden();
    await openFromMenu(page);
    await expect(dialog).toContainText('Шаг 1 из 3');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button',{name:/Поделиться впечатлением/})).toBeFocused();
  });
  test('foreground resync не открывает новые события поверх опроса',async({page,request,player})=>{
    const headers=await prepare({page,request,player});
    const dialog=await openFromMenu(page);
    for(let turn=0;turn<2;turn++){
      expect((await request.post(`${E2E_API}/api/game/period/claim-salary`,{headers})).ok()).toBeTruthy();
      expect((await request.post(`${E2E_API}/api/game/time/next`,{headers})).ok()).toBeTruthy();
    }
    const result=await request.get(`${E2E_API}/api/game/bootstrap?survey_key=first_turns_v2`,{headers});
    expect((await result.json()).events.events.length).toBeGreaterThan(0);
    await Promise.all([page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/api/game/bootstrap')&&r.request().method()==='GET'),page.evaluate(()=>window.dispatchEvent(new Event('focus')))]);
    await expect(dialog).toContainText('Шаг 1 из 3');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('.mqx-survey')).toBeHidden();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
  test('финал ждёт закрытия опроса; из меню сохранений доступен отзыв',async({page,request,player})=>{
    await prepare({page,request,player});
    const dialog=await openFromMenu(page);
    await page.route('**/api/game/bootstrap**',async route=>{
      const response=await route.fetch();const json=await response.json();
      json.run_finale={outcome:'defeat',template_key:'mq_game_basic_v1',persona_slug:'student',period_index:1,defeat_reason:'needs_depletion',cash_balance:0,cushion_turns:0};
      await route.fulfill({response,json});
    });
    await Promise.all([page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/api/game/bootstrap')),page.evaluate(()=>window.dispatchEvent(new Event('focus')))]);
    await expect(dialog).toContainText('Шаг 1 из 3');await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:/К сохранениям/}).click();
    await page.getByRole('button',{name:/Поделиться впечатлением/}).click();
    await expect(page.getByRole('dialog')).toContainText('Шаг 1 из 3');
  });
  test('Watchtower показывает ответы и свободный отзыв как текст',async({page,player})=>{
    void player;
    const comment='<img src=x onerror=alert(1)> Свой отзыв';
    await page.route('**/api/admin/watchtower**',route=>route.fulfill({json:{users:[],profiles:[],notifications:[],run_feedback:[],metrics_summary:{},onboarding_funnel:{},product_funnel:{}}}));
    await page.route('**/api/admin/playtest-surveys',route=>route.fulfill({json:{responses:[{id:1,survey_key:'first_turns_v1',game_profile_id:42,template_key:'mq_game_basic_v1',closed_turns:5,period_index:6,answers:{salary:'yes',safety:'partly',close:'yes',blocked:false,continue_playing:'yes'},comment:'Legacy feedback',submitted_at:'2026-11-04T12:00:00Z'},{id:2,survey_key:'first_turns_v2',game_profile_id:42,template_key:'mq_game_basic_v1',closed_turns:5,period_index:6,answers:{salary:'yes',safety:'partly',safety_transfer:'yes',expense_buffer:'partly',close:'yes',close_result:'yes',blocked:false,difficulty:'normal',continue_playing:'yes'},comment,submitted_at:'2026-11-05T12:00:00Z'}]}}));
    await page.goto('/#/admin?tab=survey');
    await expect(page.getByRole('heading',{name:'Опрос первых ходов',exact:true})).toBeVisible();
    await expect(page.getByRole('table',{name:/first_turns_v1/}).locator('thead th')).toHaveCount(8);
    await expect(page.getByRole('table',{name:/first_turns_v2/}).locator('thead th')).toHaveCount(12);
    await expect(page.getByRole('table',{name:/first_turns_v2/})).toContainText('Нормально');
    await page.getByRole('table',{name:/first_turns_v2/}).getByText('Прочитать отзыв',{exact:true}).click();
    await expect(page.getByText(comment,{exact:true})).toBeVisible();
    await expect(page.locator('td img')).toHaveCount(0);
  });
});
