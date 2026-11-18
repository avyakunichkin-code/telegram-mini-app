import { expect, pressGotIt, startNewGameFromMenu, test } from './fixtures.js';

test.describe('Офлайн', () => {
  // Браузер сам пишет в консоль об оборванных запросах — это ожидаемо в этом сценарии.
  test.use({ allowedConsoleErrors: [/ERR_INTERNET_DISCONNECTED|net::ERR_FAILED|Failed to load resource/] });

  test('без сети «Завершить ход» неактивна, после возврата — снова доступна', async ({ page, context, player }) => {
    await startNewGameFromMenu(page);
    const closeTurn = page.getByRole('button', { name: 'Завершить ход и перейти к следующему' });
    await expect(closeTurn).toBeEnabled();

    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText(/^Нет сети\. Прогресс сохранён на сервере/)).toBeVisible();
    await expect(closeTurn).toBeDisabled();

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(page.getByText('Связь вернулась')).toBeVisible();
    await expect(closeTurn).toBeEnabled();
  });

  test('сетевой сбой запроса даёт понятный текст, а не «Failed to fetch»', async ({ page, player }) => {
    await startNewGameFromMenu(page);
    // На шагах 1–2 онбординга кнопки действий ещё неактивны («ещё рано»).
    await pressGotIt(page);
    await pressGotIt(page);
    await page.route('**/api/game/period/claim-salary', (route) => route.abort('internetdisconnected'));
    await page.getByRole('button', { name: 'Зарплата, получить' }).click();
    await expect(page.getByText(/^Нет сети\./).first()).toBeVisible();
    await expect(page.getByText(/Failed to fetch/)).toHaveCount(0);
  });
});
