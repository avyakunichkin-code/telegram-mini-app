import { E2E_API, expect, startNewGameFromMenu, test } from './fixtures.js';

test('Финал: поражение, отзыв и новая партия', async ({ page, request, player }) => {
  await startNewGameFromMenu(page);
  const headers = { Authorization: `Bearer ${player.token}` };

  // Реальный API закрывает три убыточных хода; финал и перезапуск проверяются в UI.
  for (let turn = 0; turn < 3; turn += 1) {
    const response = await request.post(`${E2E_API}/api/game/time/next`, { headers });
    expect(response.ok(), await response.text()).toBeTruthy();
    expect((await response.json()).game_over).toBe(turn === 2);
  }

  await page.reload();
  const finale = page.getByRole('dialog', { name: 'Партия окончена' });
  await expect(finale).toBeVisible();
  // Регресс 2026-11-03: обучение перекрывало отзыв на экране поражения.
  await expect(page.getByRole('region', { name: 'Обучение', exact: true })).toBeHidden();
  await expect(finale.getByRole('list', { name: 'Советы на следующую партию' })).toBeVisible();
  await finale.getByRole('textbox', { name: 'Отзыв о партии (необязательно)' }).fill('Понятно, почему закончилась партия');
  await finale.getByRole('button', { name: 'Отправить отзыв', exact: true }).click();
  await expect(finale.getByRole('button', { name: 'Отзыв отправлен', exact: true })).toBeDisabled();

  await finale.getByRole('button', { name: 'Новая игра', exact: true }).click();
  await expect(finale).toBeHidden();
  await page.getByRole('button', { name: 'Начать за Студента', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Завершить ход и перейти к следующему' })).toBeVisible();
});
