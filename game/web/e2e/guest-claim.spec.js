import { E2E_API, expect, test } from './fixtures.js';

test.use({ allowedConsoleErrors: [/409 \(Conflict\)/] });

test('привязка почты сохраняет гостевую партию после повторного входа', async ({ page, request }) => {
  const id = crypto.randomUUID();
  const occupiedEmail = `occupied-${id}@example.com`;
  const email = `guest-${id}@example.com`;
  const password = `E2e-${id}`;
  const existing = await request.post(`${E2E_API}/api/register`, {
    data: { email: occupiedEmail, password, password_confirm: password },
  });
  expect(existing.ok()).toBeTruthy();

  await page.goto('/#/');
  const guestSession = page.waitForResponse((response) => response.url().endsWith('/api/auth/guest'));
  const guestStart = page.waitForResponse((response) => response.url().endsWith('/api/game/guest-start'));
  await page.getByRole('button', { name: 'Играть без аккаунта' }).click();
  const guest = await (await guestSession).json();
  const party = await (await guestStart).json();
  await page.getByRole('button', { name: 'Начать первый ход' }).click();
  await expect(page.getByRole('button', { name: 'Завершить ход и перейти к следующему' })).toBeVisible();

  const checkParty = async (token) => {
    const profiles = await request.get(`${E2E_API}/api/game/profiles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(profiles.ok()).toBeTruthy();
    expect((await profiles.json()).map((profile) => profile.id)).toEqual([party.profile_id]);
  };

  await page.goto('/#/register');
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  await page.getByLabel('Повтори пароль').fill(password);

  const submitClaim = async (address) => {
    await page.getByLabel('Почта').fill(address);
    const claim = page.waitForResponse((response) => response.url().endsWith('/api/auth/guest/claim'));
    await page.getByRole('button', { name: 'Создать аккаунт', exact: true }).click();
    return claim;
  };

  expect((await submitClaim(occupiedEmail)).status()).toBe(409);
  await expect(page.getByRole('alert')).toContainText('зарегистрирована');
  await checkParty(guest.access_token);

  const claimed = await submitClaim(email);
  expect(claimed.ok()).toBeTruthy();
  expect(await claimed.json()).toMatchObject({ user_id: guest.user_id, is_guest: false });

  await page.waitForURL((url) => url.hash === '#/');
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.removeItem('tg_miniapp_token');
    sessionStorage.clear();
  });
  await page.goto('/#/login');
  await page.reload();
  await page.getByLabel('Почта').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  const login = page.waitForResponse((response) => response.url().endsWith('/api/login'));
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  const loggedIn = await login;
  expect(loggedIn.ok()).toBeTruthy();
  const account = await loggedIn.json();
  expect(account.user_id).toBe(guest.user_id);
  await checkParty(account.access_token);
  await page.getByRole('button', { name: 'Продолжить игру' }).click();
  await expect(page.getByRole('button', { name: 'Завершить ход и перейти к следующему' })).toBeVisible();
});
