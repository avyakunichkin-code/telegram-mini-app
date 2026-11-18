import { test, expect, startNewGameFromMenu, playTurnOne, playTurnTwo, dismissRitual, readCash } from './fixtures.js';

test('wide web keeps one live game across tabs and viewport changes', async ({ page, player }) => {
  test.setTimeout(100000);
  await page.setViewportSize({width:390,height:850});
  await startNewGameFromMenu(page);
  await playTurnOne(page);
  await dismissRitual(page);
  await playTurnTwo(page);
  await page.getByRole('button', {name:'Закрыть подсказку'}).click();
  await page.getByRole('dialog').getByRole('button', {name:'Закрыть'}).first().click();
  const before = await readCash(page);
  await page.setViewportSize({width:1586,height:992});
  const finish = page.locator('.mqx-wide__close');
  await expect(finish).toBeVisible();
  await expect(page.locator('.mqx-wide__operation').first()).toBeVisible();
  await expect(page.locator('.mqx-wide__work').locator(':scope > *')).toHaveCount(4);
  await expect(page.locator('.mqx-wide__work > :nth-child(2)')).toHaveClass(/mqx-wide__finances/);
  if (process.env.WIDE_WEB_SCREENSHOT) {
    await expect(page.locator('.mqx-juice-toast--visible')).toBeHidden();
    await page.evaluate(() => document.fonts.ready.then(() => null));
    await page.screenshot({path:process.env.WIDE_WEB_SCREENSHOT,fullPage:true,animations:'disabled'});
  }
  const history = page.getByRole('button', {name:'Вся история →'});
  await history.click();
  await expect(page.getByRole('button', {name:'Свернуть историю'})).toHaveAttribute('aria-expanded','true');
  await page.getByRole('button', {name:'Свернуть историю'}).click();
  for (const name of ['Капитал','Аналитика','Меню','Главная']) {
    await page.getByRole('tab',{name,exact:true}).click();
    await expect(page.getByRole('tab',{name,exact:true})).toHaveAttribute('aria-selected','true');
  }
  expect(await readCash(page)).toBe(before);
  await page.getByRole('button',{name:'Зарплата, получить'}).click();
  await expect(page.getByRole('button',{name:'Зарплата, уже получена'})).toBeDisabled();
  expect(await readCash(page)).toBeGreaterThan(before);
  await finish.getByRole('button').click();
  await expect(page.locator('.mqx-juice-ritual')).toBeVisible();
  await dismissRitual(page);
  await page.setViewportSize({width:390,height:850});
  await expect(page.locator('.mqx-wide__header')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Подсказка Монетки'})).toBeVisible();
});

