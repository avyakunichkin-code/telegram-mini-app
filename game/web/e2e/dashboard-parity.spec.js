import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { test, expect, startNewGameFromMenu, playTurnOne, playTurnTwo, dismissRitual } from './fixtures.js';

test('dashboard at 390 and 320 before and after salary', async ({ page, context, player }) => {
  test.setTimeout(100_000);
  await startNewGameFromMenu(page);
  await playTurnOne(page);
  await dismissRitual(page);
  await playTurnTwo(page);
  await page.getByRole('button', { name: 'Закрыть подсказку' }).click();
  const onboardingEvent = page.getByRole('dialog');
  await expect(onboardingEvent).toContainText(/Событие 1 из \d/);
  await onboardingEvent.getByRole('button', { name: 'Закрыть' }).first().click();
  await expect(onboardingEvent).toBeHidden();
  const capitalTab = page.getByRole('tab', { name: 'Капитал' });
  const homeTab = page.getByRole('tab', { name: 'Главная' });
  await capitalTab.click();
  await expect(capitalTab).toHaveAttribute('aria-selected', 'true');
  await homeTab.click();
  await expect(homeTab).toHaveAttribute('aria-selected', 'true');
  const lab = process.env.DASHBOARD_CAPTURE_DIR ? await context.newPage() : null;
  const finish = page.getByRole('button', { name: 'Завершить ход и перейти к следующему' });
  // Optional visual evidence: feed live game values to the static approved sample.
  const capture = async (state) => {
    if (!lab) return;
    for (const width of [390, 320]) {
      for (const tab of [page, lab]) await tab.setViewportSize({ width, height: 820 });
      await page.evaluate(() => { document.querySelector('.mqx-tab-page__scroll').scrollTop = 0; });
      const values = await page.locator('.mqx-tab-page--dash-unified').evaluate(root => {
        const t = (s) => root.querySelector(s)?.innerText;
        return { turn: t('.mqx-bg-turn__title'), role: t('.mqx-bg-turn__role'), balance: t('.mqx-bg-turn__balance strong'), status: [...root.querySelectorAll('.mqx-bg-close-preview b')].map(x => x.innerText), events: t('.mqx-bg-events__text'), needs: t('.mqx-bg-needs')?.match(/\d+%/g), finances: t('.mqx-bg-money')?.match(/[\d\u00a0\u202f ]+₽/g), salary: t('.mqx-bg-salary') };
      });

      await lab.goto(pathToFileURL(path.resolve('../design-lab/finance-game-round/compact.html')).href);
      await lab.evaluate(v => {
        const put = (s, value) => { if (value != null) document.querySelector(s).textContent = value; };
        document.querySelector('.brand').src = './brand/logo-240.webp';
        put('.turn b', v.turn?.match(/\d+/)?.[0]); put('.persona span', v.role); put('.balance', v.balance);
        document.querySelectorAll('.status b').forEach((el,i) => { if (v.status[i]) el.textContent = v.status[i]; });
        put('.events b', v.events?.match(/\d+/)?.[0] ?? '0');
        document.querySelectorAll('.need').forEach((el,i) => { if (v.needs?.[i]) { el.querySelector('b').textContent = v.needs[i]; el.querySelector('meter').value = parseFloat(v.needs[i]); el.style.setProperty('--need-fill', parseFloat(v.needs[i]) >= 80 ? '#24804c' : parseFloat(v.needs[i]) >= 60 ? '#b65a00' : '#bd3f54'); } });
        document.querySelectorAll('.numbers dd').forEach((el,i) => { if (v.finances?.[i]) el.textContent = v.finances[i].trim(); });
        put('.actions .salary span', v.salary?.replace(/\n/g,' '));
        if (v.salary?.includes('получена')) document.querySelector('.actions .salary').classList.remove('salary');
      }, values);
      for (const [name, tab] of [['game',page],['lab',lab]]) {
        await tab.evaluate(() => document.fonts.ready.then(() => null));
        await tab.screenshot({ path: path.join(process.env.DASHBOARD_CAPTURE_DIR, name + '-' + state + '-' + width + '.png'), animations: 'disabled', scale: 'css', fullPage: true });
      }
    }
  };
  await expect(finish).toBeEnabled();
  await capture('before');
  await page.getByRole('button', { name: 'Подсказка Монетки' }).click();
  const tip = page.getByRole('dialog', { name: 'Подсказка Монетки' });
  await expect(tip).toBeVisible();
  await tip.getByRole('button', { name: 'Понятно' }).click();
  await expect(tip).toBeHidden();
  await page.getByRole('button', { name: 'Зарплата, получить' }).click();
  await expect(page.getByRole('button', { name: 'Зарплата, уже получена' })).toBeDisabled();
  await expect(page.locator('.mqx-bg-turn__balance--gain')).toHaveCount(0);
  await capture('after');
  const events = page.getByRole('button', { name: /ждут решения/ });
  await expect(events).toBeVisible();
  await events.click();
  const eventDialog = page.getByRole('dialog');
  await expect(eventDialog).toContainText(/Событие 1 из \d/);
  await eventDialog.getByRole('button', { name: 'Закрыть' }).first().click();
  await expect(finish).toBeEnabled();
  await finish.click();
  await expect(page.locator('.mqx-juice-ritual')).toBeVisible();
});
