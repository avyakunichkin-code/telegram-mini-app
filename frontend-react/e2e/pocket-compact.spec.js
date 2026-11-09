import { test, expect } from './fixtures.js';

test('Компактная главная: скрытая подсказка не оставляет пустоту, восстановление раскрывается отдельно', async ({ page }, testInfo) => {
  await page.goto('/#/dev/mqx');
  const demo = page.locator('[data-catalog-demo="pocket-board"]');
  await demo.locator('.mqx-pocket-hero').waitFor();
  await demo.locator('select').selectOption('low');
  const details = demo.locator('.mqx-pocket-needs-details');
  await expect(details).not.toHaveAttribute('open');
  await expect(demo.locator('[data-testid="needs-recovery"]')).toBeHidden();
  const needsHeight = (await demo.locator('.mqx-bg-needs').boundingBox()).height;
  expect(needsHeight).toBeLessThan(230);
  await details.locator(':scope > summary').click();
  await expect(demo.locator('[data-testid="needs-recovery"]')).toBeVisible();
  await details.locator(':scope > summary').click();
  await demo.getByRole('button', { name: 'Зарплата, получить', exact: true }).click();
  await expect(demo.locator('.mqx-pocket-reminder')).toBeHidden();
  const gap = await demo.evaluate(el => el.querySelector('.mqx-pocket-tickets').getBoundingClientRect().top - el.querySelector('.mqx-pocket-hero').getBoundingClientRect().bottom);
  expect(gap).toBeLessThanOrEqual(20);
  await expect(demo.locator('.mqx-pocket-goal')).toBeVisible();
  await expect(demo.locator('.mqx-pocket-goal__details')).not.toHaveAttribute('open');
  await expect(demo.locator('.mqx-bg-track__finish')).toHaveCount(0);
  await demo.locator('.mqx-pocket-goal').screenshot({ path: testInfo.outputPath('compact-goal.png') });
});
