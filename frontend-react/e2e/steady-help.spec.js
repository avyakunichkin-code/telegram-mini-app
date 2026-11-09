import { test, expect } from '@playwright/test';

test('Монетка Б: помощь и зарплата не двигают интерфейс', async ({ page }, testInfo) => {
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Начать играть' }).click();
  const salary = page.getByRole('button', { name: 'Зарплата, получить', exact: true });
  await expect(salary).toBeVisible();
  const geometry = () => page.evaluate(() => Object.fromEntries(['.mqx-pocket-hero','.mqx-pocket-tickets','.mqx-bg-needs'].map(selector => {
    const r = document.querySelector(selector).getBoundingClientRect();
    return [selector, { y: Math.round(r.y), height: Math.round(r.height) }];
  })));
  await page.waitForTimeout(400); // Wait for existing page entrance transition.
  const before = await geometry();
  await expect(page.locator('.mqx-pocket-reminder')).toHaveCount(0);
  const helper = page.getByRole('button', { name: 'Открыть подсказку Монетки' });
  await helper.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect(await geometry()).toEqual(before);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(helper).toBeFocused();
  await salary.click();
  await expect(page.getByRole('button', { name: 'Зарплата, уже получена' })).toBeDisabled();
  expect(await geometry()).toEqual(before);
  await expect(page.locator('.mqx-pocket-tickets small')).toHaveCount(0);
  await helper.click();
  await expect(dialog).toContainText('Твоё решение');
  await dialog.getByRole('button', { name: 'Понятно' }).click();
  await page.screenshot({ path: testInfo.outputPath('steady-help-paid.png'), fullPage: true });
});
