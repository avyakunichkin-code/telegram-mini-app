import { dismissRitual, expect, playTurnOne, pressGotIt, startNewGameFromMenu, test } from './fixtures.js';

/**
 * Desktop keyboard navigation covers both columns of the approved wide layout.
 * Salary accepts Enter and Finish turn remains reachable in the same Tab cycle.
 */
test.describe('Клавиатура (PWA / веб)', () => {
  test.beforeEach(async ({ page, player }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'клавиатурный путь — десктоп');
    await startNewGameFromMenu(page);
    await playTurnOne(page);
    await dismissRitual(page);
    await pressGotIt(page);
  });

  test('Tab доходит до завершения хода и зарплаты, зарплата берётся по Enter', async ({ page }) => {
    const salary = page.getByRole('button', { name: 'Зарплата, получить' });
    const seen = [];
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
      seen.push(label);
      if (seen.includes('Завершить ход и перейти к следующему') && label === 'Зарплата, получить') break;
    }
    const closeAt = seen.indexOf('Завершить ход и перейти к следующему');
    expect(closeAt, `Tab не дошёл до «Завершить ход»: ${seen.join(' → ')}`).toBeGreaterThanOrEqual(0);
    await expect(salary).toBeFocused();
    // Фокус виден: рамка или тень, не только цвет.
    const ring = await salary.evaluate((el) => {
      const cs = getComputedStyle(el);
      return (cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px') || cs.boxShadow !== 'none';
    });
    expect(ring, 'у кнопки в фокусе нет видимой рамки').toBe(true);

    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Зарплата, уже получена' })).toBeVisible();
  });
});
