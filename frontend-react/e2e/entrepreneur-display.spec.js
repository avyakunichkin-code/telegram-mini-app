import { E2E_API, expect, test } from './fixtures.js';

test('Предприниматель: суммы, финиш цели и контраст погашения', async ({ page, request, player }, testInfo) => {
  const start = await request.post(`${E2E_API}/api/game/start`, {
    headers: { Authorization: `Bearer ${player.token}` },
    data: { profile_name: 'Проверка отображения', template_key: 'mq_game_debt_stack_v1' },
  });
  expect(start.ok()).toBeTruthy();
  const guidance = await request.patch(`${E2E_API}/api/game/guidance`, {
    headers: { Authorization: `Bearer ${player.token}` }, data: { action: 'skip_all' },
  });
  expect(guidance.ok()).toBeTruthy();
  await page.goto('/#/');
  const continueButton = page.getByRole('button', { name: 'Продолжить игру', exact: true });
  await expect(continueButton).toBeVisible();
  await continueButton.click();
  await expect(page.getByRole('button', { name: 'Завершить ход и перейти к следующему' })).toBeVisible();

  // Регресс 2026-11-04: многоточие скрывало суммы, а overflow дорожки обрезал финиш.
  for (const width of [320, 360, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    for (const value of await page.locator('.mqx-bg-money__value').all()) {
      expect(await value.evaluate(el => el.scrollWidth <= el.clientWidth), `сумма при ${width}px`).toBe(true);
    }
    const finishFits = await page.locator('.mqx-pocket-route__finish').evaluate(el => {
      const finish = el.getBoundingClientRect();
      const track = el.closest('.mqx-pocket-route').getBoundingClientRect();
      return finish.left >= track.left && finish.right <= track.right;
    });
    expect(finishFits, `финиш при ${width}px`).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await testInfo.attach(`dashboard-${width}`, { body: await page.screenshot(), contentType: 'image/png' });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('tab', { name: 'Капитал', exact: true }).click();
  await page.getByRole('button', { name: 'Погасить часть: Ипотека', exact: true }).click();
  const form = page.locator('.mqx-liab-prepay-form');
  await expect(form).toBeVisible();
  // Считаем реальный контраст с учётом alpha поверх фона sheet.
  for (const selector of ['.mqx-liab-prepay-form__hint', '.mqx-liab-prepay-form__debt']) {
    const ratio = await page.locator(selector).evaluate(el => {
      const parse = color => color.match(/[\d.]+/g).map(Number);
      const fg = parse(getComputedStyle(el).color);
      const bg = parse(getComputedStyle(el.closest('[role=dialog]')).backgroundColor);
      const alpha = fg[3] ?? 1;
      const blended = fg.slice(0, 3).map((v, i) => v * alpha + bg[i] * (1 - alpha));
      const luminance = rgb => rgb.slice(0, 3).map(v => {
        const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
      const l1 = luminance(blended), l2 = luminance(bg);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    });
    expect(ratio, selector).toBeGreaterThanOrEqual(4.5);
  }
  await testInfo.attach('prepay', { body: await page.screenshot(), contentType: 'image/png' });
});
