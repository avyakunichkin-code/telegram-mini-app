import { dismissRitual, expect, playTurnOne, pressGotIt, startNewGameFromMenu, test } from './fixtures.js';

/**
 * PR-32 (UX-аудит U20): на десктопе ход проходится с клавиатуры. Порядок Tab = видимый порядок
 * ★ BG-1: «Завершить ход» в карте хода → потребности → деньги → цель → действия хода.
 */
test.describe('Клавиатура (PWA / веб)', () => {
  test.beforeEach(async ({ page, player }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'клавиатурный путь — десктоп');
    await startNewGameFromMenu(page);
    await playTurnOne(page);
    await dismissRitual(page);
    await pressGotIt(page);
  });

  test('Tab доходит до «Завершить ход» раньше действий, зарплата берётся по Enter', async ({ page }) => {
    const salary = page.getByRole('button', { name: 'Зарплата, получить' });
    const seen = [];
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
      seen.push(label);
      if (label === 'Зарплата, получить') break;
    }
    const closeAt = seen.indexOf('Завершить ход и перейти к следующему');
    expect(closeAt, `Tab не дошёл до «Завершить ход»: ${seen.join(' → ')}`).toBeGreaterThanOrEqual(0);
    expect(closeAt, 'порядок Tab расходится с экраном').toBeLessThan(seen.indexOf('Зарплата, получить'));
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
