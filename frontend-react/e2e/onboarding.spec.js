import {
  dismissRitual,
  expect,
  gameMain,
  guidanceStrip,
  playTurnOne,
  readCash,
  startNewGameFromMenu,
  test,
} from './fixtures.js';

test.describe('Регистрация и первый ход', () => {
  test('регистрация через форму ведёт в меню без сохранений', async ({ page }) => {
    const id = `${Date.now().toString(36)}${Math.random().toString(16).slice(2, 6)}`;
    const password = `E2e-${id}-pass`;
    await page.goto('/#/login');
    await page.getByRole('button', { name: /Создать аккаунт/ }).click();
    await page.getByLabel('Почта').fill(`e2e_form_${id}@example.com`);
    await page.getByLabel(/^Пароль/).fill(password);
    await page.getByLabel('Повтори пароль').fill(password);
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();
    await expect(page.getByText('Сохранений пока нет')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Новая игра' })).toBeVisible();
  });

  test('ход 1 по онбордингу: зарплата, подушка, итоги без стартового капитала', async ({ page, player }) => {
    await startNewGameFromMenu(page);
    const startCash = await playTurnOne(page);
    expect(startCash).toBeGreaterThan(0);

    const ritual = page.locator('.mqx-juice-ritual');
    await expect(ritual).toContainText('Ход №1 завершён');
    // Регресс 2026-10-26: стартовый баланс считался доходом хода («+21 000 ₽ за ход» при реальных +6 000).
    const ritualText = await ritual.innerText();
    const balance = Number(ritualText.match(/На счёте\s*([\d\s\u00a0\u202f]+)₽/)[1].replace(/[^\d]/g, ''));
    const delta = Number(ritualText.match(/([+−-][\d\s\u00a0\u202f]+)₽ за ход/)[1].replace(/[^\d]/g, ''));
    expect(delta).toBe(balance - startCash);

    await dismissRitual(page);
    await expect(gameMain(page)).toContainText('Ход 2');
    expect(await readCash(page)).toBe(balance);
    await expect(guidanceStrip(page)).toContainText('Новый ход');
  });

  test('перезагрузка во время партии возвращает в игру, а не в меню', async ({ page, player }) => {
    await startNewGameFromMenu(page);
    // Регресс 2026-10-26: после F5 / обновления PWA игрок оказывался в «Меню».
    await page.reload();
    await expect(page.getByRole('button', { name: 'Завершить ход и перейти к следующему' })).toBeVisible();
    // Регресс 2026-10-26: вложенные <main> — ориентир должен быть один.
    await expect(page.getByRole('main')).toHaveCount(1);
  });
});
