import {
  expect,
  guidanceStrip,
  playTurnOne,
  playTurnTwo,
  dismissRitual,
  startNewGameFromMenu,
  test,
} from './fixtures.js';

/** Центр кнопки не перекрыт другим слоем (подсказка, таббар, тост). */
async function isTopmost(locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return el.contains(hit);
  });
}

test.describe('События хода 3 (вводная Монетки)', () => {
  test.beforeEach(async ({ page, player }) => {
    await startNewGameFromMenu(page);
    await playTurnOne(page);
    await dismissRitual(page);
    await playTurnTwo(page);
    await expect(guidanceStrip(page)).toContainText('Жизнь подкидывает задачи');
  });

  test('«N события» открывает карусель, варианты видны и выбираются', async ({ page }) => {
    // Регресс 2026-10-26: на шаге t_events_intro карусель закрывалась сразу после открытия.
    await page.getByRole('button', { name: /ждут решения/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(/Событие 1 из \d/);
    await page.waitForTimeout(500);
    await expect(dialog).toBeVisible();

    // Регресс 2026-10-26: подсказка (z 545) лежала поверх вариантов ответа.
    const choices = dialog.locator('button').filter({ hasText: /₽|Комфорт|Статус|Связи|Здоровье/ });
    const count = await choices.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      expect(await isTopmost(choices.nth(i)), `вариант ${i + 1} перекрыт`).toBe(true);
    }

    await choices.first().click();
    // Тост повторяет чипы карточки: целые числа, без «+3.6».
    const toast = page.getByText(/^Потребности/);
    await expect(toast).toBeVisible();
    await expect(toast).not.toHaveText(/\d[.,]\d/);
  });
});
