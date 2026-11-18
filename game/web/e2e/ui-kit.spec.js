import { test, expect } from '@playwright/test';

test('Game ButtonBase: native keyboard, ref, submit and busy lock', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/e2e/ui-kit.html');
  const action = page.getByRole('button', { name: 'Действие', exact: true });
  await expect(action).toHaveAttribute('type', 'button');
  await page.getByRole('button', { name: 'Фокус', exact: true }).click();
  await expect(action).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Нажатия')).toHaveText('2');
  await expect(page.getByLabel('Отправки')).toHaveText('0');
  await page.getByRole('button', { name: 'Отправить', exact: true }).click();
  await expect(page.getByLabel('Отправки')).toHaveText('1');
  await page.getByRole('button', { name: 'Загрузка', exact: true }).click();
  await expect(action).toBeDisabled();
  await expect(action).toHaveAttribute('aria-busy', 'true');
  await page.getByRole('button', { name: 'Загрузка', exact: true }).click();
  await expect(action).toBeEnabled();
  await expect(action).not.toHaveAttribute('aria-busy', 'true');
  await page.getByRole('button', { name: 'Фокус', exact: true }).click();
  await expect(action).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Отправить', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Загрузка', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Фокус', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'hero-filled', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Недоступно', exact: true })).not.toBeFocused();
  await expect(page.getByLabel('Нажатия')).toHaveText('2');
  expect(errors).toEqual([]);
});

test('Game adapter keeps all variants and disabled appearance in both themes', async ({ page }) => {
  await page.goto('/e2e/ui-kit.html');
  const variants = page.getByRole('region', { name: 'Варианты' }).getByRole('button');
  await expect(variants).toHaveCount(7);
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    for (const button of await variants.all()) {
      await expect(button).toBeEnabled();
      await expect(button).toHaveClass(/mqx-btn/);
      await expect(button).toHaveAttribute('type', 'button');
    }
    const opacity = await page.getByRole('button', { name: 'Недоступно', exact: true }).evaluate(el => Number(getComputedStyle(el).opacity));
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  }
});
