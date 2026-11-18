import { test, expect } from '@playwright/test';

for (const width of [320, 390, 1440]) {
  test(`A · Чек: оба исхода, оценка, прокрутка и кнопки при ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/e2e/run-finale.html');
    for (const label of ['Победа', 'Поражение · минус на счёте', 'Поражение · потребности']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      const dialog = page.getByRole('dialog');
      const decisions = dialog.getByRole('region', { name: 'Что решило партию' });
      await expect(decisions.getByRole('listitem')).toHaveCount(3);
      await expect(decisions).toContainText('≈ −150');
      await expect(decisions).toContainText('+86');
      await expect(decisions).toContainText('3,6 мес. расходов');
      await decisions.screenshot({ path: test.info().outputPath(`decisions-${width}-${label === 'Победа' ? 'win' : label.includes('счёте') ? 'cash' : 'needs'}.png`) });
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      const layout = await dialog.evaluate(el => ({
        block: el.querySelector('.mqx-run-finale-decisions').offsetTop,
        actions: el.querySelector('.mqx-run-finale__actions').offsetTop,
        before: (el.querySelector('.mqx-run-finale-tips') || el.querySelector('.mqx-run-finale-stats')).offsetTop,
      }));
      expect(layout.block).toBeGreaterThan(layout.before);
      expect(layout.actions).toBeGreaterThan(layout.block);
      await dialog.getByRole('button', { name: label === 'Победа' ? 'Играть дальше' : 'Новая игра', exact: true }).click();
      await expect(dialog).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}

test('нет пустого блока; одна оценка без деления на ноль', async ({ page }) => {
  await page.goto('/e2e/run-finale.html');
  await page.getByRole('button', { name: 'Победа · без решений', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Что решило партию' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Играть дальше', exact: true }).click();
  await page.getByRole('button', { name: 'Победа · одна оценка', exact: true }).click();
  const block = page.getByRole('region', { name: 'Что решило партию' });
  await expect(block.getByRole('listitem')).toHaveCount(1);
  await expect(block).toContainText('≈ −150');
  await expect(block).not.toContainText('мес. расходов');
});

test('A · Чек: светлая и тёмная темы', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto('/e2e/run-finale.html');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
    for (const label of ['Победа', 'Поражение · минус на счёте']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      const dialog = page.getByRole('dialog');
      const block = page.getByRole('region', { name: 'Что решило партию' });
      await block.scrollIntoViewIfNeeded();
      await page.screenshot({ path: test.info().outputPath(`finale-${theme}-${label === 'Победа' ? 'win' : 'defeat'}.png`) });
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await dialog.getByRole('button', { name: label === 'Победа' ? 'Играть дальше' : 'Новая игра', exact: true }).click();
    }
  }
});
