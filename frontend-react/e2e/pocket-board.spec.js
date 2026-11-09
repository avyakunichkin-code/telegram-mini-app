import { test, expect, startNewGameFromMenu, pressGotIt, guidanceStrip } from './fixtures.js';

test('Игровой пульт: зарплата меняет баланс без сдвига карточек и потребностей', async ({ page, player }, testInfo) => {
  await startNewGameFromMenu(page);
  await pressGotIt(page);
  await pressGotIt(page);
  const salary = page.getByRole('button', { name: 'Зарплата, получить', exact: true });
  await expect(salary).toBeEnabled();
  const geometry = async () => page.evaluate(() => Object.fromEntries(
    ['.mqx-pocket-tickets', '.mqx-pocket-ticket--salary', '.mqx-bg-needs'].map(selector => {
      const element = document.querySelector(selector);
      const { x, y, width, height } = element.getBoundingClientRect();
      const root = document.querySelector('main');
      return [selector, { x, y: y - root.getBoundingClientRect().y + root.scrollTop, width, height }];
    }),
  ));
  const before = await geometry();
  const cashBefore = await page.locator('.mqx-pocket-balance > strong').innerText();
  await salary.click();
  await expect(page.getByRole('button', { name: 'Зарплата, уже получена' })).toBeDisabled();
  await expect(guidanceStrip(page)).toContainText('4 из 5');
  await expect(page.locator('.mqx-pocket-balance > strong')).not.toHaveText(cashBefore);
  const after = await geometry();
  for (const selector of Object.keys(before)) {
    expect(Math.abs(after[selector].height - before[selector].height), `${selector}: высота`).toBeLessThan(1);
    // The dismissed reminder intentionally collapses (owner correction 06.11); ticket and needs heights stay fixed.
    if (selector !== '.mqx-pocket-tickets') expect(Math.abs((after[selector].y-after['.mqx-pocket-tickets'].y)-(before[selector].y-before['.mqx-pocket-tickets'].y)), `${selector}: положение относительно билетов`).toBeLessThan(1);
  }
  await expect(page.locator('.mqx-pocket-hero__logo img').or(page.locator('.mqx-pocket-navigation__brand img'))
    .filter({ visible: true }).first()).toHaveAttribute('alt', 'ТВОЙ ХОД. Финансы как игра');
  await expect(page.getByRole('main')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('pocket-salary-paid.png'), fullPage: true });
});
