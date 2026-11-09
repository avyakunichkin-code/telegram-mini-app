import { test, expect } from '@playwright/test';

test('гость: первый ход, привязка почты и возврат без потери партии', async ({ page }, testInfo) => {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Твои решения. Твой финансовый опыт.' })).toBeVisible();
  await expect(page.locator('.mqx-guest-welcome h1')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.screenshot({ path: testInfo.outputPath('guest-welcome.png'), fullPage: true });
  const guestResponse = page.waitForResponse(r => r.url().endsWith('/api/auth/guest') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Начать играть' }).click();
  const guest = await (await guestResponse).json();
  const auth = { Authorization: `Bearer ${guest.access_token}` };
  await expect(page.getByRole('button', { name: 'Зарплата, получить', exact: true })).toBeVisible();
  await expect(page.locator('.mqx-guidance-strip')).toHaveCount(0);
  await page.getByRole('button', { name: 'Зарплата, получить', exact: true }).click();
  await expect(page.locator('.mqx-guidance-strip')).toHaveCount(0);
  const profiles = await (await page.request.get('/api/game/profiles', { headers: auth })).json();
  expect(profiles).toHaveLength(1);
  await page.getByRole('button', { name: /ждут решения/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const choice = dialog.locator('button').filter({ hasText: /₽|Комфорт|Статус|Связи|Здоровье/ }).first();
  await choice.click();
  // Remaining optional/mandatory events follow the same server API, no synthetic outcome.
  const pending = await (await page.request.get('/api/game/events/pending', { headers: auth })).json();
  for (const event of pending.events || []) {
    let applied = false;
    for (const option of event.choices || []) {
      const r = await page.request.post(`/api/game/events/${event.id}/choose`, { headers: auth, data: { choice_id: option.id } });
      if (r.ok()) { applied = true; break; }
    }
    expect(applied).toBe(true);
  }
  await page.evaluate(() => localStorage.setItem('tg_miniapp_token', 'expired-test-token'));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Завершить ход и перейти к следующему' })).toBeVisible();
  await page.getByRole('button', { name: 'Завершить ход и перейти к следующему' }).click();
  const ritual = page.locator('.mqx-juice-ritual');
  await expect(ritual).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('guest-first-result.png'), fullPage: true });
  await ritual.getByRole('button', { name: /Дальше/ }).click();
  // A turn-two event may open automatically; dismiss it to inspect the nonmodal offer.
  const events = page.getByRole('dialog');
  if (await events.isVisible()) await events.getByRole('button', { name: 'Закрыть', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Сохраним твою историю?' })).toBeVisible();
  await page.getByRole('button', { name: 'Создать аккаунт', exact: true }).click();
  const email = `guest-${Date.now()}-${testInfo.project.name}@example.com`;
  await page.getByLabel('Почта', { exact: true }).fill(email);
  await page.locator('#register-password').fill('GuestPassword123');
  await page.locator('#register-password-confirm').fill('GuestPassword123');
  const claimResponse = page.waitForResponse(r => r.url().endsWith('/api/auth/guest/claim'));
  await page.getByRole('button', { name: 'Создать аккаунт', exact: true }).click();
  const claimed = await (await claimResponse).json();
  expect(claimed.user_id).toBe(guest.user_id);
  expect(claimed.is_guest).toBe(false);
  const after = await (await page.request.get('/api/game/profiles', { headers: { Authorization: `Bearer ${claimed.access_token}` } })).json();
  expect(after.map(p => p.id)).toEqual(profiles.map(p => p.id));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Завершить ход и перейти к следующему' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('guest-claimed-resumed.png'), fullPage: true });
});

test('две вкладки начинают одну гостевую историю', async ({ page, context }) => {
  const other = await context.newPage();
  await Promise.all([page.goto('/#/'), other.goto('/#/')]);
  await Promise.all([
    page.getByRole('button', { name: 'Начать играть' }).click(),
    other.getByRole('button', { name: 'Начать играть' }).click(),
  ]);
  for (const tab of [page, other]) {
    await expect(tab.getByRole('button', { name: 'Зарплата, получить', exact: true })).toBeVisible();
  }
  const readIdentity = tab => tab.evaluate(async () => {
    const { API } = await import('/src/api.js');
    const user = await API.getMe();
    const profiles = await API.getGameProfiles();
    return { id: user.id, profiles: profiles.map(p => p.id) };
  });
  expect(await readIdentity(page)).toEqual(await readIdentity(other));
  await other.close();
});

test('ошибка сети оставляет доступный повтор старта', async ({ page }) => {
  await page.goto('/#/');
  await page.route('**/api/auth/guest', route => route.abort());
  await page.getByRole('button', { name: 'Начать играть' }).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось подключиться');
  await expect(page.getByRole('button', { name: 'Попробовать ещё раз' })).toBeEnabled();
});
