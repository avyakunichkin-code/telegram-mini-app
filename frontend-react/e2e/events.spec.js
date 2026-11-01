import {
  expect,
  guidanceStrip,
  playTurnOne,
  playTurnTwo,
  dismissRitual,
  startNewGameFromMenu,
  test,
} from './fixtures.js';

/** Что лежит в центре элемента: 'self' или класс перекрывающего слоя (для сообщения об ошибке). */
async function topmostAt(locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return el.contains(hit) ? 'self' : `${hit?.tagName ?? 'none'}.${hit?.className ?? ''}`;
  });
}

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

test.describe('Карусель событий и нижняя навигация (α-FB-19, PR-20)', () => {
  test.beforeEach(async ({ page, player }) => {
    await startNewGameFromMenu(page);
    await playTurnOne(page);
    await dismissRitual(page);
    await playTurnTwo(page);
  });

  test('открытая карусель закрывает навигацию, после закрытия навигация не перекрыта', async ({ page }) => {
    await page.getByRole('button', { name: /ждут решения/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(/Событие 1 из \d/);

    const capitalTab = page.getByRole('tab', { name: 'Капитал' });
    // Таб может быть скрыт под оверлеем (нет в дереве) или перекрыт им — но не нажимаем сквозь карточку.
    if (await capitalTab.isVisible()) {
      expect(await isTopmost(capitalTab), 'вкладка «Капитал» кликается сквозь карточку события').toBe(false);
    }

    await dialog.getByRole('button', { name: 'Закрыть' }).first().click();
    await expect(dialog).toBeHidden();
    await expect(capitalTab).toBeVisible();
    // Переход не проверяем: на шаге вводной событий онбординг держит вкладки закрытыми.
    // Ждём, пока уйдут исчезающие слои (фон карусели, тосты, «+N ₽»): в CI проверка шла раньше них.
    await expect
      .poll(() => topmostAt(capitalTab), { message: 'после закрытия карусели вкладку перекрывает слой' })
      .toBe('self');
  });
});
