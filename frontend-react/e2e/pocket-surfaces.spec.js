import { test, expect, startNewGameFromMenu, playTurnOne, dismissRitual } from './fixtures.js';

test('Игровой пульт: Капитал, Аналитика и Меню сохраняют функции в новом стиле', async ({ page, player }, testInfo) => {
  await startNewGameFromMenu(page);
  await playTurnOne(page);
  await dismissRitual(page);
  // The curriculum intentionally locks tabs: dismiss it through its native control.
  for (let i = 0; i < 2; i++) {
    const close = page.locator('.mqx-guidance-strip').getByRole('button', { name: /Закрыть|Скрыть|Пропустить/ }).first();
    if (await close.isVisible().catch(() => false)) await close.click();
  }
  for (const [label, title] of [['Капитал','Капитал'],['Аналитика','Аналитика'],['Меню','Меню']]) {
    const tab = page.getByRole('tab', { name: label, exact: true });
    await expect(tab).toBeEnabled(); await tab.click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    if (label === 'Капитал') await expect(page.locator('.mqx-state-skeleton')).toHaveCount(0);
    if (label === 'Аналитика') await expect(page.getByText('Загружаем историю…')).toHaveCount(0);
    await expect(page.getByRole('main')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`${label}.png`), fullPage: true });
  }
});
