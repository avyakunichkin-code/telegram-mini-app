import { dismissRitual, expect, gameMain, playTurnOne, pressGotIt, startNewGameFromMenu, test } from './fixtures.js';

test.describe('Капитал', () => {
  test('покупка облигаций: доход за ход растёт, позиция подписана по-русски', async ({ page, player }) => {
    await startNewGameFromMenu(page);
    await playTurnOne(page);
    await dismissRitual(page);
    // Вложения открываются после шага цели «Подушка» — с хода 2.
    await pressGotIt(page);
    await page.getByRole('button', { name: 'Зарплата, получить' }).click();

    await page.getByRole('button', { name: 'Вложить' }).click();
    await expect(page.getByRole('heading', { name: 'Капитал' })).toBeVisible();
    await page.getByText('Облигации', { exact: true }).click();
    const amount = page.getByRole('textbox', { name: 'Сумма' });
    await amount.fill('10000');
    // Регресс 2026-10-26: поле показывало «10000» без разрядов.
    await expect(amount).toHaveValue(/^10\s000$/);
    await page.getByRole('button', { name: 'Купить облигации' }).click();
    await expect(page.getByText('Облигации добавлены')).toBeVisible();

    await page.getByRole('tab', { name: 'Детали' }).click();
    const main = gameMain(page);
    await expect(main).toContainText('Облигации');
    // Регресс 2026-10-26: в названии позиции было «Облигации (easy)».
    await expect(main).not.toContainText('easy');
    await expect(main).toContainText(/\+133\s₽\sза ход/);
  });
});
