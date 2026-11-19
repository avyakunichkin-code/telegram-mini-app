import { test, expect, startNewGameFromMenu, playTurnOne, playTurnTwo, dismissRitual } from './fixtures.js';

test('game analytics updates the forecast horizon from game balances', async ({ page, player }) => {
  await startNewGameFromMenu(page);
  await playTurnOne(page);
  await dismissRitual(page);
  await playTurnTwo(page);
  await page.getByRole('button', { name: 'Закрыть подсказку' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Закрыть' }).first().click();
  await page.getByRole('tab', { name: 'Аналитика', exact: true }).click();
  const analytics = page.getByRole('main');
  await expect(analytics.getByRole('heading', { name: 'Аналитика' })).toBeVisible();
  await expect(analytics.getByRole('img', { name: /Счёт и подушка/ })).toBeVisible();
  await expect(analytics.getByText('Через 3 хода')).toBeVisible();

  const horizon = analytics.getByRole('button', { name: '12 ходов' });
  await horizon.click();
  await expect(horizon).toHaveAttribute('aria-pressed', 'true');
  await expect(analytics.getByText('Через 12 ходов')).toBeVisible();
  const turn = Number((await analytics.locator('.mqx-capital-pocket__turn').innerText()).match(/\d+/)[0]);
  await expect(analytics.getByRole('img', { name: new RegExp("Прогноз, ход " + (turn + 12) + ":") })).toBeVisible();
  await expect(analytics.getByLabel('Сценарий Design Lab')).toHaveCount(0);
});
