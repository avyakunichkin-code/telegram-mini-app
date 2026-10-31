import { test as base, expect } from '@playwright/test';

export const E2E_API = process.env.E2E_API_URL || 'http://localhost:8011';
const TOKEN_KEY = 'tg_miniapp_token';

/** Новый пользователь через API изолированного стенда: тесты не зависят друг от друга. */
async function registerUser(request) {
  const id = `${Date.now().toString(36)}${Math.random().toString(16).slice(2, 8)}`;
  const password = `E2e-${id}-pass`;
  const res = await request.post(`${E2E_API}/api/register`, {
    data: { email: `e2e_${id}@example.com`, username: `e2e_${id}`, password, password_confirm: password },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = await res.json();
  return { token: body.access_token, email: `e2e_${id}@example.com`, password };
}

export const test = base.extend({
  /** Ожидаемые в сценарии ошибки консоли (например, сетевые в офлайн-тесте): `test.use({ allowedConsoleErrors: [/…/] })`. */
  allowedConsoleErrors: [[], { option: true }],

  /** Ошибки консоли и непойманные исключения страницы — тест падает в конце, если они были. */
  consoleErrors: [
    async ({ page, allowedConsoleErrors }, use) => {
      const errors = [];
      const allowed = (text) => allowedConsoleErrors.some((re) => re.test(text));
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !allowed(msg.text())) errors.push(msg.text());
      });
      page.on('pageerror', (err) => errors.push(String(err)));
      await use(errors);
      expect(errors, 'ошибки в консоли браузера').toEqual([]);
    },
    { auto: true },
  ],

  /** Залогиненный игрок без сохранений: токен кладётся до загрузки приложения. */
  player: async ({ page, request }, use) => {
    const user = await registerUser(request);
    await page.addInitScript(
      ([key, token]) => {
        if (!window.sessionStorage.getItem('e2e-token-set')) {
          window.localStorage.setItem(key, token);
          window.sessionStorage.setItem('e2e-token-set', '1');
        }
      },
      [TOKEN_KEY, user.token],
    );
    await use(user);
  },
});

export { expect };

/** Полоска Монетки (онбординг). */
export const guidanceStrip = (page) => page.locator('.mqx-guidance-strip');

export async function startNewGameFromMenu(page) {
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Новая игра' }).click();
  await expect(page.getByRole('button', { name: 'Завершить ход и перейти к следующему' })).toBeVisible();
}

/** Контент вкладки игры — единственный ориентир main (скролл вкладки *Premium). */
export const gameMain = (page) => page.getByRole('main');

/** Текущая сумма «На счёте» на главной, в рублях. */
export async function readCash(page) {
  const text = await gameMain(page).innerText();
  const m = text.match(/На счёте\s*([\d\s\u00a0\u202f]+)₽/);
  return m ? Number(m[1].replace(/[^\d]/g, '')) : NaN;
}

/** «Понятно» и дождаться, пока подсказка сменит шаг (клик во время перехода не засчитывается). */
export async function pressGotIt(page) {
  const strip = guidanceStrip(page);
  const before = await strip.innerText();
  await strip.getByRole('button', { name: 'Понятно' }).click();
  await expect(async () => {
    const visible = await strip.isVisible();
    expect(visible ? await strip.innerText() : '').not.toBe(before);
  }).toPass();
}

/**
 * Ход 1 по онбордингу: два «Понятно» → зарплата → взнос в подушку → «Завершить ход».
 * Возвращает сумму на счёте до первого действия.
 */
export async function playTurnOne(page) {
  const strip = guidanceStrip(page);
  await expect(strip).toContainText('1 из 5');
  const startCash = await readCash(page);
  await pressGotIt(page);
  await expect(strip).toContainText('2 из 5');
  await pressGotIt(page);
  await expect(strip).toContainText('3 из 5');

  await page.getByRole('button', { name: 'Зарплата, получить' }).click();
  await expect(strip).toContainText('4 из 5');

  await page.getByRole('button', { name: 'Положить в подушку' }).first().click();
  await page.getByRole('button', { name: 'Положить в подушку' }).last().click();
  await expect(strip).toContainText('5 из 5');

  await page.getByRole('button', { name: 'Завершить ход и перейти к следующему' }).click();
  await expect(page.locator('.mqx-juice-ritual')).toBeVisible();
  return startCash;
}

/** Закрыть итоги хода и подсказку, если она есть. */
export async function dismissRitual(page) {
  const strip = guidanceStrip(page);
  if (await strip.getByRole('button', { name: 'Понятно' }).isVisible().catch(() => false)) {
    await pressGotIt(page);
  }
  await page.locator('.mqx-juice-ritual').getByRole('button', { name: 'Дальше' }).click();
  await expect(page.locator('.mqx-juice-ritual')).toBeHidden();
}

/** Ход 2: «Понятно» → зарплата → «Завершить ход» → итоги закрыты. Дальше — ход 3 с событиями. */
export async function playTurnTwo(page) {
  await pressGotIt(page);
  await page.getByRole('button', { name: 'Зарплата, получить' }).click();
  await page.getByRole('button', { name: 'Завершить ход и перейти к следующему' }).click();
  await expect(page.locator('.mqx-juice-ritual')).toBeVisible();
  await dismissRitual(page);
}
